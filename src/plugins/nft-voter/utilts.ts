import { PublicKey } from "@solana/web3.js";


export const getNftMetadataKey = (mint: string): PublicKey => {
  const metadataProgramId = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"), 
      new PublicKey(metadataProgramId).toBuffer(),
      new PublicKey(mint).toBuffer()
    ],
    new PublicKey(metadataProgramId)
  )[0];
}