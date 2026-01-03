import React, { useState } from 'react';
import { Expenditure } from '../types';
import { Plus, Trash2, Receipt, Wallet, Calendar } from 'lucide-react';

interface ExpenditureManagerProps {
  expenditures: Expenditure[];
  onAddExpenditure: (exp: Expenditure) => void;
  onDeleteExpenditure: (id: string) => void;
}

const ExpenditureManager: React.FC<ExpenditureManagerProps> = ({ expenditures, onAddExpenditure, onDeleteExpenditure }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    // Convert selected date string to timestamp
    const selectedDate = new Date(date);
    selectedDate.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);

    const newExp: Expenditure = {
      id: `EXP-${Date.now()}`,
      timestamp: selectedDate.getTime(),
      description,
      amount: Number(amount)
    };

    onAddExpenditure(newExp);
    setDescription('');
    setAmount('');
    // Keep the date as is or reset to today? Usually better to keep if inputting many items for same day
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Receipt className="text-red-500 w-6 h-6" /> Catat Pengeluaran
          </h2>
          <p className="text-sm text-stone-500 mt-1">Input biaya operasional, gaji, atau belanja bahan baku.</p>
        </div>

        <form onSubmit={handleAdd} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Tanggal</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white text-black border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Keterangan Biaya</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Misal: Gas 3kg, Gaji"
                className="w-full px-4 py-2.5 bg-white text-black border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                required
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Nominal (IDR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold text-sm">Rp</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-black border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all font-bold"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="bg-stone-900 text-white py-2.5 px-6 rounded-xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-200 active:scale-95"
            >
              <Plus className="w-5 h-5" /> Tambah
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <h3 className="font-bold text-stone-700">Riwayat Pengeluaran</h3>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Terpilih</span>
             <span className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">IDR {expenditures.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {expenditures.slice().sort((a,b) => b.timestamp - a.timestamp).map(exp => (
                <tr key={exp.id} className="hover:bg-stone-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-stone-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 opacity-40" />
                      {new Date(exp.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-stone-800">{exp.description}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">IDR {exp.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDeleteExpenditure(exp.id)}
                      className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenditures.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <Receipt className="w-12 h-12 mb-3 opacity-10" />
                      <p className="font-medium">Belum ada catatan pengeluaran.</p>
                      <p className="text-xs">Gunakan form di atas untuk menambah biaya baru.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenditureManager;