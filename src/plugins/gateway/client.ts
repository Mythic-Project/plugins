import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { Gateway } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { PLUGIN_KEYS } from "../../constants";
import { SplGovernance } from "governance-idl-sdk";
import { plugins } from "..";

export const GatewayPlugin: VotePlugin = {
  name: "Gateway Plugin",

  getClient(rpcEndpoint: string, programId?: string): Program<Gateway> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<Gateway>(idl as Gateway, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
    inputWeightProgramId?: string
  ): Promise<BN> {
    if (!inputWeightProgramId) {
      throw new Error("Input weight program ID is required for Gateway plugin");
    }

    const inputPluginIndex = PLUGIN_KEYS.findIndex((plugin) => plugin.includes(inputWeightProgramId))
      
    if (inputPluginIndex === -1) {
      const splGovernance = new SplGovernance(
        new Connection(rpcEndpoint, "confirmed"),
        new PublicKey(inputWeightProgramId)
      )

      try {
        const tor = await splGovernance.getTokenOwnerRecord(
          new PublicKey(realm),
          new PublicKey(voter),
          new PublicKey(mint)
        )

        return new BN(tor.governingTokenDepositAmount);
      } catch (error) {
        console.error("Error fetching TokenOwnerRecord:", error);
        return new BN(0);
      }
    } else {
      const sourcePlugin = plugins[inputPluginIndex];
      return sourcePlugin.getVoterWeightByVoter(
        rpcEndpoint,
        inputWeightProgramId,
        voter,
        realm,
        mint
      )
    }
  }
}