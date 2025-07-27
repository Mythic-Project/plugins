import { AnchorProvider, Idl, Program, Wallet } from "@coral-xyz/anchor";
import { 
  AnchorProvider as OldAnchorProvider, 
  Idl as OldIdl, 
  Program as OldProgram, 
  Wallet as OldWallet 
} from "@coral-xyz/anchor-old";

import { Connection, PublicKey } from "@solana/web3.js";

export function getRegistrarKey(programId: string, realm: string, mint: string, isVsr: boolean = false): PublicKey {
  return PublicKey.findProgramAddressSync(
    isVsr ? 
      [new PublicKey(realm).toBuffer(), Buffer.from("registrar"), new PublicKey(mint).toBuffer()] :
      [Buffer.from("registrar"), new PublicKey(realm).toBuffer(), new PublicKey(mint).toBuffer()],
    new PublicKey(programId)
  )[0];
}

export function getVoterKey(programId: string, registrar: string, voter: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [new PublicKey(registrar).toBuffer(), Buffer.from("voter"), new PublicKey(voter).toBuffer()],
    new PublicKey(programId)
  );
}

export function getVoterWeightRecordKey(programId: string, registrar: string, voter: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [new PublicKey(registrar).toBuffer(), Buffer.from("voter-weight-record"), new PublicKey(voter).toBuffer()],
    new PublicKey(programId)
  );
}

export function getBonkVoterWeightRecordKey(programId: string, realm: string, mint: string, voter: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter-weight-record"), 
      new PublicKey(realm).toBuffer(),
      new PublicKey(mint).toBuffer(),
      new PublicKey(voter).toBuffer()
    ],
    new PublicKey(programId)
  );
}

export function getStakeDepositRecordKey(programId: string, voterWeightRecordKey: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake-deposit-record"), new PublicKey(voterWeightRecordKey).toBuffer()],
    new PublicKey(programId)
  );
}

export function getNewAnchorProgram<IDL extends Idl>(
  rpcEndpoint: string,
  idl: IDL,
) {
  const connection = new Connection(rpcEndpoint, {commitment: 'confirmed'});
  const provider = new AnchorProvider(connection, {} as Wallet);

  return {
    connection,
    client: new Program<IDL>(idl as IDL, provider)
  }
}

export function getOldAnchorProgram<IDL extends OldIdl>(
  rpcEndpoint: string,
  idl: IDL,
  programId: string
) {
  const connection = new Connection(rpcEndpoint, {commitment: 'confirmed'});
  const provider = new OldAnchorProvider(connection, {} as OldWallet, {});

  return {
    connection,
    client: new OldProgram<IDL>(idl as IDL, programId, provider)
  }
}

export const getTokenOwnerRecordAddress = (
  realmPk: PublicKey | undefined,
  mint: PublicKey | undefined,
  programId: PublicKey | undefined,
  wallet: PublicKey | null
) =>
  !realmPk || !mint || !programId || !wallet
    ? null
    : PublicKey.findProgramAddressSync(
      [
        Buffer.from('governance'),
        realmPk.toBuffer(),
        mint.toBuffer(),
        wallet.toBuffer(),
      ],
      programId
    )[0];