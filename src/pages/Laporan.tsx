import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePOSStore } from '@/store/posStore';
import { formatCurrency } from '@/lib/formatCurrency';
import { exportToExcel, exportToPDF } from '@/lib/exportReport';
import { useState } from 'react';
import { Calendar as CalendarIcon, TrendingUp, Package, DollarSign, FileText, Clock, Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type Period = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Laporan() {
  const { transactions } = usePOSStore();
  const [period, setPeriod] = useState<Period>('today');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Filter transactions by period
  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (selectedDate) {
          startDate = new Date(selectedDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(selectedDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    return transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      return tDate >= startDate && tDate <= endDate;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate stats
  const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalProfit = filteredTransactions.reduce((sum, t) => sum + t.profit, 0);
  const totalTransactions = filteredTransactions.length;
  const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Payment method breakdown
  const cashSales = filteredTransactions
    .filter((t) => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.total, 0);
  const transferSales = filteredTransactions
    .filter((t) => t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + t.total, 0);

  // Top products
  const productSales: Record<string, { qty: number; revenue: number; profit: number }> = {};
  filteredTransactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.product.name;
      if (!productSales[key]) {
        productSales[key] = { qty: 0, revenue: 0, profit: 0 };
      }
      productSales[key].qty += item.quantity;
      productSales[key].revenue += item.product.price * item.quantity;
      productSales[key].profit += (item.product.price - item.product.costPrice) * item.quantity;
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Daily sales chart
  const getDailyData = () => {
    const days = period === 'today' || period === 'yesterday' || period === 'custom' ? 1 : period === 'week' ? 7 : 30;
    
    if (days === 1) {
      // Hourly data for single day
      const baseDate = period === 'yesterday' 
        ? new Date(new Date().setDate(new Date().getDate() - 1))
        : period === 'custom' && selectedDate 
        ? selectedDate 
        : new Date();
      
      return Array.from({ length: 24 }, (_, hour) => {
        const hourStart = new Date(baseDate);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(baseDate);
        hourEnd.setHours(hour, 59, 59, 999);

        const hourTransactions = transactions.filter((t) => {
          const tDate = new Date(t.createdAt);
          return tDate >= hourStart && tDate <= hourEnd;
        });

        return {
          date: `${hour.toString().padStart(2, '0')}:00`,
          penjualan: hourTransactions.reduce((sum, t) => sum + t.total, 0),
          profit: hourTransactions.reduce((sum, t) => sum + t.profit, 0),
        };
      });
    }
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayTransactions = transactions.filter((t) => {
        const tDate = new Date(t.createdAt);
        return tDate >= date && tDate < nextDay;
      });

      return {
        date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        penjualan: dayTransactions.reduce((sum, t) => sum + t.total, 0),
        profit: dayTransactions.reduce((sum, t) => sum + t.profit, 0),
      };
    });
  };

  const dailyData = getDailyData();

  // Category breakdown
  const categoryData: Record<string, number> = {};
  filteredTransactions.forEach((t) => {
    t.items.forEach((item) => {
      const category = item.product.category || 'Lainnya';
      categoryData[category] = (categoryData[category] || 0) + item.product.price * item.quantity;
    });
  });

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return format(new Date(), 'EEEE, d MMMM yyyy', { locale: id });
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return format(yesterday, 'EEEE, d MMMM yyyy', { locale: id });
      case 'week':
        return '7 Hari Terakhir';
      case 'month':
        return '30 Hari Terakhir';
      case 'custom':
        return selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id }) : 'Pilih Tanggal';
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setPeriod('custom');
  };

  const handleExportExcel = () => {
    exportToExcel({
      periodLabel: getPeriodLabel(),
      totalSales,
      totalProfit,
      totalTransactions,
      avgTransaction,
      cashSales,
      transferSales,
      productSales: topProducts,
      transactions: filteredTransactions,
    });
    toast.success('Laporan berhasil diexport ke Excel!');
  };

  const handleExportPDF = () => {
    exportToPDF({
      periodLabel: getPeriodLabel(),
      totalSales,
      totalProfit,
      totalTransactions,
      avgTransaction,
      cashSales,
      transferSales,
      productSales: topProducts,
      transactions: filteredTransactions,
    });
    toast.success('Laporan berhasil diexport ke PDF!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
            <p className="text-muted-foreground">
              {getPeriodLabel()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={period === 'today' ? 'default' : 'outline'}
              onClick={() => setPeriod('today')}
              size="sm"
            >
              Hari Ini
            </Button>
            <Button
              variant={period === 'yesterday' ? 'default' : 'outline'}
              onClick={() => setPeriod('yesterday')}
              size="sm"
            >
              Kemarin
            </Button>
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              onClick={() => setPeriod('week')}
              size="sm"
            >
              7 Hari
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              onClick={() => setPeriod('month')}
              size="sm"
            >
              30 Hari
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={period === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'justify-start text-left font-normal',
                    period === 'custom' && 'bg-primary text-primary-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {period === 'custom' && selectedDate
                    ? format(selectedDate, 'd MMM yyyy', { locale: id })
                    : 'Pilih Tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export ke Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export ke PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Penjualan
              </CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Profit
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalProfit)}
              </p>
              <p className="text-xs text-muted-foreground">
                Margin: {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transaksi
              </CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalTransactions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rata-rata Transaksi
              </CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(avgTransaction)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="transactions">Daftar Transaksi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sales Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {period === 'today' || period === 'yesterday' || period === 'custom'
                      ? 'Penjualan per Jam'
                      : 'Tren Penjualan'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
                        <Line
                          type="monotone"
                          dataKey="penjualan"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Penjualan"
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          name="Profit"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Penjualan per Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {categoryChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {categoryChartData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 'var(--radius)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        Tidak ada data
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method & Top Products */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Metode Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-accent p-4">
                      <div>
                        <p className="font-medium">Tunai (Cash)</p>
                        <p className="text-2xl font-bold">{formatCurrency(cashSales)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {filteredTransactions.filter((t) => t.paymentMethod === 'cash').length} transaksi
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-accent p-4">
                      <div>
                        <p className="font-medium">Transfer</p>
                        <p className="text-2xl font-bold">{formatCurrency(transferSales)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {filteredTransactions.filter((t) => t.paymentMethod === 'transfer').length} transaksi
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Produk Terlaris</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {topProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProducts.slice(0, 5)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 'var(--radius)',
                            }}
                          />
                          <Bar
                            dataKey="revenue"
                            fill="hsl(var(--primary))"
                            radius={[0, 4, 4, 0]}
                            name="Pendapatan"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        Tidak ada data
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Product Sales Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Penjualan Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead className="text-right">Qty Terjual</TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((product) => (
                        <TableRow key={product.name}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-right">{product.qty}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.revenue)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(product.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            {((product.profit / product.revenue) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {topProducts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Belum ada data penjualan
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Daftar Transaksi ({filteredTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead>Pembayaran</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.createdAt), 'HH:mm', { locale: id })}
                            <span className="block text-xs text-muted-foreground">
                              {format(new Date(transaction.createdAt), 'd MMM yyyy', { locale: id })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {transaction.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  {item.product.name} × {item.quantity}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.total)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(transaction.profit)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'rounded-full px-2 py-1 text-xs font-medium',
                                transaction.paymentMethod === 'cash'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              )}
                            >
                              {transaction.paymentMethod === 'cash' ? 'Tunai' : 'Transfer'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Tidak ada transaksi pada periode ini
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
