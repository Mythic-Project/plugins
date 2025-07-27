import { IdlAccounts, Program } from '@coral-xyz/anchor-old';
import { VotePlugin } from '../../constants/types';
import BN from 'bn.js';
import { driftIdl, DriftStakeVoter } from './idl';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getInsuranceFundStakeAccountPublicKey,
  getInsuranceFundVaultPublicKey,
  getSpotMarketPublicKey,
} from './utils';
import { getOldAnchorProgram, getRegistrarKey, getVoterWeightRecordKey } from '../../utils';
import { getTokenOwnerRecord } from '@realms-today/spl-governance';

type RegistrarData = IdlAccounts<DriftStakeVoter>['registrar'];
type InsuranceFundStake = IdlAccounts<DriftStakeVoter>['insuranceFundStake'];

export class DriftPlugin implements VotePlugin {
  private registrarData: RegistrarData | null = null;
  private insuranceFundStake: InsuranceFundStake | null = null;
  private insuranceFundStakeKey: PublicKey | null = null;
  private registrarKey: PublicKey | null = null;
  private voterWeightRecordKey: PublicKey | null = null;
  private voter: string | null = null;
  connection: Connection;
  client: Program<DriftStakeVoter>;
  showDepositModal: boolean;
  
  constructor(rpcEndpoint: string, programId: string) {
    const { client, connection } = getOldAnchorProgram(rpcEndpoint, driftIdl as DriftStakeVoter, programId);
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
    return await DriftPlugin.init(
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
    const [voterWeightRecordKey] = getVoterWeightRecordKey(programId, registrarKey.toBase58(), voter);

    const instance = new DriftPlugin(rpcEndpoint, programId);
    
    const registrarData = await instance.client.account.registrar.fetchNullable(registrarKey)
    const insuranceFundStakeKey = registrarData ?
      getInsuranceFundStakeAccountPublicKey(
        registrarData.driftProgramId,
        new PublicKey(voter),
        registrarData.spotMarketIndex
      ) :
      null;

    const insuranceFundStake = insuranceFundStakeKey ?
      (await instance.client.account.insuranceFundStake.fetchNullable(
        insuranceFundStakeKey
      )) :
      null;

    instance.registrarData = registrarData
    instance.registrarKey = registrarKey;
    instance.voterWeightRecordKey = voterWeightRecordKey;
    instance.voter = voter;
    instance.insuranceFundStake = insuranceFundStake;
    instance.insuranceFundStakeKey = insuranceFundStakeKey;

    return instance;
  }

  async getVoterWeight(tokenOwnerRecord: string) {
    if (!this.registrarData || !this.voter) {
      console.warn('Registrar data or voter not initialized');
      return { weight: new BN(0), items: [] };
      
    }
    
    let stakedWeight = new BN(0);

    if (this.insuranceFundStake) {
      const ifShares =
        this.insuranceFundStake.lastValidTs.toNumber() > Date.now() / 1000 + 5
          ? new BN(0)
          : this.insuranceFundStake.lastWithdrawRequestShares.toNumber() !== 0
            ? new BN(0)
            : this.insuranceFundStake.ifShares;

      const spotMarketIndex = this.registrarData.spotMarketIndex;

      const spotMarketKey = getSpotMarketPublicKey(
        this.registrarData.driftProgramId,
        spotMarketIndex
      );

      const spotMarketData = await this.client.provider.connection.getAccountInfo(
        spotMarketKey
      );

      if (!spotMarketData) {
        throw new Error('Spot market data not found');
      }

      const totalShares = new BN(
        spotMarketData.data.subarray(336, 352).reverse()
      );

      const vaultKey = getInsuranceFundVaultPublicKey(
        this.registrarData.driftProgramId,
        spotMarketIndex
      );

      const vaultData = await this.client.provider.connection.getTokenAccountBalance(
        vaultKey
      );

      const vaultBalance = new BN(vaultData.value.amount);
      
      stakedWeight = ifShares.mul(vaultBalance).div(totalShares);
      
      stakedWeight =
        stakedWeight.toString().slice(-6) === '999999'
          ? stakedWeight.add(new BN(1))
          : stakedWeight;
    }

    try {
      const vanillaDeposit = await getTokenOwnerRecord(
        this.connection,
        new PublicKey(tokenOwnerRecord)
      )
      return {
        weight: stakedWeight.add(vanillaDeposit.account.governingTokenDepositAmount),
        items: [
          {
            amount: vanillaDeposit.account.governingTokenDepositAmount,
            title: 'Tokens Deposited',
          },
          {
            amount: stakedWeight,
            title: 'Tokens Staked',
          },
        ],
      }
    } catch {
      return { 
        weight: stakedWeight, 
        items: [{ amount: stakedWeight, title: 'Staked' }] }
    }
  }

  getDepositMessage() {
    return {
      message: 'You can either stake tokens on Drift or deposit it into Realms to increase your voting power.',
      link: 'https://app.drift.trade/earn/stake',
      title: 'Stake with Drift',
    }
  }

  async getDepositInstructions() {
    return {
      instructions: [],
      useVanilla: true,
    }
  }

  async getWithdrawInstructions() {
    return {
      instructions: [],
      useVanilla: true,
    }
  }

  getPluginDepositMint() {
    return null;
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
      !tokenOwnerRecord ||
      !this.insuranceFundStakeKey
    ) {
      throw new Error("Registrar or voter key not initialized");
    }

    const spotMarketIndex = this.registrarData.spotMarketIndex;

    const spotMarketKey = getSpotMarketPublicKey(
      this.registrarData.driftProgramId,
      spotMarketIndex
    );

    const insuranceFundVault = getInsuranceFundVaultPublicKey(
      this.registrarData.driftProgramId,
      spotMarketIndex
    );

    const updateIx = await this.client.methods.updateVoterWeightRecord()
      .accounts({
        registrar: this.registrarKey,
        voterWeightRecord: this.voterWeightRecordKey,
        tokenOwnerRecord,
        insuranceFundStake: this.insuranceFundStakeKey,
        spotMarket: spotMarketKey,
        insuranceFundVault
      }).instruction();

    return {
      instructions: [updateIx],
      voterWeightRecordKey: this.voterWeightRecordKey.toBase58(),
      remainingAccounts: []
    };
  }
};
