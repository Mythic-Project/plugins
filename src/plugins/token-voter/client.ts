import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { TokenVoter } from "./idl";
import idl from "./idl.json";
import {  Connection, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { computeVsrWeight } from "./utils";
import { getNewAnchorProgram, getRegistrarKey, getVoterKey, getVoterWeightRecordKey } from "../../utils";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { IdlTypes, Program } from "@coral-xyz/anchor";

type RegistrarData = IdlTypes<TokenVoter>["registrar"];
type VoterData = IdlTypes<TokenVoter>["voter"];

export class TokenVoterPlugin implements VotePlugin {
  private registrarData: RegistrarData | null = null;
  private voterData: VoterData | null = null;
  private registrarKey: PublicKey | null = null;
  private voterKey: PublicKey | null = null;
  voterWeightRecordKey: PublicKey | null = null;
  private voterBump = 255;
  private vwrBump = 255;
  private voter: string | null = null;
  connection: Connection;
  client: Program<TokenVoter>;
  showDepositModal: boolean;

  constructor(rpcEndpoint: string) {
    const { client, connection } = getNewAnchorProgram(rpcEndpoint, idl as TokenVoter)
    this.client = client;
    this.connection = connection;
    this.showDepositModal = true;
  }

  async initPlugin(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string
  ): Promise<VotePlugin> {
    return await TokenVoterPlugin.init(
      rpcEndpoint,
      programId,
      voter,
      realm,
      mint
    );
  }

  static async init(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string
  ) {
    const registrarKey = getRegistrarKey(programId, realm, mint)
    const [voterKey, voterBump] = getVoterKey(programId, registrarKey.toBase58(), voter);
    const [voterWeightRecordKey, vwrBump] = getVoterWeightRecordKey(programId, registrarKey.toBase58(), voter);

    const instance = new TokenVoterPlugin(rpcEndpoint);

    const registrarData = await instance.client.account.registrar.fetchNullable(registrarKey)
    const voterData = await instance.client.account.voter.fetchNullable(voterKey);

    instance.registrarData = registrarData
    instance.voterData = voterData;
    instance.registrarKey = registrarKey;
    instance.voterKey = voterKey;
    instance.voterWeightRecordKey = voterWeightRecordKey;
    instance.voterBump = voterBump;
    instance.vwrBump = vwrBump;
    instance.voter = voter;

    return instance;
  }

  async getVoterWeight() {
    if (!this.voterData || !this.registrarData) {
      console.warn("Voter or registrar data not found");
      return { weight: new BN(0), items: [] };
    }
      
    return {
      weight: computeVsrWeight(
        this.voterData.deposits,
        this.registrarData.votingMintConfigs
      ),
      items: []
    }
  }

  getDepositMessage() {
    return null;
  }

  async getDepositInstructions(amount: BN, tokenOwnerRecord: string) {
    const ixs: TransactionInstruction[] = [];

    if (!this.registrarData || !this.registrarKey || !this.voter || !this.voterKey || !this.voterWeightRecordKey) {
      throw new Error("Registrar or voter data not found");
    }

    if (!this.voterData) {
      const createVoterIx = await this.client.methods.createVoterWeightRecord()
        .accountsPartial({
          registrar: this.registrarKey,
          voter: this.voterKey,
          voterWeightRecord: this.voterWeightRecordKey,
          voterAuthority: this.voter,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY
        }).instruction()

      ixs.push(createVoterIx)
    }
      
    const depositEntryIndex = 0
    const depositMint = this.registrarData.votingMintConfigs[0]

    if (!depositMint) {
      throw new Error("Deposit mint not found in registrar data");
    }

    const depositMintOwner = (await this.connection.getAccountInfo(depositMint.mint))?.owner;

    if (!depositMintOwner) {
      throw new Error("Deposit mint owner not found");
    }

    const depositIx = await this.client.methods.deposit(
      depositEntryIndex,
      amount
    ).accountsPartial({
      mint: depositMint.mint,
      depositAuthority: this.voter,
      tokenProgram: depositMintOwner,
      tokenOwnerRecord,
      registrar: this.registrarKey,
      voter: this.voterKey,
      voterWeightRecord: this.voterWeightRecordKey,
      vault: getAssociatedTokenAddressSync(
        depositMint.mint,
        new PublicKey(this.voterKey),
        true,
        depositMintOwner
      )
    }).instruction()

    ixs.push(depositIx)

    return {
      instructions: ixs,
      useVanilla: false
    };
  }

  async getWithdrawInstructions(
    amount: BN,
    tokenOwnerRecord: string
  ) {
    const ixs: TransactionInstruction[] = [];

    if (
      !this.registrarData || 
      !this.registrarKey || 
      !this.voterKey || 
      !this.voterWeightRecordKey || 
      !this.voterData || 
      !this.voter
    ) {
      throw new Error("Registrar or voter key not initialized");
    }

    const deposits = this.voterData.deposits || [];
    const depositMint = this.registrarData.votingMintConfigs[0]

    if (!depositMint) {
      throw new Error("Deposit mint not found in registrar data");
    }

    const depositMintOwner = (await this.connection.getAccountInfo(depositMint.mint))?.owner;
    const currentDepositAmt = deposits[0].amountDepositedNative
    const amtToWithdraw = amount.gt(currentDepositAmt) ? currentDepositAmt : amount

    const vault = getAssociatedTokenAddressSync(
      depositMint.mint,
      new PublicKey(this.voterKey),
      true,
      depositMintOwner
    )

    const destination = getAssociatedTokenAddressSync(
      depositMint.mint,
      new PublicKey(this.voter),
      true,
      depositMintOwner
    )

    const withdawIx = await this.client.methods.withdraw(
      0,
      amtToWithdraw
    ).accountsPartial({
      registrar: this.registrarKey,
      voter: this.voterKey,
      voterAuthority: this.voter,
      tokenOwnerRecord,
      voterWeightRecord: this.voterWeightRecordKey,
      vault,
      destination,
      mint: depositMint.mint,
      tokenProgram: depositMintOwner,
    })
    .instruction()

    ixs.push(withdawIx)
      
    return {
      useVanilla: false,
      instructions: ixs
    }
  }

  getPluginDepositMint() {
    return this.registrarData?.votingMintConfigs[0]?.mint.toBase58() || null;
  }

  getDepositedTokenAmount() {
    if (!this.voterData) {
      return null;
    }

    return this.voterData.deposits.reduce((acc, deposit) => acc.add(deposit.amountDepositedNative), new BN(0))
  }

  async getUpdateVoterWeightInstructions() {
    if (
      !this.registrarData || 
      !this.registrarKey || 
      !this.voterKey || 
      !this.voterWeightRecordKey || 
      !this.voter
    ) {
      throw new Error("Registrar or voter key not initialized");
    }

    return {
      instructions: [],
      voterWeightRecordKey: this.voterWeightRecordKey.toBase58(),
      remainingAccounts: []
    };
  }
}