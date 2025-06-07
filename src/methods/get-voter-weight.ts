import { BN } from "@coral-xyz/anchor-old";
import { PLUGIN_KEYS } from "../constants";
import { plugins } from "../plugins";

export async function getVoterWeight(
  rpcEndpoint: string,
  programId: string,
  voter: string,
  realm: string,
  mint: string
): Promise<BN> {
  const pluginIndex = PLUGIN_KEYS.findIndex((plugin) => plugin.includes(programId))
  
  if (pluginIndex === -1) {
    throw new Error(`Program ID ${programId} not found in plugins`)
  }
  
  const plugin = plugins[pluginIndex]

  const weight = plugin.getVoterWeightByVoter(
    rpcEndpoint,
    programId,
    voter,
    realm,
    mint
  )
  
  return weight
}