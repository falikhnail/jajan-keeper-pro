import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePOSStore } from '@/store/posStore';
import { formatCurrency } from '@/lib/formatCurrency';
import { useState } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCloudSyncContext } from '@/components/CloudSyncProvider';

export default function Kasir() {
  const { products, cart, addToCart, updateCartQuantity, removeFromCart, clearCart, processTransaction } = usePOSStore();
  const { isLoading, syncTransaction, syncDeposit, syncProductStock } = useCloudSyncContext();
  const [search, setSearch] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [cashAmount, setCashAmount] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartProfit = cart.reduce(
    (sum, item) => sum + (item.product.price - item.product.costPrice) * item.quantity,
    0
  );

  const handlePayment = async (method: 'cash' | 'transfer') => {
    // Store cart items for syncing stock updates
    const cartItems = [...cart];
    
    const transaction = processTransaction(method);
    if (transaction) {
      // Sync transaction to cloud
      await syncTransaction(transaction);
      
      // Sync product stock updates
      for (const item of cartItems) {
        const product = products.find((p) => p.id === item.product.id);
        if (product) {
          await syncProductStock(product.id, product.stock - item.quantity);
        }
      }
      
      // Sync auto-generated deposits
      const newDeposits = usePOSStore.getState().deposits.filter(
        (d) => d.notes.includes(transaction.id)
      );
      for (const deposit of newDeposits) {
        await syncDeposit(deposit, 'insert');
      }
      
      toast.success(`Transaksi berhasil! Total: ${formatCurrency(transaction.total)}`);
      setShowPaymentDialog(false);
      setCashAmount('');
    }
  };

  const change = cashAmount ? parseInt(cashAmount) - cartTotal : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kasir</h1>
          <p className="text-muted-foreground">Proses transaksi penjualan</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Products Grid */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari produk atau kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Products */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                  onClick={() => {
                    if (product.stock > 0) {
                      addToCart(product);
                      toast.success(`${product.name} ditambahkan ke keranjang`);
                    } else {
                      toast.error('Stok habis!');
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          product.stock > 10
                            ? 'bg-green-100 text-green-700'
                            : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keranjang kosong
                  </p>
                ) : (
                  <>
                    <div className="max-h-[400px] space-y-3 overflow-y-auto">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.product.name}</p>
                            <p className="text-sm text-primary">
                              {formatCurrency(item.product.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimasi Profit</span>
                        <span className="text-green-600">{formatCurrency(cartProfit)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(cartTotal)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={clearCart}
                      >
                        Batal
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setShowPaymentDialog(true)}
                      >
                        Bayar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Pembayaran</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(cartTotal)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Uang Diterima (Cash)</label>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah uang..."
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="mt-1"
                />
                {cashAmount && change >= 0 && (
                  <p className="mt-2 text-sm">
                    Kembalian:{' '}
                    <span className="font-bold text-green-600">
                      {formatCurrency(change)}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-2"
                  onClick={() => handlePayment('cash')}
                  disabled={cashAmount ? parseInt(cashAmount) < cartTotal : false}
                >
                  <Banknote className="h-6 w-6" />
                  <span>Tunai</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-2"
                  onClick={() => handlePayment('transfer')}
                >
                  <CreditCard className="h-6 w-6" />
                  <span>Transfer</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
