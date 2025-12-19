import { createContext, useContext, ReactNode } from 'react';
import { useCloudSync } from '@/hooks/useCloudSync';
import { Loader2 } from 'lucide-react';

interface CloudSyncContextType {
  isLoading: boolean;
  isSyncing: boolean;
  loadFromCloud: () => Promise<void>;
  syncSupplier: (supplier: any, action: 'insert' | 'update' | 'delete') => Promise<void>;
  syncProduct: (product: any, action: 'insert' | 'update' | 'delete') => Promise<void>;
  syncTransaction: (transaction: any) => Promise<void>;
  syncStockOpname: (opname: any) => Promise<void>;
  syncDeposit: (deposit: any, action: 'insert' | 'update' | 'delete') => Promise<void>;
  syncProductStock: (productId: string, newStock: number) => Promise<void>;
  syncAllToCloud: () => Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncContextType | null>(null);

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const cloudSync = useCloudSync();

  // Show loading screen while initial cloud data is being fetched
  if (cloudSync.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">
            Memuat data dari cloud...
          </p>
        </div>
      </div>
    );
  }

  return (
    <CloudSyncContext.Provider value={cloudSync}>
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSyncContext() {
  const context = useContext(CloudSyncContext);
  if (!context) {
    throw new Error('useCloudSyncContext must be used within CloudSyncProvider');
  }
  return context;
}
