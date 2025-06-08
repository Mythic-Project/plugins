import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { NftVoter } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";

export const NftVoterPlugin: VotePlugin = {
  name: "NFT Voter Plugin",

  getRegistrarKey(programId: string, realm: string, mint: string) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("registrar"), new PublicKey(realm).toBuffer(), new PublicKey(mint).toBuffer()],
      new PublicKey(programId)
    )[0];
  },

  getVoterKey(programId: string, registrar: string, voter: string) {
    return PublicKey.findProgramAddressSync(
      [new PublicKey(registrar).toBuffer(), Buffer.from("voter"), new PublicKey(voter).toBuffer()],
      new PublicKey(programId)
    )[0];
  },

  getClient(rpcEndpoint: string, programId?: string): Program<NftVoter> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<NftVoter>(idl as NftVoter, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string
  ): Promise<BN> {
    const client: Program<NftVoter> = this.getClient(rpcEndpoint, programId)

    const registrarKey = this.getRegistrarKey(programId, realm, mint);
    const registrar = await client.account.registrar.fetch(registrarKey);
    const collectionConfigs = registrar.collectionConfigs;
    const collections = collectionConfigs.map((config) => config.collection.toBase58());

    const response = await fetch(client.provider.connection.rpcEndpoint, {
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
    const nfts: any[] = result.items.filter((item: any) => !item.compression.compressed)
      .filter((item: any) => {
        const collection = item.grouping.find((x: any) => x.group_key === 'collection')
        return collection && collections.includes(collection.group_value)
      })

    return new BN(nfts.length)
  }
}