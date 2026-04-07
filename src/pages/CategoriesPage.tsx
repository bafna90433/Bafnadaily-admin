import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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

  const fetch = () => { setLoading(true); api.get('/categories/all').then(r => setCategories(r.data.categories)).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [])

  const openEdit = (cat: any) => { setEditing(cat); setForm({ name:cat.name, description:cat.description||'', icon:cat.icon||'🎁', isActive:cat.isActive, featured:cat.featured, sortOrder:cat.sortOrder||0 }); setOpen(true) }
  const openAdd = () => { setEditing(null); setForm(CINIT); setOpen(true) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) { await api.put(`/categories/${editing._id}`, form); toast.success('Updated!') }
      else { await api.post('/categories', form); toast.success('Category created!') }
      setOpen(false); fetch()
    } catch (err: any) { toast.error(err.response?.data?.message||'Failed') } finally { setSaving(false) }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); fetch() } catch { toast.error('Failed') }
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
            <div key={cat._id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{cat.icon||'🎁'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className="font-bold truncate">{cat.name}</p>{cat.featured&&<span className="badge bg-yellow-100 text-yellow-600 text-[10px]">Featured</span>}</div>
                <p className="text-xs text-gray-400 truncate">{cat.description||'No description'}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${cat.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{cat.isActive?'Active':'Inactive'}</span>
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
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between"><h2 className="font-bold text-lg">{editing?'Edit':'New'} Category</h2><button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button></div>
            <form onSubmit={save} className="p-5 space-y-4">
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
              <div className="flex gap-3 pt-1"><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Saving…':editing?'Update':'Create'}</button><button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
