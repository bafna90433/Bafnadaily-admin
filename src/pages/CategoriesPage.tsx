import React, { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, ImageOff, Loader2 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ICONS = ['🔑','👗','👜','💄','🎁','💕','🛍️','💍','👒','🎀','🧣','💎','🪄','🌸','🦋']

interface CatForm { name:string; description:string; icon:string; isActive:boolean; featured:boolean; sortOrder:number }
const CINIT: CatForm = { name:'',description:'',icon:'🎁',isActive:true,featured:false,sortOrder:0 }

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<CatForm>(CINIT)
  const [saving, setSaving] = useState(false)

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCats = () => { setLoading(true); api.get('/categories/all').then(r => setCategories(r.data.categories)).finally(() => setLoading(false)) }
  useEffect(() => { fetchCats() }, [])

  const openEdit = (cat: any) => {
    setEditing(cat)
    setForm({ name:cat.name, description:cat.description||'', icon:cat.icon||'🎁', isActive:cat.isActive, featured:cat.featured, sortOrder:cat.sortOrder||0 })
    setImagePreview(cat.image || null)
    setImageFile(null)
    setOpen(true)
  }
  const openAdd = () => {
    setEditing(null)
    setForm(CINIT)
    setImagePreview(null)
    setImageFile(null)
    setOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let savedCat: any
      if (editing) {
        const res = await api.put(`/categories/${editing._id}`, form)
        savedCat = res.data.category
        toast.success('Updated!')
      } else {
        const res = await api.post('/categories', form)
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

  // Upload image directly on existing category (from card)
  const uploadImageForCat = async (cat: any, file: File) => {
    const toastId = toast.loading('Uploading image...')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post(`/categories/${cat._id}/upload-image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Image uploaded!', { id: toastId })
      setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, image: res.data.url } : c))
    } catch {
      toast.error('Upload failed', { id: toastId })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Categories</h1><p className="text-gray-500 text-sm">{categories.length} categories</p></div>
        <button onClick={openAdd} className="btn-primary"><Plus size={17}/> Add Category</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array(6).fill(0).map((_,i) => <div key={i} className="h-24 skeleton rounded-xl"/>) :
          categories.map(cat => (
            <div key={cat._id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
              {/* Category Image / Icon */}
              <div className="relative flex-shrink-0">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                  />
                ) : (
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                    {cat.icon || '🎁'}
                  </div>
                )}
                {/* Quick image upload overlay */}
                <label
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Upload Image"
                >
                  <Upload size={14} className="text-white"/>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadImageForCat(cat, f) }}
                  />
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold truncate">{cat.name}</p>
                  {cat.featured && <span className="badge bg-yellow-100 text-yellow-600 text-[10px]">Featured</span>}
                </div>
                <p className="text-xs text-gray-400 truncate">{cat.description || 'No description'}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14}/></button>
                <button onClick={() => del(cat._id, cat.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
              </div>
            </div>
          ))
        }
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-lg">{editing ? 'Edit' : 'New'} Category</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={save} className="p-5 space-y-4">
              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Category Image</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover"/>
                    ) : (
                      <ImageOff size={24} className="text-gray-300"/>
                    )}
                  </div>
                  {/* Upload button */}
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full justify-center"
                    >
                      <Upload size={15}/>
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </button>
                    {imageFile && (
                      <p className="text-xs text-gray-400 mt-1.5 truncate text-center">{imageFile.name}</p>
                    )}
                    {!imageFile && editing?.image && (
                      <p className="text-xs text-green-600 mt-1.5 text-center">✓ Image set</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 text-center">JPG, PNG, WEBP — max 10MB</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Name *</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="input" required/></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="input resize-none" rows={2}/></div>

              <div><label className="block text-xs font-bold text-gray-600 mb-2">Icon Emoji</label>
                <div className="flex flex-wrap gap-2">{ICONS.map(icon => (
                  <button key={icon} type="button" onClick={() => setForm(f=>({...f,icon}))} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon===icon?'bg-primary/15 border-2 border-primary scale-110':'border border-gray-200 hover:border-primary'}`}>{icon}</button>
                ))}</div>
              </div>

              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Sort Order</label><input type="number" value={form.sortOrder} onChange={e => setForm(f=>({...f,sortOrder:Number(e.target.value)}))} className="input"/></div>
              <div className="flex gap-6">
                {[['isActive','Active'],['featured','Featured on Homepage']].map(([k,l]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form[k as keyof CatForm] as boolean} onChange={e => setForm(f=>({...f,[k]:e.target.checked}))} className="accent-primary w-4 h-4"/><span className="text-sm">{l}</span></label>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving || uploading} className="btn-primary flex-1 justify-center">
                  {(saving || uploading) ? <><Loader2 size={15} className="animate-spin mr-1.5"/> {uploading ? 'Uploading…' : 'Saving…'}</> : editing ? 'Update' : 'Create'}
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
