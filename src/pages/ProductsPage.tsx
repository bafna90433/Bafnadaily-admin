import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Package, X, Check, Loader2, Eye, EyeOff, Copy, CheckCheck, ExternalLink } from 'lucide-react'
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
  }, [fetchProducts])

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
          <p className="text-xs text-gray-400 ml-auto">💡 Click <strong>stock</strong> or <strong>category</strong> to edit inline</p>
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
    </div>
  )
}

export default ProductsPage
