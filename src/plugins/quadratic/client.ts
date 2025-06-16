import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { Quadratic } from "./idl";
import idl from "./idl.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { computeVsrWeight } from "../vsr/utils";
import { PLUGIN_KEYS } from "../../constants";
import { SplGovernance } from "governance-idl-sdk";
import { plugins } from "..";
import { getCofficientWeight } from "./utils";
import { getRegistrarKey } from "../../utils";

export const QuadraticPlugin: VotePlugin = {
  name: "Quadratic Plugin",

  getClient(rpcEndpoint: string, programId?: string): Program<Quadratic> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<Quadratic>(idl as Quadratic, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
    inputWeightProgramId?: string,
    inputInputWeightProgramId?: string
  ): Promise<BN> {

    const registrarKey = getRegistrarKey(programId, realm, mint);
    const client: Program<Quadratic> = this.getClient(rpcEndpoint, programId)
    const registrar = await client.account.registrar.fetchNullable(registrarKey);

    if (!registrar) {
      console.warn("Registrar not found");
      return new BN(0);
    }
    
    const a = registrar.quadraticCoefficients.a;
    const b = registrar.quadraticCoefficients.b;
    const c = registrar.quadraticCoefficients.c;

    if (!inputWeightProgramId) {
      throw new Error("Input weight program ID is required for Quadractic plugin");
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

        return getCofficientWeight(tor.governingTokenDepositAmount, a, b, c)
      } catch (error) {
        console.error("Error fetching TokenOwnerRecord:", error)
        return new BN(0)
      }
    } else {
      const sourcePlugin = plugins[inputPluginIndex]
      const weight = await sourcePlugin.getVoterWeightByVoter(
        rpcEndpoint,
        inputWeightProgramId,
        voter,
        realm,
        mint,
        inputInputWeightProgramId
      )

      return getCofficientWeight(weight, a, b, c)
    }
  }
}