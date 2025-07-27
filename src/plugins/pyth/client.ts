import { DepositMessage, VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { IdlAccounts, IdlTypes, Program } from "@coral-xyz/anchor";
import { Staking } from "./idl";
import idl from "./idl.json";
import { getNewAnchorProgram } from "../../utils";
import { getConfigKey, getMaxVoterWeightKey, getStakeCustodyKey, getStakeMetadataKey, getVoterRecordKey } from "./utils";
import { Account } from "@solana/spl-token";
import BigNumber from "bignumber.js";
import { VoterWeightAction } from "@realms-today/spl-governance";

type StakingPosition = IdlAccounts<Staking>["positionData"];
type VoterRecord = IdlAccounts<Staking>["voterWeightRecord"];
type TargetAccount = IdlAccounts<Staking>["targetMetadata"];
type Position = IdlTypes<Staking>["position"];
type Config = IdlAccounts<Staking>["globalConfig"];

export class PythPlugin implements VotePlugin {
  showDepositModal: boolean;
  connection: Connection;
  client: Program<Staking>;
  private positionData: StakingPosition | null = null;
  private stakePositionKey: string | null = null;
  private stakeCustody: Account | null = null;
  private voterRecord: VoterRecord | null = null;
  private voterRecordKey: PublicKey | null = null;
  private targetMetadata: TargetAccount | null = null;
  private voter: string | null = null;
  private config: Config | null = null;
  private positions: Position[] = [];
  private readonly targetKey = new PublicKey("6njqtZeuLbSFU7Yo72GxPcdwhLQWahEPx1iN9GD6DRgV");

  constructor(rpcEndpoint: string) {
    const { client, connection } = getNewAnchorProgram(rpcEndpoint, idl as Staking);
    this.showDepositModal = false;
    this.client = client;
    this.connection = connection;
  }

  async initPlugin(
    rpcEndpoint: string,
    programId: string,
    voter: string,
  ): Promise<VotePlugin> {
    return await PythPlugin.init(
      rpcEndpoint,
      programId,
      voter,
    );
  }

  static async init(
    rpcEndpoint: string,
    programId: string,
    voter: string,
  ) {
    const instance = new PythPlugin(rpcEndpoint);

    try {
      const stakingPositions = await instance.client.account.positionData.all(
        [{ memcmp: { offset: 8, bytes: voter } }],
      )

      if (stakingPositions.length > 0) {
        instance.positionData = stakingPositions[0].account;
        const stakePositionKey = stakingPositions[0].publicKey.toBase58();
        const positionInfo = await instance.connection.getAccountInfo(new PublicKey(stakePositionKey))
        // const stakeMetadataKey = getStakeMetadataKey(programId, stakePositionKey);
        // const stakeCustodyKey = getStakeCustodyKey(programId, stakePositionKey);
        const globalConfigKey = getConfigKey(programId);
        const voterRecordKey = getVoterRecordKey(programId, stakePositionKey);

        // const stakeCustody = await getAccount(instance.connection, stakeCustodyKey);
        // const stakeMetadata = await instance.client.account.stakeAccountMetadataV2.fetchNullable(stakeMetadataKey);
        // const voterRecord = await instance.client.account.voterWeightRecord.fetchNullable(voterRecordKey);
        const targetMetadata = await instance.client.account.targetMetadata.fetchNullable(instance.targetKey);
        const config = await instance.client.account.globalConfig.fetchNullable(globalConfigKey);

        const positionData = positionInfo?.data;

        if (positionData) {
          const dataSlice = positionData.subarray(40);

          for (let i = 0; i < dataSlice.length; i += 200) {
            const positionBuffer = dataSlice.subarray(i+1, i + 201);
            const position: Position = instance.client.coder.types.decode('position', positionBuffer);
            instance.positions.push(position);
          }
        }

        // instance.stakeMetadata = stakeMetadata;
        // instance.stakeCustody = stakeCustody;
        // instance.voterRecord = voterRecord;
        instance.config = config;
        instance.targetMetadata = targetMetadata;
        instance.voterRecordKey = voterRecordKey;
        instance.voter = voter;
        instance.stakePositionKey = stakePositionKey;
      } else {
        console.warn("No staking positions found for the given voter.");
      }
    } catch (error) {
      console.error("Error fetching staking positions:", error);
    }
    
    return instance;
  }

  async getVoterWeight(){
    if (!this.targetMetadata || !this.config) {
      return { weight: new BN(0), items: [] };
    }

    const lockedAmount = this.targetMetadata.locked;
    const maxWeight = new BN("10000000000000000")
    const currentEpoch = new BN(Date.now()/1000).div(this.config.epochDuration)
    
    const weight = this.positions.reduce((acc, position) => {
      const isLocked = position.activationEpoch.gt(currentEpoch) ||
        !position.unlockingStart ||
        position.unlockingStart.gt(new BN(currentEpoch));

      if (position.targetWithParameters.voting && isLocked) {
        return acc.add(position.amount);
      } else {
        return acc;
      }
    }, new BN("0"));


    const factor = new BigNumber(maxWeight.toString()).div(new BigNumber(lockedAmount.toString()));
    const finalWeight = new BigNumber(weight.toString()).times(factor);

    return {
      weight: new BN(finalWeight.integerValue().toString()),
      items: [
        {
          amount: weight,
          title: "Tokens Staked"
        }
      ]
    };
  }

  getPluginDepositMint(): string | null {
    return null;
  }

  getDepositedTokenAmount() {
    return null;
  }

  async getDepositInstructions() {
    return {
      instructions: [],
      useVanilla: false,
    }
  }

  async getWithdrawInstructions() {
    return {
      instructions: [],
      useVanilla: false,
    }
  }

  getDepositMessage(): DepositMessage | null {
    return {
      message: "Stake Pyth tokens to get voting power.",
      link: "https://staking.pyth.network",
      title: 'staking.pyth.network'
    };
  }

  async getUpdateVoterWeightInstructions(
    tokenOwnerRecord?: string,
    actionTarget?: string,
    action?: VoterWeightAction,
  ) {
    if (!this.voterRecordKey || !actionTarget || !tokenOwnerRecord || !this.voter || !this.stakePositionKey) {
      throw new Error("Voter record key or action target is not defined.");
    }

    const actionEnum = action === VoterWeightAction.CastVote as VoterWeightAction ?
      { castVote: {} } :
    action === VoterWeightAction.CreateProposal ?
      { createProposal: {} } :
    action === VoterWeightAction.CommentProposal ?
      { commentProposal: {} } :
    action === VoterWeightAction.SignOffProposal ?
      { signOffProposal: {} } :
      { createGovernance: {} } 

    const ix = await this.client.methods.updateVoterWeight(actionEnum)
      .accountsPartial({
        voterRecord: this.voterRecordKey,
        governanceTarget: this.targetKey,
        owner: this.voter,
        stakeAccountCustody: getStakeCustodyKey(this.client.programId.toBase58(), this.stakePositionKey),
        stakeAccountMetadata: getStakeMetadataKey(this.client.programId.toBase58(), this.stakePositionKey),
        stakeAccountPositions: this.stakePositionKey,
      })
      .remainingAccounts([{
        pubkey: new PublicKey(actionTarget),
        isSigner: false,
        isWritable: false,
      }])
      .instruction();

    return {
      instructions: [ix],
      voterWeightRecordKey: this.voterRecordKey.toBase58(),
      maxVoterWeightRecordKey: undefined,
      remainingAccounts: [
        {
          pubkey: getMaxVoterWeightKey(this.client.programId.toBase58()),
          isSigner: false,
          isWritable: false,
        }
      ],
    };
  } 
}