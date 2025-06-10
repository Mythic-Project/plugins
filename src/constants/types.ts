import { Idl, Program } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"
import BN from "bn.js"

export type VotePlugin = {
  name: string,
  
  getClient(
    rpcEndpoint: string,
    programId?: string,
  ): any,

  getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
    inputWeightProgramId?: string,
    inputInputWeightProgramId?: string
  ): Promise<BN>
}