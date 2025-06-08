import { VotePlugin } from "../constants/types";
import { BioVsrPlugin } from "./bio-vsr/client";
import { BonkVoterPlugin } from "./bonk/client";
import { DriftPlugin } from "./drift/client";
import { NftVoterPlugin } from "./nft-voter/client";
import { TokenVoterPlugin } from "./token-voter/client";
import { VsrPlugin } from "./vsr/client";

export const plugins: VotePlugin[] = [
  VsrPlugin,
  BioVsrPlugin,
  TokenVoterPlugin,
  BonkVoterPlugin,
  NftVoterPlugin,
  DriftPlugin
]