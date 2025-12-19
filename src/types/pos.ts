export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  supplier: string;
  supplierId?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  profit: number;
  paymentMethod: 'cash' | 'transfer';
  createdAt: Date;
}

export interface StockOpname {
  id: string;
  productId: string;
  productName: string;
  supplierId?: string;
  supplierName?: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  notes: string;
  createdAt: Date;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalTransactions: number;
  totalProfit: number;
  topProducts: { name: string; quantity: number }[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierDeposit {
  id: string;
  supplierId: string;
  supplierName: string;
  items: DepositItem[];
  totalValue: number;
  date: Date;
  notes: string;
  status: 'pending' | 'settled';
  createdAt: Date;
}

export interface DepositItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
}
