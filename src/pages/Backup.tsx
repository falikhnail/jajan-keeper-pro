import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePOSStore } from "@/store/posStore";
import { serializePOSBackup, deserializePOSBackup, type POSBackup } from "@/lib/posBackup";
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  FileText, 
  Check, 
  X, 
  Cloud, 
  Loader2, 
  RefreshCw,
  FileSpreadsheet,
  Database,
  CloudDownload,
  CloudUpload,
  HardDrive,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCloudSyncContext } from "@/components/CloudSyncProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';

interface BackupPreview {
  file: File;
  backup: POSBackup;
  stats: {
    products: number;
    suppliers: number;
    transactions: number;
    stockOpnames: number;
    deposits: number;
  };
}

export default function Backup() {
  const store = usePOSStore();
  const { syncAllToCloud, isSyncing, loadFromCloud } = useCloudSyncContext();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const excelFileRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const stats = useMemo(() => {
    return {
      products: store.products.length,
      suppliers: store.suppliers.length,
      transactions: store.transactions.length,
      stockOpnames: store.stockOpnames.length,
      deposits: store.deposits.length,
    };
  }, [store.products.length, store.suppliers.length, store.transactions.length, store.stockOpnames.length, store.deposits.length]);

  const totalItems = stats.products + stats.suppliers + stats.transactions + stats.stockOpnames + stats.deposits;

  const handleResetData = () => {
    localStorage.removeItem('pos-storage');
    window.location.reload();
  };

  // === JSON Export/Import ===
  const handleExportJSON = () => {
    try {
      const backup: POSBackup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: serializePOSBackup(usePOSStore.getState()),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `titipjajan-pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      toast.success("Backup JSON berhasil diunduh");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat file backup");
    }
  };

  const handleImportJSONClick = () => {
    fileRef.current?.click();
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as POSBackup;
      
      if (!parsed.version || !parsed.data) {
        throw new Error("Invalid backup format");
      }

      const backupStats = {
        products: parsed.data.products?.length ?? 0,
        suppliers: parsed.data.suppliers?.length ?? 0,
        transactions: parsed.data.transactions?.length ?? 0,
        stockOpnames: parsed.data.stockOpnames?.length ?? 0,
        deposits: parsed.data.deposits?.length ?? 0,
      };

      setPreview({ file, backup: parsed, stats: backupStats });
    } catch (e) {
      console.error(e);
      toast.error("File backup tidak valid atau rusak");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;

    setIsImporting(true);
    try {
      const nextState = deserializePOSBackup(preview.backup);
      usePOSStore.setState(nextState);
      toast.success("Import berhasil. Data sudah dipulihkan.");
      setPreview(null);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memproses file backup");
    } finally {
      setIsImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleCancelImport = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // === Excel Export/Import ===
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Products sheet
      const productsData = store.products.map(p => ({
        ID: p.id,
        Nama: p.name,
        Harga: p.price,
        'Harga Modal': p.costPrice,
        Stok: p.stock,
        Kategori: p.category || '',
        Supplier: p.supplier || '',
        'Supplier ID': p.supplierId || '',
      }));
      const productsSheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produk');

      // Suppliers sheet
      const suppliersData = store.suppliers.map(s => ({
        ID: s.id,
        Nama: s.name,
        Telepon: s.phone || '',
        Alamat: s.address || '',
        Catatan: s.notes || '',
      }));
      const suppliersSheet = XLSX.utils.json_to_sheet(suppliersData);
      XLSX.utils.book_append_sheet(workbook, suppliersSheet, 'Supplier');

      // Transactions sheet
      const transactionsData = store.transactions.map(t => ({
        ID: t.id,
        Total: t.total,
        Profit: t.profit,
        'Metode Bayar': t.paymentMethod,
        'Jumlah Item': t.items.length,
        Tanggal: new Date(t.createdAt).toLocaleString('id-ID'),
      }));
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transaksi');

      // Stock Opnames sheet
      const stockOpnamesData = store.stockOpnames.map(o => ({
        ID: o.id,
        'Nama Produk': o.productName,
        'Stok Sistem': o.systemStock,
        'Stok Aktual': o.actualStock,
        Selisih: o.difference,
        Supplier: o.supplierName || '',
        Catatan: o.notes || '',
        Tanggal: new Date(o.createdAt).toLocaleString('id-ID'),
      }));
      const stockOpnamesSheet = XLSX.utils.json_to_sheet(stockOpnamesData);
      XLSX.utils.book_append_sheet(workbook, stockOpnamesSheet, 'Stok Opname');

      // Deposits sheet
      const depositsData = store.deposits.map(d => ({
        ID: d.id,
        Supplier: d.supplierName,
        'Total Nilai': d.totalValue,
        Status: d.status,
        'Jumlah Item': d.items.length,
        Catatan: d.notes || '',
        Tanggal: new Date(d.date).toLocaleString('id-ID'),
      }));
      const depositsSheet = XLSX.utils.json_to_sheet(depositsData);
      XLSX.utils.book_append_sheet(workbook, depositsSheet, 'Setoran');

      // Download
      XLSX.writeFile(workbook, `titipjajan-pos-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Export Excel berhasil diunduh");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // === Cloud Sync ===
  const handleSyncToCloud = async () => {
    await syncAllToCloud();
    setLastSyncTime(new Date());
  };

  const handleLoadFromCloud = async () => {
    await loadFromCloud();
    setLastSyncTime(new Date());
    toast.success("Data berhasil dimuat dari cloud");
  };

  return (
    <Layout>
      <main className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Backup & Sinkronisasi</h1>
          <p className="text-muted-foreground">
            Kelola backup data, export/import, dan sinkronisasi dengan cloud
          </p>
        </header>

        {/* Data Summary Cards */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-6" aria-label="Ringkasan data">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                Total Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalItems}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Produk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.products}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.suppliers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.transactions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Stok Opname</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.stockOpnames}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Setoran</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.deposits}</p>
            </CardContent>
          </Card>
        </section>

        {/* Main Content Tabs */}
        <Tabs defaultValue="cloud" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cloud" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">Sinkronisasi Cloud</span>
              <span className="sm:hidden">Cloud</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span className="hidden sm:inline">Backup & Restore</span>
              <span className="sm:hidden">Backup</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Excel</span>
            </TabsTrigger>
          </TabsList>

          {/* Cloud Sync Tab */}
          <TabsContent value="cloud" className="space-y-4">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  Sinkronisasi Cloud
                </CardTitle>
                <CardDescription>
                  Simpan data ke cloud agar bisa diakses dari device lain dan tidak hilang
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastSyncTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Terakhir sync: {lastSyncTime.toLocaleString('id-ID')}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CloudUpload className="h-4 w-4 text-blue-500" />
                        Upload ke Cloud
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Upload semua data lokal ke database cloud. Data yang sudah ada di cloud akan dipertahankan.
                      </p>
                      <Button onClick={handleSyncToCloud} disabled={isSyncing} className="w-full">
                        {isSyncing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isSyncing ? "Menyinkronkan..." : "Sync ke Cloud"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CloudDownload className="h-4 w-4 text-green-500" />
                        Download dari Cloud
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Muat ulang semua data dari cloud. Gunakan ini jika ingin mengambil data terbaru.
                      </p>
                      <Button variant="outline" onClick={handleLoadFromCloud} disabled={isSyncing} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Muat dari Cloud
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="rounded-lg border border-muted bg-muted/20 p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Status Sinkronisasi
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produk</span>
                      <Badge variant={stats.products > 0 ? "default" : "secondary"}>
                        {stats.products} item
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier</span>
                      <Badge variant={stats.suppliers > 0 ? "default" : "secondary"}>
                        {stats.suppliers} item
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaksi</span>
                      <Badge variant={stats.transactions > 0 ? "default" : "secondary"}>
                        {stats.transactions} item
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stok Opname</span>
                      <Badge variant={stats.stockOpnames > 0 ? "default" : "secondary"}>
                        {stats.stockOpnames} item
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Setoran</span>
                      <Badge variant={stats.deposits > 0 ? "default" : "secondary"}>
                        {stats.deposits} item
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup & Restore Tab */}
          <TabsContent value="backup" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Backup
                  </CardTitle>
                  <CardDescription>
                    Unduh file backup JSON berisi semua data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    File .json akan berisi seluruh data aplikasi saat ini termasuk produk, supplier, transaksi, stok opname, dan setoran. Simpan file ini di tempat aman.
                  </p>
                  <Button onClick={handleExportJSON} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup JSON
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Backup
                  </CardTitle>
                  <CardDescription>
                    Pulihkan data dari file backup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                    <p className="text-sm text-muted-foreground">
                      Import akan <span className="font-medium">menggantikan</span> semua data yang ada saat ini.
                    </p>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                  />

                  <Button variant="outline" onClick={handleImportJSONClick} disabled={isImporting || !!preview} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Pilih File Backup
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Reset Data Card */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <RefreshCw className="h-5 w-5" />
                  Reset Data
                </CardTitle>
                <CardDescription>
                  Reset ke data sample awal jika terjadi masalah
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Reset data ke sample awal dengan UUID yang valid. Gunakan ini jika terjadi masalah sinkronisasi karena ID tidak valid atau data corrupt.
                </p>
                <Button variant="destructive" onClick={() => setShowResetConfirm(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset ke Data Sample
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Excel Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Export ke Excel
                </CardTitle>
                <CardDescription>
                  Export data ke format spreadsheet untuk analisis atau laporan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  File Excel akan berisi beberapa sheet terpisah untuk setiap jenis data:
                </p>
                
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Produk</p>
                    <p className="text-lg font-bold">{stats.products}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="text-lg font-bold">{stats.suppliers}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Transaksi</p>
                    <p className="text-lg font-bold">{stats.transactions}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Stok Opname</p>
                    <p className="text-lg font-bold">{stats.stockOpnames}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Setoran</p>
                    <p className="text-lg font-bold">{stats.deposits}</p>
                  </div>
                </div>

                <Button onClick={handleExportExcel} disabled={isExporting} className="w-full sm:w-auto">
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  {isExporting ? "Mengekspor..." : "Download Excel"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Section */}
        {preview && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview File Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Nama file:</span> <span className="font-medium">{preview.file.name}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Tanggal backup:</span> <span className="font-medium">{new Date(preview.backup.exportedAt).toLocaleString('id-ID')}</span></p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Produk</p>
                  <p className="text-lg font-bold">{preview.stats.products}</p>
                  <p className="text-xs text-muted-foreground">saat ini: {stats.products}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Supplier</p>
                  <p className="text-lg font-bold">{preview.stats.suppliers}</p>
                  <p className="text-xs text-muted-foreground">saat ini: {stats.suppliers}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Transaksi</p>
                  <p className="text-lg font-bold">{preview.stats.transactions}</p>
                  <p className="text-xs text-muted-foreground">saat ini: {stats.transactions}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Stok Opname</p>
                  <p className="text-lg font-bold">{preview.stats.stockOpnames}</p>
                  <p className="text-xs text-muted-foreground">saat ini: {stats.stockOpnames}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Setoran</p>
                  <p className="text-lg font-bold">{preview.stats.deposits}</p>
                  <p className="text-xs text-muted-foreground">saat ini: {stats.deposits}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">
                  Data saat ini akan <span className="font-bold">dihapus</span> dan diganti dengan data dari backup ini.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleConfirmImport} disabled={isImporting} className="flex-1">
                  <Check className="mr-2 h-4 w-4" />
                  {isImporting ? "Memproses..." : "Konfirmasi Import"}
                </Button>
                <Button variant="outline" onClick={handleCancelImport} disabled={isImporting}>
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Data ke Sample Awal?</AlertDialogTitle>
              <AlertDialogDescription>
                Semua data saat ini akan dihapus dan diganti dengan data sample baru yang memiliki UUID valid. 
                Data ini diperlukan agar sinkronisasi ke cloud berfungsi dengan benar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Ya, Reset Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </Layout>
  );
}
