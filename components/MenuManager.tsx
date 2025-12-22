import React, { useState } from 'react';
import { MenuItem, Category } from '../types';
import { getPricingRecommendation, PricingAdvice } from '../services/geminiService';
import { Loader2, Sparkles, Plus, Trash2, Pencil, X, Save, Box, Tag } from 'lucide-react';

interface MenuManagerProps {
  menuItems: MenuItem[];
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({ menuItems, onAddMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  // State for Adding New Item
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    category: Category.FOOD,
    hpp: 0,
    price: 0,
    promoPrice: 0,
    description: ''
  });
  const [ingredients, setIngredients] = useState('');
  
  // State for AI Features
  const [loadingAI, setLoadingAI] = useState(false);
  const [advice, setAdvice] = useState<PricingAdvice | null>(null);

  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  const handleAskAI = async () => {
    if (!newItem.name || !newItem.hpp) {
      alert("Mohon isi Nama Menu dan HPP terlebih dahulu.");
      return;
    }
    
    setLoadingAI(true);
    try {
      const result = await getPricingRecommendation(
        newItem.name,
        ingredients || 'Standard ingredients',
        newItem.hpp
      );
      setAdvice(result);
      // Auto-set the price based on AI recommendation for the new item
      setNewItem(prev => ({ ...prev, price: result.suggestedPrice }));
    } catch (error) {
      console.error(error);
      alert("Gagal mendapatkan rekomendasi AI.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAddSave = () => {
    // Basic validation. Note: Price might be 0 if AI wasn't used, which is allowed but maybe not ideal. 
    // User can edit later via the modal.
    if (newItem.name && newItem.hpp) {
      const item: MenuItem = {
        id: Date.now().toString(),
        name: newItem.name,
        category: newItem.category || Category.FOOD,
        hpp: Number(newItem.hpp),
        price: Number(newItem.price), // This comes from AI or defaults to 0
        promoPrice: Number(newItem.promoPrice) > 0 ? Number(newItem.promoPrice) : undefined,
        description: newItem.description || '',
        isPopular: false
      };

      onAddMenuItem(item);

      // Reset Form
      setNewItem({ name: '', category: Category.FOOD, hpp: 0, price: 0, promoPrice: 0, description: '' });
      setIngredients('');
      setAdvice(null);
    } else {
      alert("Mohon lengkapi data menu (Nama, HPP).");
    }
  };

  const openEditModal = (item: MenuItem) => {
    setEditItem({ ...item });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditItem(null);
    setIsEditModalOpen(false);
  };

  const handleEditSave = () => {
    if (editItem && editItem.name && editItem.price) {
      onUpdateMenuItem(editItem);
      closeEditModal();
    } else {
      alert("Nama dan Harga harus diisi.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 bg-transparent">
      {/* Add Menu Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 transition-all">
        <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-stone-100 text-stone-600">
              <Plus className="w-5 h-5" />
            </div>
            Tambah Menu Baru
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Nama Menu</label>
              <input 
                type="text" 
                value={newItem.name} 
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white text-stone-900 transition-all placeholder:text-stone-300"
                placeholder="Contoh: Nasi Goreng Spesial"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Kategori</label>
                <div className="relative">
                  <select 
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value as Category})}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white text-stone-900 appearance-none"
                  >
                    {Object.values(Category).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Box className="absolute right-3 top-3 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">HPP (Modal)</label>
                <input 
                  type="number" 
                  value={newItem.hpp || ''} 
                  onChange={e => setNewItem({...newItem, hpp: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white text-stone-900 placeholder:text-stone-300"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Komposisi (Untuk AI)</label>
              <textarea 
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white text-stone-900 placeholder:text-stone-300"
                placeholder="Contoh: Nasi, Telur 2, Sosis, Bumbu racik..."
                rows={3}
              />
            </div>
            
            <button 
              onClick={handleAskAI}
              disabled={loadingAI}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 active:scale-[0.98]"
            >
              {loadingAI ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              Hitung HPP & Saran Harga AI
            </button>
          </div>

          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col justify-between">
            {advice ? (
               <div className="space-y-4 mb-4">
                 <h3 className="font-bold text-indigo-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                   <Sparkles className="w-4 h-4" /> Hasil Analisis AI
                 </h3>
                 <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <p className="text-xs text-stone-500 font-semibold mb-1">Rekomendasi Harga Jual</p>
                    <div className="flex items-baseline gap-2">
                       <p className="text-3xl font-extrabold text-indigo-600">IDR {advice.suggestedPrice.toLocaleString()}</p>
                       <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Margin {advice.marginPercentage}%</span>
                    </div>
                 </div>
                 <div className="text-xs text-stone-600 space-y-3 bg-white p-4 rounded-xl border border-stone-200/50">
                   <p><strong className="text-stone-800">Kenapa harga ini?</strong><br/> {advice.reasoning}</p>
                   <p><strong className="text-stone-800">Analisa Pasar:</strong><br/> {advice.competitorAnalysis}</p>
                 </div>
               </div>
            ) : (
                <div className="mb-4 flex flex-col items-center justify-center text-stone-400 text-sm p-8 text-center border-2 border-dashed border-stone-200 rounded-xl h-full">
                  <Sparkles className="w-8 h-8 mb-3 text-stone-300" />
                  <p className="font-medium text-stone-500">Belum ada analisis</p>
                  <p className="text-xs mt-1 max-w-[200px]">Isi data menu dan klik tombol AI untuk mendapatkan saran harga cerdas.</p>
                </div>
            )}

            <div className={`mt-auto ${advice ? 'pt-6 border-t border-stone-200/50' : ''}`}>
               {/* Note: Price inputs removed from Add form as requested. Price is set by AI or defaults to 0. */}
               
               <button 
                  onClick={handleAddSave}
                  className="w-full py-3.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200"
               >
                 <Plus className="w-5 h-5" /> Simpan Menu
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50">
          <h3 className="font-bold text-stone-700">Daftar Menu Tersimpan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-stone-400 font-bold border-b border-stone-100 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Nama Menu</th>
                <th className="px-6 py-4 whitespace-nowrap">Kategori</th>
                <th className="px-6 py-4 whitespace-nowrap">HPP</th>
                <th className="px-6 py-4 whitespace-nowrap">Harga Jual</th>
                <th className="px-6 py-4 whitespace-nowrap">Promo</th>
                <th className="px-6 py-4 whitespace-nowrap">Margin</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {menuItems.map(item => {
                const effectivePrice = item.promoPrice && item.promoPrice > 0 ? item.promoPrice : item.price;
                const margin = effectivePrice - item.hpp;
                const marginPercent = effectivePrice > 0 ? ((margin / effectivePrice) * 100).toFixed(1) : '0';
                
                return (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-800 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-md uppercase tracking-wide">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 whitespace-nowrap font-medium">IDR {item.hpp.toLocaleString()}</td>
                    <td className="px-6 py-4 text-stone-800 font-bold whitespace-nowrap">IDR {item.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-500 font-bold whitespace-nowrap">
                      {item.promoPrice && item.promoPrice > 0 ? `IDR ${item.promoPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`font-bold ${Number(marginPercent) > 40 ? 'text-green-600' : 'text-orange-500'}`}>{marginPercent}%</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="text-indigo-500 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteMenuItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {menuItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-400">
                    Belum ada menu tersimpan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Pencil className="w-5 h-5" />
                </div>
                Edit Menu
              </h2>
              <button onClick={closeEditModal} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Nama Menu</label>
                  <input 
                    type="text" 
                    value={editItem.name} 
                    onChange={e => setEditItem({...editItem, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Kategori</label>
                    <div className="relative">
                      <select 
                        value={editItem.category}
                        onChange={e => setEditItem({...editItem, category: e.target.value as Category})}
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white text-stone-900 appearance-none"
                      >
                        {Object.values(Category).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <Box className="absolute right-3 top-3 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">HPP (Modal)</label>
                    <input 
                      type="number" 
                      value={editItem.hpp} 
                      onChange={e => setEditItem({...editItem, hpp: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Harga Normal</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-stone-400 text-xs font-bold">IDR</span>
                      <input 
                        type="number" 
                        value={editItem.price} 
                        onChange={e => setEditItem({...editItem, price: Number(e.target.value)})}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white text-stone-900 font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Harga Promo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-red-300 text-xs font-bold">IDR</span>
                      <input 
                        type="number" 
                        value={editItem.promoPrice || ''} 
                        onChange={e => setEditItem({...editItem, promoPrice: Number(e.target.value)})}
                        className="w-full pl-10 pr-4 py-2.5 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none bg-white text-red-600 font-bold placeholder:text-red-200"
                        placeholder="Kosongkan jika tidak ada"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Deskripsi</label>
                   <textarea
                     value={editItem.description || ''}
                     onChange={e => setEditItem({...editItem, description: e.target.value})}
                     className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white text-stone-900"
                     rows={3}
                   />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 flex justify-end gap-3 bg-stone-50">
              <button 
                onClick={closeEditModal}
                className="px-6 py-2.5 rounded-xl text-stone-600 font-bold hover:bg-stone-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleEditSave}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;