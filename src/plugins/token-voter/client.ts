import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { TokenVoter } from "./idl";
import idl from "./idl.json";
import { Connection } from "@solana/web3.js";
import { computeVsrWeight } from "./utils";
import { getRegistrarKey, getVoterKey } from "../../utils";

export const TokenVoterPlugin: VotePlugin = {
  name: "Token Voter Plugin",

  getClient(rpcEndpoint: string, programId?: string): Program<TokenVoter> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<TokenVoter>(idl as TokenVoter, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string
  ): Promise<BN> {
    const client: Program<TokenVoter> = this.getClient(rpcEndpoint, programId)
    const registrarKey = getRegistrarKey(programId, realm, mint)
    const voterKey = getVoterKey(programId, registrarKey.toBase58(), voter)
    
    try {
      const voterData = await client.account.voter.fetchNullable(voterKey)
      const registrarData = await client.account.registrar.fetchNullable(registrarKey)

      if (!voterData || !registrarData) {
        console.warn("Voter or registrar data not found");
        return new BN(0);
      }
      
      return computeVsrWeight(
        voterData.deposits,
        registrarData.votingMintConfigs
      )
    } catch (error) {
      console.error("Error fetching voter or registrar data:", error);
      return new BN(0);
    }
    
  }
}