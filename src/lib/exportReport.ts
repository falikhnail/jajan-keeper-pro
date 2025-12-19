import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '@/types/pos';
import { formatCurrency } from './formatCurrency';

interface ProductSalesData {
  name: string;
  qty: number;
  revenue: number;
  profit: number;
}

interface ExportData {
  periodLabel: string;
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  avgTransaction: number;
  cashSales: number;
  transferSales: number;
  productSales: ProductSalesData[];
  transactions: Transaction[];
}

export function exportToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['LAPORAN PENJUALAN - TitipJajan POS'],
    [''],
    ['Periode', data.periodLabel],
    [''],
    ['RINGKASAN'],
    ['Total Penjualan', data.totalSales],
    ['Total Profit', data.totalProfit],
    ['Margin', data.totalSales > 0 ? `${((data.totalProfit / data.totalSales) * 100).toFixed(1)}%` : '0%'],
    ['Total Transaksi', data.totalTransactions],
    ['Rata-rata Transaksi', data.avgTransaction],
    [''],
    ['METODE PEMBAYARAN'],
    ['Tunai', data.cashSales],
    ['Transfer', data.transferSales],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

  // Product Sales Sheet
  const productHeaders = ['Nama Produk', 'Qty Terjual', 'Pendapatan', 'Profit', 'Margin'];
  const productData = data.productSales.map((p) => [
    p.name,
    p.qty,
    p.revenue,
    p.profit,
    `${((p.profit / p.revenue) * 100).toFixed(1)}%`,
  ]);
  const productWs = XLSX.utils.aoa_to_sheet([productHeaders, ...productData]);
  XLSX.utils.book_append_sheet(wb, productWs, 'Penjualan Produk');

  // Transactions Sheet
  const txHeaders = ['Waktu', 'Produk', 'Total', 'Profit', 'Pembayaran'];
  const txData = data.transactions.map((t) => [
    new Date(t.createdAt).toLocaleString('id-ID'),
    t.items.map((i) => `${i.product.name} x${i.quantity}`).join(', '),
    t.total,
    t.profit,
    t.paymentMethod === 'cash' ? 'Tunai' : 'Transfer',
  ]);
  const txWs = XLSX.utils.aoa_to_sheet([txHeaders, ...txData]);
  XLSX.utils.book_append_sheet(wb, txWs, 'Daftar Transaksi');

  // Download
  const fileName = `Laporan_TitipJajan_${data.periodLabel.replace(/[,\s]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN PENJUALAN', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('TitipJajan POS', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Periode: ${data.periodLabel}`, pageWidth / 2, 36, { align: 'center' });
  
  // Summary Box
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN', 14, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const summaryStartY = 58;
  const summaryData = [
    ['Total Penjualan', formatCurrency(data.totalSales)],
    ['Total Profit', formatCurrency(data.totalProfit)],
    ['Margin', data.totalSales > 0 ? `${((data.totalProfit / data.totalSales) * 100).toFixed(1)}%` : '0%'],
    ['Total Transaksi', data.totalTransactions.toString()],
    ['Rata-rata Transaksi', formatCurrency(data.avgTransaction)],
  ];

  autoTable(doc, {
    startY: summaryStartY,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 50 },
    },
    margin: { left: 14 },
  });

  // Payment Methods
  const paymentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('METODE PEMBAYARAN', 14, paymentY);

  autoTable(doc, {
    startY: paymentY + 5,
    head: [['Metode', 'Jumlah']],
    body: [
      ['Tunai', formatCurrency(data.cashSales)],
      ['Transfer', formatCurrency(data.transferSales)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
    margin: { left: 14, right: pageWidth / 2 + 10 },
  });

  // Product Sales Table
  const productY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PENJUALAN PRODUK', 14, productY);

  autoTable(doc, {
    startY: productY + 5,
    head: [['Produk', 'Qty', 'Pendapatan', 'Profit', 'Margin']],
    body: data.productSales.slice(0, 15).map((p) => [
      p.name,
      p.qty.toString(),
      formatCurrency(p.revenue),
      formatCurrency(p.profit),
      p.revenue > 0 ? `${((p.profit / p.revenue) * 100).toFixed(1)}%` : '0%',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  // Check if need new page for transactions
  const txY = (doc as any).lastAutoTable.finalY + 15;
  if (txY > 250) {
    doc.addPage();
  }

  // Transaction List
  const txStartY = txY > 250 ? 20 : txY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DAFTAR TRANSAKSI', 14, txStartY);

  autoTable(doc, {
    startY: txStartY + 5,
    head: [['Waktu', 'Produk', 'Total', 'Profit', 'Bayar']],
    body: data.transactions.slice(0, 20).map((t) => [
      new Date(t.createdAt).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      t.items.map((i) => `${i.product.name} x${i.quantity}`).join(', ').substring(0, 30),
      formatCurrency(t.total),
      formatCurrency(t.profit),
      t.paymentMethod === 'cash' ? 'Tunai' : 'Transfer',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 8, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 18 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Dicetak pada: ${new Date().toLocaleString('id-ID')} - TitipJajan POS`,
    pageWidth / 2,
    finalY,
    { align: 'center' }
  );

  // Download
  const fileName = `Laporan_TitipJajan_${data.periodLabel.replace(/[,\s]/g, '_')}.pdf`;
  doc.save(fileName);
}
