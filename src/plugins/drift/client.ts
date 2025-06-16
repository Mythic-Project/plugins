import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor-old";
import { VotePlugin } from "../../constants/types";
import BN from "bn.js";
import { driftIdl, DriftStakeVoter } from "./idl";
import { Connection, PublicKey } from "@solana/web3.js";
import { getInsuranceFundStakeAccountPublicKey, getInsuranceFundVaultPublicKey, getSpotMarketPublicKey } from "./utils";
import { SplGovernance } from "governance-idl-sdk";
import { getRegistrarKey } from "../../utils";

export const DriftPlugin: VotePlugin = {
  name: "Drift Plugin",

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
    const registrarKey = getRegistrarKey(programId, realm, mint)

    try {
      const registrarData = await client.account.registrar.fetchNullable(registrarKey)
      const realmData = await client.provider.connection.getAccountInfo(new PublicKey(realm))

      const splGovernance = new SplGovernance(client.provider.connection, realmData?.owner || undefined)

      if (!registrarData) {
        console.warn("Registrar data not found");
        return new BN(0);
      }

      const spotMarketIndex = registrarData.spotMarketIndex
      const insuranceFundStakeKey = getInsuranceFundStakeAccountPublicKey(
        registrarData.driftProgramId,
        new PublicKey(voter),
        spotMarketIndex
      )
      
      const insuranceFundStake = await client.account.insuranceFundStake.fetchNullable(insuranceFundStakeKey)
      
      if (!insuranceFundStake) {
        console.warn("Insurance fund stake data not found");
        return new BN(0);
      }
      
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