import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { BioVoterStakeRegistry } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeVsrWeight } from "../vsr/utils";

export const BioVsrPlugin: VotePlugin = {
  name: "Bio Voter Stake Registry",
  
  getRegistrarKey(programId: string, realm: string, mint: string) {
    return PublicKey.findProgramAddressSync(
      [new PublicKey(realm).toBuffer(), Buffer.from("registrar"), new PublicKey(mint).toBuffer()],
      new PublicKey(programId)
    )[0];
  },

  getVoterKey(programId: string, registrar: string, voter: string) {
    return PublicKey.findProgramAddressSync(
      [new PublicKey(registrar).toBuffer(), Buffer.from("voter"), new PublicKey(voter).toBuffer()],
      new PublicKey(programId)
    )[0];
  },

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
    const registrarKey = this.getRegistrarKey(programId, realm, mint)
    const voterKey = this.getVoterKey(programId, registrarKey.toBase58(), voter)
    const voterData = await client.account.voter.fetch(voterKey)
    const registrarData = await client.account.registrar.fetch(registrarKey)

    return computeVsrWeight(
      voterData.deposits,
      registrarData.votingMints)
  }
}