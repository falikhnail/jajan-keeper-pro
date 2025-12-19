import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePOSStore } from '@/store/posStore';
import { formatCurrency } from '@/lib/formatCurrency';
import { useState } from 'react';
import { ClipboardCheck, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCloudSyncContext } from '@/components/CloudSyncProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function StokOpname() {
  const { products, stockOpnames, addStockOpname, applyStockOpname, updateProduct } = usePOSStore();
  const { isLoading, syncStockOpname, syncProductStock } = useCloudSyncContext();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [actualStock, setActualStock] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  const handleSubmit = async () => {
    if (!selectedProduct || actualStock === '') {
      toast.error('Pilih produk dan masukkan stok aktual');
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const actual = parseInt(actualStock);
    const difference = actual - product.stock;

    addStockOpname({
      productId: product.id,
      productName: product.name,
      systemStock: product.stock,
      actualStock: actual,
      difference,
      notes,
    });

    // Immediately apply the stock adjustment
    updateProduct(product.id, { stock: actual });

    // Sync to cloud
    const newOpnames = usePOSStore.getState().stockOpnames;
    const newOpname = newOpnames[0]; // Most recent opname
    await syncStockOpname(newOpname);
    await syncProductStock(product.id, actual);

    toast.success(`Stok opname berhasil! Stok ${product.name} diperbarui menjadi ${actual}`);
    
    // Reset form
    setSelectedProduct('');
    setActualStock('');
    setNotes('');
  };

  const filteredOpnames = stockOpnames.filter(
    (o) => o.productName.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-foreground">Stok Opname</h1>
          <p className="text-muted-foreground">Penyesuaian stok berdasarkan penghitungan fisik</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Input Stok Opname
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Produk *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stok sistem: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProductData && (
                <div className="rounded-lg bg-accent p-4 space-y-2">
                  <p className="font-medium">{selectedProductData.name}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stok Sistem:</span>
                      <span className="ml-2 font-bold">{selectedProductData.stock}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Harga:</span>
                      <span className="ml-2 font-bold">
                        {formatCurrency(selectedProductData.price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Supplier:</span>
                      <span className="ml-2 font-bold">{selectedProductData.supplier || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="actualStock">Stok Aktual (Hasil Hitung Fisik) *</Label>
                <Input
                  id="actualStock"
                  type="number"
                  value={actualStock}
                  onChange={(e) => setActualStock(e.target.value)}
                  placeholder="Masukkan jumlah stok aktual"
                />
              </div>

              {selectedProductData && actualStock !== '' && (
                <div
                  className={`rounded-lg p-4 ${
                    parseInt(actualStock) === selectedProductData.stock
                      ? 'bg-green-100 text-green-700'
                      : parseInt(actualStock) < selectedProductData.stock
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {parseInt(actualStock) === selectedProductData.stock ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {parseInt(actualStock) === selectedProductData.stock
                        ? 'Stok sesuai'
                        : `Selisih: ${parseInt(actualStock) - selectedProductData.stock} unit`}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Ada 2 produk rusak, 1 produk expired"
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!selectedProduct || actualStock === ''}
              >
                Simpan Stok Opname
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Stok Opname</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                {filteredOpnames.length > 0 ? (
                  <div className="space-y-3">
                    {filteredOpnames.map((opname) => (
                      <div
                        key={opname.id}
                        className="rounded-lg border border-border p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{opname.productName}</p>
                            {opname.supplierName && (
                              <p className="text-xs text-primary font-medium">
                                Supplier: {opname.supplierName}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(opname.createdAt).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              opname.difference === 0
                                ? 'bg-green-100 text-green-700'
                                : opname.difference < 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {opname.difference > 0 ? '+' : ''}
                            {opname.difference}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Stok Sistem:</span>
                            <span className="ml-2">{opname.systemStock}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stok Aktual:</span>
                            <span className="ml-2">{opname.actualStock}</span>
                          </div>
                        </div>
                        {opname.notes && (
                          <p className="text-sm text-muted-foreground">
                            Catatan: {opname.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada riwayat stok opname
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stock Check Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Stok Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Stok Sistem</TableHead>
                    <TableHead className="text-right">Nilai Stok</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.supplier}</TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.stock * product.costPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="rounded-lg bg-primary/10 px-4 py-2">
                <span className="text-sm text-muted-foreground">Total Nilai Stok: </span>
                <span className="font-bold text-primary">
                  {formatCurrency(
                    products.reduce((sum, p) => sum + p.stock * p.costPrice, 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
