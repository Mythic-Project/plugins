import { IdlAccounts, Program } from '@coral-xyz/anchor';
import { VotePlugin } from '../../constants/types';
import BN from 'bn.js';
import { Quadratic } from './idl';
import idl from './idl.json';
import { Connection, PublicKey } from '@solana/web3.js';
import { getCofficientWeight } from './utils';
import { getNewAnchorProgram, getRegistrarKey, getVoterWeightRecordKey } from '../../utils';
import { GatewayPlugin } from '../gateway/client';

type RegistrarData = IdlAccounts<Quadratic>["registrar"];
type VoterWeightRecord = IdlAccounts<Quadratic>["voterWeightRecord"];

export class QuadraticPlugin implements VotePlugin {
  private sourcePlugin: VotePlugin | null = null;
  private registrarKey: PublicKey | null = null;
  private registrarData: RegistrarData | null = null;
  private voterWeightRecord: VoterWeightRecord | null = null;
  private voterWeightRecordKey: PublicKey | null = null;
  private voter: string | null = null;
  connection: Connection;
  client: Program<Quadratic>;
  showDepositModal: boolean;

  constructor(rpcEndpoint: string) {
    const { client, connection } = getNewAnchorProgram(rpcEndpoint, idl as Quadratic);
    this.connection = connection;
    this.client = client;
    this.showDepositModal = true;
  }
  
  async initPlugin(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
    inputWeightProgramId?: string,
    inputInputWeightProgramId?: string
  ): Promise<VotePlugin> {
    return await QuadraticPlugin.init(
      rpcEndpoint,
      programId,
      voter,
      realm,
      mint,
      inputWeightProgramId,
      inputInputWeightProgramId
    );
  }

  static async init(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
    inputWeightProgramId?: string,
    inputInputWeightProgramId?: string
  ) {
    if (!inputWeightProgramId) {
      throw new Error('Input weight program ID is required for Quadratic plugin');
    }

    const instance = new QuadraticPlugin(rpcEndpoint);
    const registrarKey = getRegistrarKey(programId, realm, mint);
    const [voterWeightRecordKey] = getVoterWeightRecordKey(programId, registrarKey.toBase58(), voter);
    const registrarData = await instance.client.account.registrar.fetchNullable(registrarKey);
    const voterWeightRecord = await instance.client.account.voterWeightRecord.fetchNullable(voterWeightRecordKey);

    const sourcePlugin = await GatewayPlugin.init(
      rpcEndpoint,
      inputWeightProgramId,
      voter,
      realm,
      mint,
      inputInputWeightProgramId
    )

    instance.sourcePlugin = sourcePlugin;
    instance.registrarData = registrarData;
    instance.registrarKey = registrarKey;
    instance.voterWeightRecord = voterWeightRecord;
    instance.voterWeightRecordKey = voterWeightRecordKey;
    instance.voter = voter;

    return instance;
  }

  async getVoterWeight() {
    if (!this.registrarData) {
      console.warn('Registrar data not found');
      return { weight: new BN(0), items: [] };
    }

    const a = this.registrarData.quadraticCoefficients.a;
    const b = this.registrarData.quadraticCoefficients.b;
    const c = this.registrarData.quadraticCoefficients.c;

    const voteWeight = (await this.sourcePlugin?.getVoterWeight())?.weight || new BN(0); 
    const weight = getCofficientWeight(voteWeight, a, b, c);
    return {
      weight,
      items: [
        {
          amount: voteWeight,
          title: "Deposited"
        }
      ]
    };
  }

  getDepositMessage() {
    return null;
  }

  async getDepositInstructions() {
    if (!this.registrarData || !this.voter || !this.voterWeightRecordKey || !this.registrarKey) {
      console.warn('Registrar data not found');
      return {
        instructions: [],
        useVanilla: true
      };
    }

    if (!this.voterWeightRecord) {
      const createVoterWeightRecordIx = await this.client.methods
        .createVoterWeightRecord(new PublicKey(this.voter))
        .accountsPartial({
          registrar: this.registrarKey,
          voterWeightRecord: this.voterWeightRecordKey,
          payer: this.voter
        })
        .instruction();

      return {
        instructions: [createVoterWeightRecordIx],
        useVanilla: true
      };
    }

    return {
      instructions: [],
      useVanilla: true
    };
  }

  async getWithdrawInstructions() {
    return {
      instructions: [],
      useVanilla: true
    };
  }

  getPluginDepositMint() {
    return null
  }

  getDepositedTokenAmount() {
    return null
  }

  async getUpdateVoterWeightInstructions(
    tokenOwnerRecord?: string,
  ) {
    if (
      !this.registrarData ||
      !this.registrarKey ||
      !this.voterWeightRecordKey ||
      !this.voter ||
      !tokenOwnerRecord
    ) {
      throw new Error("Registrar or voter key not initialized");
    }

    const updateIx = await this.client.methods.updateVoterWeightRecord()
      .accountsPartial({
        registrar: this.registrarKey,
        voterWeightRecord: this.voterWeightRecordKey,
        inputVoterWeight: tokenOwnerRecord
      }).instruction();

    return {
      instructions: [updateIx],
      voterWeightRecordKey: this.voterWeightRecordKey.toBase58(),
      remainingAccounts: []
    };
  }
};
