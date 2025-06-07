import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { TokenVoter } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeVsrWeight } from "./utils";

export const TokenVoterPlugin: VotePlugin = {
  name: "Token Voter Plugin",

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
    const registrarKey = this.getRegistrarKey(programId, realm, mint)
    const voterKey = this.getVoterKey(programId, registrarKey.toBase58(), voter)
    const voterData = await client.account.voter.fetch(voterKey)
    const registrarData = await client.account.registrar.fetch(registrarKey)

    return computeVsrWeight(
      voterData.deposits,
      registrarData.votingMintConfigs
    )
  }
}