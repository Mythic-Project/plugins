import { IdlAccounts, Program } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { TokenHaver } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { associatedAddress } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getNewAnchorProgram, getRegistrarKey, getVoterWeightRecordKey } from "../../utils";

type RegistrarData = IdlAccounts<TokenHaver>["registrar"];
type Atas = { key: PublicKey; amount: BN }[];
type VoterWeightRecord = IdlAccounts<TokenHaver>["voterWeightRecord"];

export class TokenHaverPlugin implements VotePlugin {
  private registrarData: RegistrarData | null = null;
  private registrarKey: PublicKey | null = null;
  private voterWeightRecordKey: PublicKey | null = null;
  private voterWeightRecord: VoterWeightRecord | null = null;
  private voter: string | null = null;
  private atas: Atas | null = null;
  connection: Connection;
  client: Program<TokenHaver>;
  showDepositModal: boolean;

  constructor(rpcEndpoint: string) {
    const { client, connection } = getNewAnchorProgram(rpcEndpoint, idl as TokenHaver);
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
  ): Promise<VotePlugin> {
    return await TokenHaverPlugin.init(
      rpcEndpoint,
      programId,
      voter,
      realm,
      mint,
    );
  }

  static async init(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
  ) {
    const instance = new TokenHaverPlugin(rpcEndpoint);
    const registrarKey = getRegistrarKey(programId, realm, mint);
    const [voterWeightRecordKey] = getVoterWeightRecordKey(programId, registrarKey.toBase58(), voter);

    const registrarData = await instance.client.account.registrar.fetchNullable(registrarKey);
    const voterWeightRecord = await instance.client.account.voterWeightRecord.fetchNullable(voterWeightRecordKey);
    
    const mints = registrarData?.mints

    if (mints) {
      const ataKeys = mints.map(mint => associatedAddress({ mint, owner: new PublicKey(voter) }))
      const atas = []
      
      for (const ata of ataKeys) {
        try {
          const ataData = await instance.connection.getTokenAccountBalance(ata);
          if (ataData.value.amount !== "0") {
            atas.push({ key: ata, amount: new BN(ataData.value.amount) });
          }
        } catch {
          continue;
        }
      }

      instance.atas = atas;
    }

    instance.registrarData = registrarData;
    instance.registrarKey = registrarKey;
    instance.voterWeightRecordKey = voterWeightRecordKey;
    instance.voterWeightRecord = voterWeightRecord;
    instance.voter = voter;

    return instance;
  }

  async getVoterWeight() {
    if (!this.registrarData || !this.atas) {
      console.warn("Registrar not found");
      return { weight: new BN(0), items: [] };
    }
    
    const count = this.atas.length
    return {
      weight: new BN(count * 1_000_000),
      items: []
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
      useVanilla: false,
    }
  }

  getPluginDepositMint(): string | null {
    return null
  }

  getDepositedTokenAmount() {
    return null
  }

  async getUpdateVoterWeightInstructions() {
    if (
      !this.registrarData ||
      !this.registrarKey ||
      !this.voterWeightRecordKey ||
      !this.voter
    ) {
      throw new Error("Registrar or voter key not initialized");
    }

    const updateIx = await this.client.methods.updateVoterWeightRecord()
      .accountsPartial({
        registrar: this.registrarKey,
        voterWeightRecord: this.voterWeightRecordKey,
      }).instruction();

    return {
      instructions: [updateIx],
      voterWeightRecordKey: this.voterWeightRecordKey.toBase58(),
      remainingAccounts: []
    };
  }
}