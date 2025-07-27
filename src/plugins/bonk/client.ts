import { IdlTypes, Program, ProgramAccount } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { BonkPlugin } from "./idl";
import idl from "./idl.json";
import stakeIdl from "./stake.json";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { SplTokenStaking } from "./stake";
import { getBonkVoterWeightRecordKey, getNewAnchorProgram, getRegistrarKey, getStakeDepositRecordKey } from "../../utils";
import { TokenVoterPlugin } from "../token-voter/client";
import { getGovernance, VoterWeightAction } from "@realms-today/spl-governance";

type RegistrarData = IdlTypes<BonkPlugin>["registrar"];
type ActiveSdrs = ProgramAccount<IdlTypes<SplTokenStaking>["stakeDepositReceipt"]>[];

export class BonkVoterPlugin implements VotePlugin {
  private registrarData: RegistrarData | null = null;
  private registrarKey: PublicKey | null = null;
  private activeSdrs: ActiveSdrs | null = null;
  private voterWeightRecordKey: PublicKey | null = null;
  private voter: string | null = null;
  private tokenVoterPlugin: TokenVoterPlugin | null = null;
  connection: Connection;
  client: Program<BonkPlugin>;
  stakeClient: Program<SplTokenStaking>;
  showDepositModal: boolean;

  constructor(rpcEndpoint: string) {
    const { client, connection } = getNewAnchorProgram(rpcEndpoint, idl as BonkPlugin)
    const { client: stakeClient } = getNewAnchorProgram(rpcEndpoint, stakeIdl as SplTokenStaking)
    this.client = client;
    this.stakeClient = stakeClient;
    this.connection = connection;
    this.showDepositModal = false;
  }

  async initPlugin(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string
  ): Promise<VotePlugin> {
    return await BonkVoterPlugin.init(
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
    const [voterWeightRecordKey] = getBonkVoterWeightRecordKey(programId, realm, mint, voter);

    const instance = new BonkVoterPlugin(rpcEndpoint);
    const tokenVoterPlugin = await TokenVoterPlugin.init(
      rpcEndpoint,
      "HA99cuBQCCzZu1zuHN2qBxo2FBo1cxNLwKkdt6Prhy8v",
      voter,
      realm,
      mint
    );

    const registrarData = await instance.client.account.registrar.fetchNullable(registrarKey)
    const stakePool = registrarData?.stakePool;

    const sdrs = stakePool ?
      (await instance.stakeClient.account.stakeDepositReceipt.all([
        { memcmp: { offset: 8, bytes: voter } },
        { memcmp: { offset: 72, bytes: stakePool.toBase58() } }
      ])) :
      [];

    const activeSdrs = sdrs.filter(
      (sdr) =>
        sdr.account.depositTimestamp
          .add(sdr.account.lockupDuration)
          .toNumber() >
        Date.now() / 1000,
    )

    instance.registrarData = registrarData
    instance.registrarKey = registrarKey;
    instance.voterWeightRecordKey = voterWeightRecordKey;
    instance.voter = voter;
    instance.activeSdrs = activeSdrs;
    instance.tokenVoterPlugin = tokenVoterPlugin;

    return instance;
  }

  async getVoterWeight() {
    try {
      if (!this.registrarData || !this.registrarKey) {
        console.warn("Registrar not found");
        return { weight: new BN(0), items: [] };
      }
      
      const sdrBalance = this.activeSdrs?.reduce(
        (a, b) => a.add(b.account.depositAmount),
        new BN(0),
      )

      const depositedTokens = (await this.tokenVoterPlugin?.getVoterWeight())?.weight || new BN(0);

      return { 
        weight: sdrBalance ? depositedTokens.add(sdrBalance) : depositedTokens, 
        items: [
          {
            amount: depositedTokens,
            title: "Tokens Deposited"
          },
          {
            amount: sdrBalance || new BN(0),
            title: "Tokens Staked"
          }
        ] 
      };
      
    } catch (error) {
      console.error("Error fetching voter weight data", error);
      return { weight: new BN(0), items: [] };
    }
  }

  getDepositMessage() {
    return {
      message: "Visit bonkdao.com to deposit BONK tokens.",
      link: "https://bonkdao.com",
      title: 'bonkdao.com'
    }
  }

  async getDepositInstructions() {
    return {
      instructions: [],
      useVanilla: false
    }
  }

  async getWithdrawInstructions() {
    return {
      instructions: [],
      useVanilla: false
    }
  }

  getPluginDepositMint() {
    return null
  }

  getDepositedTokenAmount() {
    return null
  }

  async getUpdateVoterWeightInstructions(
    tokenOwnerRecord?: string,
    actionTarget?: string,
    action?: VoterWeightAction,
    governance?: string,
    proposal?: string,
    proposalCreatedAt?: number
  ) {
    if (!actionTarget || !governance || !proposal || !tokenOwnerRecord) {
      throw new Error("Action target and action must be provided");
    }

    if (
      !this.registrarData || 
      !this.registrarKey || 
      !this.activeSdrs || 
      !this.voterWeightRecordKey || 
      !this.voter ||
      !this.tokenVoterPlugin?.voterWeightRecordKey
    ) {
      throw new Error("Registrar or voter key not initialized");
    }

    const actionEnum = action === VoterWeightAction.CastVote as VoterWeightAction ?
      { castVote : {} } :
      action === VoterWeightAction.CreateProposal ?
      { createProposal : {} } :
      action === VoterWeightAction.CommentProposal ?
      { commentProposal : {} } :
      action === VoterWeightAction.SignOffProposal ?
      { signOffProposal : {} } :
      { createGovernance : {} } 

    const inputVoterWeight = this.tokenVoterPlugin.voterWeightRecordKey
    const [stakeDepositRecord] = getStakeDepositRecordKey(
      this.client.programId.toBase58(),
      this.voterWeightRecordKey.toBase58()
    )

    let proposalEndTime = 0
    if (action === VoterWeightAction.CastVote as VoterWeightAction && proposalCreatedAt) {
      const governanceAccount = await getGovernance(this.connection, new PublicKey(governance));
      proposalEndTime = proposalCreatedAt + 
        governanceAccount.account.config.baseVotingTime + 
        governanceAccount.account.config.votingCoolOffTime;
    }

    let sdrs = this.activeSdrs.filter(
      (sdr) =>
        sdr.account.depositTimestamp
          .add(sdr.account.lockupDuration)
          .toNumber() >
        proposalEndTime,
    );

    const stakeDepositRecordAccount = await this.client.account.stakeDepositRecord.fetchNullable(stakeDepositRecord);

    if (stakeDepositRecord && stakeDepositRecordAccount?.weightActionTarget?.equals(new PublicKey(actionTarget))) {
      const usedSdrs = stakeDepositRecordAccount.deposits;
      sdrs = sdrs.filter(
        (sdr) => !usedSdrs.some((usedSdr) => usedSdr.equals(sdr.publicKey))
      );
    }

    const updateIx = await this.client.methods.updateVoterWeightRecord(
      sdrs.length,
      new PublicKey(actionTarget),
      actionEnum
    )
    .accountsPartial({
      registrar: this.registrarKey,
      voterWeightRecord: this.voterWeightRecordKey,
      governance,
      proposal,
      voterTokenOwnerRecord: tokenOwnerRecord,
      inputVoterWeight,
      stakeDepositRecord,
      payer: this.voter,
      voterAuthority: this.voter,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(sdrs.map((sdr) => ({
      pubkey: sdr.publicKey,
      isWritable: false,
      isSigner: false
    })))
    .instruction();

    return {
      instructions: [updateIx],
      voterWeightRecordKey: this.voterWeightRecordKey.toBase58(),
      remainingAccounts: []
    };
  }
}