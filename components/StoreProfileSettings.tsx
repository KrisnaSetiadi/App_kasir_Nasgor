import React, { useState, useEffect, useRef } from 'react';
import { StoreProfile } from '../types';
import { STORAGE_KEYS } from '../App';
import { Store, Save, CheckCircle, Trash2, AlertTriangle, Download, Upload, FileJson } from 'lucide-react';

interface StoreProfileSettingsProps {
  profile: StoreProfile;
  onUpdateProfile: (profile: StoreProfile) => void;
}

const StoreProfileSettings: React.FC<StoreProfileSettingsProps> = ({ profile, onUpdateProfile }) => {
  const [formData, setFormData] = useState<StoreProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFactoryReset = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA DATA?\n\nSemua menu, riwayat transaksi, dan pengaturan akan dihapus permanen dari browser ini.')) {
      localStorage.removeItem(STORAGE_KEYS.MENU);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      window.location.reload();
    }
  };

  const handleExportData = () => {
    const allData = {
      menu: JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU) || '[]'),
      transactions: JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'),
      profile: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || '{}'),
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `nasigor_pos_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (confirm('Import data akan menimpa data yang ada saat ini. Lanjutkan?')) {
          if (json.menu) localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(json.menu));
          if (json.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(json.transactions));
          if (json.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(json.profile));
          
          alert('Data berhasil di-import! Aplikasi akan dimuat ulang.');
          window.location.reload();
        }
      } catch (err) {
        alert('File tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <Store className="text-orange-500 w-6 h-6" /> Pengaturan Profil
            </h2>
            <p className="text-sm text-stone-500 mt-1">Informasi toko pada struk dan aplikasi.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Nama Toko</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Nomor Telepon</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Sosial Media</label>
                <input type="text" name="socialMedia" value={formData.socialMedia} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Alamat</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Pesan Kaki Struk</label>
                <input type="text" name="footerText" value={formData.footerText} onChange={handleChange} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-stone-100 flex items-center gap-4">
            <button type="submit" className="px-8 py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-all flex items-center gap-2 shadow-lg shadow-stone-200">
              <Save className="w-5 h-5" /> Simpan Profil
            </button>
            {isSaved && (
              <span className="text-green-600 font-bold flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100 animate-in fade-in">
                <CheckCircle className="w-5 h-5" /> Berhasil!
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500" /> Cadangkan Data
          </h3>
          <p className="text-sm text-stone-500">Unduh semua data menu dan transaksi ke dalam file JSON untuk disimpan sebagai backup.</p>
          <button onClick={handleExportData} className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl font-bold text-stone-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
            <FileJson className="w-5 h-5" /> Export ke JSON
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-500" /> Pulihkan Data
          </h3>
          <p className="text-sm text-stone-500">Impor data dari file backup JSON sebelumnya. Data saat ini akan ditimpa.</p>
          <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl font-bold text-stone-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" /> Pilih File Backup
          </button>
        </div>
      </div>

      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold">Zona Bahaya</h3>
        </div>
        <p className="text-sm text-red-500/80">Menghapus semua data aplikasi secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
        <button onClick={handleFactoryReset} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-100">
          <Trash2 className="w-5 h-5" /> Reset Pabrik (Hapus Semua)
        </button>
      </div>
    </div>
  );
};

export default StoreProfileSettings;