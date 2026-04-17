import React, { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, Search, Tag, Clock, X, Check, Pencil } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface Product {
  _id: string
  name: string
  price: number
  mrp: number
  images: { url: string }[]
  slug: string
}

interface Deal {
  _id: string
  product: Product
  discountType: 'percentage' | 'flat'
  discountValue: number
  dealPrice: number
  endTime: string
  isActive: boolean
}

const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
const isExpired = (d: string) => new Date(d) < new Date()
const toLocal = (iso: string) => new Date(iso).toISOString().slice(0, 16)
const toISO = (local: string) => new Date(local).toISOString()

const DealsOfDayPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)

  // Product search
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Form fields
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage')
  const [discountValue, setDiscountValue] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const fetchDeals = async () => {
    setLoading(true)
    try {
      const res = await api.get('/deals-of-day/all')
      setDeals(res.data.deals || [])
    } catch { toast.error('Failed to load deals') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchDeals()
    // Auto-refresh every 60 seconds so expired status updates correctly
    const interval = setInterval(() => fetchDeals(), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(search)}&limit=8`)
        setSearchResults(res.data.products || [])
      } catch {} finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  // Auto-calc deal price preview
  const calcDealPrice = (product: Product | null, type: string, val: string): number | null => {
    if (!product || !val) return null
    const v = parseFloat(val)
    if (isNaN(v) || v < 0) return null
    const dp = type === 'percentage' ? Math.round(product.price * (1 - v / 100)) : Math.round(product.price - v)
    return Math.max(0, dp)
  }

  const previewPrice = calcDealPrice(selectedProduct, discountType, discountValue)

  const openAdd = () => {
    setEditDeal(null)
    setSelectedProduct(null)
    setSearch('')
    setSearchResults([])
    setDiscountType('percentage')
    setDiscountValue('')
    setEndTime('')
    setShowForm(true)
  }

  const openEdit = (deal: Deal) => {
    setEditDeal(deal)
    setSelectedProduct(deal.product)
    setDiscountType(deal.discountType)
    setDiscountValue(String(deal.discountValue))
    setEndTime(toLocal(deal.endTime))
    setSearch('')
    setSearchResults([])
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!selectedProduct) return toast.error('Select a product')
    if (!discountValue || parseFloat(discountValue) <= 0) return toast.error('Enter valid discount')
    if (!endTime) return toast.error('Set end date & time')
    if (previewPrice === null || previewPrice < 0) return toast.error('Invalid deal price')

    setSaving(true)
    try {
      if (editDeal) {
        await api.put(`/deals-of-day/${editDeal._id}`, {
          discountType, discountValue: parseFloat(discountValue), endTime: toISO(endTime)
        })
        toast.success('Deal updated!')
      } else {
        await api.post('/deals-of-day', {
          productId: selectedProduct._id,
          discountType, discountValue: parseFloat(discountValue), endTime: toISO(endTime)
        })
        toast.success('Deal created!')
      }
      setShowForm(false)
      fetchDeals()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this deal?')) return
    try {
      await api.delete(`/deals-of-day/${id}`)
      setDeals(prev => prev.filter(d => d._id !== id))
      toast.success('Deal deleted')
    } catch { toast.error('Delete failed') }
  }

  const toggleActive = async (deal: Deal) => {
    try {
      await api.put(`/deals-of-day/${deal._id}`, { isActive: !deal.isActive })
      setDeals(prev => prev.map(d => d._id === deal._id ? { ...d, isActive: !d.isActive } : d))
    } catch { toast.error('Update failed') }
  }

  // Tick every second so isExpired() stays accurate in the UI
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const activeDeals = deals.filter(d => d.isActive && !isExpired(d.endTime))
  const expiredDeals = deals.filter(d => !d.isActive || isExpired(d.endTime))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-xl text-orange-500"><Tag size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deals Of The Day</h1>
            <p className="text-sm text-gray-400 mt-0.5">{activeDeals.length} active deals running</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDeals} disabled={loading} className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-sm active:scale-95">
            <Plus size={18} /> Add Deal
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-orange-200 p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-gray-900">{editDeal ? 'Edit Deal' : 'New Deal'}</h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={18} /></button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Product selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Select Product</label>
                {selectedProduct ? (
                  <div className="flex items-center gap-3 p-3 border-2 border-orange-300 rounded-xl bg-orange-50">
                    <img src={selectedProduct.images?.[0]?.url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{selectedProduct.name}</p>
                      <p className="text-xs text-gray-500">MRP: <span className="line-through">₹{selectedProduct.mrp}</span> &nbsp; Price: <strong>₹{selectedProduct.price}</strong></p>
                    </div>
                    {!editDeal && (
                      <button onClick={() => { setSelectedProduct(null); setSearch('') }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><X size={14} /></button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search product by name..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm"
                    />
                    {searching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={14} />}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-20 max-h-60 overflow-y-auto">
                        {searchResults.map(p => (
                          <button
                            key={p._id}
                            onClick={() => { setSelectedProduct(p); setSearch(''); setSearchResults([]) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 text-left transition-colors border-b border-gray-50 last:border-0"
                          >
                            <img src={p.images?.[0]?.url} alt="" className="w-9 h-9 rounded-lg object-cover border flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">₹{p.price} <span className="line-through text-gray-300">₹{p.mrp}</span></p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* End Date/Time */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Deal Ends At</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right: Discount settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Discount Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${discountType === 'percentage' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
                  >
                    % Percentage
                  </button>
                  <button
                    onClick={() => setDiscountType('flat')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${discountType === 'flat' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
                  >
                    ₹ Flat Amount
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  {discountType === 'percentage' ? 'Discount %' : 'Flat Discount (₹)'}
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'}
                  min="0"
                  max={discountType === 'percentage' ? '100' : undefined}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm"
                />
              </div>

              {/* Price Preview */}
              {selectedProduct && discountValue && (
                <div className={`p-4 rounded-2xl border-2 ${previewPrice !== null && previewPrice >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Price Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Original Price</p>
                      <p className="text-lg font-black text-gray-400 line-through">₹{selectedProduct.price}</p>
                    </div>
                    <div className="text-2xl text-gray-300 font-light">→</div>
                    <div className="text-center">
                      <p className="text-xs text-orange-600 font-bold">Deal Price</p>
                      <p className="text-2xl font-black text-orange-600">
                        {previewPrice !== null && previewPrice >= 0 ? `₹${previewPrice}` : '—'}
                      </p>
                    </div>
                    {previewPrice !== null && previewPrice >= 0 && (
                      <div className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded-full ml-auto">
                        Save ₹{selectedProduct.price - previewPrice}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !selectedProduct || !discountValue || !endTime}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? 'Saving…' : editDeal ? 'Update Deal' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Deals */}
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-orange-400" size={32} /></div>
      ) : (
        <div className="space-y-6">
          {activeDeals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">🔥 Active Deals ({activeDeals.length})</h2>
              <div className="space-y-3">
                {activeDeals.map(deal => <DealRow key={deal._id} deal={deal} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />)}
              </div>
            </div>
          )}

          {expiredDeals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">⏱️ Expired / Inactive ({expiredDeals.length})</h2>
              <div className="space-y-3 opacity-60">
                {expiredDeals.map(deal => <DealRow key={deal._id} deal={deal} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />)}
              </div>
            </div>
          )}

          {deals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Tag size={48} className="text-gray-200 mb-4" />
              <p className="font-bold text-gray-400 text-lg">No deals yet</p>
              <p className="text-sm text-gray-300 mt-1">Click "Add Deal" to create your first deal</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Deal Row Card ─────────────────────────────────────────────────────────────
const DealRow: React.FC<{
  deal: Deal
  onEdit: (d: Deal) => void
  onDelete: (id: string) => void
  onToggle: (d: Deal) => void
}> = ({ deal, onEdit, onDelete, onToggle }) => {
  const expired = isExpired(deal.endTime)
  const savings = deal.product.price - deal.dealPrice
  const pct = Math.round((savings / deal.product.price) * 100)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <img src={deal.product.images?.[0]?.url} alt="" className="w-16 h-16 rounded-xl object-cover border flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 truncate">{deal.product.name}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-gray-400 text-sm line-through">₹{deal.product.price}</span>
          <span className="text-orange-600 font-black text-lg">₹{deal.dealPrice}</span>
          <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full">{pct}% OFF</span>
          <span className="text-xs text-gray-400">
            {deal.discountType === 'percentage' ? `${deal.discountValue}% discount` : `₹${deal.discountValue} flat off`}
          </span>
        </div>
      </div>

      <div className="text-right flex-shrink-0 hidden sm:block">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{expired ? 'Ended' : 'Ends'}</p>
        <p className={`text-xs font-bold ${expired ? 'text-red-500' : 'text-gray-700'}`}>{fmt(deal.endTime)}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggle(deal)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${deal.isActive && !expired ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          {deal.isActive && !expired ? 'Active' : 'Inactive'}
        </button>
        <button onClick={() => onEdit(deal)} className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"><Pencil size={14} /></button>
        <button onClick={() => onDelete(deal._id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  )
}

export default DealsOfDayPage
