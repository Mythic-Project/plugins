import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor-old";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { driftIdl, DriftStakeVoter } from "./idl";
import { Connection, PublicKey } from "@solana/web3.js";
import { getInsuranceFundStakeAccountPublicKey, getInsuranceFundVaultPublicKey, getSpotMarketPublicKey } from "./utils";
import { DriftClient } from "@drift-labs/sdk";
import { SplGovernance } from "governance-idl-sdk";

export const DriftPlugin: VotePlugin = {
  name: "Drift Plugin",
  
  getRegistrarKey(programId: string, realm: string, mint: string) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("registrar"), new PublicKey(realm).toBuffer(), new PublicKey(mint).toBuffer()],
      new PublicKey(programId)
    )[0];
  },

  getVoterKey(programId: string, registrar: string, voter: string) {
    return PublicKey.findProgramAddressSync(
      [new PublicKey(registrar).toBuffer(), Buffer.from("voter"), new PublicKey(voter).toBuffer()],
      new PublicKey(programId)
    )[0];
  },

  getClient(rpcEndpoint: string, programId?: string): Program<DriftStakeVoter> {
    const provider = new AnchorProvider(
      new Connection(rpcEndpoint, "confirmed"),
      {} as Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<DriftStakeVoter>(driftIdl as DriftStakeVoter, programId!, provider)
    return program;
  },

  async getVoterWeightByVoter(
    rpcEndpoint: string, 
    programId: string, 
    voter: string,
    realm: string,
    mint: string
  ): Promise<BN> {
    const client: Program<DriftStakeVoter>  = this.getClient(rpcEndpoint, programId)
    const registrarKey = this.getRegistrarKey(programId, realm, mint)
    const registrarData = await client.account.registrar.fetch(registrarKey)

    const realmData = await client.provider.connection.getAccountInfo(new PublicKey(realm))

    const splGovernance = new SplGovernance(client.provider.connection, realmData?.owner || undefined)

    const spotMarketIndex = registrarData.spotMarketIndex
    const insuranceFundStakeKey = getInsuranceFundStakeAccountPublicKey(
      registrarData.driftProgramId,
      new PublicKey(voter),
      spotMarketIndex
    )

    try {
      const insuranceFundStake = await client.account.insuranceFundStake.fetch(insuranceFundStakeKey)
      const ifShares =
        insuranceFundStake.lastValidTs.toNumber() > Date.now() / 1000 + 5 ?
          new BN(0) :
          insuranceFundStake.lastWithdrawRequestShares.toNumber() !== 0 ?
            new BN(0) :
            insuranceFundStake.ifShares

      const spotMarketKey = getSpotMarketPublicKey(
        registrarData.driftProgramId,
        spotMarketIndex
      )

      const spotMarketData = await client.provider.connection.getAccountInfo(spotMarketKey)

      if (!spotMarketData) {
        throw new Error("Spot market data not found");
      }

      const totalShares = new BN(spotMarketData.data.subarray(336, 352).reverse())

      const vaultKey = getInsuranceFundVaultPublicKey(
        registrarData.driftProgramId,
        spotMarketIndex
      )

      const vaultData = await client.provider.connection.getTokenAccountBalance(vaultKey)
      const vaultBalance = new BN(vaultData.value.amount)
      let stakedWeight = ifShares.mul(vaultBalance).div(totalShares)
      stakedWeight = stakedWeight.toString().slice(-6) === "999999" ? stakedWeight.add(new BN(1)) : stakedWeight;

      const tor = splGovernance.pda.tokenOwnerRecordAccount({
        realmAccount: new PublicKey(realm),
        governingTokenMintAccount: new PublicKey(mint),
        governingTokenOwner: new PublicKey(voter)
      }).publicKey

      try {
        const vanillaDeposit = await splGovernance.getTokenOwnerRecordByPubkey(tor)
        return stakedWeight.add(vanillaDeposit.governingTokenDepositAmount);
      } catch {
        return stakedWeight
      }

    } catch (error) {
      console.error("Error fetching voter weight:", error);
      return new BN(0);
    }
    
  }
}