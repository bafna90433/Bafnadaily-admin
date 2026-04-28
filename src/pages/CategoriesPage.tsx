import React, { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, ImageOff, Loader2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ICONS = ['🔑', '👗', '👜', '💄', '🎁', '💕', '🛍️', '💍', '👒', '🎀', '🧣', '💎', '🪄', '🌸', '🦋']

interface CatForm { name: string; description: string; icon: string; isActive: boolean; featured: boolean; sortOrder: number; parent: string; layoutType: string; isDashboardMain: boolean }
const CINIT: CatForm = { name: '', description: '', icon: '🎁', isActive: true, featured: false, sortOrder: 0, parent: '', layoutType: 'standard', isDashboardMain: false }

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<CatForm>(CINIT)
  const [saving, setSaving] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const fetchCats = () => {
    setLoading(true)
    api.get('/categories/all?admin=true').then(r => setCategories(r.data.categories)).finally(() => setLoading(false))
  }
  useEffect(() => { fetchCats() }, [])

  const openEdit = (cat: any) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '🎁',
      isActive: cat.isActive,
      featured: cat.featured,
      sortOrder: cat.sortOrder || 0,
      parent: cat.parent?._id || cat.parent || '',
      layoutType: cat.layoutType || 'standard',
      isDashboardMain: cat.isDashboardMain || false
    })
    setImagePreview(cat.image || null)
    setImageFile(null)
    setBannerPreview(cat.banner || null)
    setBannerFile(null)
    setOpen(true)
  }
  const openAdd = () => {
    setEditing(null)
    setForm(CINIT)
    setImagePreview(null)
    setImageFile(null)
    setBannerPreview(null)
    setBannerFile(null)
    setOpen(true)
  }
  const openAddSub = (parentId: string) => {
    setEditing(null)
    setForm({ ...CINIT, parent: parentId })
    setImagePreview(null)
    setImageFile(null)
    setBannerPreview(null)
    setBannerFile(null)
    setOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImageForCat = async (cat: any, file: File) => {
    const tid = toast.loading(`Uploading image for ${cat.name}...`)
    try {
      const fd = new FormData()
      fd.append('image', file)
      await api.post(`/categories/${cat._id}/upload-image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Image updated!', { id: tid })
      fetchCats()
    } catch (err) {
      toast.error('Upload failed', { id: tid })
    }
  }

  // ─── Move category up or down ───────────────────────────────────────────────
  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newList = [...categories]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newList.length) return

      // Swap in local state immediately (optimistic)
      ;[newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]]

    // Reassign sortOrder based on new position
    const updated = newList.map((cat, i) => ({ ...cat, sortOrder: i }))
    setCategories(updated)

    // The two affected categories
    const catA = updated[index]
    const catB = updated[swapIndex]
    setMovingId(catA._id)

    try {
      await Promise.all([
        api.put(`/categories/${catA._id}`, { sortOrder: catA.sortOrder }),
        api.put(`/categories/${catB._id}`, { sortOrder: catB.sortOrder }),
      ])
    } catch {
      toast.error('Order update failed')
      fetchCats() // revert on error
    } finally {
      setMovingId(null)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const finalData = {
        ...form,
        parent: form.parent === '' ? null : form.parent
      }

      let savedCat: any
      if (editing) {
        const res = await api.put(`/categories/${editing._id}`, finalData)
        savedCat = res.data.category
        toast.success('Updated!')
      } else {
        const res = await api.post('/categories', finalData)
        savedCat = res.data.category
        toast.success('Category created!')
      }

      // Upload image if selected
      if (imageFile && savedCat?._id) {
        setUploading(true)
        try {
          const fd = new FormData()
          fd.append('image', imageFile)
          await api.post(`/categories/${savedCat._id}/upload-image`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          toast.success('Image uploaded!')
        } catch {
          toast.error('Image upload failed')
        } finally {
          setUploading(false)
        }
      }

      // Upload banner if selected
      if (bannerFile && savedCat?._id) {
        setUploading(true)
        try {
          const fd = new FormData()
          fd.append('banner', bannerFile)
          await api.post(`/categories/${savedCat._id}/upload-banner`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          toast.success('Banner uploaded!')
        } catch {
          toast.error('Banner upload failed')
        } finally {
          setUploading(false)
        }
      }

      setOpen(false)
      fetchCats()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); fetchCats() } catch { toast.error('Failed') }
  }


  // Helper to group categories recursively
  const mainCategories = categories.filter(c => !c.parent || c.parent === '')
  const getSubCategories = (parentId: string) => categories.filter(c => (c.parent?._id || c.parent) === parentId)

  const renderCategoryItem = (cat: any, index: number, isSub: boolean = false) => (
    <div
      key={cat._id}
      className={`card p-3 flex items-center gap-3 transition-all duration-200 ${movingId === cat._id ? 'opacity-60 scale-[0.99]' : 'hover:shadow-md'
        } ${isSub ? 'ml-12 border-l-4 border-primary/20 bg-gray-50/30' : ''}`}
    >
      {/* Order Badge */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-6">
        <span className="text-[10px] font-bold text-gray-300">#{index + 1}</span>
        <GripVertical size={13} className="text-gray-300" />
      </div>

      {/* Move Buttons */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={() => moveCategory(index, 'up')}
          disabled={index === 0 || movingId !== null}
          className={`p-1 rounded-lg transition-all ${index === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-primary hover:bg-primary/10'
            }`}
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={() => moveCategory(index, 'down')}
          disabled={index === categories.length - 1 || movingId !== null}
          className={`p-1 rounded-lg transition-all ${index === categories.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-primary hover:bg-primary/10'
            }`}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Image / Icon */}
      <div className="relative flex-shrink-0 group/img">
        {cat.image ? (
          <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">
            {cat.icon || '🎁'}
          </div>
        )}
        <label
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
          title="Change Image"
        >
          <Upload size={12} className="text-white" />
          <input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImageForCat(cat, f) }}
          />
        </label>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm truncate">{cat.name}</p>
          {cat.featured && (
            <span className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded-full font-bold">Featured</span>
          )}
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {cat.isActive ? 'Active' : 'Inactive'}
          </span>
          {cat.isDashboardMain && (
            <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">Dashboard Side</span>
          )}
          {isSub && (
            <span className="text-[9px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full font-bold uppercase tracking-tighter">Sub-Category</span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{cat.description || 'No description'}</p>
      </div>

      {/* Sort number indicator */}
      <div className="hidden sm:flex items-center">
        <span className="text-xs text-gray-300 font-mono bg-gray-50 px-2 py-1 rounded-lg border">
          order: {cat.sortOrder ?? index}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 flex-shrink-0">
        {!isSub && (
          <button
            onClick={() => openAddSub(cat._id)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg flex items-center gap-1 text-[10px] font-bold"
            title="Add Sub-category"
          >
            <Plus size={14} /> SUB
          </button>
        )}
        <button onClick={() => openEdit(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit">
          <Pencil size={14} />
        </button>
        <button onClick={() => del(cat._id, cat.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories · drag ↑↓ to reorder</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={17} /> Add Category</button>
      </div>

      {/* Category List */}
      <div className="flex flex-col gap-3">
        {loading
          ? Array(5).fill(0).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)
          : mainCategories.map((cat, index) => (
            <React.Fragment key={cat._id}>
              {renderCategoryItem(cat, index, false)}
              {getSubCategories(cat._id).map((sub, sIdx) => (
                renderCategoryItem(sub, sIdx, true)
              ))}
            </React.Fragment>
          ))
        }
      </div>

      {/* Empty state */}
      {!loading && categories.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📂</p>
          <p className="font-medium">No categories yet</p>
          <button onClick={openAdd} className="btn-primary mt-4"><Plus size={15} /> Add First Category</button>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-lg">{editing ? 'Edit' : 'New'} Category</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={save} className="p-5 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Category Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                      : <ImageOff size={24} className="text-gray-300" />
                    }
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full justify-center"
                    >
                      <Upload size={15} />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </button>
                    {imageFile && <p className="text-xs text-gray-400 mt-1.5 truncate text-center">{imageFile.name}</p>}
                    {!imageFile && editing?.image && <p className="text-xs text-green-600 mt-1.5 text-center">✓ Image set</p>}
                    <p className="text-[10px] text-gray-400 mt-1 text-center">JPG, PNG, WEBP — max 10MB</p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Category Banner (For Landing Page)</label>
                <div className="flex flex-col gap-2">
                  <div className="w-full aspect-[21/9] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                    {bannerPreview
                      ? <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
                      : <div className="text-gray-300 text-xs font-bold">No Banner Selected</div>
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full justify-center"
                  >
                    <Upload size={14} />
                    {bannerPreview ? 'Change Banner' : 'Upload Banner'}
                  </button>
                  <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (f) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); }
                  }} />
                </div>
              </div>

              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" required /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none" rows={2} /></div>

              <div><label className="block text-xs font-bold text-gray-600 mb-2">Icon Emoji</label>
                <div className="flex flex-wrap gap-2">{ICONS.map(icon => (
                  <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon ? 'bg-primary/15 border-2 border-primary scale-110' : 'border border-gray-200 hover:border-primary'}`}
                  >{icon}</button>
                ))}</div>
              </div>

              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Sort Order</label><input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="input" /></div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Parent Category</label>
                  <select value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))} className="input">
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => c._id !== editing?._id).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Display Layout</label>
                  <select value={form.layoutType} onChange={e => setForm(f => ({ ...f, layoutType: e.target.value }))} className="input">
                    <option value="standard">Standard Grid</option>
                    <option value="hanging">Hanging (Keychain Style)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-6">
                {[['isActive', 'Active'], ['featured', 'Featured'], ['isDashboardMain', 'Show on Dashboard Side']].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[k as keyof CatForm] as boolean} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} className="accent-primary w-4 h-4" />
                    <span className="text-sm whitespace-nowrap">{l}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving || uploading} className="btn-primary flex-1 justify-center">
                  {(saving || uploading)
                    ? <><Loader2 size={15} className="animate-spin mr-1.5" />{uploading ? 'Uploading…' : 'Saving…'}</>
                    : editing ? 'Update' : 'Create'
                  }
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
