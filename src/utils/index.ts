import { PublicKey } from "@solana/web3.js";

export function getRegistrarKey(programId: string, realm: string, mint: string, isVsr: boolean = false): PublicKey {
  return PublicKey.findProgramAddressSync(
    isVsr ? 
      [new PublicKey(realm).toBuffer(), Buffer.from("registrar"), new PublicKey(mint).toBuffer()] :
      [Buffer.from("registrar"), new PublicKey(realm).toBuffer(), new PublicKey(mint).toBuffer()],
    new PublicKey(programId)
  )[0];
}

export function getVoterKey(programId: string, registrar: string, voter: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new PublicKey(registrar).toBuffer(), Buffer.from("voter"), new PublicKey(voter).toBuffer()],
    new PublicKey(programId)
  )[0];
}