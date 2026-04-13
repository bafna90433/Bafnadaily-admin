import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import {
  Package, Search, Printer, RotateCcw, Zap, History,
  ArrowUp, ArrowDown, AlertCircle, CheckCircle2, X, PlusCircle, MinusCircle,
  Loader2, Pencil, Check, Hash, Download, Filter, ChevronDown,
  LayoutList, AlertTriangle, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
  mrp: number;
  price: number;
  images: { url: string }[];
  category?: { _id: string; name: string };
  reorderLevel?: number;
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [qtyToAdjust, setQtyToAdjust] = useState(1);
  const [adjustType, setAdjustType] = useState<'inward' | 'outward'>('inward');
  const [adjustNote, setAdjustNote] = useState('');

  const [previewBarcode, setPreviewBarcode] = useState<{ value: string; name: string } | null>(null);
  const [printModal, setPrintModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
  const [printQty, setPrintQty] = useState(1);
  const [printCols, setPrintCols] = useState<1 | 2>(1);

  const [editingSku, setEditingSku] = useState<{ id: string; value: string } | null>(null);
  const [editingBarcode, setEditingBarcode] = useState<{ id: string; value: string } | null>(null);
  const [editingReorder, setEditingReorder] = useState<{ id: string; value: string } | null>(null);

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkQty, setBulkQty] = useState(1);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [search]);

  // Client-side filter for cat + stock
  useEffect(() => {
    let filtered = allProducts;
    if (catFilter) filtered = filtered.filter(p => p.category?._id === catFilter);
    if (stockFilter === 'out') filtered = filtered.filter(p => p.stock <= 0);
    else if (stockFilter === 'low') filtered = filtered.filter(p => p.stock > 0 && p.stock < 10);
    setProducts(filtered);
  }, [allProducts, catFilter, stockFilter]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/all');
      setCategories(res.data.categories || []);
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?limit=200&search=${search}`);
      setAllProducts(res.data.products || []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const generateBarcode = async (product: Product) => {
    if (!product.sku) { toast.error('Add SKU first'); return; }
    const prefix = product.sku.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    try {
      await api.put(`/products/${product._id}`, { barcode: `${prefix}${random}` });
      toast.success('Barcode generated');
      fetchProducts();
    } catch { toast.error('Failed to generate barcode'); }
  };

  const saveSku = async (id: string, sku: string) => {
    if (!sku.trim()) return toast.error('SKU cannot be empty');
    try {
      await api.put(`/products/${id}`, { sku: sku.trim().toUpperCase() });
      toast.success('SKU updated'); setEditingSku(null); fetchProducts();
    } catch { toast.error('Failed to update SKU'); }
  };

  const saveBarcode = async (id: string, barcode: string) => {
    if (!barcode.trim()) return toast.error('Barcode cannot be empty');
    try {
      await api.put(`/products/${id}`, { barcode: barcode.trim().toUpperCase() });
      toast.success('Barcode updated'); setEditingBarcode(null); fetchProducts();
    } catch { toast.error('Failed to update barcode'); }
  };

  const saveReorder = async (id: string, val: string) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return toast.error('Enter valid number');
    try {
      await api.put(`/products/${id}`, { reorderLevel: n });
      toast.success('Reorder level saved'); setEditingReorder(null); fetchProducts();
    } catch { toast.error('Failed to save'); }
  };

  const viewHistory = async (product: Product) => {
    setSelectedProduct(product);
    setIsAdjusting(false);
    setAdjustNote('');
    try {
      const res = await api.get(`/products/inventory/logs/${product._id}`);
      setLogs(res.data.logs);
      setShowLogs(true);
    } catch { toast.error('Failed to load history'); }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    try {
      await api.put('/products/update-stock/barcode', {
        barcode: selectedProduct.barcode,
        quantity: qtyToAdjust,
        type: adjustType,
        note: adjustNote.trim() || undefined,
      });
      toast.success(`Stock ${adjustType} successful`);
      setIsAdjusting(false);
      setAdjustNote('');
      fetchProducts();
      const res = await api.get(`/products/inventory/logs/${selectedProduct._id}`);
      setLogs(res.data.logs);
      // update selectedProduct stock
      setSelectedProduct(p => p ? { ...p, stock: adjustType === 'inward' ? p.stock + qtyToAdjust : p.stock - qtyToAdjust } : p);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleBulkUpdate = async (type: 'inward' | 'outward') => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    let ok = 0, fail = 0;
    for (const id of Array.from(selected)) {
      const p = allProducts.find(x => x._id === id);
      if (!p?.barcode) { fail++; continue; }
      try {
        await api.put('/products/update-stock/barcode', { barcode: p.barcode, quantity: bulkQty, type });
        ok++;
      } catch { fail++; }
    }
    setBulkLoading(false);
    toast.success(`${ok} updated${fail ? `, ${fail} failed (no barcode)` : ''}`);
    setSelected(new Set());
    fetchProducts();
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'SKU', 'Barcode', 'Category', 'Stock', 'Reorder Level', 'MRP', 'Price', 'Status'],
      ...products.map(p => [
        `"${p.name}"`,
        p.sku || '',
        p.barcode || '',
        p.category?.name || '',
        p.stock,
        p.reorderLevel ?? 0,
        p.mrp,
        p.price,
        p.stock <= 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'Healthy',
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const toggleSelectAll = () => {
    setSelected(prev => prev.size === products.length ? new Set() : new Set(products.map(p => p._id)));
  };

  const printLabel = (product: Product, qty: number, cols: 1 | 2) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return alert('Enable pop-ups');
    const sheetWidth = cols === 2 ? '100mm' : '50mm';
    let labelsHtml = '';
    if (cols === 2) {
      for (let i = 0; i < qty; i += 2) {
        labelsHtml += `<div class="label-sheet double"><div class="label-box"><p class="product-name">${product.name}</p><div class="barcode-wrapper"><svg id="barcode_${i}"></svg></div><div class="price-row"><span class="mrp-label">MRP:</span><span class="mrp-value">₹${product.mrp || product.price}</span></div></div>${(i+1<qty)?`<div class="label-box"><p class="product-name">${product.name}</p><div class="barcode-wrapper"><svg id="barcode_${i+1}"></svg></div><div class="price-row"><span class="mrp-label">MRP:</span><span class="mrp-value">₹${product.mrp || product.price}</span></div></div>`:'<div class="label-box empty"></div>'}</div>`;
      }
    } else {
      for (let i = 0; i < qty; i++) {
        labelsHtml += `<div class="label-sheet single"><div class="label-box"><p class="product-name">${product.name}</p><div class="barcode-wrapper"><svg id="barcode_${i}"></svg></div><div class="price-row"><span class="mrp-label">MRP:</span><span class="mrp-value">₹${product.mrp || product.price}</span></div></div></div>`;
      }
    }
    printWindow.document.write(`<html><head><title>Print Labels</title><style>@page{size:${sheetWidth} 25mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;width:${sheetWidth};height:25mm;background:white}.label-sheet{width:${sheetWidth};height:25mm;page-break-after:always;display:flex;overflow:hidden}.label-box{width:50mm;height:25mm;padding:1mm;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}.label-box.empty{visibility:hidden}.product-name{font-family:'Segoe UI',sans-serif;font-size:7pt;font-weight:900;margin:0;text-transform:uppercase;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.barcode-wrapper{flex:1;display:flex;align-items:center;justify-content:center;width:100%;padding:0.5mm 0}svg{max-width:98%;height:auto!important;max-height:15mm}.price-row{display:flex;align-items:center;justify-content:center;gap:4px;font-family:Arial,sans-serif}.mrp-label{font-size:7pt;color:#333;font-weight:bold}.mrp-value{font-size:11pt;font-weight:900;color:black}</style><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script></head><body>${labelsHtml}<script>function draw(){if(window.JsBarcode){for(let i=0;i<${qty};i++){try{JsBarcode("#barcode_"+i,"${product.barcode}",{format:"CODE128",width:2.5,height:55,displayValue:true,fontSize:16,fontOptions:"bold",margin:5,background:"#ffffff"})}catch(e){}}setTimeout(()=>{window.print();window.close()},400)}else{setTimeout(draw,50)}}window.onload=draw;</script></body></html>`);
    printWindow.document.close();
  };

  const lowStockCount = allProducts.filter(p => p.stock > 0 && p.stock < 10).length;
  const outStockCount = allProducts.filter(p => p.stock <= 0).length;
  const reorderAlerts = allProducts.filter(p => p.reorderLevel && p.reorderLevel > 0 && p.stock <= p.reorderLevel).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Inventory Management</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-slate-500 text-sm">{allProducts.length} products</span>
              {lowStockCount > 0 && <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><AlertTriangle size={12}/>{lowStockCount} low</span>}
              {outStockCount > 0 && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle size={12}/>{outStockCount} out</span>}
              {reorderAlerts > 0 && <span className="text-xs font-bold text-purple-500 flex items-center gap-1"><Bell size={12}/>{reorderAlerts} reorder</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 w-64 bg-slate-50 border-slate-200 text-sm" placeholder="Search name, SKU, barcode..." />
            </div>
            {/* Category filter */}
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input bg-slate-50 border-slate-200 text-sm pr-8">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {/* Stock filter */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-black">
              {(['all','low','out'] as const).map(f => (
                <button key={f} onClick={() => setStockFilter(f)} className={`px-3 py-2 uppercase transition-colors ${stockFilter===f ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {f === 'all' ? 'All' : f === 'low' ? 'Low' : 'Out'}
                </button>
              ))}
            </div>
            {/* Export */}
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors">
              <Download size={15}/> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-black text-primary">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Qty:</label>
            <input type="number" min={1} value={bulkQty} onChange={e => setBulkQty(parseInt(e.target.value)||1)} className="input w-20 text-center font-black text-sm py-1.5" />
          </div>
          <button onClick={() => handleBulkUpdate('inward')} disabled={bulkLoading} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-black hover:bg-green-600 transition-colors disabled:opacity-50">
            <PlusCircle size={15}/> Inward {bulkQty}
          </button>
          <button onClick={() => handleBulkUpdate('outward')} disabled={bulkLoading} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-black hover:bg-red-600 transition-colors disabled:opacity-50">
            <MinusCircle size={15}/> Outward {bulkQty}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-400 hover:text-slate-600 text-xs font-bold">Clear</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-4 py-4">
                <input type="checkbox" checked={products.length > 0 && selected.size === products.length} onChange={toggleSelectAll} className="rounded" />
              </th>
              <th className="px-4 py-4">Product</th>
              <th className="px-4 py-4">SKU / Barcode</th>
              <th className="px-4 py-4">Reorder Level</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Stock</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="animate-spin inline text-primary mr-2" />Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">No products found.</td></tr>
            ) : products.map(p => {
              const isReorderAlert = p.reorderLevel && p.reorderLevel > 0 && p.stock <= p.reorderLevel;
              return (
                <tr key={p._id} className={`hover:bg-slate-50/50 transition-colors group ${selected.has(p._id) ? 'bg-primary/3' : ''}`}>
                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)} className="rounded" />
                  </td>
                  {/* Product */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{p.category?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </td>
                  {/* SKU / Barcode */}
                  <td className="px-4 py-4 min-w-[180px]">
                    {/* SKU */}
                    {editingSku?.id === p._id ? (
                      <div className="flex items-center gap-1 mb-1">
                        <input autoFocus className="input py-1 px-2 text-xs w-28 font-mono uppercase" value={editingSku.value}
                          onChange={e => setEditingSku({ id: p._id, value: e.target.value.toUpperCase() })}
                          onKeyDown={e => { if (e.key==='Enter') saveSku(p._id, editingSku.value); if (e.key==='Escape') setEditingSku(null); }} />
                        <button onClick={() => saveSku(p._id, editingSku.value)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={13}/></button>
                        <button onClick={() => setEditingSku(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={13}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-xs font-medium text-slate-600">SKU: <span className="font-mono">{p.sku || <span className="text-orange-400">Not set</span>}</span></p>
                        <button onClick={() => setEditingSku({ id: p._id, value: p.sku || '' })} className="p-0.5 text-slate-300 hover:text-primary" title="Edit SKU"><Pencil size={11}/></button>
                      </div>
                    )}
                    {/* Barcode */}
                    {editingBarcode?.id === p._id ? (
                      <div className="flex items-center gap-1">
                        <input autoFocus className="input py-1 px-2 text-xs w-32 font-mono uppercase" value={editingBarcode.value} placeholder="Enter barcode"
                          onChange={e => setEditingBarcode({ id: p._id, value: e.target.value.toUpperCase() })}
                          onKeyDown={e => { if (e.key==='Enter') saveBarcode(p._id, editingBarcode.value); if (e.key==='Escape') setEditingBarcode(null); }} />
                        <button onClick={() => saveBarcode(p._id, editingBarcode.value)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={13}/></button>
                        <button onClick={() => setEditingBarcode(null)} className="p-1 text-slate-400 rounded"><X size={13}/></button>
                      </div>
                    ) : p.barcode ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPreviewBarcode({ value: p.barcode, name: p.name })}
                          className="p-1 bg-white border border-slate-100 rounded hover:border-primary/50 hover:shadow-md transition-all cursor-zoom-in">
                          <Barcode value={p.barcode} width={1.2} height={24} fontSize={9} margin={0} background="#FFFFFF"/>
                        </button>
                        <button onClick={() => setEditingBarcode({ id: p._id, value: p.barcode })} className="p-0.5 text-slate-300 hover:text-primary" title="Edit"><Pencil size={11}/></button>
                      </div>
                    ) : !p.sku ? (
                      <span className="text-[10px] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded text-orange-500">Add SKU first</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">NO BARCODE</span>
                        <button onClick={() => generateBarcode(p)} className="text-primary" title="Auto-generate"><Zap size={14} fill="currentColor"/></button>
                        <button onClick={() => setEditingBarcode({ id: p._id, value: '' })} className="text-slate-400 hover:text-primary" title="Enter manually"><Hash size={13}/></button>
                      </div>
                    )}
                  </td>
                  {/* Reorder Level */}
                  <td className="px-4 py-4">
                    {editingReorder?.id === p._id ? (
                      <div className="flex items-center gap-1">
                        <input autoFocus type="number" className="input py-1 px-2 text-xs w-16 text-center" value={editingReorder.value}
                          onChange={e => setEditingReorder({ id: p._id, value: e.target.value })}
                          onKeyDown={e => { if (e.key==='Enter') saveReorder(p._id, editingReorder.value); if (e.key==='Escape') setEditingReorder(null); }} />
                        <button onClick={() => saveReorder(p._id, editingReorder.value)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={13}/></button>
                        <button onClick={() => setEditingReorder(null)} className="p-1 text-slate-400 rounded"><X size={13}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-bold ${isReorderAlert ? 'text-purple-600' : 'text-slate-400'}`}>
                          {p.reorderLevel || 0}
                        </span>
                        {isReorderAlert && <Bell size={12} className="text-purple-500 animate-pulse"/>}
                        <button onClick={() => setEditingReorder({ id: p._id, value: String(p.reorderLevel || 0) })} className="p-0.5 text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={11}/></button>
                      </div>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-4">
                    {p.stock <= 0 ? (
                      <span className="badge-red flex items-center gap-1 w-fit"><AlertCircle size={10}/> Out of Stock</span>
                    ) : p.stock < 10 ? (
                      <span className="badge-orange flex items-center gap-1 w-fit"><AlertTriangle size={10}/> Low Stock</span>
                    ) : (
                      <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle2 size={10}/> Healthy</span>
                    )}
                  </td>
                  {/* Stock */}
                  <td className="px-4 py-4">
                    <p className={`text-lg font-black ${p.stock<=0?'text-red-600':p.stock<10?'text-orange-500':'text-slate-800'}`}>{p.stock}</p>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => viewHistory(p)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="History"><History size={17}/></button>
                      {p.barcode && (
                        <button onClick={() => setPrintModal({ show: true, product: p })} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Print"><Printer size={17}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* History + Stock Adjust Modal */}
      {showLogs && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <img src={selectedProduct.images?.[0]?.url} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white"/>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Stock Audit Log</h2>
                  <p className="text-slate-500 text-xs">{selectedProduct.name}</p>
                </div>
              </div>
              <button onClick={() => setShowLogs(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={24} className="text-slate-400"/></button>
            </div>

            <div className="p-5 bg-slate-50 flex gap-4">
              <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                <p className="text-3xl font-black text-slate-800">{selectedProduct.stock}</p>
                {selectedProduct.reorderLevel && selectedProduct.reorderLevel > 0 && (
                  <p className={`text-xs mt-1 font-bold ${selectedProduct.stock <= selectedProduct.reorderLevel ? 'text-purple-500' : 'text-slate-400'}`}>Reorder at: {selectedProduct.reorderLevel}</p>
                )}
              </div>
              <div className="flex-1 flex gap-2">
                <button onClick={() => { setAdjustType('inward'); setIsAdjusting(true); }} className="flex-1 bg-[#4ADE80] text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-green-500/20">
                  <PlusCircle size={20}/><span className="text-[10px] font-black uppercase tracking-widest">Inward</span>
                </button>
                <button onClick={() => { setAdjustType('outward'); setIsAdjusting(true); }} className="flex-1 bg-[#F87171] text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-500/20">
                  <MinusCircle size={20}/><span className="text-[10px] font-black uppercase tracking-widest">Outward</span>
                </button>
              </div>
            </div>

            {isAdjusting && (
              <div className="px-6 py-4 bg-white border-b border-slate-100 space-y-3">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-bold text-slate-600">Qty to {adjustType}:</p>
                  <input type="number" value={qtyToAdjust} onChange={e => setQtyToAdjust(parseInt(e.target.value)||0)} className="input w-24 text-center font-black text-xl"/>
                  <button onClick={handleAdjustStock}
                    className={`flex-1 py-3 px-6 rounded-xl text-white font-black text-sm uppercase tracking-widest ${adjustType==='inward'?'bg-[#4ADE80]':'bg-[#F87171]'}`}>
                    Confirm {adjustType}
                  </button>
                  <button onClick={() => setIsAdjusting(false)} className="text-slate-400 font-bold text-xs uppercase underline">Cancel</button>
                </div>
                {/* Note field */}
                <input
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="Add note / reason (optional) — e.g. Purchase order #123, Damaged stock..."
                  className="input w-full text-sm text-slate-600 bg-slate-50"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white shadow-sm z-10 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-3">Type</th>
                    <th className="px-8 py-3">Qty</th>
                    <th className="px-8 py-3">Note</th>
                    <th className="px-8 py-3">Date</th>
                    <th className="px-8 py-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <tr key={log._id} className="text-sm">
                      <td className="px-8 py-4">
                        <span className={`flex items-center gap-1 font-black ${log.type==='inward'?'text-green-600':'text-red-600'}`}>
                          {log.type==='inward'?<ArrowUp size={14}/>:<ArrowDown size={14}/>}{log.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-4 font-black text-slate-800">{log.type==='inward'?'+':'-'}{log.quantity}</td>
                      <td className="px-8 py-4 text-slate-500 text-xs max-w-[160px] truncate">{log.note || <span className="text-slate-300">—</span>}</td>
                      <td className="px-8 py-4">
                        <p className="text-slate-700 font-medium">{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <p className="text-xs text-slate-400">{log.oldStock} →</p>
                        <p className="font-black text-slate-800">{log.newStock}</p>
                      </td>
                    </tr>
                  ))}
                  {logs.length===0 && <tr><td colSpan={5} className="py-16 text-center text-slate-400">No logs found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Preview Modal */}
      {previewBarcode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm" onClick={() => setPreviewBarcode(null)}>
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <p className="font-black text-slate-800 text-lg">{previewBarcode.name}</p>
            <Barcode value={previewBarcode.value} width={2} height={80} fontSize={14} margin={10}/>
            <p className="font-mono text-slate-500 text-sm">{previewBarcode.value}</p>
            <button onClick={() => setPreviewBarcode(null)} className="mt-2 px-6 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200">Close</button>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printModal.show && printModal.product && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-2xl"><Printer size={24}/></div>
                <div><h2 className="text-xl font-black text-slate-800">Print Settings</h2><p className="text-slate-500 text-xs">Configure sticker labels</p></div>
              </div>
              <button onClick={() => setPrintModal({ show: false, product: null })} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img src={printModal.product.images?.[0]?.url} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white"/>
                <div>
                  <p className="font-bold text-slate-800 text-sm line-clamp-1">{printModal.product.name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{printModal.product.barcode}</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Number of Labels</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setPrintQty(Math.max(1,printQty-1))} className="w-12 h-12 flex items-center justify-center border-2 border-slate-100 rounded-2xl text-slate-400 hover:border-primary hover:text-primary transition-all"><MinusCircle size={20}/></button>
                  <input type="number" value={printQty} onChange={e => setPrintQty(parseInt(e.target.value)||1)} className="flex-1 input h-14 text-center text-2xl font-black"/>
                  <button onClick={() => setPrintQty(printQty+1)} className="w-12 h-12 flex items-center justify-center border-2 border-slate-100 rounded-2xl text-slate-400 hover:border-primary hover:text-primary transition-all"><PlusCircle size={20}/></button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Label Roll Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {([1,2] as const).map(c => (
                    <button key={c} onClick={() => setPrintCols(c)} className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${printCols===c?'border-primary bg-primary/5':'border-slate-100'}`}>
                      <span className={`text-xs font-black uppercase tracking-widest ${printCols===c?'text-primary':'text-slate-400'}`}>{c===1?'Single':'Double'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <button onClick={() => { printLabel(printModal.product!, printQty, printCols); setPrintModal({ show: false, product: null }); }}
                className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center justify-center gap-3">
                <Printer size={20}/> Generate {printQty} Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
