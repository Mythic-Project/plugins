import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { PythStakingClient } from "@pythnetwork/staking-sdk";
import { BigNumber } from "bignumber.js";

export const PythPlugin: VotePlugin = {
  name: "Pyth Plugin",

  getClient(rpcEndpoint: string, programId?: string): PythStakingClient{
    const connection = new Connection(rpcEndpoint, "confirmed")
    const client = new PythStakingClient({
      connection
    })
    return client
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string
  ): Promise<BN> {
    const client: PythStakingClient = this.getClient(rpcEndpoint, programId);

    try {
      const config = await client.getVoterWeight(new PublicKey(voter))
      const pythScalingFactor = await client.getScalingFactor()
      const scalingFactor = new BigNumber(pythScalingFactor)
      const power = new BigNumber(config.toString()).multipliedBy(scalingFactor)
    return new BN(power.integerValue().toString());
    } catch (error) {
      console.error("Error fetching voter weight:", error);
      return new BN(0);
    }
  }
}