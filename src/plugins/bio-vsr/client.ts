import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { BioVoterStakeRegistry } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeVsrWeight } from "../vsr/utils";
import { getRegistrarKey, getVoterKey } from "../../utils";

export const BioVsrPlugin: VotePlugin = {
  name: "Bio Voter Stake Registry",

  getClient(rpcEndpoint: string, programId?: string): Program<BioVoterStakeRegistry> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<BioVoterStakeRegistry>(idl as BioVoterStakeRegistry, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string
  ): Promise<BN> {
    const client: Program<BioVoterStakeRegistry> = this.getClient(rpcEndpoint, programId)
    const registrarKey = getRegistrarKey(programId, realm, mint, true)
    const voterKey = getVoterKey(programId, registrarKey.toBase58(), voter)

    try {
      const voterData = await client.account.voter.fetch(voterKey)
      const registrarData = await client.account.registrar.fetch(registrarKey)

      return computeVsrWeight(
        voterData.deposits,
        registrarData.votingMints
      )
    } catch (error) {
      console.error("Error fetching voter weight:", error);
      return new BN(0);
    }
  }
}