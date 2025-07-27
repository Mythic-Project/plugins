import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { BioVoterStakeRegistry } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { computeVsrWeight } from "../vsr/utils";
import { getNewAnchorProgram, getRegistrarKey, getVoterKey, getVoterWeightRecordKey } from "../../utils";
import { RegistrarData, VoterData } from "./utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { SYSTEM_PROGRAM_ID } from "@realms-today/spl-governance";
import { Program } from "@coral-xyz/anchor";

export class BioVsrPlugin implements VotePlugin {
  private registrarData: RegistrarData | null = null;
  private voterData: VoterData | null = null;
  private registrarKey: PublicKey | null = null;
  private voterKey: PublicKey | null = null;
  private voterWeightRecordKey: PublicKey | null = null;
  private voterBump = 255;
  private vwrBump = 255;
  private voter: string | null = null;
  connection: Connection;
  client: Program<BioVoterStakeRegistry>;
  showDepositModal: boolean;

  constructor(rpcEndpoint: string) {
    const { client, connection } = getNewAnchorProgram(rpcEndpoint, idl as BioVoterStakeRegistry)
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
    return await BioVsrPlugin.init(
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
    const registrarKey = getRegistrarKey(programId, realm, mint, true)
    const [voterKey, voterBump] = getVoterKey(programId, registrarKey.toBase58(), voter);
    const [voterWeightRecordKey, vwrBump] = getVoterWeightRecordKey(programId, registrarKey.toBase58(), voter);

    const instance = new BioVsrPlugin(rpcEndpoint);
    
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
    const voterData = this.voterData;
    const registrarData = this.registrarData;
    
    if (!voterData || !registrarData) {
      console.warn("Voter or registrar data not found");
      return { weight: new BN(0), items: [] };
    }

    return {
      weight: computeVsrWeight(
        voterData.deposits,
        registrarData.votingMints
      ), 
      items: [
        {
          amount: voterData.deposits.reduce((acc, deposit) => acc.add(deposit.amountDepositedNative), new BN(0)),
          title: "Total Deposited"
        }
      ] 
    };
    
  }

  async getDepositInstructions(amount: BN) {
    const ixs: TransactionInstruction[] = [];

    if (!this.registrarData || !this.registrarKey || !this.voterKey || !this.voterWeightRecordKey || !this.voter) {
      throw new Error("Registrar or voter key not initialized");
    }

    const depositMint = this.registrarData.votingMints[0]
    
    if (!depositMint) {
      throw new Error("Deposit mint not found in registrar data");
    }

    const depositMintOwner = (await this.connection.getAccountInfo(depositMint.mint))?.owner;
    const deposits = this.voterData?.deposits || [];

    if (!depositMintOwner) {
      throw new Error("Deposit mint owner not found");
    }

    if (!this.voterData) {
      const createVoterIx = await this.client.methods.createVoter(this.voterBump, this.vwrBump)
        .accounts({
          registrar: this.registrarKey,
          voterAuthority: this.voter,
          payer: this.voter
        }).instruction()

      ixs.push(createVoterIx)
    }
    

    let depositEntryIndex = 0

    let availableDeposit = deposits.findIndex(
      deposit => deposit.isUsed && deposit.lockup.kind.none &&
        this.registrarData!.votingMints[deposit.votingMintConfigIdx].mint.equals(depositMint.mint)
    )

    if (availableDeposit === -1) {
      availableDeposit = deposits.findIndex(deposit => !deposit.isUsed)

      if (availableDeposit === -1 && deposits.length > 0) {
        throw new Error("No deposit entry space is available.")
      }

      availableDeposit = availableDeposit === -1 ? 0 : availableDeposit
      depositEntryIndex = availableDeposit

      const vault = getAssociatedTokenAddressSync(
        depositMint.mint,
        new PublicKey(this.voterKey),
        true,
        depositMintOwner
      )

      const createDepositEntryIx = await this.client.methods.createDepositEntry(
        availableDeposit,
        { none: {} },
        null,
        0,
        false
      ).accountsPartial({
        depositMint: depositMint.mint,
        payer: this.voter,
        tokenProgram: depositMintOwner,
        registrar: this.registrarKey,
        voter: this.voterKey,
        voterAuthority: this.voter,
        systemProgram: SYSTEM_PROGRAM_ID,
        vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
      }).instruction()

      ixs.push(createDepositEntryIx)
    } else {
      depositEntryIndex = availableDeposit
    }

    const depositToken = getAssociatedTokenAddressSync(
      depositMint.mint,
      new PublicKey(this.voter),
      true,
      depositMintOwner
    )

    const depositIx = await this.client.methods.deposit(
      depositEntryIndex,
      amount
    ).accountsPartial({
      depositAuthority: this.voter,
      tokenProgram: depositMintOwner,
      mint: depositMint.mint,
      depositToken,
      registrar: this.registrarKey,
      voter: this.voterKey,
    }).instruction()

    ixs.push(depositIx)

    return {
      useVanilla: false,
      instructions: ixs
    };
  }
  
  async getWithdrawInstructions(
    amount: BN,
    tokenOwnerRecord: string
  ) {
    const ixs: TransactionInstruction[] = [];
    let amountRemaining = amount
    let currentIndex = 0

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
    const depositMint = this.registrarData.votingMints[0]

    if (!depositMint) {
      throw new Error("Deposit mint not found in registrar data");
    }

    const depositMintOwner = (await this.connection.getAccountInfo(depositMint.mint))?.owner;

    while (amountRemaining.gt(new BN(0))) {
      const currentDepositAmt = deposits[currentIndex].amountDepositedNative

      if (
        deposits[currentIndex].isUsed &&
        this.registrarData.votingMints[deposits[currentIndex].votingMintConfigIdx].mint.equals(depositMint.mint) &&
        currentDepositAmt.gt(new BN(0)) &&
        deposits[currentIndex].lockup.kind.none !== undefined
      ) {
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
          currentIndex,
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
          tokenProgram: depositMintOwner
        })
        .instruction()

        ixs.push(withdawIx)
        amountRemaining = amountRemaining.sub(amtToWithdraw)
      }

      currentIndex++
    }

    return {
      useVanilla: false,
      instructions: ixs
    }
  }

  getDepositMessage() {
    return null
  }

  getPluginDepositMint() {
    return this.registrarData?.votingMints[0]?.mint.toBase58() || null;
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

    const updateIx = await this.client.methods.updateVoterWeightRecord()
      .accountsPartial({
        registrar: this.registrarKey,
        voter: this.voterKey,
        voterWeightRecord: this.voterWeightRecordKey,
        systemProgram: SYSTEM_PROGRAM_ID
      }).instruction();

    return {
      instructions: [updateIx],
      voterWeightRecordKey: this.voterWeightRecordKey.toBase58(),
      remainingAccounts: []
    };
  }
}