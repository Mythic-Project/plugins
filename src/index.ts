import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import { VotePlugin } from "./constants/types";
import { BioVsrPlugin } from "./plugins/bio-vsr/client";
import { BonkVoterPlugin } from "./plugins/bonk/client";
import { DriftPlugin } from "./plugins/drift/client";
import { GatewayPlugin } from "./plugins/gateway/client";
import { NftVoterPlugin } from "./plugins/nft-voter/client";
// import { ParclPlugin } from "./parcl/client";
import { PythPlugin } from "./plugins/pyth/client";
import { QuadraticPlugin } from "./plugins/quadratic/client";
import { TokenHaverPlugin } from "./plugins/token-haver/client";
import { TokenVoterPlugin } from "./plugins/token-voter/client";
import { VsrPlugin } from "./plugins/vsr/client";

const defaultConnection = clusterApiUrl("mainnet-beta");
const defaultPublicKey = PublicKey.default.toBase58();

export const plugins: VotePlugin[] = [
  new VsrPlugin(defaultConnection, defaultPublicKey),
  new BioVsrPlugin(defaultConnection),
  new TokenVoterPlugin(defaultConnection),
  new BonkVoterPlugin(defaultConnection),
  new NftVoterPlugin(defaultConnection),
  new DriftPlugin(defaultConnection, defaultPublicKey),
  new PythPlugin(defaultConnection),
  new QuadraticPlugin(defaultConnection),
  new GatewayPlugin(defaultConnection),
  new TokenHaverPlugin(defaultConnection),
  // ParclPlugin
]

export { PLUGIN_KEYS } from "./constants";