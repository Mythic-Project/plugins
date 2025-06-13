import { VotePlugin } from "../constants/types";
import { BioVsrPlugin } from "./bio-vsr/client";
import { BonkVoterPlugin } from "./bonk/client";
import { DriftPlugin } from "./drift/client";
import { GatewayPlugin } from "./gateway/client";
import { NftVoterPlugin } from "./nft-voter/client";
import { ParclPlugin } from "./parcl/client";
import { PythPlugin } from "./pyth/client";
import { QuadraticPlugin } from "./quadratic/client";
import { TokenHaverPlugin } from "./token-haver/client";
import { TokenVoterPlugin } from "./token-voter/client";
import { VsrPlugin } from "./vsr/client";

export const plugins: VotePlugin[] = [
  VsrPlugin,
  BioVsrPlugin,
  TokenVoterPlugin,
  BonkVoterPlugin,
  NftVoterPlugin,
  DriftPlugin,
  PythPlugin,
  QuadraticPlugin,
  GatewayPlugin,
  TokenHaverPlugin,
  ParclPlugin
]