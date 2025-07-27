import { PublicKey } from "@solana/web3.js";

export function getStakeMetadataKey(programId: string, positionId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake_metadata"), new PublicKey(positionId).toBuffer()],
    new PublicKey(programId),
  )[0];
}

export function getStakeCustodyKey(programId: string, positionId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("custody"), new PublicKey(positionId).toBuffer()],
    new PublicKey(programId),
  )[0];
}

export function getVoterRecordKey(programId: string, positionId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("voter_weight"), new PublicKey(positionId).toBuffer()],
    new PublicKey(programId),
  )[0];
}

export function getConfigKey(programId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    new PublicKey(programId),
  )[0];
}

export function getMaxVoterWeightKey(programId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("max_voter")],
    new PublicKey(programId),
  )[0];
}