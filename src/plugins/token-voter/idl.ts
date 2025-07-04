/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/token_voter.json`.
 */
export type TokenVoter = {
  "address": "HA99cuBQCCzZu1zuHN2qBxo2FBo1cxNLwKkdt6Prhy8v",
  "metadata": {
    "name": "tokenVoter",
    "version": "0.0.1",
    "spec": "0.1.0",
    "description": "SPL Governance plugin implementing token based governance power"
  },
  "instructions": [
    {
      "name": "closeVoter",
      "discriminator": [
        117,
        35,
        234,
        247,
        206,
        131,
        182,
        149
      ],
      "accounts": [
        {
          "name": "registrar"
        },
        {
          "name": "voter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "voter.registrar",
                "account": "voter"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "voterAuthority"
              }
            ]
          }
        },
        {
          "name": "voterAuthority",
          "signer": true
        },
        {
          "name": "solDestination",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "configureMintConfig",
      "discriminator": [
        106,
        243,
        103,
        28,
        15,
        98,
        97,
        11
      ],
      "accounts": [
        {
          "name": "registrar",
          "docs": [
            "Registrar which we configure the provided spl-governance instance for"
          ],
          "writable": true
        },
        {
          "name": "realm"
        },
        {
          "name": "realmAuthority",
          "docs": [
            "Authority of the Realm must sign the transaction and must match realm.authority"
          ],
          "signer": true
        },
        {
          "name": "mint",
          "docs": [
            "Tokens of this mint will be included in the Mint Configs"
          ]
        },
        {
          "name": "maxVoterWeightRecord",
          "writable": true
        },
        {
          "name": "governanceProgramId",
          "docs": [
            "The onus is entirely on the caller side to ensure the provided instance is correct",
            "In future versions once we have the registry of spl-governance instances it could be validated against the registry"
          ]
        }
      ],
      "args": [
        {
          "name": "digitShift",
          "type": "i8"
        }
      ]
    },
    {
      "name": "createMaxVoterWeightRecord",
      "discriminator": [
        182,
        70,
        243,
        119,
        162,
        176,
        38,
        248
      ],
      "accounts": [
        {
          "name": "registrar"
        },
        {
          "name": "maxVoterWeightRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  120,
                  45,
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  119,
                  101,
                  105,
                  103,
                  104,
                  116,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "registrar.realm",
                "account": "registrar"
              },
              {
                "kind": "account",
                "path": "registrar.governing_token_mint",
                "account": "registrar"
              }
            ]
          }
        },
        {
          "name": "governanceProgramId",
          "docs": [
            "The program id of the spl-governance program the realm belongs to"
          ]
        },
        {
          "name": "realm"
        },
        {
          "name": "realmGoverningTokenMint",
          "docs": [
            "Either the realm community mint or the council mint."
          ]
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createRegistrar",
      "discriminator": [
        132,
        235,
        36,
        49,
        139,
        66,
        202,
        69
      ],
      "accounts": [
        {
          "name": "registrar",
          "docs": [
            "The Realm Voter Registrar",
            "There can only be a single registrar per governance Realm and governing mint of the Realm"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "realm"
              },
              {
                "kind": "account",
                "path": "governingTokenMint"
              }
            ]
          }
        },
        {
          "name": "governanceProgramId",
          "docs": [
            "The program id of the spl-governance program the realm belongs to"
          ]
        },
        {
          "name": "realm",
          "docs": [
            "An spl-governance Realm",
            "",
            "Realm is validated in the instruction:",
            "- Realm is owned by the governance_program_id",
            "- governing_token_mint must be the community or council mint",
            "- realm_authority is realm.authority"
          ]
        },
        {
          "name": "governingTokenMint",
          "docs": [
            "Either the realm community mint or the council mint.",
            "It must match Realm.community_mint or Realm.config.council_mint",
            "",
            "Note: Once the Realm voter plugin is enabled the governing_token_mint is used only as identity",
            "for the voting population and the tokens of that are no longer used"
          ]
        },
        {
          "name": "realmAuthority",
          "docs": [
            "realm_authority must sign and match Realm.authority"
          ],
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxMints",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createVoterWeightRecord",
      "discriminator": [
        184,
        249,
        133,
        178,
        88,
        152,
        250,
        186
      ],
      "accounts": [
        {
          "name": "registrar"
        },
        {
          "name": "voter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "registrar"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "voterAuthority"
              }
            ]
          }
        },
        {
          "name": "voterWeightRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "registrar"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  119,
                  101,
                  105,
                  103,
                  104,
                  116,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "voterAuthority"
              }
            ]
          }
        },
        {
          "name": "voterAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "instructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "registrar",
          "relations": [
            "voter"
          ]
        },
        {
          "name": "voter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "registrar"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "depositAuthority"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "voterWeightRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "registrar"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  119,
                  101,
                  105,
                  103,
                  104,
                  116,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "depositAuthority"
              }
            ]
          }
        },
        {
          "name": "tokenOwnerRecord",
          "docs": [
            "TokenOwnerRecord for any of the configured spl-governance instances"
          ]
        },
        {
          "name": "mint",
          "docs": [
            "Tokens of this mint must be included in the Voting Mint Configs"
          ]
        },
        {
          "name": "depositToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "depositAuthority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "depositAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "instructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "depositEntryIndex",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resizeRegistrar",
      "discriminator": [
        106,
        167,
        171,
        194,
        104,
        246,
        189,
        253
      ],
      "accounts": [
        {
          "name": "registrar",
          "docs": [
            "The Realm Voter Registrar",
            "There can only be a single registrar per governance Realm and governing mint of the Realm"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  97,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "realm"
              },
              {
                "kind": "account",
                "path": "governingTokenMint"
              }
            ]
          }
        },
        {
          "name": "governanceProgramId",
          "docs": [
            "The program id of the spl-governance program the realm belongs to"
          ]
        },
        {
          "name": "realm",
          "docs": [
            "An spl-governance Realm",
            "",
            "Realm is validated in the instruction:",
            "- Realm is owned by the governance_program_id",
            "- governing_token_mint must be the community or council mint",
            "- realm_authority is realm.authority"
          ]
        },
        {
          "name": "governingTokenMint",
          "docs": [
            "Either the realm community mint or the council mint.",
            "It must match Realm.community_mint or Realm.config.council_mint",
            "",
            "Note: Once the Realm voter plugin is enabled the governing_token_mint is used only as identity",
            "for the voting population and the tokens of that are no longer used"
          ]
        },
        {
          "name": "realmAuthority",
          "docs": [
            "realm_authority must sign and match Realm.authority"
          ],
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxMints",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "registrar",
          "relations": [
            "voter"
          ]
        },
        {
          "name": "voter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "registrar"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "voterAuthority"
              }
            ]
          }
        },
        {
          "name": "voterAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenOwnerRecord",
          "docs": [
            "The token_owner_record for the voter_authority. This is needed",
            "to be able to forbid withdraws while the voter is engaged with",
            "a vote or has an open proposal.",
            "",
            "- owned by registrar.governance_program_id",
            "- for the registrar.realm",
            "- for the registrar.realm_governing_token_mint",
            "- governing_token_owner is voter_authority"
          ]
        },
        {
          "name": "mint",
          "docs": [
            "Tokens of this mint must be included in the Voting Mint Configs"
          ]
        },
        {
          "name": "voterWeightRecord",
          "docs": [
            "Withdraws must update the voter weight record, to prevent a stale",
            "record being used to vote after the withdraw."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "registrar"
              },
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114,
                  45,
                  119,
                  101,
                  105,
                  103,
                  104,
                  116,
                  45,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "voterAuthority"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "destination",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "voterAuthority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "depositEntryIndex",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "registrar",
      "discriminator": [
        193,
        202,
        205,
        51,
        78,
        168,
        150,
        128
      ]
    },
    {
      "name": "voter",
      "discriminator": [
        241,
        93,
        35,
        191,
        254,
        147,
        17,
        202
      ]
    }
  ],
  "types": [
    {
      "name": "depositEntry",
      "docs": [
        "Bookkeeping for a single deposit for a given mint."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amountDepositedNative",
            "docs": [
              "Amount in deposited, in native currency.",
              "Withdraws directly reduce this amount.",
              "",
              "This directly tracks the total amount added by the user. They may",
              "never withdraw more than this amount."
            ],
            "type": "u64"
          },
          {
            "name": "votingMintConfigIdx",
            "docs": [
              "Points to the VotingMintConfig this deposit uses."
            ],
            "type": "u8"
          },
          {
            "name": "depositSlotHash",
            "docs": [
              "Deposit slot hash.",
              "saves deposit slot hash so that depositor cannot withdraw at the same slot."
            ],
            "type": "u64"
          },
          {
            "name": "isUsed",
            "type": "bool"
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future upgrades"
            ],
            "type": {
              "array": [
                "u8",
                38
              ]
            }
          }
        ]
      }
    },
    {
      "name": "registrar",
      "docs": [
        "Registrar which stores Token Voting configuration for the given Realm"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governanceProgramId",
            "docs": [
              "spl-governance program the Realm belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "realm",
            "docs": [
              "Realm of the Registrar"
            ],
            "type": "pubkey"
          },
          {
            "name": "governingTokenMint",
            "docs": [
              "Governing token mint the Registrar is for",
              "It can either be the Community or the Council mint of the Realm",
              "When the plugin is used the mint is only used as identity of the governing power (voting population)",
              "and the actual token of the mint is not used"
            ],
            "type": "pubkey"
          },
          {
            "name": "votingMintConfigs",
            "docs": [
              "Storage for voting mints and their configuration.",
              "The length should be adjusted for one's use case."
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "votingMintConfig"
                }
              }
            }
          },
          {
            "name": "maxMints",
            "docs": [
              "Max mints that voters can create."
            ],
            "type": "u8"
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future upgrades"
            ],
            "type": {
              "array": [
                "u8",
                127
              ]
            }
          }
        ]
      }
    },
    {
      "name": "voter",
      "docs": [
        "User account for mint voting rights."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voterAuthority",
            "docs": [
              "Voter Authority who owns the account tokens."
            ],
            "type": "pubkey"
          },
          {
            "name": "registrar",
            "docs": [
              "Registrar in which the voter is created in."
            ],
            "type": "pubkey"
          },
          {
            "name": "deposits",
            "docs": [
              "Deposit entries for a deposit for a given mint."
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "depositEntry"
                }
              }
            }
          },
          {
            "name": "voterBump",
            "docs": [
              "Voter account bump."
            ],
            "type": "u8"
          },
          {
            "name": "voterWeightRecordBump",
            "docs": [
              "Voter weight record account bump."
            ],
            "type": "u8"
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future upgrades"
            ],
            "type": {
              "array": [
                "u8",
                94
              ]
            }
          }
        ]
      }
    },
    {
      "name": "votingMintConfig",
      "docs": [
        "Exchange rate for an asset that can be used to mint voting rights.",
        "",
        "See documentation of configure_voting_mint for details on how",
        "native token amounts convert to vote weight."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "Mint for this entry."
            ],
            "type": "pubkey"
          },
          {
            "name": "digitShift",
            "docs": [
              "Number of digits to shift native amounts, applying a 10^digit_shift factor."
            ],
            "type": "i8"
          },
          {
            "name": "reserved1",
            "type": {
              "array": [
                "u8",
                63
              ]
            }
          }
        ]
      }
    }
  ]
};