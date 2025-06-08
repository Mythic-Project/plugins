import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export function getInsuranceFundStakeAccountPublicKey(
  programId: PublicKey,
  authority: PublicKey,
  marketIndex: number,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('insurance_fund_stake'),
      authority.toBuffer(),
      new BN(marketIndex).toArrayLike(Buffer, 'le', 2),
    ],
    programId,
  )[0]
}

export function getSpotMarketPublicKey(
  programId: PublicKey,
  marketIndex: number,
): PublicKey {
  return (
    PublicKey.findProgramAddressSync(
      [
        Buffer.from('spot_market'),
        new BN(marketIndex).toArrayLike(Buffer, 'le', 2),
      ],
      programId,
    )
  )[0]
}

export function getInsuranceFundVaultPublicKey(
  programId: PublicKey,
  marketIndex: number,
): PublicKey {
  return (
    PublicKey.findProgramAddressSync(
      [
        Buffer.from('insurance_fund_vault'),
        new BN(marketIndex).toArrayLike(Buffer, 'le', 2),
      ],
      programId,
    )
  )[0]
}