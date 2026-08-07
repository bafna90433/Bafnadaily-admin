import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Package, X, Check, Loader2, Eye, EyeOff, Copy, CheckCheck, ExternalLink, BookOpen, Download, FileText, Upload } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const FEED_URL = 'https://bafnadaily-api.onrender.com/api/feed/facebook'

// ── Inline Stock Cell ─────────────────────────────────────────────────────────
const StockCell: React.FC<{ product: any; onSave: (id: string, stock: number) => Promise<void> }> = ({ product, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(product.stock))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const start = () => { setVal(String(product.stock)); setEditing(true); setTimeout(() => inputRef.current?.select(), 30) }

  const save = async () => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 0) { setEditing(false); return }
    if (num === product.stock) { setEditing(false); return }
    setSaving(true)
    await onSave(product._id, num)
    setSaving(false)
    setEditing(false)
  }

  const cancel = () => { setVal(String(product.stock)); setEditing(false) }
  const color = product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-orange-500' : 'text-green-600'

  if (saving) return <div className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin text-gray-400"/><span className="text-sm font-bold text-gray-400">{val}</span></div>

  if (editing) return (
    <div className="flex items-center gap-1">
      <input ref={inputRef} type="number" min="0" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
        onBlur={save}
        className="w-16 border-2 border-primary rounded-lg px-2 py-0.5 text-sm font-bold text-center focus:outline-none"
        autoFocus
      />
      <button onMouseDown={e => { e.preventDefault(); save() }} className="p-0.5 text-green-600 hover:bg-green-50 rounded">
        <Check size={13}/>
      </button>
    </div>
  )

  return (
    <button onClick={start} title="Click to edit stock"
      className={`font-bold text-sm px-2.5 py-1 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer group ${color}`}>
      {product.stock}
      <span className="ml-1 text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
    </button>
  )
}

// ── Inline GST Cell ───────────────────────────────────────────────────────────
const GSTCell: React.FC<{ product: any; onSave: (id: string, gstRate: number) => Promise<void> }> = ({ product, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async (rate: number) => {
    setSaving(true)
    await onSave(product._id, rate)
    setSaving(false)
    setEditing(false)
  }

  if (saving) return <div className="flex items-center gap-1"><Loader2 size={12} className="animate-spin text-gray-400"/><span className="text-xs text-gray-400">{product.gstRate||0}%</span></div>

  if (editing) return (
    <div className="flex items-center gap-1">
      <select autoFocus defaultValue={String(product.gstRate||0)} onChange={e => save(Number(e.target.value))} onBlur={() => setEditing(false)}
        className="text-xs border-2 border-primary rounded-lg px-1.5 py-0.5 focus:outline-none bg-white font-bold">
        <option value="0">0%</option>
        <option value="5">5%</option>
        <option value="12">12%</option>
        <option value="18">18%</option>
        <option value="28">28%</option>
      </select>
    </div>
  )

  const rate = product.gstRate || 0
  return (
    <button onClick={() => setEditing(true)} title="Click to set GST rate"
      className={`text-xs font-bold px-2 py-1 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer group ${rate > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
      {rate > 0 ? `${rate}% GST` : '—'}
      <span className="ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
    </button>
  )
}

// ── Inline Category Cell ──────────────────────────────────────────────────────
const CategoryCell: React.FC<{ product: any; categories: any[]; onSave: (id: string, catId: string) => Promise<void> }> = ({ product, categories, onSave }) => {
  const [saving, setSaving] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value
    if (catId === (product.category?._id || product.category)) return
    setSaving(true)
    await onSave(product._id, catId)
    setSaving(false)
  }

  const currentCatId = product.category?._id || product.category || ''

  return (
    <div className="relative">
      {saving && <Loader2 size={12} className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-primary z-10"/>}
      <select value={currentCatId} onChange={handleChange} disabled={saving}
        className="text-xs text-gray-600 bg-transparent border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-lg px-2 py-1.5 cursor-pointer transition-all focus:outline-none focus:border-primary focus:bg-white disabled:opacity-60 max-w-[160px] appearance-none pr-5"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239ca3af'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}>
        <option value="">— No Category —</option>
        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  // ── Multi-select state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeletePwd, setBulkDeletePwd] = useState('')
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [showBulkPwd, setShowBulkPwd] = useState(false)

  // ── Site Settings & Catalog Modal State ──
  const [siteSettings, setSiteSettings] = useState<any>(null)
  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [stockFilter, setStockFilter] = useState('all')
  const [priceOption, setPriceOption] = useState('both')
  const [layoutGrid, setLayoutGrid] = useState('3')
  const [catalogLoading, setCatalogLoading] = useState(false)

  // ── Excel Import / Export Modal State ──
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const handleExportFullExcel = async () => {
    try {
      const res = await api.get('/products?limit=5000&admin=true')
      const list = res.data.products || []
      if (!list.length) { toast.error('Koi products nahi mile'); return }

      const rows = [
        ['Product ID', 'SKU', 'Barcode', 'Product Name', 'Category', 'Stock', 'Selling Price (₹)', 'MRP (₹)', 'GST Rate (%)', 'Status']
      ]

      list.forEach((pr: any) => {
        rows.push([
          pr._id,
          pr.sku || '',
          pr.barcode || '',
          pr.name || '',
          pr.category?.name || 'Uncategorized',
          pr.stock || 0,
          pr.price || 0,
          pr.mrp || pr.price || 0,
          pr.gstRate || 0,
          pr.isActive ? 'Active' : 'Inactive'
        ])
      })

      const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `Bulk_Products_Update_Sheet_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      toast.success('Products Excel file downloaded!')
    } catch {
      toast.error('Excel export failed')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '')
      if (lines.length < 2) { toast.error('CSV file me data nahi mila'); return }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())

      const items: any[] = []
      for (let i = 1; i < lines.length; i++) {
        const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',')
        const row = matches.map(cell => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))

        const item: any = {}
        headers.forEach((h, idx) => {
          const val = row[idx] !== undefined ? row[idx] : ''
          if (h.includes('id') || h === '_id') item._id = val
          else if (h === 'sku') item.sku = val
          else if (h.includes('barcode') || h === 'bc') item.barcode = val
          else if (h.includes('name') || h.includes('title')) item.name = val
          else if (h.includes('stock')) item.stock = val
          else if (h.includes('selling') || h.includes('wholesale') || h.includes('price') || h.includes('rate')) {
            if (!h.includes('mrp')) item.price = val
          }
          else if (h.includes('mrp')) item.mrp = val
          else if (h.includes('gst')) item.gstRate = val
          else if (h.includes('status') || h.includes('active')) item.isActive = val
        })

        if (item._id || item.sku || item.barcode || item.name) {
          items.push(item)
        }
      }

      setParsedData(items)
      toast.success(`${items.length} products read from CSV file!`)
    }
    reader.readAsText(file)
  }

  const handleStartBulkImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      toast.error('Import karne ke liye koi product data nahi hai.')
      return
    }

    setImporting(true)
    setImportResult(null)
    try {
      const res = await api.post('/products/bulk-update', { products: parsedData })
      toast.success(res.data.message || 'Bulk update complete!')
      setImportResult(res.data)
      fetchProducts()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Bulk update error')
    } finally {
      setImporting(false)
    }
  }

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20', admin: 'true' })
      if (debouncedSearch) p.set('search', debouncedSearch)
      const res = await api.get(`/products?${p}`)
      setProducts(res.data.products); setTotal(res.data.total)
    } catch {} finally { setLoading(false) }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchProducts()
    api.get('/categories/all?admin=true').then(r => setCategories(r.data.categories)).catch(() => {})
    api.get('/settings').then(r => setSiteSettings(r.data.settings)).catch(() => {})
  }, [fetchProducts])

  const fetchFilteredProductsForCatalog = async () => {
    setCatalogLoading(true)
    try {
      const p = new URLSearchParams({ limit: '5000', admin: 'true' })
      if (catFilter !== 'all') p.set('category', catFilter)
      const res = await api.get(`/products?${p}`)
      let list = res.data.products || []

      if (statusFilter === 'active') {
        list = list.filter((pr: any) => pr.isActive)
      }
      if (stockFilter === 'instock') {
        list = list.filter((pr: any) => (pr.stock || 0) > 0)
      }

      return list
    } catch {
      toast.error('Products load nahi ho paaye')
      return []
    } finally {
      setCatalogLoading(false)
    }
  }

  const generatePdfCatalog = async () => {
    const list = await fetchFilteredProductsForCatalog()
    if (!list || list.length === 0) {
      toast.error('Is filter ke saath koi products nahi mile.')
      return
    }

    const win = window.open('', '_blank')
    if (!win) return

    const siteName = siteSettings?.siteName || 'Bafnadaily Store'
    const logo = siteSettings?.siteLogo || ''
    const phone = siteSettings?.contactPhone || ''
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    const catObj = categories.find(c => c._id === catFilter)
    const categoryTitle = catFilter === 'all' ? 'All Categories Full Store Catalog' : `Category: ${catObj?.name || 'Selected Category'}`

    // Group products by category
    const grouped: Record<string, any[]> = {}
    list.forEach((pr: any) => {
      const cName = pr.category?.name || 'Uncategorized'
      if (!grouped[cName]) grouped[cName] = []
      grouped[cName].push(pr)
    })

    const groupKeys = Object.keys(grouped).sort()
    const cols = Number(layoutGrid) || 3

    const cardsHtml = groupKeys.map(cName => {
      const prods = grouped[cName]
      const prodsHtml = prods.map((pr: any) => {
        const imgUrl = pr.images?.[0]?.url || `https://placehold.co/240x240/FCE4EC/E91E63?text=${encodeURIComponent(pr.name.substring(0, 8))}`
        const inStock = (pr.stock || 0) > 0

        return `
          <div class="card">
            <div class="stock-tag ${inStock ? 'in' : 'out'}">${inStock ? `In Stock: ${pr.stock} Pcs` : 'Out of Stock'}</div>
            <div class="img-box">
              <img src="${imgUrl}" alt="${pr.name}" onerror="this.onerror=null;this.src='https://placehold.co/240x240/FCE4EC/E91E63?text=P';"/>
            </div>
            <div class="info">
              <div class="cat-badge">${cName}</div>
              <div class="title">${pr.name}</div>
              <div class="sku-row">
                ${pr.sku ? `<span class="sku">SKU: ${pr.sku}</span>` : ''}
                ${pr.barcode ? `<span class="barcode">BC: ${pr.barcode}</span>` : ''}
              </div>
              ${priceOption !== 'none' ? `
                <div class="price-box">
                  <div>
                    <span class="price-lbl">Selling Price</span>
                    <div class="price-val" style="color:#e91e63;font-size:14px;font-weight:800">₹${Number(pr.price || 0).toLocaleString('en-IN')}</div>
                  </div>
                  ${priceOption === 'both' && pr.mrp && pr.mrp > pr.price ? `
                  <div style="text-align:right">
                    <span class="price-lbl">MRP</span>
                    <div class="price-val" style="text-decoration:line-through;color:#94a3b8;font-size:12px">₹${Number(pr.mrp).toLocaleString('en-IN')}</div>
                  </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `
      }).join('')

      return `
        <div class="cat-section">
          <div class="cat-header">
            📁 Category: <span>${cName}</span> (${prods.length} Products)
          </div>
          <div class="grid cols-${cols}">
            ${prodsHtml}
          </div>
        </div>
      `
    }).join('')

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>${siteName} - ${categoryTitle}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#1e293b;padding:24px;font-size:13px}
      .wrap{max-width:1120px;margin:0 auto}
      .head{display:flex;justify-content:space-between;align-items:center;padding:20px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);margin-bottom:20px;border-bottom:3px solid #e91e63}
      .brand{display:flex;align-items:center;gap:14px}
      .brand img{height:48px;object-fit:contain}
      .logo-box{width:46px;height:46px;background:#e91e63;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px}
      .brand-name{font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#0f172a}
      .brand-sub{font-size:11px;color:#64748b;margin-top:2px}
      .inv-right{text-align:right}
      .inv-right h1{font-size:20px;font-weight:900;color:#e91e63;letter-spacing:0.5px}
      .inv-right p{font-size:11px;color:#64748b;margin-top:2px}
      
      .cat-section{margin-bottom:28px}
      .cat-header{font-size:15px;font-weight:800;color:#0f172a;background:#fff;padding:10px 16px;border-radius:8px;border-left:4px solid #e91e63;margin-bottom:14px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
      .cat-header span{color:#e91e63}

      .grid{display:grid;gap:16px}
      .grid.cols-3{grid-template-columns:repeat(3, 1fr)}
      .grid.cols-4{grid-template-columns:repeat(4, 1fr)}

      .card{background:#fff;border-radius:10px;border:1px solid #e2e8f0;padding:12px;display:flex;flex-direction:column;position:relative;box-shadow:0 1px 3px rgba(0,0,0,0.02);break-inside:avoid;page-break-inside:avoid}
      .img-box{width:100%;height:160px;background:#f8fafc;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:10px;border:1px solid #f1f5f9}
      .img-box img{max-width:100%;max-height:100%;object-fit:contain}
      .info{flex:1;display:flex;flex-direction:column}
      .cat-badge{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:3px}
      .title{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:32px}
      .sku-row{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}
      .sku{font-size:9px;font-weight:700;color:#6366f1;background:#e0e7ff;padding:2px 6px;border-radius:4px;font-family:monospace}
      .barcode{font-size:9px;font-weight:700;color:#059669;background:#d1fae5;padding:2px 6px;border-radius:4px;font-family:monospace}
      
      .price-box{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:6px;border-top:1px dashed #e2e8f0}
      .price-lbl{font-size:9px;color:#94a3b8;display:block;text-transform:uppercase;font-weight:600}
      .price-val{font-size:12px;font-weight:600;color:#0f172a}
      
      .stock-tag{position:absolute;top:8px;right:8px;font-size:9px;font-weight:800;padding:3px 8px;border-radius:12px;z-index:10}
      .stock-tag.in{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0}
      .stock-tag.out{background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5}
      
      .foot{text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
      .no-print{text-align:center;margin-bottom:20px;display:flex;justify-content:center;gap:10px}
      .pbtn{padding:10px 24px;background:#e91e63;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 3px 6px rgba(233,30,99,0.2)}
      .ebtn{padding:10px 20px;background:#64748b;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer}
      
      @media print{
        body{background:#fff;padding:0}
        .head{box-shadow:none;border:none;padding:10px 0;border-bottom:3px solid #e91e63;border-radius:0}
        .card{box-shadow:none;border:1px solid #cbd5e1}
        .no-print{display:none}
      }
    </style>
    </head><body><div class="wrap">
    <div class="no-print">
      <button class="pbtn" onclick="window.print()">🖨️ Print / Save as PDF Catalog</button>
      <button class="ebtn" onclick="window.close()">✕ Close Window</button>
    </div>
    <div class="head">
      <div class="brand">
        ${logo ? `<img src="${logo}" alt="Logo"/>` : `<div class="logo-box">B</div>`}
        <div>
          <div class="brand-name">${siteName}</div>
          <div class="brand-sub">Official Product Catalog · ${phone ? `Contact: ${phone}` : ''}</div>
        </div>
      </div>
      <div class="inv-right">
        <h1>PRODUCT CATALOG</h1>
        <p>${categoryTitle}</p>
        <p>Total Products: <strong>${list.length}</strong> | Date: <strong>${dateStr}</strong></p>
      </div>
    </div>
    ${cardsHtml}
    <div class="foot">
      <p style="font-size:12px;font-weight:600;color:#475569;margin-bottom:3px">Thank you for browsing! — ${siteName}</p>
      <p>For orders & inquiries, please contact our wholesale sales desk.</p>
    </div>
    </div></body></html>`)

    win.document.close()
    setCatalogModalOpen(false)
  }

  const generateExcelCatalog = async () => {
    const list = await fetchFilteredProductsForCatalog()
    if (!list || list.length === 0) {
      toast.error('Is filter ke saath koi products nahi mile.')
      return
    }

    const rows = [
      ['#', 'SKU', 'Barcode', 'Product Name', 'Category', 'Selling Price (INR)', 'MRP (INR)', 'Stock', 'GST Rate (%)', 'Status', 'Image URL']
    ]

    list.forEach((pr: any, i: number) => {
      rows.push([
        i + 1,
        pr.sku || '',
        pr.barcode || '',
        pr.name || '',
        pr.category?.name || 'Uncategorized',
        pr.price || 0,
        pr.mrp || pr.price || 0,
        pr.stock || 0,
        pr.gstRate || 0,
        pr.isActive ? 'Active' : 'Inactive',
        pr.images?.[0]?.url || ''
      ])
    })

    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const catObj = categories.find(c => c._id === catFilter)
    const catName = catFilter === 'all' ? 'All_Categories' : (catObj?.name || 'Category').replace(/\s+/g, '_')
    a.download = `Catalog_${catName}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('Excel catalog downloaded!')
    setCatalogModalOpen(false)
  }

  // ── Inline saves ────────────────────────────────────────────────────────────
  const saveStock = async (id: string, stock: number) => {
    try {
      await api.put(`/products/${id}`, { stock })
      setProducts(prev => prev.map(p => p._id === id ? { ...p, stock } : p))
      toast.success(`Stock updated to ${stock}`)
    } catch { toast.error('Stock update failed') }
  }

  const saveCategory = async (id: string, catId: string) => {
    try {
      await api.put(`/products/${id}`, { category: catId })
      const cat = categories.find(c => c._id === catId)
      setProducts(prev => prev.map(p => p._id === id ? { ...p, category: cat || { _id: catId, name: '—' } } : p))
      toast.success(`Category changed to ${cat?.name || '—'}`)
    } catch { toast.error('Category update failed') }
  }

  const saveGst = async (id: string, gstRate: number) => {
    try {
      await api.put(`/products/${id}`, { gstRate })
      setProducts(prev => prev.map(p => p._id === id ? { ...p, gstRate } : p))
      toast.success(`GST set to ${gstRate}%`)
    } catch { toast.error('GST update failed') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); fetchProducts() }
    catch { toast.error('Failed') }
  }

  const toggle = async (id: string, current: boolean) => {
    try {
      await api.put(`/products/${id}`, { isActive: !current })
      setProducts(prev => prev.map(p => p._id === id ? { ...p, isActive: !current } : p))
    } catch { toast.error('Failed') }
  }

  // ── Multi-select helpers ────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(products.map((p: any) => p._id)))
  }

  const openBulkDelete = () => { setBulkDeletePwd(''); setShowBulkPwd(false); setBulkDeleteOpen(true) }

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true)
    try {
      const ids = Array.from(selectedIds)
      const res = await api.delete('/products/bulk', { data: { password: bulkDeletePwd, ids } })
      toast.success(res.data.message || `${ids.length} products deleted!`)
      setBulkDeleteOpen(false)
      setBulkDeletePwd('')
      setSelectedIds(new Set())
      fetchProducts()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Bulk delete failed')
    } finally { setBulkDeleteLoading(false) }
  }

  const [feedCopied, setFeedCopied] = useState(false)

  const copyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(FEED_URL)
      setFeedCopied(true)
      toast.success('Feed URL copied! Paste it in Facebook Commerce Manager → Catalogue → Add Products → Use a URL')
      setTimeout(() => setFeedCopied(false), 3000)
    } catch {
      toast.error('Could not copy. URL: ' + FEED_URL)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-gray-500 text-sm">{total} total</p></div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button onClick={openBulkDelete}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <Trash2 size={15}/> Delete {selectedIds.size} Selected
            </button>
          )}
          {/* ── Facebook Feed URL Button ── */}
          <button
            id="copy-facebook-feed-url"
            onClick={copyFeedUrl}
            title={`Facebook Data Feed URL:\n${FEED_URL}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
              feedCopied
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}>
            {feedCopied ? <><CheckCheck size={15}/> Copied!</> : <><Copy size={15}/> Copy Feed URL</>}
          </button>
          <a
            href={FEED_URL}
            target="_blank"
            rel="noreferrer"
            title="Preview live CSV feed"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all">
            <ExternalLink size={14}/> Preview Feed
          </a>
          <button
            onClick={() => setCatalogModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md shadow-pink-500/20 transition-all duration-200"
          >
            <BookOpen size={16}/> Download Catalog
          </button>
          <button
            onClick={() => { setExcelModalOpen(true); setParsedData([]); setImportFile(null); setImportResult(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 transition-all duration-200"
          >
            <Download size={16}/> Excel Bulk Edit (Import / Export)
          </button>
          <Link to="/products/add" className="btn-primary"><Plus size={17}/> Add Product</Link>
        </div>
      </div>

      {/* ── Facebook Feed Info Banner ── */}
      <div className="mb-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
        <span className="text-blue-600 text-lg mt-0.5">📘</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-blue-800 mb-0.5">Facebook Commerce Manager — Data Feed URL</p>
          <p className="text-blue-600 text-xs font-mono truncate">{FEED_URL}</p>
          <p className="text-blue-500 text-xs mt-1">Paste this URL in Facebook → Commerce Manager → Catalogue → Add Products → Use a URL or Google Sheets</p>
        </div>
        <button onClick={copyFeedUrl} className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
          {feedCopied ? <><CheckCheck size={12}/> Copied!</> : <><Copy size={12}/> Copy</>}
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9 pr-8 py-2"
              placeholder="Search products…"
              autoComplete="off"
              name="product-search-nofill"
              type="search"
            />
            {search && (
              <button onClick={() => { setSearch(''); searchRef.current?.focus() }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
                <X size={14}/>
              </button>
            )}
          </div>
          {debouncedSearch && <p className="text-xs text-gray-400">Results for "<span className="font-semibold text-gray-600">{debouncedSearch}</span>"</p>}
          <p className="text-xs text-gray-400 ml-auto">💡 Click <strong>stock</strong>, <strong>category</strong> or <strong>GST</strong> to edit inline</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {/* Select all checkbox */}
                <th className="th w-10">
                  <input type="checkbox"
                    checked={products.length > 0 && selectedIds.size === products.length}
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < products.length }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </th>
                <th className="th">Product</th>
                <th className="th">Category <span className="text-primary text-xs font-normal">(click)</span></th>
                <th className="th">Price</th>
                <th className="th">Stock <span className="text-primary text-xs font-normal">(click)</span></th>
                <th className="th">GST <span className="text-primary text-xs font-normal">(click)</span></th>
                <th className="th">Badges</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_,i) => (
                <tr key={i}><td colSpan={8} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>
              )) : products.map((p: any) => (
                <tr key={p._id} className={`hover:bg-gray-50/80 transition-colors ${selectedIds.has(p._id) ? 'bg-red-50' : ''}`}>
                  {/* Checkbox */}
                  <td className="td">
                    <input type="checkbox"
                      checked={selectedIds.has(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      className="w-4 h-4 accent-red-500 cursor-pointer"
                    />
                  </td>

                  {/* Product name + image */}
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url || `https://placehold.co/40x40/FCE4EC/E91E63?text=P`} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt=""/>
                      <div>
                        <p className="font-semibold text-sm line-clamp-1 max-w-[180px]">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.sku || '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category inline */}
                  <td className="td"><CategoryCell product={p} categories={categories} onSave={saveCategory}/></td>

                  {/* Price */}
                  <td className="td">
                    <span className="font-bold">₹{p.price}</span>
                    {p.mrp > p.price && <span className="text-xs text-gray-400 ml-1.5 line-through">₹{p.mrp}</span>}
                  </td>

                  {/* Stock inline */}
                  <td className="td"><StockCell product={p} onSave={saveStock}/></td>

                  {/* GST inline */}
                  <td className="td"><GSTCell product={p} onSave={saveGst}/></td>

                  {/* Badges */}
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {p.isTrending && <span className="badge bg-orange-100 text-orange-600">🔥</span>}
                      {p.isFeatured && <span className="badge bg-yellow-100 text-yellow-600">⭐</span>}
                      {p.isNewArrival && <span className="badge bg-green-100 text-green-600">✨</span>}
                      {p.isBestSeller && <span className="badge bg-purple-100 text-purple-600">🏆</span>}
                    </div>
                  </td>

                  {/* Status toggle */}
                  <td className="td">
                    <button onClick={() => toggle(p._id, p.isActive)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${p.isActive ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="td">
                    <div className="flex gap-1">
                      <Link to={`/products/edit/${p._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Full edit">
                        <Pencil size={15}/>
                      </Link>
                      <button onClick={() => del(p._id, p.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && products.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-30"/>
              <p className="font-medium">No products yet</p>
              <Link to="/products/add" className="btn-primary mt-4">Add First Product</Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (() => {
          const totalPages = Math.ceil(total / 20)
          const win = 5
          let start = Math.max(1, page - Math.floor(win / 2))
          let end = Math.min(totalPages, start + win - 1)
          if (end - start < win - 1) start = Math.max(1, end - win + 1)
          return (
            <div className="p-4 border-t flex justify-center items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">← Prev</button>
              {start > 1 && <><button onClick={() => setPage(1)} className="w-9 h-9 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">1</button>{start > 2 && <span className="text-gray-400 px-1">…</span>}</>}
              {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>{p}</button>
              ))}
              {end < totalPages && <>{end < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}<button onClick={() => setPage(totalPages)} className="w-9 h-9 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">{totalPages}</button></>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next →</button>
              <span className="text-xs text-gray-400 ml-2">Page {page} of {totalPages} ({total} total)</span>
            </div>
          )
        })()}
      </div>

      {/* ── Bulk Delete Modal ── */}
      {bulkDeleteOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setBulkDeleteOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600"/>
                </div>
                <div>
                  <h2 className="font-bold text-base text-red-700">Bulk Delete Products</h2>
                  <p className="text-xs text-gray-400">{selectedIds.size} product(s) selected</p>
                </div>
              </div>
              <button onClick={() => setBulkDeleteOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X size={18}/>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-bold mb-1">⚠️ This action is irreversible!</p>
                <p><strong>{selectedIds.size} product(s)</strong> will be deactivated and hidden from store permanently.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Enter Admin Delete Password</label>
                <div className="relative">
                  <input
                    type={showBulkPwd ? 'text' : 'password'}
                    value={bulkDeletePwd}
                    onChange={e => setBulkDeletePwd(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && bulkDeletePwd && handleBulkDelete()}
                    className="input pr-10 border-red-200 focus:border-red-400"
                    placeholder="Enter admin delete password…"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowBulkPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showBulkPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Set this password in Admin → Settings → Advanced</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setBulkDeleteOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleBulkDelete} disabled={!bulkDeletePwd || bulkDeleteLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  {bulkDeleteLoading ? 'Deleting…' : <><Trash2 size={15}/> Delete {selectedIds.size} Products</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Download Product Catalog Modal ── */}
      {catalogModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setCatalogModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50 via-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">📖</div>
                <div>
                  <h2 className="font-bold text-base text-gray-900">Generate Product Catalog</h2>
                  <p className="text-xs text-gray-500">Download or Print professional product catalog</p>
                </div>
              </div>
              <button onClick={() => setCatalogModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">📁 Select Category</label>
                <select
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  className="input w-full py-2 text-xs font-semibold"
                >
                  <option value="all">🌟 All Categories (Full Store Catalog)</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>📁 {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status & Stock Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Product Status</label>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-full py-2 text-xs">
                    <option value="active">Active Only (Default)</option>
                    <option value="all">All Products (Active + Hidden)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Filter</label>
                  <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="input w-full py-2 text-xs">
                    <option value="all">All Stock (Include Out of Stock)</option>
                    <option value="instock">In-Stock Only</option>
                  </select>
                </div>
              </div>

              {/* Price Options & Grid Layout */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price Options</label>
                  <select value={priceOption} onChange={e => setPriceOption(e.target.value)} className="input w-full py-2 text-xs">
                    <option value="both">Show Wholesale Rate & MRP</option>
                    <option value="rate_only">Show Wholesale Rate Only</option>
                    <option value="none">Hide Prices (Image Catalog Only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Print Layout</label>
                  <select value={layoutGrid} onChange={e => setLayoutGrid(e.target.value)} className="input w-full py-2 text-xs">
                    <option value="3">3 Cards / Row (Standard PDF)</option>
                    <option value="4">4 Cards / Row (Compact PDF)</option>
                  </select>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-3.5 text-xs text-pink-800 space-y-1">
                <p className="font-bold flex items-center gap-1">✨ Professional Printable Catalog</p>
                <p className="text-[11px] text-pink-700">Generates clean PDF printable cards with product images, SKU barcodes, wholesale rates & category headers.</p>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end">
              <button
                onClick={generateExcelCatalog}
                disabled={catalogLoading}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Download size={14}/> Export Excel (.csv)
              </button>
              <button
                onClick={generatePdfCatalog}
                disabled={catalogLoading}
                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <FileText size={14}/> {catalogLoading ? 'Generating...' : '🖨️ Generate & Print PDF Catalog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Excel Bulk Export & Import Modal ── */}
      {excelModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setExcelModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 via-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">📊</div>
                <div>
                  <h2 className="font-bold text-base text-gray-900">Excel Bulk Stock & Price Update</h2>
                  <p className="text-xs text-gray-500">Export products to Excel, edit Stock/Price/MRP, and re-import</p>
                </div>
              </div>
              <button onClick={() => setExcelModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* Step 1: Export */}
              <div className="bg-green-50/70 border border-green-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-green-900 text-xs uppercase tracking-wide">Step 1: Download Current Products Excel</h3>
                  <button
                    onClick={handleExportFullExcel}
                    className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={13}/> Export CSV File
                  </button>
                </div>
                <p className="text-xs text-green-700">
                  Is file me saare products ka **Product ID, Stock, Wholesale Rate, MRP, GST Rate aur Status** hoga. Is file ko MS Excel ya Google Sheets me open karke stock/price change karein.
                </p>
              </div>

              {/* Step 2: Import File Upload */}
              <div className="border-2 border-dashed border-gray-300 hover:border-green-500 rounded-xl p-5 text-center transition-colors bg-gray-50/50">
                <input
                  type="file"
                  accept=".csv"
                  id="excel-file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="excel-file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                  <Upload size={32} className="text-green-600 mb-2 animate-bounce"/>
                  <span className="font-bold text-gray-800 text-sm">Click to Upload Edited CSV File</span>
                  <span className="text-xs text-gray-400 mt-0.5">{importFile ? `Selected: ${importFile.name}` : 'Supports .csv exported from Step 1'}</span>
                </label>
              </div>

              {/* Parsed Preview Summary */}
              {parsedData.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">Ready to Update: {parsedData.length} Products</span>
                    <span className="text-[11px] text-blue-600 font-semibold">Columns Matched ✓</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    CSV File parsed successfully. Clicking **"Start Bulk Update"** will update stock, prices, MRP, and GST rates for all matched products in store.
                  </p>
                </div>
              )}

              {/* Import Result Feedback */}
              {importResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1 text-xs text-emerald-800">
                  <p className="font-bold text-emerald-900 text-sm">🎉 {importResult.message}</p>
                  <p>Updated: <strong>{importResult.updatedCount}</strong> product(s)</p>
                  {importResult.errorsCount > 0 && (
                    <p className="text-amber-700 mt-1">Skipped / Unmatched: {importResult.errorsCount} products</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end">
              <button
                onClick={() => setExcelModalOpen(false)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleStartBulkImport}
                disabled={!parsedData.length || importing}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {importing ? 'Updating Database…' : `🚀 Start Bulk Update (${parsedData.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
