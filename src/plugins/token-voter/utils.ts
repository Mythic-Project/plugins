import BN from "bn.js";
import { TokenVoter } from "./idl";
import { IdlTypes } from "@coral-xyz/anchor";

export const SCALED_FACTOR_BASE = new BN(1_000_000_000)

export type DepositEntry = IdlTypes<TokenVoter>["depositEntry"]

export function computeVsrWeight(
  deposits: IdlTypes<TokenVoter>["depositEntry"][],
  votingMints: IdlTypes<TokenVoter>["votingMintConfig"][]
) {
  const updatedDeposits = deposits.map(deposit => {
    if (deposit.isUsed) {
      const votingMint = votingMints[deposit.votingMintConfigIdx]
      const baselineWeight = votingMint.digitShift > 0 ?
        deposit.amountDepositedNative.mul(new BN(10).pow(new BN(votingMint.digitShift))) :
        deposit.amountDepositedNative.div(new BN(10).pow(new BN(votingMint.digitShift * -1)))

        return baselineWeight
    } else {
      return new BN(0)
    }
  })

  return updatedDeposits.reduce((a, b) => a.add(b), new BN(0))
}