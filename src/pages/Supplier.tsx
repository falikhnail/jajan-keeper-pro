import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePOSStore } from '@/store/posStore';
import { formatCurrency } from '@/lib/formatCurrency';
import { useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Phone,
  MapPin,
  Package,
  Clock,
  Bell,
  AlertTriangle,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import { useCloudSyncContext } from '@/components/CloudSyncProvider';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Supplier, DepositItem } from '@/types/pos';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialSupplierForm = {
  name: '',
  phone: '',
  address: '',
  notes: '',
};

export default function SupplierPage() {
  const {
    suppliers,
    products,
    deposits,
    stockOpnames,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addDeposit,
    settleDeposit,
  } = usePOSStore();
  const { isLoading, syncSupplier, syncDeposit, syncProductStock } = useCloudSyncContext();

  const [search, setSearch] = useState('');
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm);

  // Deposit form
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [depositItems, setDepositItems] = useState<DepositItem[]>([]);
  const [depositNotes, setDepositNotes] = useState('');

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  // Overdue deposits calculation
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const overdueDeposits = deposits.filter((d) => {
    const depositDate = new Date(d.date);
    return d.status === 'pending' && depositDate < sevenDaysAgo;
  });

  const getOverdueDays = (date: Date) => {
    const depositDate = new Date(date);
    const diffTime = Math.abs(new Date().getTime() - depositDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isDepositOverdue = (deposit: { date: Date; status: string }) => {
    const depositDate = new Date(deposit.date);
    return deposit.status === 'pending' && depositDate < sevenDaysAgo;
  };

  // Get supplier stats
  const getSupplierStats = (supplierId: string) => {
    const supplierProducts = products.filter((p) => p.supplierId === supplierId);
    const supplierDeposits = deposits.filter((d) => d.supplierId === supplierId);
    const totalDeposits = supplierDeposits.reduce((sum, d) => sum + d.totalValue, 0);
    const pendingDeposits = supplierDeposits.filter((d) => d.status === 'pending');
    const pendingValue = pendingDeposits.reduce((sum, d) => sum + d.totalValue, 0);
    const overdueCount = supplierDeposits.filter((d) => isDepositOverdue(d)).length;

    return {
      productCount: supplierProducts.length,
      totalDeposits,
      pendingCount: pendingDeposits.length,
      pendingValue,
      overdueCount,
    };
  };

  const handleSubmitSupplier = async () => {
    if (!supplierForm.name) {
      toast.error('Nama supplier wajib diisi');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierForm);
      await syncSupplier({ ...editingSupplier, ...supplierForm }, 'update');
      toast.success('Supplier berhasil diperbarui');
    } else {
      addSupplier(supplierForm);
      const newSuppliers = usePOSStore.getState().suppliers;
      const newSupplier = newSuppliers[newSuppliers.length - 1];
      await syncSupplier(newSupplier, 'insert');
      toast.success('Supplier berhasil ditambahkan');
    }

    handleCloseSupplierDialog();
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
    });
    setShowSupplierDialog(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (supplier) {
      deleteSupplier(id);
      await syncSupplier(supplier, 'delete');
      toast.success('Supplier berhasil dihapus');
    }
    setDeleteConfirm(null);
  };

  const handleCloseSupplierDialog = () => {
    setShowSupplierDialog(false);
    setEditingSupplier(null);
    setSupplierForm(initialSupplierForm);
  };

  // Deposit handlers
  const supplierProducts = selectedSupplier
    ? products.filter((p) => p.supplierId === selectedSupplier)
    : [];

  const handleAddDepositItem = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existing = depositItems.find((i) => i.productId === productId);
    if (existing) {
      setDepositItems(
        depositItems.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setDepositItems([
        ...depositItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          costPrice: product.costPrice,
        },
      ]);
    }
  };

  const handleUpdateDepositItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setDepositItems(depositItems.filter((i) => i.productId !== productId));
    } else {
      setDepositItems(
        depositItems.map((i) =>
          i.productId === productId ? { ...i, quantity: qty } : i
        )
      );
    }
  };

  const handleSubmitDeposit = async () => {
    if (!selectedSupplier) {
      toast.error('Pilih supplier terlebih dahulu');
      return;
    }
    if (depositItems.length === 0) {
      toast.error('Tambahkan minimal 1 produk');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplier);
    const totalValue = depositItems.reduce(
      (sum, item) => sum + item.quantity * item.costPrice,
      0
    );

    addDeposit({
      supplierId: selectedSupplier,
      supplierName: supplier?.name || '',
      items: depositItems,
      totalValue,
      date: new Date(),
      notes: depositNotes,
      status: 'pending',
    });

    // Sync deposit and product stock updates to cloud
    const newDeposits = usePOSStore.getState().deposits;
    const newDeposit = newDeposits[0];
    await syncDeposit(newDeposit, 'insert');
    
    // Sync product stock updates
    for (const item of depositItems) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        await syncProductStock(product.id, product.stock + item.quantity);
      }
    }

    toast.success('Setoran berhasil dicatat! Stok produk telah diperbarui.');
    handleCloseDepositDialog();
  };

  const handleCloseDepositDialog = () => {
    setShowDepositDialog(false);
    setSelectedSupplier('');
    setDepositItems([]);
    setDepositNotes('');
  };

  const depositTotal = depositItems.reduce(
    (sum, item) => sum + item.quantity * item.costPrice,
    0
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Supplier / Penitip</h1>
            <p className="text-muted-foreground">
              Kelola data penitip dan catat setoran harian
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSupplierDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Supplier
            </Button>
            <Button onClick={() => setShowDepositDialog(true)}>
              <Package className="mr-2 h-4 w-4" />
              Catat Setoran
            </Button>
          </div>
        </div>

        {/* Overdue Deposits Alert */}
        {overdueDeposits.length > 0 && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <Bell className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
              Reminder: {overdueDeposits.length} Setoran Belum Lunas &gt; 7 Hari!
            </AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                {overdueDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">{deposit.supplierName}</span>
                      <Badge variant="destructive" className="text-xs">
                        {getOverdueDays(deposit.date)} hari
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{formatCurrency(deposit.totalValue)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          settleDeposit(deposit.id);
                          toast.success('Setoran ditandai lunas');
                        }}
                      >
                        Lunaskan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="suppliers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="suppliers">Daftar Supplier</TabsTrigger>
            <TabsTrigger value="deposits">
              Riwayat Setoran
              {overdueDeposits.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {overdueDeposits.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="stock-opname">Stok Opname</TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Daftar Supplier ({filteredSuppliers.length})
                  </CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari supplier..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSuppliers.map((supplier) => {
                    const stats = getSupplierStats(supplier.id);
                    return (
                      <Card key={supplier.id} className="relative">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{supplier.name}</h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {supplier.phone || '-'}
                              </div>
                              {supplier.address && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {supplier.address}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditSupplier(supplier)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteConfirm(supplier.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                            <div className="text-center p-2 rounded-lg bg-accent">
                              <p className="text-xs text-muted-foreground">Produk</p>
                              <p className="font-bold">{stats.productCount}</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-accent">
                              <p className="text-xs text-muted-foreground">Total Setoran</p>
                              <p className="font-bold text-sm">
                                {formatCurrency(stats.totalDeposits)}
                              </p>
                            </div>
                          </div>

                          {stats.pendingCount > 0 && (
                            <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-100 text-yellow-800">
                              <span className="text-sm font-medium">
                                {stats.pendingCount} setoran belum lunas
                              </span>
                              <span className="text-sm font-bold">
                                {formatCurrency(stats.pendingValue)}
                              </span>
                            </div>
                          )}

                          {supplier.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              {supplier.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredSuppliers.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Tidak ada supplier ditemukan
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Riwayat Setoran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Total Nilai</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((deposit) => {
                        const overdue = isDepositOverdue(deposit);
                        return (
                          <TableRow key={deposit.id} className={overdue ? 'bg-destructive/5' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {overdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                                <span>
                                  {new Date(deposit.date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {deposit.supplierName}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {deposit.items.map((item, idx) => (
                                  <div key={idx} className="text-sm">
                                    {item.productName} × {item.quantity}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(deposit.totalValue)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant={
                                    deposit.status === 'settled' ? 'default' : 'secondary'
                                  }
                                  className={
                                    overdue
                                      ? 'bg-destructive text-destructive-foreground'
                                      : deposit.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                      : ''
                                  }
                                >
                                  {deposit.status === 'settled' ? 'Lunas' : overdue ? 'Terlambat!' : 'Belum Lunas'}
                                </Badge>
                                {overdue && (
                                  <span className="text-xs text-destructive font-medium">
                                    {getOverdueDays(deposit.date)} hari
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {deposit.notes || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {deposit.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    settleDeposit(deposit.id);
                                    toast.success('Setoran ditandai lunas');
                                  }}
                                >
                                  Lunaskan
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {deposits.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            Belum ada riwayat setoran
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Opname Tab */}
          <TabsContent value="stock-opname" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Riwayat Stok Opname per Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {suppliers.map((supplier) => {
                    const supplierProducts = products.filter((p) => p.supplierId === supplier.id);
                    const productIds = supplierProducts.map((p) => p.id);
                    const supplierOpnames = stockOpnames.filter((o) => 
                      o.supplierId === supplier.id || productIds.includes(o.productId)
                    );
                    
                    if (supplierOpnames.length === 0) return null;
                    
                    return (
                      <div key={supplier.id} className="border border-border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {supplier.name}
                          <Badge variant="secondary">{supplierOpnames.length} opname</Badge>
                        </h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Stok Sistem</TableHead>
                                <TableHead className="text-right">Stok Aktual</TableHead>
                                <TableHead className="text-right">Selisih</TableHead>
                                <TableHead>Catatan</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {supplierOpnames.map((opname) => (
                                <TableRow key={opname.id}>
                                  <TableCell>
                                    {new Date(opname.createdAt).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </TableCell>
                                  <TableCell className="font-medium">{opname.productName}</TableCell>
                                  <TableCell className="text-right">{opname.systemStock}</TableCell>
                                  <TableCell className="text-right">{opname.actualStock}</TableCell>
                                  <TableCell className="text-right">
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
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {opname.notes || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                  {stockOpnames.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Belum ada riwayat stok opname
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={handleCloseSupplierDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Supplier *</Label>
              <Input
                id="name"
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, name: e.target.value })
                }
                placeholder="Contoh: Pak Ahmad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, phone: e.target.value })
                }
                placeholder="081234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, address: e.target.value })
                }
                placeholder="Jl. Merdeka No. 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={supplierForm.notes}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, notes: e.target.value })
                }
                placeholder="Catatan tentang supplier..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseSupplierDialog}
              >
                Batal
              </Button>
              <Button className="flex-1" onClick={handleSubmitSupplier}>
                {editingSupplier ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={handleCloseDepositDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catat Setoran Harian</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Supplier *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSupplier && (
              <>
                <div className="space-y-2">
                  <Label>Produk dari Supplier</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {supplierProducts.map((product) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2"
                        onClick={() => handleAddDepositItem(product.id)}
                      >
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(product.costPrice)}
                          </p>
                        </div>
                      </Button>
                    ))}
                    {supplierProducts.length === 0 && (
                      <p className="col-span-2 text-sm text-muted-foreground text-center py-4">
                        Belum ada produk dari supplier ini
                      </p>
                    )}
                  </div>
                </div>

                {depositItems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Daftar Setoran</Label>
                    <div className="border border-border rounded-lg divide-y divide-border">
                      {depositItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-3"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              @ {formatCurrency(item.costPrice)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateDepositItemQty(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateDepositItemQty(
                                  item.productId,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateDepositItemQty(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                      <span className="font-medium">Total Nilai Setoran:</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(depositTotal)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="depositNotes">Catatan</Label>
                  <Textarea
                    id="depositNotes"
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                    placeholder="Contoh: Setoran pagi"
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseDepositDialog}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitDeposit}
                disabled={!selectedSupplier || depositItems.length === 0}
              >
                Simpan Setoran
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Supplier yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDeleteSupplier(deleteConfirm)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
