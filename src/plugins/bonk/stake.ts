/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/spl_token_staking.json`.
 */
export type SplTokenStaking = {
  "address": "STAKEkKzbdeKkqzKpLkNQD3SUuLgshDKCD7U8duxAbB",
  "metadata": {
    "name": "splTokenStaking",
    "version": "0.1.6",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "initializeStakePool",
      "docs": [
        "Create a [StakePool](state::StakePool) and initialize the Mint that will",
        "represent effective stake weight."
      ],
      "discriminator": [
        48,
        189,
        243,
        73,
        19,
        67,
        36,
        83
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Payer of rent"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "docs": [
            "Authority that can add rewards pools"
          ]
        },
        {
          "name": "mint",
          "docs": [
            "SPL Token Mint of the underlying token to be deposited for staking"
          ]
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "stakeMint",
          "docs": [
            "An SPL token Mint for the effective stake weight token"
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "An SPL token Account for staging A tokens"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        },
        {
          "name": "maxWeight",
          "type": "u64"
        },
        {
          "name": "minDuration",
          "type": "u64"
        },
        {
          "name": "maxDuration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateStakePool",
      "discriminator": [
        0,
        148,
        108,
        113,
        176,
        174,
        42,
        40
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can add rewards pools"
          ],
          "signer": true
        },
        {
          "name": "mint",
          "docs": [
            "SPL Token Mint of the underlying token to be deposited for staking"
          ]
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "stakeMint",
          "docs": [
            "An SPL token Mint for the effective stake weight token"
          ],
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        },
        {
          "name": "maxWeight",
          "type": "u64"
        },
        {
          "name": "minDuration",
          "type": "u64"
        },
        {
          "name": "maxDuration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addRewardPool",
      "docs": [
        "Add a [RewardPool](state::RewardPool) to an existing [StakePool](state::StakePool).",
        "",
        "Can only be invoked by the StakePool's authority."
      ],
      "discriminator": [
        28,
        53,
        119,
        0,
        114,
        211,
        196,
        239
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Payer of rent"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "docs": [
            "Authority of the StakePool"
          ],
          "signer": true
        },
        {
          "name": "rewardMint",
          "docs": [
            "SPL Token Mint of the token that will be distributed as rewards"
          ]
        },
        {
          "name": "stakePool",
          "docs": [
            "StakePool where the RewardPool will be added"
          ],
          "writable": true
        },
        {
          "name": "rewardVault",
          "docs": [
            "An SPL token Account for holding rewards to be claimed"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "deposit",
      "docs": [
        "Deposit (aka Stake) a wallet's tokens to the specified [StakePool](state::StakePool).",
        "Depending on the `lockup_duration` and the StakePool's weighting configuration, the",
        "wallet initiating the deposit will receive tokens representing their effective stake",
        "(i.e. deposited amount multiplied by the lockup weight).",
        "",
        "For each RewardPool, the latest amount per effective stake will be recalculated to ensure",
        "the latest accumulated rewards are attributed to all previous depositors and not the deposit",
        "resulting from this instruction.",
        "",
        "A [StakeDepositReceipt](state::StakeDepositReceipt) will be created to track the",
        "lockup duration, effective weight, and claimable rewards.",
        "",
        "Remaining accounts are required: pass the `reward_vault` of each reward pool. These must be",
        "passed in the same order as `StakePool.reward_pools`"
      ],
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
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "owner",
          "docs": [
            "Owner of the StakeDepositReceipt, which may differ",
            "from the account staking."
          ]
        },
        {
          "name": "from",
          "docs": [
            "Token Account to transfer stake_mint from, to be deposited into the vault"
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "Vault of the StakePool token will be transfer to"
          ],
          "writable": true
        },
        {
          "name": "stakeMint",
          "writable": true
        },
        {
          "name": "destination",
          "docs": [
            "Token account the StakePool token will be transfered to"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "stakePool",
          "docs": [
            "StakePool owning the vault that will receive the deposit"
          ],
          "writable": true
        },
        {
          "name": "stakeDepositReceipt",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u32"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "lockupDuration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimAll",
      "docs": [
        "Claim unclaimed rewards from all RewardPools for a specific StakeDepositReceipt.",
        "",
        "For each RewardPool, the latest amount per effective stake will be recalculated to ensure",
        "the latest accumulated rewards are accounted for in the claimable amount. The StakeDepositReceipt",
        "is also updated so that the latest claimed amount is equivalent, so that their claimable amount",
        "is 0 after invoking the claim instruction."
      ],
      "discriminator": [
        194,
        194,
        80,
        194,
        234,
        210,
        217,
        90
      ],
      "accounts": [
        {
          "name": "claimBase",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "Owner of the StakeDepositReceipt"
              ],
              "writable": true,
              "signer": true
            },
            {
              "name": "stakePool",
              "writable": true
            },
            {
              "name": "stakeDepositReceipt",
              "docs": [
                "StakeDepositReceipt of the owner that will be used to claim respective rewards"
              ],
              "writable": true
            },
            {
              "name": "tokenProgram"
            }
          ]
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw (aka Unstake) a wallet's tokens for a specific StakeDepositReceipt. The StakePool's",
        "total weighted stake will be decreased by the effective stake amount of the StakeDepositReceipt",
        "and the original amount deposited will be transferred out of the vault.",
        "",
        "All rewards will be claimed. So, for each RewardPool, the latest amount per effective stake will",
        "be recalculated to ensure the latest accumulated rewards are accounted for in the claimable amount.",
        "The StakeDepositReceipt is also updated so that the latest claimed amount is equivalent, so that",
        "their claimable amount is 0 after invoking the withdraw instruction.",
        "",
        "StakeDepositReceipt account is closed after this instruction.",
        "",
        "Remaining accounts are required: pass the `reward_vault` of each reward pool. These must be",
        "passed in the same order as `StakePool.reward_pools`. The owner (the token account which",
        "gains the withdrawn funds) must also be passed be, in pairs like so:",
        "* `<reward_vault[0]><owner[0]>`",
        "* `<reward_vault[1]><owner[1]>",
        "* ...etc"
      ],
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
          "name": "claimBase",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "Owner of the StakeDepositReceipt"
              ],
              "writable": true,
              "signer": true
            },
            {
              "name": "stakePool",
              "writable": true
            },
            {
              "name": "stakeDepositReceipt",
              "docs": [
                "StakeDepositReceipt of the owner that will be used to claim respective rewards"
              ],
              "writable": true
            },
            {
              "name": "tokenProgram"
            }
          ]
        },
        {
          "name": "vault",
          "docs": [
            "Vault of the StakePool token will be transferred from"
          ],
          "writable": true
        },
        {
          "name": "stakeMint",
          "docs": [
            "stake_mint of StakePool that will be burned"
          ],
          "writable": true
        },
        {
          "name": "from",
          "docs": [
            "Token Account holding weighted stake representation token to burn"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "destination",
          "docs": [
            "Token account to transfer the previously staked token to"
          ],
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "updateTokenMeta",
      "discriminator": [
        138,
        54,
        34,
        1,
        233,
        180,
        193,
        240
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "metadataAccount",
          "writable": true
        },
        {
          "name": "stakePool"
        },
        {
          "name": "stakeMint"
        },
        {
          "name": "metadataProgram"
        },
        {
          "name": "rent"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeExpiredRewardPool",
      "docs": [
        "Creates a pool for expired stake reward tokens.",
        "Only can be initialized by the original stake pool authority."
      ],
      "discriminator": [
        139,
        177,
        243,
        204,
        55,
        59,
        29,
        161
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can add rewards pools"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "docs": [
            "SPL Token Mint of the original stake pool"
          ]
        },
        {
          "name": "rewardMint",
          "docs": [
            "SPL Token Mint of the original stake pool"
          ]
        },
        {
          "name": "expiredRewardPool",
          "writable": true
        },
        {
          "name": "expiredRewardVault",
          "docs": [
            "An SPL token Account for expired reward pool"
          ],
          "writable": true
        },
        {
          "name": "stakePool",
          "docs": [
            "authority must be signer who has authority over the stake pool"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "moveToExpiredPool",
      "docs": [
        "This takes a stake's reward tokens and moves them into an expired reward pool.",
        "It updates the StakeDepositReceipt to set the effective stake to 0 (no more rewards)",
        "It uses the 9th element of the claimed_amounts vec to store the claimable rewards amount",
        "The function remove the weighted stake amount of the receipt from the total weighted stake in the stake pool",
        "This makes it effectively unstaked and not accruing rewards anymore."
      ],
      "discriminator": [
        16,
        142,
        206,
        73,
        78,
        115,
        209,
        124
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Authority that can add rewards pools"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "stakeDepositReceipt",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true
        },
        {
          "name": "expiredRewardPool",
          "writable": true
        },
        {
          "name": "expiredRewardVault",
          "docs": [
            "An SPL token Account for expired rewards pool"
          ],
          "writable": true
        },
        {
          "name": "stakePool",
          "docs": [
            "authority must be signer who has authority over the stake pool"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawStakeAndExpiredRewards",
      "docs": [
        "This allows an owner of a StakedDepositReceipt to withdraw both their original staked tokens and",
        "their accumulated rewards stored in the expired pool."
      ],
      "discriminator": [
        167,
        227,
        191,
        136,
        33,
        84,
        18,
        218
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true
        },
        {
          "name": "owner",
          "docs": [
            "Owner of the StakeDepositReceipt"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "stakeDepositReceipt",
          "writable": true
        },
        {
          "name": "expiredRewardPool",
          "writable": true
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "Vault of the StakePool token will be transferred from"
          ],
          "writable": true
        },
        {
          "name": "expiredRewardVault",
          "docs": [
            "An SPL token Account for unlocked rewards pool"
          ],
          "writable": true
        },
        {
          "name": "destination",
          "docs": [
            "Token account to transfer the previously staked token to"
          ],
          "writable": true
        },
        {
          "name": "rewardDestination",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "rent"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "expiredRewardPool",
      "discriminator": [
        196,
        73,
        131,
        146,
        179,
        159,
        77,
        167
      ]
    },
    {
      "name": "stakePool",
      "discriminator": [
        121,
        34,
        206,
        21,
        79,
        127,
        255,
        28
      ]
    },
    {
      "name": "stakeDepositReceipt",
      "discriminator": [
        210,
        98,
        254,
        196,
        151,
        68,
        235,
        0
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAuthority",
      "msg": "Invalid StakePool authority"
    },
    {
      "code": 6001,
      "name": "rewardPoolIndexOccupied",
      "msg": "RewardPool index is already occupied"
    },
    {
      "code": 6002,
      "name": "invalidStakePoolVault",
      "msg": "StakePool vault is invalid"
    },
    {
      "code": 6003,
      "name": "invalidRewardPoolVault",
      "msg": "RewardPool vault is invalid"
    },
    {
      "code": 6004,
      "name": "invalidRewardPoolVaultIndex",
      "msg": "Invalid RewardPool vault remaining account index"
    },
    {
      "code": 6005,
      "name": "invalidOwner",
      "msg": "Invalid StakeDepositReceiptOwner"
    },
    {
      "code": 6006,
      "name": "invalidStakePool",
      "msg": "Invalid StakePool"
    },
    {
      "code": 6007,
      "name": "precisionMath",
      "msg": "Math precision error"
    },
    {
      "code": 6008,
      "name": "invalidStakeMint",
      "msg": "Invalid stake mint"
    },
    {
      "code": 6009,
      "name": "stakeStillLocked",
      "msg": "Stake is still locked"
    },
    {
      "code": 6010,
      "name": "invalidStakePoolDuration",
      "msg": "Max duration must be great than min"
    },
    {
      "code": 6011,
      "name": "invalidStakePoolWeight",
      "msg": "Max weight must be great than min"
    },
    {
      "code": 6012,
      "name": "durationTooShort",
      "msg": "Duration too short"
    },
    {
      "code": 6013,
      "name": "alreadyMoved",
      "msg": "Rewards already moved"
    },
    {
      "code": 6014,
      "name": "notMoved",
      "msg": "Rewards not moved"
    },
    {
      "code": 6015,
      "name": "invalidStakeMintDestination",
      "msg": "Invalid stake mint destination"
    }
  ],
  "types": [
    {
      "name": "rewardPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewardVault",
            "docs": [
              "Token Account to store the reward SPL Token"
            ],
            "type": "pubkey"
          },
          {
            "name": "rewardsPerEffectiveStake",
            "docs": [
              "Ever increasing accumulator of the amount of rewards per effective stake.\n    Said another way, if a user deposited before any rewards were added to the\n    `vault`, then this would be the token amount per effective stake they could\n    claim."
            ],
            "type": "u128"
          },
          {
            "name": "lastAmount",
            "docs": [
              "latest amount of tokens in the vault"
            ],
            "type": "u64"
          },
          {
            "name": "padding0",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "expiredRewardPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewardVault",
            "docs": [
              "Token Account to store the rewards"
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "Pubkey that can make updates to ExpiredRewardPool"
            ],
            "type": "pubkey"
          },
          {
            "name": "mint",
            "docs": [
              "Mint of the locked token"
            ],
            "type": "pubkey"
          },
          {
            "name": "rewardMint",
            "docs": [
              "Mint of the reward token"
            ],
            "type": "pubkey"
          },
          {
            "name": "stakePool",
            "docs": [
              "Pubkey of the StakePool"
            ],
            "type": "pubkey"
          },
          {
            "name": "bumpSeed",
            "docs": [
              "Bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "nonce",
            "docs": [
              "Nonce to derive multiple unlocked pools from same mint"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stakePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Pubkey that can make updates to StakePool"
            ],
            "type": "pubkey"
          },
          {
            "name": "totalWeightedStake",
            "docs": [
              "Total amount staked that accounts for the lock up period weighting.\n    Note, this is not equal to the amount of SPL Tokens staked."
            ],
            "type": "u128"
          },
          {
            "name": "vault",
            "docs": [
              "Token Account to store the staked SPL Token"
            ],
            "type": "pubkey"
          },
          {
            "name": "mint",
            "docs": [
              "Mint of the token being staked"
            ],
            "type": "pubkey"
          },
          {
            "name": "stakeMint",
            "docs": [
              "Mint of the token representing effective stake"
            ],
            "type": "pubkey"
          },
          {
            "name": "rewardPools",
            "docs": [
              "Array of RewardPools that apply to the stake pool.",
              "Unused entries are Pubkey default. In arbitrary order, and may have gaps."
            ],
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "rewardPool"
                  }
                },
                10
              ]
            }
          },
          {
            "name": "baseWeight",
            "docs": [
              "The minimum weight received for staking. In terms of 1 / SCALE_FACTOR_BASE.",
              "Examples:",
              "* `min_weight = 1 x SCALE_FACTOR_BASE` = minmum of 1x multiplier for > min_duration staking",
              "* `min_weight = 2 x SCALE_FACTOR_BASE` = minmum of 2x multiplier for > min_duration staking"
            ],
            "type": "u64"
          },
          {
            "name": "maxWeight",
            "docs": [
              "Maximum weight for staking lockup (i.e. weight multiplier when locked",
              "up for max duration). In terms of 1 / SCALE_FACTOR_BASE. Examples:",
              "* A `max_weight = 1 x SCALE_FACTOR_BASE` = 1x multiplier for max staking duration",
              "* A `max_weight = 2 x SCALE_FACTOR_BASE` = 2x multiplier for max staking duration"
            ],
            "type": "u64"
          },
          {
            "name": "minDuration",
            "docs": [
              "Minimum duration for lockup. At this point, the staker would receive the base weight. In seconds."
            ],
            "type": "u64"
          },
          {
            "name": "maxDuration",
            "docs": [
              "Maximum duration for lockup. At this point, the staker would receive the max weight. In seconds."
            ],
            "type": "u64"
          },
          {
            "name": "nonce",
            "docs": [
              "Nonce to derive multiple stake pools from same mint"
            ],
            "type": "u8"
          },
          {
            "name": "bumpSeed",
            "docs": [
              "Bump seed for stake_mint"
            ],
            "type": "u8"
          },
          {
            "name": "padding0",
            "type": {
              "array": [
                "u8",
                6
              ]
            }
          },
          {
            "name": "reserved0",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "stakeDepositReceipt",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Pubkey that owns the staked assets"
            ],
            "type": "pubkey"
          },
          {
            "name": "payer",
            "docs": [
              "Pubkey that paid for the deposit"
            ],
            "type": "pubkey"
          },
          {
            "name": "stakePool",
            "docs": [
              "StakePool the deposit is for"
            ],
            "type": "pubkey"
          },
          {
            "name": "lockupDuration",
            "docs": [
              "Duration of the lockup period in seconds"
            ],
            "type": "u64"
          },
          {
            "name": "depositTimestamp",
            "docs": [
              "Timestamp in seconds of when the stake lockup began"
            ],
            "type": "i64"
          },
          {
            "name": "depositAmount",
            "docs": [
              "Amount of SPL token deposited"
            ],
            "type": "u64"
          },
          {
            "name": "effectiveStake",
            "docs": [
              "Amount of stake weighted by lockup duration."
            ],
            "type": "u128"
          },
          {
            "name": "claimedAmounts",
            "docs": [
              "The amount per reward that has been claimed or perceived to be claimed. Indexes align with",
              "the StakedPool reward_pools property."
            ],
            "type": {
              "array": [
                "u128",
                10
              ]
            }
          }
        ]
      }
    }
  ]
};
