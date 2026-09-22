import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  deposit(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): __compactRuntime.CircuitResults<PS, []>;
  release(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array,
                    color: Uint8Array,
                    value: bigint,
                    mt_index: bigint
                  },
          caller_0: Uint8Array): __compactRuntime.CircuitResults<PS, { change: { is_some: boolean,
                                                                                 value: { nonce: Uint8Array,
                                                                                          color: Uint8Array,
                                                                                          value: bigint
                                                                                        }
                                                                               },
                                                                       sent: { nonce: Uint8Array,
                                                                               color: Uint8Array,
                                                                               value: bigint
                                                                             }
                                                                     }>;
  refund(context: __compactRuntime.CircuitContext<PS>,
         coin_0: { nonce: Uint8Array,
                   color: Uint8Array,
                   value: bigint,
                   mt_index: bigint
                 },
         caller_0: Uint8Array): __compactRuntime.CircuitResults<PS, { change: { is_some: boolean,
                                                                                value: { nonce: Uint8Array,
                                                                                         color: Uint8Array,
                                                                                         value: bigint
                                                                                       }
                                                                              },
                                                                      sent: { nonce: Uint8Array,
                                                                              color: Uint8Array,
                                                                              value: bigint
                                                                            }
                                                                    }>;
}

export type ProvableCircuits<PS> = {
  deposit(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): __compactRuntime.CircuitResults<PS, []>;
  release(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array,
                    color: Uint8Array,
                    value: bigint,
                    mt_index: bigint
                  },
          caller_0: Uint8Array): __compactRuntime.CircuitResults<PS, { change: { is_some: boolean,
                                                                                 value: { nonce: Uint8Array,
                                                                                          color: Uint8Array,
                                                                                          value: bigint
                                                                                        }
                                                                               },
                                                                       sent: { nonce: Uint8Array,
                                                                               color: Uint8Array,
                                                                               value: bigint
                                                                             }
                                                                     }>;
  refund(context: __compactRuntime.CircuitContext<PS>,
         coin_0: { nonce: Uint8Array,
                   color: Uint8Array,
                   value: bigint,
                   mt_index: bigint
                 },
         caller_0: Uint8Array): __compactRuntime.CircuitResults<PS, { change: { is_some: boolean,
                                                                                value: { nonce: Uint8Array,
                                                                                         color: Uint8Array,
                                                                                         value: bigint
                                                                                       }
                                                                              },
                                                                      sent: { nonce: Uint8Array,
                                                                              color: Uint8Array,
                                                                              value: bigint
                                                                            }
                                                                    }>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  deposit(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): __compactRuntime.CircuitResults<PS, []>;
  release(context: __compactRuntime.CircuitContext<PS>,
          coin_0: { nonce: Uint8Array,
                    color: Uint8Array,
                    value: bigint,
                    mt_index: bigint
                  },
          caller_0: Uint8Array): __compactRuntime.CircuitResults<PS, { change: { is_some: boolean,
                                                                                 value: { nonce: Uint8Array,
                                                                                          color: Uint8Array,
                                                                                          value: bigint
                                                                                        }
                                                                               },
                                                                       sent: { nonce: Uint8Array,
                                                                               color: Uint8Array,
                                                                               value: bigint
                                                                             }
                                                                     }>;
  refund(context: __compactRuntime.CircuitContext<PS>,
         coin_0: { nonce: Uint8Array,
                   color: Uint8Array,
                   value: bigint,
                   mt_index: bigint
                 },
         caller_0: Uint8Array): __compactRuntime.CircuitResults<PS, { change: { is_some: boolean,
                                                                                value: { nonce: Uint8Array,
                                                                                         color: Uint8Array,
                                                                                         value: bigint
                                                                                       }
                                                                              },
                                                                      sent: { nonce: Uint8Array,
                                                                              color: Uint8Array,
                                                                              value: bigint
                                                                            }
                                                                    }>;
}

export type Ledger = {
  readonly depositor: Uint8Array;
  readonly beneficiary: Uint8Array;
  readonly escrowVault: { nonce: Uint8Array,
                          color: Uint8Array,
                          value: bigint,
                          mt_index: bigint
                        };
  readonly funded: boolean;
  readonly settled: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               dep_0: Uint8Array,
               ben_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
