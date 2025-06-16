import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { TokenHaver } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { associatedAddress } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getRegistrarKey } from "../../utils";

export const TokenHaverPlugin: VotePlugin = {
  name: "Token Haver Plugin",

  getClient(rpcEndpoint: string, programId?: string): Program<TokenHaver> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<TokenHaver>(idl as TokenHaver, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
  ): Promise<BN> {
    const client: Program<TokenHaver> = this.getClient(rpcEndpoint, programId)
    const registrarKey = getRegistrarKey(programId, realm, mint)
    const registrarData = await client.account.registrar.fetchNullable(registrarKey)

    if (!registrarData) {
      console.warn("Registrar not found");
      return new BN(0);
    }
    
    const mints = registrarData.mints
    
    const atas = mints.map(mint => associatedAddress({mint, owner: new PublicKey(voter)}))
    
    let count = 0
    for (const ata of atas) {
      try {
        const ataData = await client.provider.connection.getTokenAccountBalance(ata)
        if (ataData.value.amount !== "0") {
          count += 1
        }
      } catch {
        continue;
      }
    }

    return new BN(count * 1_000_000)
   
  }
}