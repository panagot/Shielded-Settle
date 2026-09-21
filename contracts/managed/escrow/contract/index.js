export class Contract {
  constructor() {
    throw new Error(
      "Escrow Compact contract is not compiled. Run: npm run compact:fetch && npm run compact",
    );
  }
}

export function ledger() {
  throw new Error("Escrow Compact contract is not compiled.");
}
