// Shared minimal type for backup serialization.
// We keep it separate to avoid importing Zustand internals inside the backup lib.

export type POSStore = {
  products: unknown[];
  suppliers: unknown[];
  transactions: unknown[];
  stockOpnames: unknown[];
  deposits: unknown[];
  cart: unknown[];
};
