import React, { useState, useMemo, useRef } from 'react';
import { MenuItem, CartItem, OrderSource, PaymentMethod, Transaction, Category, StoreProfile } from '../types';
import { ShoppingCart, Plus, Minus, Receipt, CheckCircle, X, ChevronDown, ChevronUp, Printer, RefreshCw, FileDown, Loader2, Wallet, Tag, Utensils, ShoppingBasket } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface POSProps {
  menuItems: MenuItem[];
  onCompleteTransaction: (transaction: Transaction) => void;
  storeProfile: StoreProfile;
}

const POS: React.FC<POSProps> = ({ menuItems, onCompleteTransaction, storeProfile }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  const [orderSource, setOrderSource] = useState<OrderSource>(OrderSource.OFFLINE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [customerName, setCustomerName] = useState('');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      const effectivePrice = item.promoPrice && item.promoPrice > 0 ? item.promoPrice : item.price;
      
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, price: effectivePrice, originalPrice: item.price }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const changeAmount = useMemo(() => {
    const cash = Number(cashGiven);
    if (isNaN(cash) || cash < totalAmount) return 0;
    return cash - totalAmount;
  }, [cashGiven, totalAmount]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    if (orderSource === OrderSource.OFFLINE && paymentMethod === PaymentMethod.CASH) {
      if (Number(cashGiven) < totalAmount) {
        alert("Uang tunai kurang dari total tagihan!");
        return;
      }
    }
    
    const totalHpp = cart.reduce((sum, item) => sum + (item.hpp * item.quantity), 0);
    const profit = totalAmount - totalHpp;

    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      timestamp: Date.now(),
      items: [...cart],
      totalAmount,
      totalHpp,
      totalProfit: profit,
      orderSource,
      paymentMethod: orderSource === OrderSource.OFFLINE ? paymentMethod : undefined,
      customerName: customerName || 'Pelanggan Umum',
      cashGiven: orderSource === OrderSource.OFFLINE && paymentMethod === PaymentMethod.CASH ? Number(cashGiven) : undefined,
      change: orderSource === OrderSource.OFFLINE && paymentMethod === PaymentMethod.CASH ? changeAmount : undefined,
    };

    onCompleteTransaction(transaction);
    setLastTransaction(transaction);
    
    setCart([]);
    setShowCheckout(false);
    setIsMobileCartOpen(false);
    setCustomerName('');
    setOrderSource(OrderSource.OFFLINE);
    setCashGiven('');
    
    setShowSuccess(true);
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const element = document.getElementById('receipt-preview-content');
    if (!element) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 58; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Struk-${lastTransaction?.id}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Gagal membuat PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return menuItems;
    return menuItems.filter(i => i.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  return (
    <div className="flex h-full flex-col md:flex-row overflow-hidden bg-stone-50 relative">
      {/* Product Grid Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Category Filter - Sticky & Styled */}
        <div className="p-4 bg-stone-50 z-10 sticky top-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <button 
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${selectedCategory === 'ALL' ? 'bg-stone-800 text-white shadow-stone-300' : 'bg-white text-stone-500 hover:bg-stone-100 border border-stone-200'}`}
            >
              Semua Menu
            </button>
            {Object.values(Category).map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-white text-stone-500 hover:bg-stone-100 border border-stone-200'}`}
              >
                {cat === 'FOOD' ? 'Makanan' : cat === 'BEVERAGE' ? 'Minuman' : 'Tambahan'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const hasPromo = item.promoPrice && item.promoPrice > 0;
              return (
                <div 
                  key={item.id} 
                  onClick={() => addToCart(item)}
                  className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all duration-200 flex flex-col justify-between h-[160px] md:h-[180px] active:scale-[0.98] group relative overflow-hidden"
                >
                  {/* Decorative Background Icon */}
                  <Utensils className="absolute -right-4 -bottom-4 w-24 h-24 text-stone-50 opacity-50 group-hover:text-orange-50 transition-colors" />
                  
                  {hasPromo && (
                    <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                      <Tag className="w-3 h-3" /> PROMO
                    </div>
                  )}
                  
                  <div className="z-10">
                    <h3 className="font-bold text-stone-800 line-clamp-2 leading-tight text-sm md:text-base group-hover:text-orange-600 transition-colors">{item.name}</h3>
                    <p className="text-xs text-stone-400 mt-1">{item.description || item.category}</p>
                  </div>
                  
                  <div className="mt-2 flex items-end justify-between z-10">
                    <div className="flex flex-col">
                      {hasPromo ? (
                        <>
                           <span className="text-xs text-stone-400 line-through">IDR {item.price.toLocaleString()}</span>
                           <span className="font-extrabold text-red-500 text-sm md:text-base">IDR {item.promoPrice?.toLocaleString()}</span>
                        </>
                      ) : (
                         <span className="font-extrabold text-stone-700 text-sm md:text-base">IDR {item.price.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="bg-orange-50 text-orange-500 p-2 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-sm">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center text-stone-400 h-64">
              <div className="bg-stone-100 p-4 rounded-full mb-3">
                 <ShoppingCart className="w-8 h-8 opacity-40" />
              </div>
              <p>Tidak ada menu di kategori ini</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Cart Summary */}
      {cart.length > 0 && (
        <div 
          onClick={() => setIsMobileCartOpen(true)}
          className="md:hidden fixed bottom-20 left-4 right-4 bg-stone-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl z-30 flex justify-between items-center cursor-pointer active:scale-95 transition-transform animate-in slide-in-from-bottom-5 border border-stone-700"
        >
          <div className="flex items-center gap-4">
             <div className="bg-orange-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
               {totalItems}
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] text-stone-300 uppercase tracking-wider font-medium">Total Estimasi</span>
               <span className="font-bold text-lg">IDR {totalAmount.toLocaleString()}</span>
             </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-lg">
            Bayar <ChevronUp className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <div className={`
        fixed inset-0 z-40 bg-white transform transition-transform duration-300 flex flex-col
        md:relative md:translate-x-0 md:w-[400px] md:border-l md:border-stone-200 md:shadow-xl md:h-full md:z-20
        ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-5 border-b border-stone-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Receipt className="w-5 h-5 text-orange-500" /> 
            </div>
            <div>
               <h2 className="font-bold text-lg text-stone-800">Pesanan Aktif</h2>
               <p className="text-xs text-stone-400">Order #{Date.now().toString().slice(-4)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs bg-stone-100 px-2.5 py-1 rounded-full text-stone-600 font-bold">{cart.length} Item</span>
             <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden p-2 bg-stone-50 rounded-full text-stone-400">
               <ChevronDown className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/30">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-start p-3 bg-white rounded-xl border border-stone-100 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex-1">
                <h4 className="font-semibold text-stone-800 text-sm mb-1">{item.name}</h4>
                <div className="flex items-center gap-2">
                   <p className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">IDR {item.price.toLocaleString()}</p>
                   {item.originalPrice && item.originalPrice !== item.price && (
                      <span className="text-[10px] text-stone-400 line-through">IDR {item.originalPrice.toLocaleString()}</span>
                   )}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-stone-50 p-1 rounded-lg border border-stone-100">
                <button 
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-stone-500 hover:text-red-500 shadow-sm border border-stone-100 active:scale-95 transition-all"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold w-6 text-center text-stone-700">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-stone-500 hover:text-green-600 shadow-sm border border-stone-100 active:scale-95 transition-all"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-stone-300">
               <ShoppingBasket className="w-16 h-16 mb-4 opacity-20" />
               <p className="text-sm font-medium">Keranjang masih kosong</p>
               <p className="text-xs mt-1">Silahkan pilih menu</p>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-white border-t border-stone-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] pb-8 md:pb-5">
          <div className="flex justify-between items-end mb-4">
            <span className="text-stone-500 text-sm font-medium">Total Pembayaran</span>
            <span className="text-2xl font-extrabold text-stone-800">IDR {totalAmount.toLocaleString()}</span>
          </div>
          <button 
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-stone-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Lanjut Pembayaran <ChevronUp className="w-4 h-4 rotate-90" />
          </button>
        </div>
      </div>

      {/* Checkout Modal - Softer & Cleaner */}
      {showCheckout && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-lg text-stone-800">Konfirmasi Pembayaran</h3>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-2">Nama Pelanggan</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white text-stone-900 transition-all"
                  placeholder="Isi nama pelanggan..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-2">Sumber Pesanan</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(OrderSource).map(src => (
                    <button
                      key={src}
                      onClick={() => setOrderSource(src)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${orderSource === src ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                    >
                      {src.replace('ONLINE_', '').replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {orderSource === OrderSource.OFFLINE && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-semibold text-stone-600 mb-2">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.values(PaymentMethod).map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${paymentMethod === method ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                      >
                        {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  
                  {paymentMethod === PaymentMethod.CASH && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                       <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                         <Wallet className="w-3 h-3" /> Tunai Diterima
                       </label>
                       <div className="relative">
                         <span className="absolute left-3 top-3 text-stone-400 font-bold">Rp</span>
                         <input 
                            type="number" 
                            value={cashGiven}
                            onChange={(e) => setCashGiven(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none font-bold text-lg bg-white text-stone-900 shadow-sm"
                            placeholder="0"
                         />
                       </div>
                       <div className="flex justify-between mt-3 text-sm pt-3 border-t border-stone-200/50">
                         <span className="text-stone-500 font-medium">Kembalian</span>
                         <span className={`font-bold text-lg ${changeAmount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                           IDR {changeAmount < 0 ? '-' : changeAmount.toLocaleString()}
                         </span>
                       </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-stone-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-stone-500">Total Akhir</span>
                  <span className="font-extrabold text-2xl text-stone-900">IDR {totalAmount.toLocaleString()}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={orderSource === OrderSource.OFFLINE && paymentMethod === PaymentMethod.CASH && Number(cashGiven) < totalAmount}
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  <CheckCircle className="w-5 h-5" /> Selesaikan Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Polished */}
      {showSuccess && lastTransaction && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in duration-300 flex flex-col max-h-[90vh] overflow-hidden border border-stone-100">
              <div className="flex-shrink-0 mb-4">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-50">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-stone-800">Transaksi Sukses!</h2>
                {lastTransaction.change !== undefined && (
                   <div className="mt-2 text-stone-600">
                     <span className="text-xs uppercase tracking-wide text-stone-400">Kembalian</span>
                     <p className="text-2xl font-bold text-green-600">IDR {lastTransaction.change.toLocaleString()}</p>
                   </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto mb-4 border border-stone-200 rounded-xl bg-stone-50 p-4 shadow-inner custom-scrollbar">
                 <div id="receipt-preview-content" className="bg-white p-4 shadow-sm mx-auto text-left w-[240px] border border-stone-100">
                    <div className="text-center mb-4 space-y-0.5">
                      <h1 className="font-bold text-base uppercase tracking-wider text-stone-900">{storeProfile.name}</h1>
                      <p className="text-[9px] text-stone-500">{storeProfile.address}</p>
                      <p className="text-[9px] text-stone-500">{storeProfile.phone}</p>
                      <p className="text-[9px] text-stone-500 mt-1">{new Date(lastTransaction.timestamp).toLocaleString()}</p>
                    </div>
                    
                    <div className="border-b-2 border-dashed border-stone-200 my-3"></div>
                    
                    <div className="flex flex-col gap-2 text-[10px] text-stone-700">
                      {lastTransaction.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col">
                          <span className="font-semibold">{item.name}</span>
                          <div className="flex justify-between mt-0.5">
                             <span>{item.quantity} x {item.price.toLocaleString()}</span>
                             <span>{(item.quantity * item.price).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-b-2 border-dashed border-stone-200 my-3"></div>
                    
                    <div className="flex justify-between font-bold text-xs text-stone-900">
                      <span>TOTAL</span>
                      <span>IDR {lastTransaction.totalAmount.toLocaleString()}</span>
                    </div>

                    <div className="mt-2 text-[9px] text-stone-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Metode:</span>
                        <span className="uppercase font-semibold">{lastTransaction.paymentMethod || lastTransaction.orderSource}</span>
                      </div>
                      {lastTransaction.cashGiven !== undefined && (
                        <>
                          <div className="flex justify-between">
                            <span>Bayar:</span>
                            <span>IDR {lastTransaction.cashGiven.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="border-b-2 border-dashed border-stone-200 my-3"></div>
                    
                    <div className="text-center">
                      <p className="font-semibold text-[10px] text-stone-700">TERIMA KASIH</p>
                      <p className="text-[8px] text-stone-400 mt-1">{storeProfile.footerText}</p>
                    </div>
                 </div>
              </div>
              
              <div className="flex-shrink-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handlePrint}
                    className="py-2.5 bg-stone-800 text-white rounded-xl font-semibold shadow-sm text-sm flex items-center justify-center gap-2 hover:bg-stone-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Cetak
                  </button>
                  <button 
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-sm text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70"
                  >
                     {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                     PDF
                  </button>
                </div>
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Transaksi Baru
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Hidden Receipt for Printing - No Styles Changed */}
      <div id="receipt-print-area" className="hidden">
        {lastTransaction && (
          <div className="p-2">
            <div className="text-center mb-2">
              <h1 className="font-bold text-lg uppercase">{storeProfile.name}</h1>
              <p className="text-[10px]">{storeProfile.address}</p>
              {storeProfile.phone && <p className="text-[10px]">{storeProfile.phone}</p>}
              <p className="text-[10px]">{new Date(lastTransaction.timestamp).toLocaleString()}</p>
              <p className="text-[10px]">Order: #{lastTransaction.id.slice(-6)}</p>
              <p className="text-[10px]">Pel: {lastTransaction.customerName}</p>
            </div>
            <div className="border-b border-dashed border-black my-2"></div>
            <div className="flex flex-col gap-1">
              {lastTransaction.items.map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-bold">{item.name}</span>
                  <div className="flex justify-between">
                     <span>{item.quantity} x {item.price.toLocaleString()}</span>
                     <span>{(item.quantity * item.price).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-b border-dashed border-black my-2"></div>
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>IDR {lastTransaction.totalAmount.toLocaleString()}</span>
            </div>
            <div className="text-[10px] mt-2">
               <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="uppercase">{lastTransaction.paymentMethod || lastTransaction.orderSource}</span>
               </div>
               {lastTransaction.cashGiven !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>Tunai:</span>
                    <span>IDR {lastTransaction.cashGiven.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kembali:</span>
                    <span>IDR {(lastTransaction.change || 0).toLocaleString()}</span>
                  </div>
                </>
               )}
            </div>
            <div className="border-b border-dashed border-black my-2"></div>
            <div className="text-center mt-4">
              <p className="font-bold">TERIMA KASIH</p>
              <p className="text-[10px]">{storeProfile.footerText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;