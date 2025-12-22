import React, { useState, useMemo } from 'react';
import { Transaction, TimeFilter, OrderSource } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Calendar, Wallet, TrendingUp, Users, Receipt, FileDown } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#fb923c', '#a78bfa', '#22d3ee', '#34d399', '#fb7185'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<TimeFilter>(TimeFilter.TODAY);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    
    return transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      
      switch (filter) {
        case TimeFilter.TODAY: {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          return t.timestamp >= startOfToday.getTime();
        }
        case TimeFilter.WEEK: {
          const startOfWeek = new Date();
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return t.timestamp >= startOfWeek.getTime();
        }
        case TimeFilter.MONTH: {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          return t.timestamp >= startOfMonth.getTime();
        }
        case TimeFilter.LIFETIME:
          return true;
        case TimeFilter.CUSTOM: {
          if (!customRange.start || !customRange.end) return true;
          const start = new Date(customRange.start);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customRange.end);
          end.setHours(23, 59, 59, 999);
          return t.timestamp >= start.getTime() && t.timestamp <= end.getTime();
        }
        default:
          return true;
      }
    });
  }, [transactions, filter, customRange]);

  const totalSales = filteredTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalProfit = filteredTransactions.reduce((acc, t) => acc + t.totalProfit, 0);
  const totalOrders = filteredTransactions.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const handleDownloadCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk di-download pada filter ini.");
      return;
    }

    const headers = ["ID Transaksi", "Tanggal", "Jam", "Pelanggan", "Items", "Sumber", "Pembayaran", "HPP", "Total Penjualan", "Profit"];
    const rows = filteredTransactions.map(t => {
      const date = new Date(t.timestamp);
      return [
        t.id,
        date.toLocaleDateString('id-ID'),
        date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        t.customerName || 'Pelanggan Umum',
        t.items.map(i => `${i.name} (${i.quantity})`).join('; '),
        t.orderSource,
        t.paymentMethod || '-',
        t.totalHpp,
        t.totalAmount,
        t.totalProfit
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Penjualan_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const salesData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const dateStr = new Date(t.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      grouped[dateStr] = (grouped[dateStr] || 0) + t.totalAmount;
    });
    return Object.keys(grouped).map(key => ({ name: key, sales: grouped[key] }));
  }, [filteredTransactions]);

  const sourceData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const source = t.orderSource.replace('ONLINE_', '');
      grouped[source] = (grouped[source] || 0) + 1;
    });
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
  }, [filteredTransactions]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 bg-transparent min-h-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-5 rounded-2xl shadow-sm border border-stone-100 gap-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <TrendingUp className="text-orange-500 w-6 h-6" /> Laporan Penjualan
          </h2>
          <p className="text-sm text-stone-400 mt-1">Data terkini performa bisnis Anda</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-start md:items-center">
          <div className="flex items-center p-1 bg-stone-100 rounded-xl overflow-x-auto w-full md:w-auto">
            {Object.values(TimeFilter).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${filter === f ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                {f === 'LIFETIME' ? 'Semua' : f === 'CUSTOM' ? 'Custom' : f === 'TODAY' ? 'Hari Ini' : f === 'WEEK' ? 'Minggu Ini' : 'Bulan Ini'}
              </button>
            ))}
          </div>
          
          {filter === TimeFilter.CUSTOM && (
            <div className="flex gap-2 items-center text-sm w-full md:w-auto animate-in fade-in slide-in-from-right-5">
               <input type="date" className="border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-800 outline-none focus:ring-2 focus:ring-orange-200 w-full md:w-auto" onChange={e => setCustomRange(p => ({...p, start: e.target.value}))} />
               <span className="text-stone-400">-</span>
               <input type="date" className="border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-800 outline-none focus:ring-2 focus:ring-orange-200 w-full md:w-auto" onChange={e => setCustomRange(p => ({...p, end: e.target.value}))} />
            </div>
          )}

          <button 
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] w-full md:w-auto whitespace-nowrap"
          >
            <FileDown className="w-4 h-4" /> Download CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Total Penjualan" value={`IDR ${totalSales.toLocaleString()}`} color="blue" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Estimasi Profit" value={`IDR ${totalProfit.toLocaleString()}`} color="green" />
        <StatCard icon={<Receipt className="w-6 h-6" />} label="Total Transaksi" value={totalOrders.toString()} color="orange" />
        <StatCard icon={<Users className="w-6 h-6" />} label="Rata-rata Order" value={`IDR ${Math.round(avgOrderValue).toLocaleString()}`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 lg:col-span-2">
          <h3 className="font-bold text-stone-700 mb-6">Grafik Tren Penjualan</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 11}} tickFormatter={(value) => `Rp${value/1000}k`} />
                <Tooltip cursor={{fill: '#fafaf9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#fff'}} />
                <Bar dataKey="sales" fill="#fb923c" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="font-bold text-stone-700 mb-6">Sumber Pesanan</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={6} dataKey="value" cornerRadius={6}>
                  {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h3 className="font-bold text-stone-700">Riwayat Transaksi Terakhir</h3>
          <span className="text-xs font-semibold text-stone-400">{filteredTransactions.length} Transaksi ditampilkan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-100">
              <tr>
                <th className="px-6 py-4">ID & Waktu</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Status & Pembayaran</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredTransactions.slice().reverse().slice(0, 50).map(t => (
                <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-stone-800">{t.id.slice(-8)}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{new Date(t.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}, {new Date(t.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-stone-700 whitespace-nowrap font-medium">{t.customerName}</td>
                  <td className="px-6 py-4 text-stone-600">
                    <span className="line-clamp-1">{t.items.map(i => `${i.name} (${i.quantity})`).join(', ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit px-2.5 py-1 rounded-md text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200 uppercase">{t.orderSource.replace('_', ' ')}</span>
                      {t.paymentMethod && <span className="inline-flex w-fit px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">{t.paymentMethod}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-stone-800 whitespace-nowrap">IDR {t.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                   <td colSpan={5} className="text-center py-12 text-stone-400">Belum ada transaksi pada periode ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'blue' | 'green' | 'orange' | 'purple' }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${colorStyles[color]} flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-stone-800">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;