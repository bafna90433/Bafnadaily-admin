import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface BannerForm { title:string; subtitle:string; image:string; link:string; type:string; isActive:boolean; showOnMobile:boolean; showOnWebsite:boolean; sortOrder:number }
const BINIT: BannerForm = { title:'',subtitle:'',image:'',link:'',type:'hero',isActive:true,showOnMobile:true,showOnWebsite:true,sortOrder:0 }

const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<BannerForm>(BINIT)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetch = () => { setLoading(true); api.get('/banners').then(r => setBanners(r.data.banners)).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [])

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
      if (editing) { await api.put(`/banners/${editing._id}`, form); toast.success('Updated!') }
      else { await api.post('/banners', form); toast.success('Banner created!') }
      setOpen(false); fetch()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete banner?')) return
    try { await api.delete(`/banners/${id}`); toast.success('Deleted'); fetch() } catch { toast.error('Failed') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Banners</h1>
        <button onClick={() => { setEditing(null); setForm(BINIT); setOpen(true) }} className="btn-primary"><Plus size={17}/> Add Banner</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_,i) => <div key={i} className="h-48 skeleton rounded-xl"/>) :
          banners.map(b => (
            <div key={b._id} className="card overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {b.image ? <img src={b.image} alt={b.title} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-gray-300 text-sm">No image</div>}
                <span className={`absolute top-2 right-2 badge ${b.isActive?'bg-green-500 text-white':'bg-gray-500 text-white'}`}>{b.isActive?'Active':'Hidden'}</span>
                <span className="absolute top-2 left-2 badge bg-black/60 text-white capitalize">{b.type}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div><p className="font-bold text-sm">{b.title||'(No title)'}</p><p className="text-xs text-gray-400 truncate max-w-[160px]">{b.link||'No link'}</p></div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(b); setForm({title:b.title||'',subtitle:b.subtitle||'',image:b.image||'',link:b.link||'',type:b.type,isActive:b.isActive,showOnMobile:b.showOnMobile!==false,showOnWebsite:b.showOnWebsite!==false,sortOrder:b.sortOrder}); setOpen(true) }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14}/></button>
                  <button onClick={() => del(b._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))
        }
        {!loading && banners.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400">No banners yet</div>}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white"><h2 className="font-bold text-lg">{editing?'Edit':'New'} Banner</h2><button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button></div>
            <form onSubmit={save} className="p-5 space-y-4">
              {/* Title / Label field */}
              {form.type === 'hanging' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">📌 Price Label <span className="text-pink-500">(shown on app tag)</span></label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f=>({...f,title:e.target.value}))}
                    className="input"
                    placeholder="e.g. Under ₹99   or   Under ₹30"
                  />
                  <p className="text-xs text-gray-400 mt-1">✏️ Ye text keychain ke neeche app mein show hoga. Example: <strong>Under ₹99</strong></p>
                </div>
              ) : (
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Title *</label><input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} className="input" required/></div>
              )}
              {form.type !== 'hanging' && <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Subtitle</label><input value={form.subtitle} onChange={e => setForm(f=>({...f,subtitle:e.target.value}))} className="input"/></div>}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Banner Image</label>
                {form.image && <img src={form.image} alt="" className="h-32 w-full object-cover rounded-xl mb-2 border"/>}
                <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary text-sm text-gray-500 transition-colors ${uploading?'opacity-50':''}`}>
                  <Upload size={15}/> {uploading?'Uploading…':'Click to upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImg(e.target.files[0])} disabled={uploading}/>
                </label>
              </div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Link URL</label><input value={form.link} onChange={e => setForm(f=>({...f,link:e.target.value}))} className="input" placeholder="/category/keychains"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} className="input">
                    {['hero','promo','category','hanging'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Sort Order</label><input type="number" value={form.sortOrder} onChange={e => setForm(f=>({...f,sortOrder:Number(e.target.value)}))} className="input"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <input type="checkbox" checked={form.showOnWebsite} onChange={e => setForm(f=>({...f,showOnWebsite:e.target.checked}))} className="accent-primary w-4 h-4"/>
                  <span className="text-xs font-medium">Show on Website</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <input type="checkbox" checked={form.showOnMobile} onChange={e => setForm(f=>({...f,showOnMobile:e.target.checked}))} className="accent-primary w-4 h-4"/>
                  <span className="text-xs font-medium">Show on App</span>
                </label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f=>({...f,isActive:e.target.checked}))} className="accent-primary w-4 h-4"/><span className="text-sm font-medium">Active (Status)</span></label>
              <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Saving…':'Save Banner'}</button><button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BannersPage
