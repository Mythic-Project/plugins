import { VotePlugin } from '../../constants/types';
import BN from 'bn.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { PLUGIN_KEYS } from '../../constants';
import { plugins } from '../..';
import { getTokenOwnerRecordAddress } from '../../utils';
import { getTokenOwnerRecord } from '@realms-today/spl-governance';
import { IdlAccounts, Program } from '@coral-xyz/anchor';
import { Gateway } from './idl';
import idl from './idl.json';
import { getNewAnchorProgram, getRegistrarKey, getVoterWeightRecordKey } from '../../utils';

type RegistrarData = IdlAccounts<Gateway>["registrar"];
type VoterWeightRecord = IdlAccounts<Gateway>["voterWeightRecord"];

export class GatewayPlugin implements VotePlugin {
  private sourcePlugin: VotePlugin | null = null;
  private tokenOwnerRecord: PublicKey | null = null;
  private registrarKey: PublicKey | null = null;
  private registrarData: RegistrarData | null = null;
  private voterWeightRecord: VoterWeightRecord | null = null;
  private voterWeightRecordKey: PublicKey | null = null;
  private voter: string | null = null;
  connection: Connection;
  client: Program<Gateway>;
  showDepositModal: boolean;

  constructor(rpcEndpoint: string) {
    const { client, connection } = getNewAnchorProgram(rpcEndpoint, idl as Gateway); 
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
    inputWeightProgramId?: string
  ): Promise<VotePlugin> {
    return await GatewayPlugin.init(
      rpcEndpoint,
      programId,
      voter,
      realm,
      mint,
      inputWeightProgramId
    );
  }

  static async init(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
    inputWeightProgramId?: string
  ) {
    if (!inputWeightProgramId) {
      throw new Error('Input weight program ID is required for Gateway plugin');
    }

    const instance = new GatewayPlugin(rpcEndpoint);

    const inputPluginIndex = PLUGIN_KEYS.findIndex((plugin) =>
      plugin.includes(inputWeightProgramId)
    );

    if (inputPluginIndex !== -1) {
      const sourcePlugin = plugins[inputPluginIndex];
      const pluginInstance = await sourcePlugin.initPlugin(
        rpcEndpoint,
        programId,
        voter,
        realm,
        mint,
        inputWeightProgramId
      );

      instance.sourcePlugin = pluginInstance;
    }


    const registrarKey = getRegistrarKey(programId, realm, mint);
    const [voterWeightRecordKey] = getVoterWeightRecordKey(programId, registrarKey.toBase58(), voter);
    const registrarData = await instance.client.account.registrar.fetchNullable(registrarKey);
    const voterWeightRecord = await instance.client.account.voterWeightRecord.fetchNullable(voterWeightRecordKey);
    
    const realmData = await instance.connection.getAccountInfo(new PublicKey(realm));

    const torAddress = getTokenOwnerRecordAddress(
      new PublicKey(realm),
      new PublicKey(mint),
      realmData ? new PublicKey(realmData.owner) : undefined,
      new PublicKey(voter)
    );

    instance.tokenOwnerRecord = torAddress;
    instance.registrarData = registrarData;
    instance.registrarKey = registrarKey;
    instance.voterWeightRecord = voterWeightRecord;
    instance.voterWeightRecordKey = voterWeightRecordKey;
    instance.voter = voter;
    
    return instance;
  }

  async getVoterWeight() {
    if (this.sourcePlugin) {
      return await this.sourcePlugin.getVoterWeight();
    }

    try {
      if (!this.tokenOwnerRecord) {
        console.warn('TokenOwnerRecord address not found');
        return { weight: new BN(0), items: [] };
      }
      const tor = await getTokenOwnerRecord(this.connection, this.tokenOwnerRecord);
      return {
        weight: new BN(tor.account.governingTokenDepositAmount),
        items: []
      };
    } catch (error) {
      console.error('Error fetching TokenOwnerRecord:', error);
      return { weight: new BN(0), items: [] };
    }
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
    }
  }

  getPluginDepositMint(): string | null {
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
