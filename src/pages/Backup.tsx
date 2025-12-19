import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePOSStore } from "@/store/posStore";
import { serializePOSBackup, deserializePOSBackup, type POSBackup } from "@/lib/posBackup";
import { Download, Upload, AlertTriangle, FileText, Check, X, Cloud, Loader2, RefreshCw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCloudSyncContext } from "@/components/CloudSyncProvider";
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
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<BackupPreview | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const stats = useMemo(() => {
    return {
      products: store.products.length,
      suppliers: store.suppliers.length,
      transactions: store.transactions.length,
      stockOpnames: store.stockOpnames.length,
      deposits: store.deposits.length,
    };
  }, [store.products.length, store.suppliers.length, store.transactions.length, store.stockOpnames.length, store.deposits.length]);

  const handleResetData = () => {
    // Clear localStorage and reload to get fresh sample data
    localStorage.removeItem('pos-storage');
    window.location.reload();
  };

  const handleExport = () => {
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
      toast.success("Backup berhasil diunduh");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat file backup");
    }
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as POSBackup;
      
      // Validate backup structure
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

  const handleSyncToCloud = async () => {
    await syncAllToCloud();
  };

  const handleLoadFromCloud = async () => {
    await loadFromCloud();
    toast.success("Data berhasil dimuat dari cloud");
  };

  return (
    <Layout>
      <main className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Backup & Import Data</h1>
          <p className="text-muted-foreground">
            Unduh backup semua data (produk, supplier, transaksi, stok opname, setoran) dan pulihkan kembali saat dibutuhkan.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5" aria-label="Ringkasan data">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Produk</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.products}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Supplier</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.suppliers}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Transaksi</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.transactions}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Stok Opname</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.stockOpnames}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Setoran</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.deposits}</p></CardContent></Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3" aria-label="Aksi backup">
          {/* Cloud Sync */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                Sinkronisasi Cloud
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sinkronkan data lokal ke database cloud agar data tersimpan permanen dan bisa diakses dari device lain.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleSyncToCloud} disabled={isSyncing} className="flex-1">
                  {isSyncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {isSyncing ? "Menyinkronkan..." : "Sync ke Cloud"}
                </Button>
                <Button variant="outline" onClick={handleLoadFromCloud} disabled={isSyncing} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Muat dari Cloud
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                File .json akan berisi seluruh data aplikasi saat ini. Simpan file ini di tempat aman.
              </p>
              <Button onClick={handleExport} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Import akan <span className="font-medium">menggantikan</span> data yang sekarang.
                </p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />

              <Button variant="outline" onClick={handleImportClick} disabled={isImporting || !!preview} className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Pilih File Backup
              </Button>
            </CardContent>
          </Card>

          {/* Reset Data Card */}
          <Card className="border-destructive/50 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <RefreshCw className="h-5 w-5" />
                Reset Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Reset data ke sample awal dengan UUID yang valid. Gunakan ini jika terjadi masalah sinkronisasi karena ID tidak valid.
              </p>
              <Button variant="destructive" onClick={() => setShowResetConfirm(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset ke Data Sample
              </Button>
            </CardContent>
          </Card>
        </section>

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
