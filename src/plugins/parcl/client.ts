// import { VotePlugin } from "../../constants/types";
// import BN from "bn.js";
// import { Connection, PublicKey } from "@solana/web3.js";
// import { BigNumber } from "bignumber.js";
// import { StakeConnection } from "@parcl-oss/staking";
// import { Wallet } from "@coral-xyz/anchor-old";

// export const ParclPlugin: VotePlugin = {
//   name: "Parcl Plugin",

//   async getVoterWeightByVoter(
//     rpcEndpoint: string,
//     programId: string,
//     voter: string,
//   ): Promise<BN> {
//     try {
//       const connection = new Connection(rpcEndpoint, "confirmed");
//       const client = await StakeConnection.connect(
//         connection,
//         {} as Wallet
//       )
//       const mainAccount = await client.getMainAccount(new PublicKey(voter))

//       if (mainAccount) {
//         const weight = mainAccount.getVoterWeight(await client.getTime()).toBN()
//         const parclScalingFactor = new BigNumber(client.getScalingFactor())
//         const weightedPower = new BigNumber(weight.toString()).multipliedBy(parclScalingFactor)
//         return new BN(weightedPower.integerValue().toString())
//       }
//       return new BN(0)
//     } catch (error) {
//       console.error("Error fetching voter weight:", error)
//       return new BN(0)
//     }
//   }
// }