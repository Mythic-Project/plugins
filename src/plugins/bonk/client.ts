import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { BonkPlugin } from "./idl";
import idl from "./idl.json";
import stakeIdl from "./stake.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { SplTokenStaking } from "./stake";
import { TokenVoterPlugin } from "../token-voter/client";
import { TOKEN_VOTER_PLUGINS } from "../../constants";
import { getRegistrarKey } from "../../utils";

export const BonkVoterPlugin: VotePlugin = {
  name: "Bonk Plugin",

  getClient(rpcEndpoint: string, programId?: string): Program<BonkPlugin> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<BonkPlugin>(idl as BonkPlugin, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string
  ): Promise<BN> {
    const client: Program<BonkPlugin> = this.getClient(rpcEndpoint, programId)
    const stakingClient: Program<SplTokenStaking> = new Program<SplTokenStaking>(
      stakeIdl as SplTokenStaking,
      client.provider
    )
  
    const registrarKey = getRegistrarKey(programId, realm, mint);
    const registrar = await client.account.registrar.fetch(registrarKey);
    const stakePool = registrar.stakePool;

    const sdrs = await stakingClient.account.stakeDepositReceipt.all([
      {
        memcmp: {
          offset: 8,
          bytes: voter,
        },
      },
      {
        memcmp: {
          offset: 72,
          bytes: stakePool.toBase58(),
        },
      },
    ])

    const activeSdrs = sdrs.filter(
      (sdr) =>
        sdr.account.depositTimestamp
          .add(sdr.account.lockupDuration)
          .toNumber() >
        Date.now() / 1000,
    )

    const sdrBalance = activeSdrs.reduce(
      (a, b) => a.add(b.account.depositAmount),
      new BN(0),
    )

    const depositedTokens = await TokenVoterPlugin.getVoterWeightByVoter(
      rpcEndpoint,
      TOKEN_VOTER_PLUGINS[0],
      voter,
      realm,
      mint
    )

    return depositedTokens.add(sdrBalance)

  }
}