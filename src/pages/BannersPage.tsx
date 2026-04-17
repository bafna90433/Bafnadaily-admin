import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, Tag } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface BannerForm {
  title: string; subtitle: string; image: string; link: string;
  type: string; isActive: boolean; showOnMobile: boolean; showOnWebsite: boolean;
  sortOrder: number; category: string;
}
const BINIT: BannerForm = {
  title: '', subtitle: '', image: '', link: '',
  type: 'hero', isActive: true, showOnMobile: true, showOnWebsite: true,
  sortOrder: 0, category: ''
}

const TYPE_INFO: Record<string, { emoji: string; label: string; desc: string; color: string }> = {
  hero: { emoji: '🖼️', label: 'Main Banner (Hero)', desc: 'Category page pe main banner slider mein show hoga', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  hanging: { emoji: '🪁', label: 'Hanging Banner', desc: 'Category page pe hanging items (rope) section mein show hoga', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  promo: { emoji: '🎯', label: 'Promo Banner', desc: 'Promotional strip banner', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  category: { emoji: '📂', label: 'Category Banner', desc: 'Category highlight banner', color: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<BannerForm>(BINIT)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchBanners = () => {
    setLoading(true)
    // Fetch ALL banners (admin sees all regardless of category)
    api.get('/banners?all=true').then(r => setBanners(r.data.banners || [])).finally(() => setLoading(false))
  }
  const fetchCategories = () => {
    api.get('/categories/all').then(r => setCategories(r.data.categories || []))
  }
  useEffect(() => { fetchBanners(); fetchCategories() }, [])

  const uploadImg = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file); fd.append('folder', 'banners')
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, image: res.data.url })); toast.success('Image uploaded!')
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, category: form.category || null }
      if (editing) { await api.put(`/banners/${editing._id}`, payload); toast.success('Updated!') }
      else { await api.post('/banners', payload); toast.success('Banner created!') }
      setOpen(false); fetchBanners()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete banner?')) return
    try { await api.delete(`/banners/${id}`); toast.success('Deleted'); fetchBanners() } catch { toast.error('Failed') }
  }

  const openEdit = (b: any) => {
    setEditing(b)
    setForm({
      title: b.title || '', subtitle: b.subtitle || '', image: b.image || '',
      link: b.link || '', type: b.type, isActive: b.isActive,
      showOnMobile: b.showOnMobile !== false, showOnWebsite: b.showOnWebsite !== false,
      sortOrder: b.sortOrder,
      category: b.category?._id || b.category || ''
    })
    setOpen(true)
  }

  // Group banners by category for display
  const globalBanners = banners.filter(b => !b.category)
  const catBanners = banners.filter(b => b.category)

  const info = TYPE_INFO[form.type] || TYPE_INFO.hero

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hero banners ← category assign karo • Hanging banners ← category + hanging type</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(BINIT); setOpen(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={17} /> Add Banner
        </button>
      </div>

      {/* ── Global Banners ── */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          🌐 Global Banners <span className="text-xs font-normal text-gray-400">(Homepage pe show honge)</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-48 skeleton rounded-xl" />)
            : globalBanners.map(b => <BannerCard key={b._id} b={b} onEdit={openEdit} onDel={del} />)}
          {!loading && globalBanners.length === 0 && (
            <div className="col-span-3 text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
              No global banners yet
            </div>
          )}
        </div>
      </div>

      {/* ── Category Banners ── */}
      {!loading && catBanners.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            📂 Category Banners <span className="text-xs font-normal text-gray-400">(Specific category page pe show honge)</span>
          </h2>

          {/* Group by category */}
          {Object.entries(
            catBanners.reduce((acc: any, b) => {
              const catId = b.category?._id || b.category
              const catName = b.category?.name || categories.find(c => c._id === catId)?.name || catId
              if (!acc[catName]) acc[catName] = []
              acc[catName].push(b)
              return acc
            }, {})
          ).map(([catName, blist]: any) => (
            <div key={catName} className="mb-6">
              <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                <Tag size={12} /> {catName}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {blist.map((b: any) => <BannerCard key={b._id} b={b} onEdit={openEdit} onDel={del} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">{editing ? 'Edit' : 'New'} Banner</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">

              {/* Type selector — visual cards */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Banner Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TYPE_INFO).map(([t, ti]) => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${form.type === t ? ti.color + ' border-current shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="text-lg mb-0.5">{ti.emoji}</div>
                      <div className="text-xs font-bold">{ti.label}</div>
                      <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{ti.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  Category <span className="font-normal text-gray-400">(Kaun si category page pe show hoga?)</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="input"
                >
                  <option value="">🌐 Global (Homepage)</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.parent ? `  └ ${c.name}` : c.name} {c.layoutType === 'hanging' ? '🪁' : ''}
                    </option>
                  ))}
                </select>
                {form.category && form.type === 'hanging' && (
                  <p className="text-xs text-pink-600 font-medium mt-1">
                    🪁 Ye banner selected category page ki <strong>hanging section</strong> mein show hoga
                  </p>
                )}
                {form.category && form.type === 'hero' && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    🖼️ Ye banner selected category page ke <strong>main banner</strong> mein show hoga
                  </p>
                )}
                {!form.category && (
                  <p className="text-xs text-gray-400 mt-1">
                    📌 No category selected — ye banner homepage pe show hoga
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  {form.type === 'hanging' ? '📌 Price Label (app tag pe dikhega)' : 'Title *'}
                </label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input"
                  placeholder={form.type === 'hanging' ? 'e.g. Under ₹99' : 'Banner title'}
                  required={form.type !== 'hanging'}
                />
                {form.type === 'hanging' && (
                  <p className="text-xs text-gray-400 mt-1">✏️ Keychain ke neeche app mein show hoga. E.g. <strong>Under ₹99</strong></p>
                )}
              </div>

              {form.type !== 'hanging' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Subtitle</label>
                  <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="input" />
                </div>
              )}

              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Banner Image</label>
                {form.image && (
                  <img src={form.image} alt="" className={`w-full object-cover rounded-xl mb-2 border ${form.type === 'hanging' ? 'aspect-[9/16] h-32 object-contain' : 'aspect-[21/9]'}`} />
                )}
                <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary text-sm text-gray-500 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                  <Upload size={15} /> {uploading ? 'Uploading…' : 'Click to upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImg(e.target.files[0])} disabled={uploading} />
                </label>
                {form.type === 'hanging' && <p className="text-xs text-pink-500 mt-1">📐 Portrait image upload karo (9:16 ratio best)</p>}
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Link URL</label>
                <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} className="input" placeholder="/category/keychains" />
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="input" />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <input type="checkbox" checked={form.showOnWebsite} onChange={e => setForm(f => ({ ...f, showOnWebsite: e.target.checked }))} className="accent-primary w-4 h-4" />
                  <span className="text-xs font-medium">Show on Website</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <input type="checkbox" checked={form.showOnMobile} onChange={e => setForm(f => ({ ...f, showOnMobile: e.target.checked }))} className="accent-primary w-4 h-4" />
                  <span className="text-xs font-medium">Show on App</span>
                </label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary w-4 h-4" />
                <span className="text-sm font-medium">Active (Visible on site)</span>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save Banner'}</button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Banner Card ────────────────────────────────────────────────────────────────
const BannerCard = ({ b, onEdit, onDel }: { b: any; onEdit: (b: any) => void; onDel: (id: string) => void }) => {
  const ti = TYPE_INFO[b.type] || TYPE_INFO.hero
  return (
    <div className="card overflow-hidden">
      <div className={`aspect-[21/9] bg-gray-100 relative ${b.type === 'hanging' ? 'aspect-[3/4]' : ''}`}>
        {b.image
          ? <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
          : <div className="flex items-center justify-center h-full text-gray-300 text-sm">No image</div>}
        <span className={`absolute top-2 right-2 badge ${b.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
          {b.isActive ? 'Active' : 'Hidden'}
        </span>
        <span className={`absolute top-2 left-2 badge border text-[10px] ${ti.color}`}>
          {ti.emoji} {ti.label}
        </span>
      </div>
      <div className="p-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{b.title || '(No title)'}</p>
          <p className="text-xs text-gray-400 truncate max-w-[180px]">{b.link || 'No link'}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(b)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
          <button onClick={() => onDel(b._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  )
}

export default BannersPage
