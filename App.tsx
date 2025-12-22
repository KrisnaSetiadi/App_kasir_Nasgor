import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBasket, UtensilsCrossed, Menu, Settings, ChevronRight } from 'lucide-react';
import MenuManager from './components/MenuManager';
import POS from './components/POS';
import Dashboard from './components/Dashboard';
import StoreProfileSettings from './components/StoreProfileSettings';
import { MenuItem, Transaction, Category, StoreProfile } from './types';

// Storage Keys
const STORAGE_KEYS = {
  MENU: 'NASIGOR_MENU_V1',
  TRANSACTIONS: 'NASIGOR_TRX_V1',
  PROFILE: 'NASIGOR_PROFILE_V1'
};

// Mock Initial Data (Used only if storage is empty)
const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Nasi Goreng Spesial', category: Category.FOOD, hpp: 12000, price: 25000, description: 'Telur, Ayam, Sosis' },
  { id: '2', name: 'Mie Goreng Seafood', category: Category.FOOD, hpp: 15000, price: 30000, description: 'Udang, Cumi' },
  { id: '3', name: 'Kwetiaw Siram Sapi', category: Category.FOOD, hpp: 18000, price: 35000, description: 'Daging sapi iris' },
  { id: '4', name: 'Es Teh Manis', category: Category.BEVERAGE, hpp: 2000, price: 5000 },
  { id: '5', name: 'Es Jeruk', category: Category.BEVERAGE, hpp: 4000, price: 10000 },
  { id: '6', name: 'Kerupuk Putih', category: Category.ADD_ON, hpp: 500, price: 2000 },
];

const INITIAL_PROFILE: StoreProfile = {
  name: 'Nasi Goreng AI',
  address: 'Jl. Rasa No. 1, Jakarta',
  phone: '0812-3456-7890',
  socialMedia: '@nasigorengai',
  footerText: 'Powered by NasiGorAI'
};

enum View {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  MENU = 'MENU',
  SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.POS);

  // Initialize State from LocalStorage (Lazy Initialization)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENU);
      return saved ? JSON.parse(saved) : INITIAL_MENU;
    } catch (e) {
      return INITIAL_MENU;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch (e) {
      return INITIAL_PROFILE;
    }
  });

  // Persistence Effects: Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(storeProfile));
  }, [storeProfile]);


  const handleAddMenuItem = (item: MenuItem) => {
    setMenuItems(prev => [...prev, item]);
    setCurrentView(View.MENU); 
  };

  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteMenuItem = (id: string) => {
    if(confirm("Hapus menu ini?")) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleTransactionComplete = (transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
    // No alert needed, the UI feedback is enough, but purely functional:
    // console.log("Transaction saved"); 
  };

  const handleUpdateProfile = (profile: StoreProfile) => {
    setStoreProfile(profile);
  };

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-stone-800 overflow-hidden">
      {/* Desktop Sidebar Navigation - Cleaner, White Theme */}
      <aside className="hidden md:flex w-20 lg:w-72 bg-white flex-col items-center lg:items-start transition-all duration-300 border-r border-stone-200 z-30 h-full shadow-[2px_0_24px_-12px_rgba(0,0,0,0.05)]">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3 w-full mb-2">
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-200 flex-shrink-0">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <h1 className="hidden lg:block font-extrabold text-xl tracking-tight text-stone-800 leading-tight">
            {storeProfile.name}
          </h1>
        </div>
        
        <nav className="flex-1 w-full px-4 space-y-2">
          <NavButton 
            active={currentView === View.POS} 
            onClick={() => setCurrentView(View.POS)} 
            icon={<ShoppingBasket className="w-5 h-5" />} 
            label="Kasir (POS)" 
          />
          <NavButton 
            active={currentView === View.DASHBOARD} 
            onClick={() => setCurrentView(View.DASHBOARD)} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
          />
          <NavButton 
            active={currentView === View.MENU} 
            onClick={() => setCurrentView(View.MENU)} 
            icon={<Menu className="w-5 h-5" />} 
            label="Menu & HPP" 
          />
          <NavButton 
            active={currentView === View.SETTINGS} 
            onClick={() => setCurrentView(View.SETTINGS)} 
            icon={<Settings className="w-5 h-5" />} 
            label="Pengaturan" 
          />
        </nav>
        
        <div className="p-6 border-t border-stone-100 w-full">
          <div className="hidden lg:flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
             <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500">v1</div>
             <div className="flex-1">
               <p className="text-xs font-semibold text-stone-700">Versi 1.1.0</p>
               <p className="text-[10px] text-stone-400">Database: Local</p>
             </div>
          </div>
          <p className="text-[10px] text-stone-400 text-center lg:hidden">v1.1</p>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-stone-50/50">
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-stone-200 h-16 flex-none flex items-center px-4 z-20 justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-orange-500 p-1.5 rounded-lg">
                <UtensilsCrossed className="w-5 h-5 text-white" />
             </div>
             <h1 className="font-bold text-stone-800 truncate text-lg">{storeProfile.name}</h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative pb-[72px] md:pb-0">
          <div className="h-full overflow-y-auto overflow-x-hidden p-0 md:p-2">
             {currentView === View.POS && (
               <POS menuItems={menuItems} onCompleteTransaction={handleTransactionComplete} storeProfile={storeProfile} />
             )}
             {currentView === View.MENU && (
               <MenuManager 
                 menuItems={menuItems} 
                 onAddMenuItem={handleAddMenuItem} 
                 onUpdateMenuItem={handleUpdateMenuItem}
                 onDeleteMenuItem={handleDeleteMenuItem} 
               />
             )}
             {currentView === View.DASHBOARD && (
               <Dashboard transactions={transactions} />
             )}
             {currentView === View.SETTINGS && (
               <StoreProfileSettings profile={storeProfile} onUpdateProfile={handleUpdateProfile} />
             )}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Floating Style */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border border-stone-200 shadow-xl rounded-2xl h-16 flex items-center justify-around z-50 px-2">
           <MobileNavButton 
             active={currentView === View.POS} 
             onClick={() => setCurrentView(View.POS)} 
             icon={<ShoppingBasket className="w-5 h-5" />} 
             label="Kasir" 
           />
           <MobileNavButton 
             active={currentView === View.DASHBOARD} 
             onClick={() => setCurrentView(View.DASHBOARD)} 
             icon={<LayoutDashboard className="w-5 h-5" />} 
             label="Laporan" 
           />
           <MobileNavButton 
             active={currentView === View.MENU} 
             onClick={() => setCurrentView(View.MENU)} 
             icon={<Menu className="w-5 h-5" />} 
             label="Menu" 
           />
           <MobileNavButton 
             active={currentView === View.SETTINGS} 
             onClick={() => setCurrentView(View.SETTINGS)} 
             icon={<Settings className="w-5 h-5" />} 
             label="Profil" 
           />
        </nav>
      </div>
    </div>
  );
};

// Helper Components for Cleaner Code
const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-orange-50 text-orange-600 font-semibold shadow-sm' 
        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
    }`}
  >
    <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="hidden lg:block text-sm">{label}</span>
    {active && <ChevronRight className="w-4 h-4 ml-auto hidden lg:block opacity-50" />}
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-colors ${
      active ? 'text-orange-600' : 'text-stone-400'
    }`}
  >
    <div className={`p-1.5 rounded-full mb-0.5 transition-all ${active ? 'bg-orange-50 -translate-y-1' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;