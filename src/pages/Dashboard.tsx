import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePOSStore } from '@/store/posStore';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign,
  AlertTriangle,
  Bell,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Dashboard() {
  const { products, transactions, deposits } = usePOSStore();

  // Calculate today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransactions = transactions.filter(
    (t) => new Date(t.createdAt) >= today
  );

  const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const todayProfit = todayTransactions.reduce((sum, t) => sum + t.profit, 0);
  const totalTransactions = todayTransactions.length;

  // Low stock products (less than 10)
  const lowStockProducts = products.filter((p) => p.stock < 10);

  // Overdue deposits (pending and older than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const overdueDeposits = deposits.filter((d) => {
    const depositDate = new Date(d.date);
    return d.status === 'pending' && depositDate < sevenDaysAgo;
  });

  const totalOverdueValue = overdueDeposits.reduce((sum, d) => sum + d.totalValue, 0);

  // Calculate days overdue for each deposit
  const getOverdueDays = (date: Date) => {
    const depositDate = new Date(date);
    const diffTime = Math.abs(new Date().getTime() - depositDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Chart data - last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayTransactions = transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      return tDate >= date && tDate < nextDay;
    });

    return {
      name: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      penjualan: dayTransactions.reduce((sum, t) => sum + t.total, 0),
      profit: dayTransactions.reduce((sum, t) => sum + t.profit, 0),
    };
  });

  // Top selling products today
  const productSales: Record<string, number> = {};
  todayTransactions.forEach((t) => {
    t.items.forEach((item) => {
      productSales[item.product.name] =
        (productSales[item.product.name] || 0) + item.quantity;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Ringkasan penjualan hari ini -{' '}
              {today.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Overdue Deposits Alert */}
        {overdueDeposits.length > 0 && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <Bell className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
              Reminder: {overdueDeposits.length} Setoran Belum Lunas!
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Ada {overdueDeposits.length} setoran senilai{' '}
                <span className="font-bold">{formatCurrency(totalOverdueValue)}</span>{' '}
                yang belum dibayar lebih dari 7 hari.
              </p>
              <div className="space-y-2 mb-3">
                {overdueDeposits.slice(0, 3).map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{deposit.supplierName}</span>
                      <span className="text-sm opacity-75">
                        ({getOverdueDays(deposit.date)} hari)
                      </span>
                    </div>
                    <span className="font-bold">{formatCurrency(deposit.totalValue)}</span>
                  </div>
                ))}
                {overdueDeposits.length > 3 && (
                  <p className="text-sm opacity-75">
                    +{overdueDeposits.length - 3} setoran lainnya
                  </p>
                )}
              </div>
              <Link to="/supplier">
                <Button variant="outline" size="sm" className="gap-1">
                  Lihat Semua Setoran
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Penjualan Hari Ini
              </CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(todaySales)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profit Hari Ini
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(todayProfit)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transaksi
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalTransactions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Produk
              </CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{products.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis
                      tickFormatter={(value) =>
                        `${(value / 1000).toFixed(0)}k`
                      }
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                    />
                    <Bar
                      dataKey="penjualan"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Penjualan"
                    />
                    <Bar
                      dataKey="profit"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      name="Profit"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Produk Terlaris Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.map(([name, qty], index) => (
                      <div
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            {index + 1}
                          </span>
                          <span className="font-medium">{name}</span>
                        </div>
                        <span className="text-muted-foreground">{qty} terjual</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    Belum ada penjualan hari ini
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Stok Menipis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg bg-destructive/10 px-4 py-2"
                      >
                        <span className="font-medium">{product.name}</span>
                        <span className="font-bold text-destructive">
                          {product.stock} tersisa
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    Semua stok aman
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
