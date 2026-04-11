import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, Search, Printer, RotateCcw, Zap, History, 
  ArrowUp, ArrowDown, AlertCircle, CheckCircle2, X, PlusCircle, MinusCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
});

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
  mrp: number;
  price: number;
  images: { url: string }[];
  category?: { name: string };
}

interface InventoryLog {
  _id: string;
  type: 'inward' | 'outward';
  quantity: number;
  oldStock: number;
  newStock: number;
  note: string;
  createdAt: string;
}

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [qtyToAdjust, setQtyToAdjust] = useState(1);
  const [adjustType, setAdjustType] = useState<'inward' | 'outward'>('inward');
  const [previewBarcode, setPreviewBarcode] = useState<{ value: string, name: string } | null>(null);
  const [printModal, setPrintModal] = useState<{ show: boolean, product: Product | null }>({ show: false, product: null });
  const [printQty, setPrintQty] = useState(1);
  const [printCols, setPrintCols] = useState<1 | 2>(1);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?limit=100&search=${search}`);
      setProducts(res.data.products);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const generateBarcode = async (product: Product) => {
    const prefix = product.sku ? product.sku.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() : 'RET';
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const newBarcode = `${prefix}${random}`;
    
    try {
      await api.put(`/products/${product._id}`, { barcode: newBarcode });
      toast.success('Barcode generated');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to generate barcode');
    }
  };

  const viewHistory = async (product: Product) => {
    setSelectedProduct(product);
    try {
      const res = await api.get(`/products/inventory/logs/${product._id}`);
      setLogs(res.data.logs);
      setShowLogs(true);
    } catch (err) {
      toast.error('Failed to load history');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    try {
      await api.put('/products/update-stock/barcode', {
        barcode: selectedProduct.barcode,
        quantity: qtyToAdjust,
        type: adjustType
      });
      toast.success(`Stock ${adjustType} successfully`);
      setIsAdjusting(false);
      fetchProducts();
      // Reload logs if they are open
      const res = await api.get(`/products/inventory/logs/${selectedProduct._id}`);
      setLogs(res.data.logs);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const printLabel = (product: Product, qty: number, cols: 1 | 2) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return alert('Enable pop-ups');

    let labelsHtml = '';
    const sheetWidth = cols === 2 ? '100mm' : '50mm';
    
    if (cols === 2) {
      // 2-column layout logic
      for (let i = 0; i < qty; i += 2) {
        labelsHtml += `
          <div class="label-sheet double">
            <div class="label-box">
              <p class="product-name">${product.name}</p>
              <div class="barcode-wrapper"><svg id="barcode_${i}"></svg></div>
              <div class="price-row"><span class="mrp-label">MRP:</span><span class="mrp-value">₹${product.mrp || product.price}</span></div>
            </div>
            ${(i + 1 < qty) ? `
            <div class="label-box">
              <p class="product-name">${product.name}</p>
              <div class="barcode-wrapper"><svg id="barcode_${i+1}"></svg></div>
              <div class="price-row"><span class="mrp-label">MRP:</span><span class="mrp-value">₹${product.mrp || product.price}</span></div>
            </div>` : '<div class="label-box empty"></div>'}
          </div>
        `;
      }
    } else {
      // 1-column layout logic
      for (let i = 0; i < qty; i++) {
        labelsHtml += `
          <div class="label-sheet single">
            <div class="label-box">
              <p class="product-name">${product.name}</p>
              <div class="barcode-wrapper"><svg id="barcode_${i}"></svg></div>
              <div class="price-row"><span class="mrp-label">MRP:</span><span class="mrp-value">₹${product.mrp || product.price}</span></div>
            </div>
          </div>
        `;
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels: ${product.name}</title>
          <style>
            @page { size: ${sheetWidth} 25mm; margin: 0; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
            html, body { margin: 0 !important; padding: 0 !important; width: ${sheetWidth}; height: 25mm; background: white; }
            .label-sheet { width: ${sheetWidth}; height: 25mm; page-break-after: always; display: flex; overflow: hidden; }
            .label-box { width: 50mm; height: 25mm; padding: 1mm 1mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; }
            .label-box.empty { visibility: hidden; }
            .product-name { font-family: 'Segoe UI', sans-serif; font-size: 7pt; font-weight: 900; margin: 0; padding: 0 1.5mm; text-transform: uppercase; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1; }
            .barcode-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden; padding: 0.5mm 0; }
            svg { max-width: 98%; height: auto !important; max-height: 15mm; shape-rendering: crispEdges; }
            .price-row { display: flex; align-items: center; justify-content: center; gap: 4px; font-family: Arial, sans-serif; line-height: 1; padding-bottom: 0.5mm; }
            .mrp-label { font-size: 7pt; color: #333; font-weight: bold; }
            .mrp-value { font-size: 11pt; font-weight: 900; color: black; }
            @media print { body { width: ${sheetWidth}; height: 25mm; } }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          ${labelsHtml}
          <script>
            function draw() {
              if (window.JsBarcode) {
                for (let i = 0; i < ${qty}; i++) {
                  try {
                    JsBarcode("#barcode_" + i, "${product.barcode}", {
                      format: "CODE128", 
                      width: 2.5, 
                      height: 55, 
                      displayValue: true, 
                      fontSize: 16, 
                      fontOptions: "bold", 
                      margin: 5, 
                      background: "#ffffff"
                    });
                  } catch(e) {}
                }
                setTimeout(() => { window.print(); window.close(); }, 400);
              } else { setTimeout(draw, 50); }
            }
            window.onload = draw;
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Monitor stock levels and track every movement</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 w-80 bg-slate-50 border-slate-200" 
            placeholder="Search by name, SKU or barcode..." 
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin inline text-primary mr-2" /> Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-slate-400">No products found matching your search.</td></tr>
            ) : products.map(p => (
              <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0]?.url} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{p.category?.name || 'Uncategorized'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-medium text-slate-600">SKU: {p.sku || '-'}</p>
                  <div className="mt-1">
                    {p.barcode ? (
                      <button 
                        onClick={() => setPreviewBarcode({ value: p.barcode, name: p.name })}
                        className="p-1 bg-white border border-slate-100 rounded flex items-center w-fit hover:border-primary/50 hover:shadow-md transition-all cursor-zoom-in group/barcode"
                        title="Click to preview"
                      >
                        <Barcode 
                          value={p.barcode} 
                          width={1.2} 
                          height={24} 
                          fontSize={9} 
                          margin={0}
                          background="#FFFFFF"
                        />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                          NO BARCODE
                        </p>
                        <button onClick={() => generateBarcode(p)} className="text-primary hover:text-primary-dark transition-colors">
                          <Zap size={14} fill="currentColor" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {p.stock <= 0 ? (
                    <span className="badge-red flex items-center gap-1 w-fit"><AlertCircle size={10} /> Out of Stock</span>
                  ) : p.stock < 10 ? (
                    <span className="badge-orange flex items-center gap-1 w-fit"><AlertCircle size={10} /> Low Stock</span>
                  ) : (
                    <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle2 size={10} /> Healthy</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className={`text-lg font-black ${p.stock <= 0 ? 'text-red-600' : p.stock < 10 ? 'text-orange-500' : 'text-slate-800'}`}>
                    {p.stock}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => viewHistory(p)}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Stock History"
                    >
                      <History size={18} />
                    </button>
                    {p.barcode && (
                      <button 
                        onClick={() => setPrintModal({ show: true, product: p })}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Print Label"
                      >
                        <Printer size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      {showLogs && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <img src={selectedProduct.images?.[0]?.url} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white" />
                 <div>
                    <h2 className="text-xl font-black text-slate-800">Stock Audit Log</h2>
                    <p className="text-slate-500 text-xs">Full movement history for {selectedProduct.name}</p>
                 </div>
              </div>
              <button onClick={() => setShowLogs(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 flex gap-4">
               <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                  <p className="text-3xl font-black text-slate-800">{selectedProduct.stock}</p>
               </div>
               <div className="flex-1 flex gap-2">
                  <button 
                    onClick={() => { setAdjustType('inward'); setIsAdjusting(true); }}
                    className="flex-1 bg-[#4ADE80] text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                  >
                    <PlusCircle size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Inward</span>
                  </button>
                  <button 
                    onClick={() => { setAdjustType('outward'); setIsAdjusting(true); }}
                    className="flex-1 bg-[#F87171] text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                  >
                    <MinusCircle size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Outward</span>
                  </button>
               </div>
            </div>

            {isAdjusting && (
              <div className="px-6 py-4 bg-white border-b border-slate-100 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-bold text-slate-600">Quantity to {adjustType}:</p>
                  <input 
                    type="number" 
                    value={qtyToAdjust} 
                    onChange={e => setQtyToAdjust(parseInt(e.target.value) || 0)}
                    className="input w-24 text-center font-black text-xl" 
                  />
                  <button 
                    onClick={handleAdjustStock}
                    className={`flex-1 py-3 px-6 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all ${adjustType === 'inward' ? 'bg-[#4ADE80]' : 'bg-[#F87171]'}`}
                  >
                    Confirm {adjustType}
                  </button>
                  <button onClick={() => setIsAdjusting(false)} className="text-slate-400 font-bold text-xs uppercase underline">Cancel</button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-0 p-b-10">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white shadow-sm z-10 border-b border-slate-100">
                   <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-3">Type</th>
                      <th className="px-8 py-3">Qty</th>
                      <th className="px-8 py-3">Timeline</th>
                      <th className="px-8 py-3 text-right">Stock</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <tr key={log._id} className="text-sm">
                      <td className="px-8 py-4">
                        <span className={`flex items-center gap-1 font-black ${log.type === 'inward' ? 'text-green-600' : 'text-red-600'}`}>
                          {log.type === 'inward' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {log.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-4 font-black text-slate-800">
                        {log.type === 'inward' ? '+' : '-'}{log.quantity}
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-slate-700 font-medium">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <p className="text-xs text-slate-400">{log.oldStock} →</p>
                          <p className="font-black text-slate-800">{log.newStock}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-400">No logs found for this product.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Print Settings Modal */}
      {printModal.show && printModal.product && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                    <Printer size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-800">Print Settings</h2>
                    <p className="text-slate-500 text-xs">Configure your sticker labels</p>
                 </div>
              </div>
              <button 
                onClick={() => setPrintModal({ show: false, product: null })}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <img src={printModal.product.images?.[0]?.url} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white" />
                 <div>
                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{printModal.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{printModal.product.barcode}</p>
                 </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Number of Labels</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setPrintQty(Math.max(1, printQty - 1))}
                    className="w-12 h-12 flex items-center justify-center border-2 border-slate-100 rounded-2xl text-slate-400 hover:border-primary hover:text-primary transition-all active:scale-90"
                  >
                    <MinusCircle size={20} />
                  </button>
                  <input 
                    type="number" 
                    value={printQty}
                    onChange={e => setPrintQty(parseInt(e.target.value) || 1)}
                    className="flex-1 input h-14 text-center text-2xl font-black text-slate-800 bg-slate-50 border-transparent focus:bg-white focus:border-primary"
                  />
                  <button 
                    onClick={() => setPrintQty(printQty + 1)}
                    className="w-12 h-12 flex items-center justify-center border-2 border-slate-100 rounded-2xl text-slate-400 hover:border-primary hover:text-primary transition-all active:scale-90"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Label Roll Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPrintCols(1)}
                    className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${printCols === 1 ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="w-8 h-10 border-2 border-dashed border-current rounded flex items-center justify-center">
                       <div className="w-4 h-6 bg-current opacity-20 rounded-sm" />
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${printCols === 1 ? 'text-primary' : 'text-slate-400'}`}>Single</span>
                  </button>
                  <button 
                    onClick={() => setPrintCols(2)}
                    className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${printCols === 2 ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="w-14 h-10 border-2 border-dashed border-current rounded flex gap-1 items-center justify-center p-1">
                       <div className="flex-1 h-6 bg-current opacity-20 rounded-sm" />
                       <div className="flex-1 h-6 bg-current opacity-20 rounded-sm" />
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${printCols === 2 ? 'text-primary' : 'text-slate-400'}`}>Double</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => {
                  printLabel(printModal.product!, printQty, printCols);
                  setPrintModal({ show: false, product: null });
                }}
                className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Printer size={20} />
                Generate {printQty} Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
