import React, { useState, useMemo } from 'react';
import { Transaction, TimeFilter, OrderSource, Expenditure } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Calendar, Wallet, TrendingUp, Users, Receipt, FileDown, ArrowDownCircle, ArrowUpCircle, Banknote } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  expenditures: Expenditure[];
}

const COLORS = ['#fb923c', '#a78bfa', '#22d3ee', '#34d399', '#fb7185'];

const Dashboard: React.FC<DashboardProps> = ({ transactions, expenditures }) => {
  const [filter, setFilter] = useState<TimeFilter>(TimeFilter.TODAY);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const filteredData = useMemo(() => {
    const now = new Date();
    
    const filterFn = (timestamp: number) => {
      switch (filter) {
        case TimeFilter.TODAY: {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          return timestamp >= startOfToday.getTime();
        }
        case TimeFilter.WEEK: {
          const startOfWeek = new Date();
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return timestamp >= startOfWeek.getTime();
        }
        case TimeFilter.MONTH: {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          return timestamp >= startOfMonth.getTime();
        }
        case TimeFilter.LIFETIME:
          return true;
        case TimeFilter.CUSTOM: {
          if (!customRange.start || !customRange.end) return true;
          const start = new Date(customRange.start);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customRange.end);
          end.setHours(23, 59, 59, 999);
          return timestamp >= start.getTime() && timestamp <= end.getTime();
        }
        default:
          return true;
      }
    };

    return {
      transactions: transactions.filter(t => filterFn(t.timestamp)),
      expenditures: expenditures.filter(e => filterFn(e.timestamp))
    };
  }, [transactions, expenditures, filter, customRange]);

  const totalSales = filteredData.transactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalOpProfit = filteredData.transactions.reduce((acc, t) => acc + t.totalProfit, 0);
  const totalExpenditure = filteredData.expenditures.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalOpProfit - totalExpenditure;
  const totalOrders = filteredData.transactions.length;

  const handleDownloadCSV = () => {
    if (filteredData.transactions.length === 0 && filteredData.expenditures.length === 0) {
      alert("Tidak ada data untuk di-download pada filter ini.");
      return;
    }

    const headers = ["Tipe", "ID/Keterangan", "Tanggal", "Jam", "Pelanggan/Kategori", "Total Penjualan", "HPP/Biaya", "Profit/Sisa"];
    
    const transRows = filteredData.transactions.map(t => {
      const date = new Date(t.timestamp);
      return [
        "PENJUALAN",
        t.id,
        date.toLocaleDateString('id-ID'),
        date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        t.customerName || 'Umum',
        t.totalAmount,
        t.totalHpp,
        t.totalProfit
      ];
    });

    const expRows = filteredData.expenditures.map(e => {
      const date = new Date(e.timestamp);
      return [
        "PENGELUARAN",
        e.description,
        date.toLocaleDateString('id-ID'),
        date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        "-",
        0,
        e.amount,
        -e.amount
      ];
    });

    const csvContent = [
      headers.join(','),
      ...transRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ...expRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Keuangan_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const salesData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.transactions.forEach(t => {
      const dateStr = new Date(t.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      grouped[dateStr] = (grouped[dateStr] || 0) + t.totalAmount;
    });
    return Object.keys(grouped).map(key => ({ name: key, sales: grouped[key] }));
  }, [filteredData.transactions]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 bg-transparent min-h-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-5 rounded-2xl shadow-sm border border-stone-100 gap-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <TrendingUp className="text-orange-500 w-6 h-6" /> Laporan Keuangan
          </h2>
          <p className="text-sm text-stone-400 mt-1">Pantau performa pemasukan vs pengeluaran</p>
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
            <div className="flex gap-2 items-center text-sm w-full md:w-auto">
               <input type="date" className="border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-800 outline-none w-full md:w-auto" onChange={e => setCustomRange(p => ({...p, start: e.target.value}))} />
               <span className="text-stone-400">-</span>
               <input type="date" className="border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-800 outline-none w-full md:w-auto" onChange={e => setCustomRange(p => ({...p, end: e.target.value}))} />
            </div>
          )}

          <button 
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] w-full md:w-auto"
          >
            <FileDown className="w-4 h-4" /> Download CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Pemasukan Kotor" value={`IDR ${totalSales.toLocaleString()}`} color="blue" />
        <StatCard icon={<ArrowDownCircle className="w-6 h-6" />} label="Total Pengeluaran" value={`IDR ${totalExpenditure.toLocaleString()}`} color="red" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Laba Operasional" value={`IDR ${totalOpProfit.toLocaleString()}`} color="orange" sub="Sales - HPP" />
        <StatCard icon={<Banknote className="w-6 h-6" />} label="Laba Bersih Akhir" value={`IDR ${netProfit.toLocaleString()}`} color={netProfit >= 0 ? 'green' : 'red'} sub="Op. Profit - Biaya" />
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
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-stone-700">Ringkasan Sesi Ini</h3>
           </div>
           <div className="space-y-4">
              <SummaryItem label="Total Pesanan" value={totalOrders.toString()} icon={<Receipt className="w-4 h-4" />} />
              <SummaryItem label="Beban Modal (HPP)" value={`IDR ${filteredData.transactions.reduce((a, t) => a + t.totalHpp, 0).toLocaleString()}`} icon={<ArrowDownCircle className="w-4 h-4" />} color="text-orange-500" />
              <SummaryItem label="Biaya Lainnya" value={`IDR ${totalExpenditure.toLocaleString()}`} icon={<ArrowDownCircle className="w-4 h-4" />} color="text-red-500" />
              <div className="pt-4 border-t border-stone-100 mt-4">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-stone-800">Uang Tunai Bersih</span>
                   <span className={`text-lg font-black ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>IDR {netProfit.toLocaleString()}</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string; color: 'blue' | 'green' | 'orange' | 'purple' | 'red'; sub?: string }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${colorStyles[color]} flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-stone-800">{value}</p>
        {sub && <p className="text-[10px] text-stone-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, icon, color = "text-stone-600" }: { label: string; value: string; icon: React.ReactNode; color?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-2 text-stone-500">
      {icon}
      <span>{label}</span>
    </div>
    <span className={`font-bold ${color}`}>{value}</span>
  </div>
);

export default Dashboard;