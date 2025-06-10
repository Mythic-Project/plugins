import { BigNumber } from "bignumber.js";
import BN from "bn.js";

export function getCofficientWeight(
  voterWeight: BN,
  a: number,
  b: number,
  c: number
) {
  const w = new BigNumber(voterWeight.toString())
  const aBig = new BigNumber(a)
  const bBig = new BigNumber(b)
  const cBig = new BigNumber(c)

  const weight = aBig.times(w.sqrt()).plus(bBig.times(w)).plus(cBig)
  return new BN(weight.integerValue().toString())
}