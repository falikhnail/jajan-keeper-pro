import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePOSStore } from '@/store/posStore';
import { Product, Supplier, Transaction, StockOpname, SupplierDeposit, DepositItem, CartItem } from '@/types/pos';
import { toast } from 'sonner';

export function useCloudSync() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const store = usePOSStore();

  // Load data from cloud on mount
  const loadFromCloud = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load suppliers first (products reference them)
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (suppliersError) throw suppliersError;

      const suppliers: Supplier[] = (suppliersData || []).map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone || '',
        address: s.address || '',
        notes: s.notes || '',
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      }));

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const products: Product[] = (productsData || []).map((p) => {
        const supplier = suppliers.find((s) => s.id === p.supplier_id);
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          costPrice: p.cost_price,
          stock: p.stock,
          supplierId: p.supplier_id || undefined,
          supplier: supplier?.name || '',
          category: p.category || '',
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        };
      });

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      const transactions: Transaction[] = (transactionsData || []).map((t) => ({
        id: t.id,
        items: (t.items as unknown as CartItem[]) || [],
        total: t.total,
        profit: t.profit,
        paymentMethod: t.payment_method as 'cash' | 'transfer',
        createdAt: new Date(t.created_at),
      }));

      // Load stock opnames
      const { data: stockOpnamesData, error: stockOpnamesError } = await supabase
        .from('stock_opnames')
        .select('*')
        .order('created_at', { ascending: false });

      if (stockOpnamesError) throw stockOpnamesError;

      const stockOpnames: StockOpname[] = (stockOpnamesData || []).map((o) => ({
        id: o.id,
        productId: o.product_id || '',
        productName: o.product_name,
        supplierId: o.supplier_id || undefined,
        supplierName: o.supplier_name || undefined,
        systemStock: o.system_stock,
        actualStock: o.actual_stock,
        difference: o.difference,
        notes: o.notes || '',
        createdAt: new Date(o.created_at),
      }));

      // Load deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('supplier_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (depositsError) throw depositsError;

      const deposits: SupplierDeposit[] = (depositsData || []).map((d) => ({
        id: d.id,
        supplierId: d.supplier_id,
        supplierName: d.supplier_name,
        items: (d.items as unknown as DepositItem[]) || [],
        totalValue: d.total_value,
        date: new Date(d.date),
        notes: d.notes || '',
        status: d.status as 'pending' | 'settled',
        createdAt: new Date(d.created_at),
      }));

      // SAFETY: Jangan timpa data lokal jika cloud kosong (agar transaksi tidak “hilang”)
      const current = usePOSStore.getState();
      usePOSStore.setState({
        suppliers: suppliers.length > 0 || current.suppliers.length === 0 ? suppliers : current.suppliers,
        products: products.length > 0 || current.products.length === 0 ? products : current.products,
        transactions: transactions.length > 0 || current.transactions.length === 0 ? transactions : current.transactions,
        stockOpnames: stockOpnames.length > 0 || current.stockOpnames.length === 0 ? stockOpnames : current.stockOpnames,
        deposits: deposits.length > 0 || current.deposits.length === 0 ? deposits : current.deposits,
      });
    } catch (error) {
      console.error('Failed to load from cloud:', error);
      toast.error('Gagal memuat data dari cloud');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync functions for each entity
  const syncSupplier = useCallback(
    async (supplier: Supplier, action: 'insert' | 'update' | 'delete') => {
      setIsSyncing(true);
      try {
        if (action === 'delete') {
          const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', supplier.id);
          if (error) throw error;
        } else if (action === 'insert') {
          const { error } = await supabase.from('suppliers').insert({
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone,
            address: supplier.address,
            notes: supplier.notes,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('suppliers')
            .update({
              name: supplier.name,
              phone: supplier.phone,
              address: supplier.address,
              notes: supplier.notes,
            })
            .eq('id', supplier.id);
          if (error) throw error;
        }
      } catch (error) {
        console.error('Failed to sync supplier:', error);
        toast.error('Gagal menyimpan supplier ke cloud');
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const syncProduct = useCallback(
    async (product: Product, action: 'insert' | 'update' | 'delete') => {
      setIsSyncing(true);
      try {
        if (action === 'delete') {
          const { error } = await supabase.from('products').delete().eq('id', product.id);
          if (error) throw error;
        } else if (action === 'insert') {
          const { error } = await supabase.from('products').insert({
            id: product.id,
            name: product.name,
            price: product.price,
            cost_price: product.costPrice,
            stock: product.stock,
            supplier_id: product.supplierId || null,
            category: product.category,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('products')
            .update({
              name: product.name,
              price: product.price,
              cost_price: product.costPrice,
              stock: product.stock,
              supplier_id: product.supplierId || null,
              category: product.category,
            })
            .eq('id', product.id);
          if (error) throw error;
        }
      } catch (error) {
        console.error('Failed to sync product:', error);
        toast.error('Gagal menyimpan produk ke cloud');
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const syncTransaction = useCallback(async (transaction: Transaction) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('transactions').insert([
        {
          id: transaction.id,
          total: transaction.total,
          profit: transaction.profit,
          payment_method: transaction.paymentMethod,
          items: JSON.parse(JSON.stringify(transaction.items)),
        },
      ]);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync transaction:', error);
      toast.error('Gagal menyimpan transaksi ke cloud');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncStockOpname = useCallback(async (opname: StockOpname) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('stock_opnames').insert({
        id: opname.id,
        product_id: opname.productId,
        product_name: opname.productName,
        supplier_id: opname.supplierId || null,
        supplier_name: opname.supplierName || null,
        system_stock: opname.systemStock,
        actual_stock: opname.actualStock,
        difference: opname.difference,
        notes: opname.notes,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync stock opname:', error);
      toast.error('Gagal menyimpan stok opname ke cloud');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncDeposit = useCallback(
    async (deposit: SupplierDeposit, action: 'insert' | 'update' | 'delete') => {
      setIsSyncing(true);
      try {
        if (action === 'delete') {
          const { error } = await supabase
            .from('supplier_deposits')
            .delete()
            .eq('id', deposit.id);
          if (error) throw error;
        } else if (action === 'insert') {
          const { error } = await supabase.from('supplier_deposits').insert([
            {
              id: deposit.id,
              supplier_id: deposit.supplierId,
              supplier_name: deposit.supplierName,
              items: JSON.parse(JSON.stringify(deposit.items)),
              total_value: deposit.totalValue,
              date: deposit.date.toISOString(),
              notes: deposit.notes,
              status: deposit.status,
            },
          ]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('supplier_deposits')
            .update({
              status: deposit.status,
            })
            .eq('id', deposit.id);
          if (error) throw error;
        }
      } catch (error) {
        console.error('Failed to sync deposit:', error);
        toast.error('Gagal menyimpan setoran ke cloud');
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const syncProductStock = useCallback(async (productId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock: newStock,
        })
        .eq('id', productId);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync product stock:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadFromCloud();
  }, [loadFromCloud]);

  // NOTE: Realtime subscription dimatikan karena bisa mengganggu (data lokal ter-timpa saat cloud kosong)

  // Sync all local data to cloud (initial sync)
  const syncAllToCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const state = usePOSStore.getState();
      
      // Sync suppliers first (products reference them)
      for (const supplier of state.suppliers) {
        const { data: existing } = await supabase
          .from('suppliers')
          .select('id')
          .eq('id', supplier.id)
          .maybeSingle();
        
        if (!existing) {
          const { error } = await supabase.from('suppliers').insert({
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone,
            address: supplier.address,
            notes: supplier.notes,
          });
          if (error) console.error('Failed to sync supplier:', error);
        }
      }
      
      // Sync products
      for (const product of state.products) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('id', product.id)
          .maybeSingle();
        
        if (!existing) {
          const { error } = await supabase.from('products').insert({
            id: product.id,
            name: product.name,
            price: product.price,
            cost_price: product.costPrice,
            stock: product.stock,
            supplier_id: product.supplierId || null,
            category: product.category,
          });
          if (error) console.error('Failed to sync product:', error);
        }
      }
      
      // Sync transactions
      for (const transaction of state.transactions) {
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('id', transaction.id)
          .maybeSingle();
        
        if (!existing) {
          const { error } = await supabase.from('transactions').insert({
            id: transaction.id,
            total: transaction.total,
            profit: transaction.profit,
            payment_method: transaction.paymentMethod,
            items: JSON.parse(JSON.stringify(transaction.items)),
          });
          if (error) console.error('Failed to sync transaction:', error);
        }
      }
      
      // Sync stock opnames
      for (const opname of state.stockOpnames) {
        const { data: existing } = await supabase
          .from('stock_opnames')
          .select('id')
          .eq('id', opname.id)
          .maybeSingle();
        
        if (!existing) {
          const { error } = await supabase.from('stock_opnames').insert({
            id: opname.id,
            product_id: opname.productId,
            product_name: opname.productName,
            supplier_id: opname.supplierId || null,
            supplier_name: opname.supplierName || null,
            system_stock: opname.systemStock,
            actual_stock: opname.actualStock,
            difference: opname.difference,
            notes: opname.notes,
          });
          if (error) console.error('Failed to sync stock opname:', error);
        }
      }
      
      // Sync deposits
      for (const deposit of state.deposits) {
        const { data: existing } = await supabase
          .from('supplier_deposits')
          .select('id')
          .eq('id', deposit.id)
          .maybeSingle();
        
        if (!existing) {
          const { error } = await supabase.from('supplier_deposits').insert({
            id: deposit.id,
            supplier_id: deposit.supplierId,
            supplier_name: deposit.supplierName,
            items: JSON.parse(JSON.stringify(deposit.items)),
            total_value: deposit.totalValue,
            date: deposit.date.toISOString(),
            notes: deposit.notes,
            status: deposit.status,
          });
          if (error) console.error('Failed to sync deposit:', error);
        }
      }
      
      toast.success('Semua data berhasil disinkronkan ke cloud!');
    } catch (error) {
      console.error('Failed to sync all to cloud:', error);
      toast.error('Gagal menyinkronkan data ke cloud');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isLoading,
    isSyncing,
    loadFromCloud,
    syncSupplier,
    syncProduct,
    syncTransaction,
    syncStockOpname,
    syncDeposit,
    syncProductStock,
    syncAllToCloud,
  };
}
