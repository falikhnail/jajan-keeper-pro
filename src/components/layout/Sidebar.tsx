import { NavLink } from '@/components/NavLink';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  Users,
  Download,
  HardDriveDownload,
  UserCog,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/kasir', icon: ShoppingCart, label: 'Kasir' },
  { to: '/produk', icon: Package, label: 'Produk' },
  { to: '/supplier', icon: Users, label: 'Supplier' },
  { to: '/stok-opname', icon: ClipboardList, label: 'Stok Opname' },
  { to: '/laporan', icon: BarChart3, label: 'Laporan' },
  { to: '/backup', icon: HardDriveDownload, label: 'Backup & Import' },
  { to: '/install', icon: Download, label: 'Install App' },
];

const adminItems = [
  { to: '/manajemen-user', icon: UserCog, label: 'Manajemen User' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, isAdmin, signOut } = useAuthContext();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal logout',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Anda telah logout',
      });
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 transform bg-card shadow-lg transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center border-b border-border px-6">
            <h1 className="text-2xl font-bold text-primary">TitipJajan</h1>
          </div>

          {/* User Info */}
          {profile && (
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">@{profile.username}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="my-4 border-t border-border pt-4">
                  <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin
                  </p>
                  {adminItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </nav>

          {/* Footer with Logout */}
          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              © 2024 TitipJajan POS
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
