import { BN } from "@coral-xyz/anchor"
import { VoterWeightAction } from "@realms-today/spl-governance";
import { AccountMeta, TransactionInstruction } from "@solana/web3.js";

export type DepositMessage = {
  message: string;
  link: string | null;
  title: string | null;
}

export type PluginInstructions = {
  instructions: TransactionInstruction[];
  useVanilla: boolean;
}

export type UpdateInstructions = {
  instructions: TransactionInstruction[];
  voterWeightRecordKey: string;
  maxVoterWeightRecordKey?: string;
  remainingAccounts?: AccountMeta[];
}

export type VoteWeight = {
  weight: BN;
  items: {amount: BN, title: string}[]
}

export interface VotePlugin {
  showDepositModal: boolean,

  initPlugin(
    rpcEndpoint: string,
    programId: string,
    voter: string,
    realm: string,
    mint: string,
    inputWeightProgramId?: string,
    inputInputWeightProgramId?: string
  ): Promise<VotePlugin>,

  getVoterWeight(tokenOwnerRecord?: string): Promise<VoteWeight>,

  getDepositInstructions(amount: BN, tokenOwnerRecord?: string): Promise<PluginInstructions>,

  getWithdrawInstructions(amount: BN, tokenOwnerRecord: string): Promise<PluginInstructions>,

  getDepositMessage(): DepositMessage | null,

  getPluginDepositMint() : string | null,

  getDepositedTokenAmount(): BN | null,

  getUpdateVoterWeightInstructions(
    tokenOwnerRecord?: string,
    actionTarget?: string,
    action?: VoterWeightAction,
    governance?: string,
    proposal?: string,
    proposalCreatedAt?: number
  ): Promise<UpdateInstructions>,
}