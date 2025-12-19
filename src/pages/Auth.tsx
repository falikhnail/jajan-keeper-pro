import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, User, Lock, UserPlus } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  password: z.string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
});

const setupSchema = z.object({
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  fullName: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  password: z.string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, user } = useAuthContext();
  const { toast } = useToast();
  
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Setup state
  const [setupUsername, setSetupUsername] = useState('');
  const [setupFullName, setSetupFullName] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [setupErrors, setSetupErrors] = useState<Record<string, string>>({});
  
  // Check if admin exists
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('id')
          .eq('role', 'admin')
          .limit(1);

        if (error) {
          console.error('Error checking admin:', error);
          setHasAdmin(true); // Assume admin exists on error
        } else {
          setHasAdmin(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error:', error);
        setHasAdmin(true);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminExists();
  }, []);

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ username, password });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(username, password);

      if (error) {
        let message = 'Terjadi kesalahan saat login';
        if (error.message.includes('Invalid login credentials')) {
          message = 'Username atau password salah';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Akun belum diaktifkan';
        }
        toast({
          title: 'Login Gagal',
          description: message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login Berhasil',
          description: 'Selamat datang!',
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan yang tidak terduga',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupErrors({});

    const validation = setupSchema.safeParse({
      username: setupUsername,
      fullName: setupFullName,
      password: setupPassword,
      confirmPassword: setupConfirmPassword,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setSetupErrors(fieldErrors);
      return;
    }

    setIsSetupLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('setup-admin', {
        body: {
          username: setupUsername,
          fullName: setupFullName,
          password: setupPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Berhasil',
        description: 'Admin berhasil dibuat. Silakan login.',
      });

      setHasAdmin(true);
      setSetupUsername('');
      setSetupFullName('');
      setSetupPassword('');
      setSetupConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal membuat admin',
        variant: 'destructive',
      });
    } finally {
      setIsSetupLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">TitipJajan POS</CardTitle>
          <CardDescription>
            {hasAdmin ? 'Masuk ke sistem' : 'Setup admin pertama'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasAdmin ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          ) : (
            // Setup Admin Form
            <form onSubmit={handleSetupAdmin} className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm text-muted-foreground">
                  <UserPlus className="mr-2 inline h-4 w-4" />
                  Buat akun admin pertama untuk menggunakan sistem
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-username">Username</Label>
                <Input
                  id="setup-username"
                  type="text"
                  placeholder="Contoh: admin"
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  disabled={isSetupLoading}
                />
                {setupErrors.username && (
                  <p className="text-sm text-destructive">{setupErrors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-fullname">Nama Lengkap</Label>
                <Input
                  id="setup-fullname"
                  type="text"
                  placeholder="Contoh: Administrator"
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  disabled={isSetupLoading}
                />
                {setupErrors.fullName && (
                  <p className="text-sm text-destructive">{setupErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-password">Password</Label>
                <Input
                  id="setup-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  disabled={isSetupLoading}
                />
                {setupErrors.password && (
                  <p className="text-sm text-destructive">{setupErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-confirm-password">Konfirmasi Password</Label>
                <Input
                  id="setup-confirm-password"
                  type="password"
                  placeholder="Ulangi password"
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  disabled={isSetupLoading}
                />
                {setupErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{setupErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSetupLoading}>
                {isSetupLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Buat Admin'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
