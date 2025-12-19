import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, Check, Smartphone, Monitor, Share, MoreVertical } from 'lucide-react';

export default function Install() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Install Aplikasi</h1>
          <p className="text-muted-foreground mt-2">
            Install TitipJajan POS ke perangkat Anda untuk akses lebih cepat
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-green-600">Aplikasi Sudah Terinstall!</h2>
                  <p className="text-muted-foreground mt-1">
                    TitipJajan POS sudah terinstall di perangkat Anda.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isInstallable ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Download className="h-6 w-6 text-primary" />
                Siap Diinstall
              </CardTitle>
              <CardDescription>
                Klik tombol di bawah untuk menginstall aplikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" onClick={installApp} className="gap-2">
                <Download className="h-5 w-5" />
                Install Sekarang
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {isIOS && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Cara Install di iPhone/iPad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Buka di Safari</p>
                      <p className="text-sm text-muted-foreground">
                        Pastikan Anda membuka halaman ini di browser Safari
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        Ketuk tombol Share
                        <Share className="h-4 w-4" />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tombol berbagi di bagian bawah layar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Pilih "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground">
                        Scroll ke bawah dan ketuk opsi tersebut
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAndroid && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Cara Install di Android
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Buka di Chrome</p>
                      <p className="text-sm text-muted-foreground">
                        Pastikan Anda membuka halaman ini di browser Chrome
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        Ketuk menu
                        <MoreVertical className="h-4 w-4" />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Titik tiga di pojok kanan atas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Pilih "Install app" atau "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground">
                        Ikuti petunjuk untuk menyelesaikan instalasi
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isIOS && !isAndroid && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Cara Install di Desktop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Buka di Chrome/Edge</p>
                      <p className="text-sm text-muted-foreground">
                        Gunakan browser Chrome atau Microsoft Edge
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Klik ikon Install di address bar</p>
                      <p className="text-sm text-muted-foreground">
                        Biasanya berupa ikon komputer kecil di sebelah kanan address bar
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Keuntungan Install Aplikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span>Akses cepat dari home screen</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span>Bekerja offline</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span>Tampilan fullscreen tanpa address bar</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 shrink-0" />
                <span>Loading lebih cepat</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
