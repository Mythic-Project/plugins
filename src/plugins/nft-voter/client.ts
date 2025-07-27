import { IdlAccounts, Program } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { NftVoter } from "./idl";
import idl from "./idl.json";
import { AccountMeta, Connection, PublicKey } from "@solana/web3.js";
import { getNewAnchorProgram, getRegistrarKey, getVoterWeightRecordKey } from "../../utils";
import { getNftMetadataKey } from "./utilts";

type Nft = {
  id: string;
  compression: {
    compressed: boolean;
  };
  grouping: Array<{
    group_key: string;
    group_value: string;
  }>;
}

type RegistrarData = IdlAccounts<NftVoter>["registrar"];
type VoterWeightRecord = IdlAccounts<NftVoter>["voterWeightRecord"];

export class NftVoterPlugin implements VotePlugin {
  private registrarKey: PublicKey | null = null;
  private registrarData: RegistrarData | null = null;
  private voterWeightRecord: VoterWeightRecord | null = null;
  private voterWeightRecordKey: PublicKey | null = null;
  private voter: string | null = null;
  private realm: string | null = null;
  private mint: string | null = null;
  private governanceProgramId: string | null = null;
  private nfts: Nft[] | null = null;
  connection: Connection;
  client: Program<NftVoter>;
  showDepositModal: boolean;

  constructor(rpcEndpoint: string) {
    const { client, connection } = getNewAnchorProgram(rpcEndpoint, idl as NftVoter);
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
    return await NftVoterPlugin.init(
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
    const instance = new NftVoterPlugin(rpcEndpoint);
    const registrarKey = getRegistrarKey(programId, realm, mint);
    const [voterWeightRecordKey] = getVoterWeightRecordKey(programId, registrarKey.toBase58(), voter);
    const registrarData = await instance.client.account.registrar.fetchNullable(registrarKey);
    const voterWeightRecord = await instance.client.account.voterWeightRecord.fetchNullable(voterWeightRecordKey);

    const collectionConfigs = registrarData?.collectionConfigs;

    if (collectionConfigs) {
      const collections = collectionConfigs.map((config) => config.collection.toBase58());
      
      const response = await fetch(instance.client.provider.connection.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'Realms user',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: voter,
          },
        }),
      })

      const { result } = await response.json()
      const nfts = result.items.filter((item: Nft) => !item.compression.compressed)
        .filter((item: Nft) => {
          const collection = item.grouping.find((x) => x.group_key === 'collection')
          return collection && collections.includes(collection.group_value)
        })
      
      instance.nfts = nfts;
    }

    const realmData = await instance.connection.getAccountInfo(new PublicKey(realm));
    
    instance.registrarData = registrarData;
    instance.registrarKey = registrarKey;
    instance.voterWeightRecord = voterWeightRecord;
    instance.voterWeightRecordKey = voterWeightRecordKey;
    instance.voter = voter;
    instance.realm = realm;
    instance.governanceProgramId = realmData?.owner.toBase58() || null;
    instance.mint = mint;
    
    return instance;
  }

  async getVoterWeight() {
    if (!this.registrarData || !this.nfts) {
      console.warn("Registrar not found");
      return { weight: new BN(0), items: [] };
    }
  
    return {
      weight: new BN(this.nfts.length),
      items: [
        {
          amount: new BN(this.nfts.length),
          title: "NFT Deposited"
        }
      ]
    }
  }

  getDepositMessage() {
    return null;
  }

  async getDepositInstructions() {
    if (!this.realm || !this.governanceProgramId || !this.voter || !this.voterWeightRecordKey || !this.mint) {
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
          voterWeightRecord: this.voterWeightRecordKey,
          realm: this.realm,
          governanceProgramId: this.governanceProgramId,
          payer: this.voter,
          realmGoverningTokenMint: this.mint
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
      useVanilla: false
    };
  }

  getPluginDepositMint() {
    return null;
  }

  getDepositedTokenAmount() {
    return null
  }

  async getUpdateVoterWeightInstructions(
    tokenOwnerRecord?: string,
    actionTarget?: string,
  ) {
    if (
      !this.registrarData || 
      !this.registrarKey || 
      !actionTarget || 
      !this.voterWeightRecordKey || 
      !this.voter ||
      !tokenOwnerRecord ||
      !this.nfts
    ) {
      throw new Error("Registrar or voter key not initialized");
    }

    const updateIx = await this.client.methods.castNftVote(new PublicKey(actionTarget))
      .accountsPartial({
        registrar: this.registrarKey,
        voterWeightRecord: this.voterWeightRecordKey,
        voterTokenOwnerRecord: new PublicKey(tokenOwnerRecord),
        voterAuthority: new PublicKey(this.voter),
      }).instruction();

    const keys: AccountMeta[] = []

    for (const nft of this.nfts) {
      const nftPubkey = new PublicKey(nft.id);
      const nftMetadata = getNftMetadataKey(nft.id);

      keys.push({
        pubkey: nftPubkey,
        isSigner: false,
        isWritable: false
      });

      keys.push({
        pubkey: nftMetadata,
        isSigner: false,
        isWritable: false
      });
    }

    return {
      instructions: [updateIx],
      voterWeightRecordKey: this.voterWeightRecordKey.toBase58(),
      remainingAccounts: keys
    };
  }
}