import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Transaction, StockOpname, Supplier, SupplierDeposit, DepositItem } from '@/types/pos';

interface POSStore {
  products: Product[];
  cart: CartItem[];
  transactions: Transaction[];
  stockOpnames: StockOpname[];
  suppliers: Supplier[];
  deposits: SupplierDeposit[];
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Transaction actions
  processTransaction: (paymentMethod: 'cash' | 'transfer') => Transaction | null;
  
  // Stock opname actions
  addStockOpname: (opname: Omit<StockOpname, 'id' | 'createdAt'>) => void;
  applyStockOpname: (opnameId: string) => void;

  // Supplier actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Deposit actions
  addDeposit: (deposit: Omit<SupplierDeposit, 'id' | 'createdAt'>) => void;
  settleDeposit: (depositId: string) => void;
  deleteDeposit: (depositId: string) => void;

  // Relational getters
  getProductsBySupplier: (supplierId: string) => Product[];
  getTransactionsByProduct: (productId: string) => Transaction[];
  getDepositsBySupplier: (supplierId: string) => SupplierDeposit[];
  getStockOpnamesByProduct: (productId: string) => StockOpname[];
  getSupplierById: (supplierId: string) => Supplier | undefined;
  getProductById: (productId: string) => Product | undefined;
  getSupplierStats: (supplierId: string) => { totalProducts: number; totalDeposits: number; totalValue: number };
  getProductStats: (productId: string) => { totalSold: number; totalRevenue: number; totalProfit: number };
}

const generateId = () => crypto.randomUUID();

// Sample suppliers with valid UUIDs
const sampleSuppliers: Supplier[] = [
  { id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', name: 'Pak Ahmad', phone: '081234567890', address: 'Jl. Merdeka No. 10', notes: 'Supplier snack', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', name: 'Bu Siti', phone: '081234567891', address: 'Jl. Sudirman No. 5', notes: 'Supplier wafer & biskuit', createdAt: new Date(), updatedAt: new Date() },
  { id: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', name: 'Pak Budi', phone: '081234567892', address: 'Jl. Gatot Subroto No. 15', notes: 'Supplier minuman', createdAt: new Date(), updatedAt: new Date() },
  { id: 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', name: 'Bu Dewi', phone: '081234567893', address: 'Jl. Diponegoro No. 20', notes: 'Supplier roti & coklat', createdAt: new Date(), updatedAt: new Date() },
];

// Sample products with valid UUIDs
const sampleProducts: Product[] = [
  { id: 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', name: 'Chitato Original', price: 10000, costPrice: 8000, stock: 50, supplier: 'Pak Ahmad', supplierId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', category: 'Snack', createdAt: new Date(), updatedAt: new Date() },
  { id: 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', name: 'Tango Wafer', price: 5000, costPrice: 4000, stock: 30, supplier: 'Bu Siti', supplierId: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', category: 'Wafer', createdAt: new Date(), updatedAt: new Date() },
  { id: 'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', name: 'Pocky Strawberry', price: 8000, costPrice: 6500, stock: 25, supplier: 'Pak Ahmad', supplierId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', category: 'Biskuit', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', name: 'Oreo Original', price: 7000, costPrice: 5500, stock: 40, supplier: 'Bu Siti', supplierId: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', category: 'Biskuit', createdAt: new Date(), updatedAt: new Date() },
  { id: 'c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', name: 'Aqua 600ml', price: 4000, costPrice: 3000, stock: 100, supplier: 'Pak Budi', supplierId: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', category: 'Minuman', createdAt: new Date(), updatedAt: new Date() },
  { id: 'd0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', name: 'Teh Pucuk 350ml', price: 5000, costPrice: 3800, stock: 60, supplier: 'Pak Budi', supplierId: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', category: 'Minuman', createdAt: new Date(), updatedAt: new Date() },
  { id: 'e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', name: 'Sari Roti Coklat', price: 6000, costPrice: 4500, stock: 20, supplier: 'Bu Dewi', supplierId: 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', category: 'Roti', createdAt: new Date(), updatedAt: new Date() },
  { id: 'f2a3b4c5-d6e7-5f6a-9b0c-1d2e3f4a5b6c', name: 'Silverqueen Chunky', price: 15000, costPrice: 12000, stock: 15, supplier: 'Bu Dewi', supplierId: 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', category: 'Coklat', createdAt: new Date(), updatedAt: new Date() },
];

// Sample transactions with valid UUIDs
const sampleTransactions: Transaction[] = [
  { id: 'a3b4c5d6-e7f8-6a7b-0c1d-2e3f4a5b6c7d', items: [{ product: sampleProducts[0], quantity: 2 }], total: 20000, profit: 4000, paymentMethod: 'cash', createdAt: new Date(Date.now() - 3600000) },
  { id: 'b4c5d6e7-f8a9-7b8c-1d2e-3f4a5b6c7d8e', items: [{ product: sampleProducts[1], quantity: 3 }, { product: sampleProducts[4], quantity: 2 }], total: 23000, profit: 5000, paymentMethod: 'transfer', createdAt: new Date(Date.now() - 7200000) },
  { id: 'c5d6e7f8-a9b0-8c9d-2e3f-4a5b6c7d8e9f', items: [{ product: sampleProducts[5], quantity: 1 }], total: 5000, profit: 1200, paymentMethod: 'cash', createdAt: new Date(Date.now() - 10800000) },
];

// Sample deposits with valid UUIDs
const sampleDeposits: SupplierDeposit[] = [
  {
    id: 'd6e7f8a9-b0c1-9d0e-3f4a-5b6c7d8e9f0a',
    supplierId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    supplierName: 'Pak Ahmad',
    items: [
      { productId: 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', productName: 'Chitato Original', quantity: 20, costPrice: 8000 },
      { productId: 'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', productName: 'Pocky Strawberry', quantity: 15, costPrice: 6500 },
    ],
    totalValue: 257500,
    date: new Date(Date.now() - 86400000),
    notes: 'Setoran pagi',
    status: 'settled',
    createdAt: new Date(Date.now() - 86400000),
  },
];

export const usePOSStore = create<POSStore>()(
  persist(
    (set, get) => ({
      products: sampleProducts,
      cart: [],
      transactions: sampleTransactions,
      stockOpnames: [],
      suppliers: sampleSuppliers,
      deposits: sampleDeposits,

      addProduct: (productData) => {
        const product: Product = {
          ...productData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ products: [...state.products, product] }));
      },

      updateProduct: (id, productData) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...productData, updatedAt: new Date() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.cart.find((item) => item.product.id === product.id);
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        }));
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ cart: [] });
      },

      processTransaction: (paymentMethod) => {
        const { cart, products, suppliers, deposits } = get();
        if (cart.length === 0) return null;

        const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const profit = cart.reduce(
          (sum, item) => sum + (item.product.price - item.product.costPrice) * item.quantity,
          0
        );

        const transaction: Transaction = {
          id: generateId(),
          items: [...cart],
          total,
          profit,
          paymentMethod,
          createdAt: new Date(),
        };

        // Update stock
        const updatedProducts = products.map((product) => {
          const cartItem = cart.find((item) => item.product.id === product.id);
          if (cartItem) {
            return { ...product, stock: product.stock - cartItem.quantity, updatedAt: new Date() };
          }
          return product;
        });

        // Auto-create deposits for each supplier based on sold items (costPrice)
        const supplierSales: Record<string, { items: DepositItem[]; totalValue: number }> = {};
        
        cart.forEach((cartItem) => {
          const product = cartItem.product;
          if (product.supplierId) {
            if (!supplierSales[product.supplierId]) {
              supplierSales[product.supplierId] = { items: [], totalValue: 0 };
            }
            
            const existingItem = supplierSales[product.supplierId].items.find(
              (i) => i.productId === product.id
            );
            
            if (existingItem) {
              existingItem.quantity += cartItem.quantity;
            } else {
              supplierSales[product.supplierId].items.push({
                productId: product.id,
                productName: product.name,
                quantity: cartItem.quantity,
                costPrice: product.costPrice,
              });
            }
            
            supplierSales[product.supplierId].totalValue += product.costPrice * cartItem.quantity;
          }
        });

        // Create new deposits for each supplier
        const newDeposits: SupplierDeposit[] = Object.entries(supplierSales).map(
          ([supplierId, data]) => {
            const supplier = suppliers.find((s) => s.id === supplierId);
            return {
              id: generateId(),
              supplierId,
              supplierName: supplier?.name || 'Unknown',
              items: data.items,
              totalValue: data.totalValue,
              date: new Date(),
              notes: `Penjualan otomatis - ${transaction.id}`,
              status: 'pending' as const,
              createdAt: new Date(),
            };
          }
        );

        set((state) => ({
          transactions: [transaction, ...state.transactions],
          products: updatedProducts,
          deposits: [...newDeposits, ...state.deposits],
          cart: [],
        }));

        return transaction;
      },

      addStockOpname: (opnameData) => {
        // Get supplier info from product
        const product = get().products.find((p) => p.id === opnameData.productId);
        const opname: StockOpname = {
          ...opnameData,
          id: generateId(),
          supplierId: product?.supplierId,
          supplierName: product?.supplier,
          createdAt: new Date(),
        };
        set((state) => ({ stockOpnames: [opname, ...state.stockOpnames] }));
      },

      applyStockOpname: (opnameId) => {
        const { stockOpnames, products } = get();
        const opname = stockOpnames.find((o) => o.id === opnameId);
        if (!opname) return;

        const updatedProducts = products.map((product) => {
          if (product.id === opname.productId) {
            return { ...product, stock: opname.actualStock, updatedAt: new Date() };
          }
          return product;
        });

        set({ products: updatedProducts });
      },

      // Supplier actions
      addSupplier: (supplierData) => {
        const supplier: Supplier = {
          ...supplierData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ suppliers: [...state.suppliers, supplier] }));
      },

      updateSupplier: (id, supplierData) => {
        set((state) => {
          const updatedSuppliers = state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplierData, updatedAt: new Date() } : s
          );
          
          // Sync supplier name in products if name changed
          const supplier = updatedSuppliers.find((s) => s.id === id);
          const updatedProducts = supplier && supplierData.name
            ? state.products.map((p) =>
                p.supplierId === id ? { ...p, supplier: supplier.name, updatedAt: new Date() } : p
              )
            : state.products;

          // Sync supplier name in deposits if name changed
          const updatedDeposits = supplier && supplierData.name
            ? state.deposits.map((d) =>
                d.supplierId === id ? { ...d, supplierName: supplier.name } : d
              )
            : state.deposits;

          return {
            suppliers: updatedSuppliers,
            products: updatedProducts,
            deposits: updatedDeposits,
          };
        });
      },

      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }));
      },

      // Deposit actions
      addDeposit: (depositData) => {
        const deposit: SupplierDeposit = {
          ...depositData,
          id: generateId(),
          createdAt: new Date(),
        };

        // Update product stock
        const { products } = get();
        const updatedProducts = products.map((product) => {
          const depositItem = depositData.items.find((item) => item.productId === product.id);
          if (depositItem) {
            return { ...product, stock: product.stock + depositItem.quantity, updatedAt: new Date() };
          }
          return product;
        });

        set((state) => ({
          deposits: [deposit, ...state.deposits],
          products: updatedProducts,
        }));
      },

      settleDeposit: (depositId) => {
        set((state) => ({
          deposits: state.deposits.map((d) =>
            d.id === depositId ? { ...d, status: 'settled' as const } : d
          ),
        }));
      },

      deleteDeposit: (depositId) => {
        set((state) => ({
          deposits: state.deposits.filter((d) => d.id !== depositId),
        }));
      },

      // Relational getters
      getProductsBySupplier: (supplierId) => {
        return get().products.filter((p) => p.supplierId === supplierId);
      },

      getTransactionsByProduct: (productId) => {
        return get().transactions.filter((t) =>
          t.items.some((item) => item.product.id === productId)
        );
      },

      getDepositsBySupplier: (supplierId) => {
        return get().deposits.filter((d) => d.supplierId === supplierId);
      },

      getStockOpnamesByProduct: (productId) => {
        return get().stockOpnames.filter((o) => o.productId === productId);
      },

      getSupplierById: (supplierId) => {
        return get().suppliers.find((s) => s.id === supplierId);
      },

      getProductById: (productId) => {
        return get().products.find((p) => p.id === productId);
      },

      getSupplierStats: (supplierId) => {
        const products = get().products.filter((p) => p.supplierId === supplierId);
        const deposits = get().deposits.filter((d) => d.supplierId === supplierId);
        const totalValue = deposits.reduce((sum, d) => sum + d.totalValue, 0);
        return {
          totalProducts: products.length,
          totalDeposits: deposits.length,
          totalValue,
        };
      },

      getProductStats: (productId) => {
        const transactions = get().transactions;
        let totalSold = 0;
        let totalRevenue = 0;
        let totalProfit = 0;

        transactions.forEach((t) => {
          t.items.forEach((item) => {
            if (item.product.id === productId) {
              totalSold += item.quantity;
              totalRevenue += item.product.price * item.quantity;
              totalProfit += (item.product.price - item.product.costPrice) * item.quantity;
            }
          });
        });

        return { totalSold, totalRevenue, totalProfit };
      },
    }),
    {
      name: 'pos-storage',
    }
  )
);
