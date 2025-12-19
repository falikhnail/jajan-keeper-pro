import type { Product, Supplier, Transaction, StockOpname, SupplierDeposit, CartItem, DepositItem } from "@/types/pos";

export type POSBackup = {
  version: 1;
  exportedAt: string;
  data: POSBackupData;
};

type POSBackupData = {
  products: (Omit<Product, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string })[];
  suppliers: (Omit<Supplier, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string })[];
  transactions: (Omit<Transaction, "createdAt"> & { createdAt: string })[];
  stockOpnames: (Omit<StockOpname, "createdAt"> & { createdAt: string })[];
  deposits: (Omit<SupplierDeposit, "createdAt" | "date" | "items"> & {
    createdAt: string;
    date: string;
    items: DepositItem[];
  })[];
};

export function serializePOSBackup(state: any): POSBackupData {
  return {
    products: (state.products ?? []).map((p: Product) => ({
      ...p,
      createdAt: new Date(p.createdAt).toISOString(),
      updatedAt: new Date(p.updatedAt).toISOString(),
    })),
    suppliers: (state.suppliers ?? []).map((s: Supplier) => ({
      ...s,
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: new Date(s.updatedAt).toISOString(),
    })),
    transactions: (state.transactions ?? []).map((t: Transaction) => ({
      ...t,
      createdAt: new Date(t.createdAt).toISOString(),
      items: (t.items ?? []).map((ci: CartItem) => ({
        product: {
          ...ci.product,
          createdAt: new Date(ci.product.createdAt).toISOString() as any,
          updatedAt: new Date(ci.product.updatedAt).toISOString() as any,
        } as any,
        quantity: ci.quantity,
      })) as any,
    })),
    stockOpnames: (state.stockOpnames ?? []).map((o: StockOpname) => ({
      ...o,
      createdAt: new Date(o.createdAt).toISOString(),
    })),
    deposits: (state.deposits ?? []).map((d: SupplierDeposit) => ({
      ...d,
      createdAt: new Date(d.createdAt).toISOString(),
      date: new Date(d.date).toISOString(),
      items: (d.items ?? []).map((i) => ({ ...i })),
    })),
  };
}

export function deserializePOSBackup(parsed: unknown) {
  const backup = parsed as any;
  if (!backup || typeof backup !== "object" || typeof backup.version !== "number" || !backup.data) {
    throw new Error("Invalid backup envelope");
  }

  const data = backup.data as POSBackupData;

  const products: Product[] = (data.products ?? []).map((p: any) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));

  const suppliers: Supplier[] = (data.suppliers ?? []).map((s: any) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  }));

  const transactions: Transaction[] = (data.transactions ?? []).map((t: any) => ({
    ...t,
    createdAt: new Date(t.createdAt),
    items: (t.items ?? []).map((ci: any) => ({
      product: {
        ...ci.product,
        createdAt: new Date(ci.product.createdAt),
        updatedAt: new Date(ci.product.updatedAt),
      },
      quantity: ci.quantity,
    })),
  }));

  const stockOpnames: StockOpname[] = (data.stockOpnames ?? []).map((o: any) => ({
    ...o,
    createdAt: new Date(o.createdAt),
  }));

  const deposits: SupplierDeposit[] = (data.deposits ?? []).map((d: any) => ({
    ...d,
    createdAt: new Date(d.createdAt),
    date: new Date(d.date),
    items: (d.items ?? []).map((i: any) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: Number(i.quantity),
      costPrice: Number(i.costPrice),
    })),
  }));

  return {
    products,
    suppliers,
    transactions,
    stockOpnames,
    deposits,
    cart: [],
  } as any;
}
