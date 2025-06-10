import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor-old";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { VoterStakeRegistry } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeVsrWeight } from "./utils";
import { getRegistrarKey, getVoterKey } from "../../utils";

export const VsrPlugin: VotePlugin = {
  name: "Voter Stake Registry",

  getClient(rpcEndpoint: string, programId?: string): Program<VoterStakeRegistry> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<VoterStakeRegistry>(idl as VoterStakeRegistry, programId!, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string, 
    programId: string, 
    voter: string,
    realm: string,
    mint: string
  ): Promise<BN> {
    const client: Program<VoterStakeRegistry>  = this.getClient(rpcEndpoint, programId)
    const registrarKey = getRegistrarKey(programId, realm, mint, true)
    const voterKey = getVoterKey(programId, registrarKey.toBase58(), voter)

    try {
      const voterData = await client.account.voter.fetch(voterKey)
      const registrarData = await client.account.registrar.fetch(registrarKey)

      return computeVsrWeight(
        voterData.deposits,
        registrarData.votingMints)
      }
    catch(error) {
      console.error("Error fetching voter weight data", error);
      return new BN(0);
    }
  }
}