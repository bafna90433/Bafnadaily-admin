import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, X, ArrowLeft, Loader2 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface FormState {
  name:string; description:string; shortDescription:string; price:string; mrp:string; stock:string; sku:string;
  category:string; material:string; weight:string; tags:string; color:string;
  isFeatured:boolean; isTrending:boolean; isNewArrival:boolean; isBestSeller:boolean; giftWrapping:boolean;
  images: {url:string; fileId?:string}[]
}

const INIT: FormState = { name:'',description:'',shortDescription:'',price:'',mrp:'',stock:'',sku:'',category:'',material:'',weight:'',tags:'',color:'',isFeatured:false,isTrending:false,isNewArrival:false,isBestSeller:false,giftWrapping:false,images:[] }

const AddProductPage: React.FC = () => {
  const { id } = useParams<{id:string}>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [form, setForm] = useState<FormState>(INIT)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api.get('/categories/all').then(r => setCategories(r.data.categories))
    if (isEdit) {
      api.get(`/products/by-id/${id}`).then(r => {
        const p = r.data.product
        setForm({ ...INIT, ...p, price: String(p.price), mrp: String(p.mrp), stock: String(p.stock), tags: p.tags?.join(',') || '', color: p.color?.join(',') || '', category: p.category?._id || p.category || '', images: p.images || [] })
      }).catch(() => navigate('/products'))
    }
  }, [id])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  const uploadImages = async (files: FileList) => {
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append('images', f))
      fd.append('folder', 'products')
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, images: [...f.images, ...res.data.images] }))
      toast.success(`${res.data.images.length} image(s) uploaded to ImageKit!`)
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  const removeImg = (idx: number) => setForm(f => ({ ...f, images: f.images.filter((_,i) => i !== idx) }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category) { toast.error('Fill required fields'); return }
    setLoading(true)
    try {
      const payload = { ...form, price: Number(form.price), mrp: Number(form.mrp || form.price), stock: Number(form.stock || 0), tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [], color: form.color ? form.color.split(',').map(c=>c.trim()).filter(Boolean) : [] }
      if (isEdit) { await api.put(`/products/${id}`, payload); toast.success('Product updated!') }
      else { await api.post('/products', payload); toast.success('Product created!') }
      navigate('/products')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') } finally { setLoading(false) }
  }

  const toggleBadge = (k: 'isFeatured'|'isTrending'|'isNewArrival'|'isBestSeller'|'giftWrapping') => set(k, !form[k])

  const Toggle: React.FC<{k:'isFeatured'|'isTrending'|'isNewArrival'|'isBestSeller'|'giftWrapping'; label:string}> = ({ k, label }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={() => toggleBadge(k)} className={`w-11 h-6 rounded-full relative transition-colors ${form[k]?'bg-primary':'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[k]?'translate-x-6':'translate-x-1'}`}/>
      </div>
      <span className="text-sm font-medium">{label}</span>
    </label>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-200 rounded-lg transition-colors"><ArrowLeft size={20}/></button>
        <div><h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'Add New Product'}</h1><p className="text-gray-500 text-sm">Fill in the product details</p></div>
      </div>

      <form onSubmit={submit}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Info */}
            <div className="card p-5 space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-3">Basic Information</h3>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Product Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} className="input" placeholder="e.g. Cute Anime Keychain Set" required/></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Short Description</label><input value={form.shortDescription} onChange={e=>set('shortDescription',e.target.value)} className="input" placeholder="One-line product summary"/></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Full Description *</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} className="input resize-none" rows={4} placeholder="Detailed description…" required/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Category *</label>
                  <select value={form.category} onChange={e=>set('category',e.target.value)} className="input" required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Material</label><input value={form.material} onChange={e=>set('material',e.target.value)} className="input" placeholder="Acrylic, Metal, etc."/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Tags (comma separated)</label><input value={form.tags} onChange={e=>set('tags',e.target.value)} className="input" placeholder="cute,anime,gift,keychain"/></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Colors (comma separated)</label><input value={form.color} onChange={e=>set('color',e.target.value)} className="input" placeholder="Pink,Black,Blue"/></div>
              </div>
            </div>

            {/* Images */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 border-b pb-3 mb-4">Product Images <span className="text-gray-400 font-normal text-sm">(Uploaded to ImageKit CDN)</span></h3>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 group">
                    <img src={img.url} alt="" className="w-full h-full object-cover"/>
                    <button type="button" onClick={() => removeImg(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X size={20} className="text-white"/>
                    </button>
                    {i === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-primary text-white py-0.5 font-bold">MAIN</span>}
                  </div>
                ))}
                <label className={`w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors ${uploading?'opacity-50 pointer-events-none':''}`}>
                  {uploading ? <Loader2 size={22} className="text-primary animate-spin"/> : <><Upload size={22} className="text-gray-400 mb-1"/><span className="text-xs text-gray-400 font-medium">Upload</span></>}
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files && uploadImages(e.target.files)} disabled={uploading}/>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-3">First image = main product image. Drag to reorder. Max 10 images.</p>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="card p-5 space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-3">Pricing & Stock</h3>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Selling Price (₹) *</label><input type="number" value={form.price} onChange={e=>set('price',e.target.value)} className="input" placeholder="299" required min="0"/></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">MRP / Original Price (₹)</label><input type="number" value={form.mrp} onChange={e=>set('mrp',e.target.value)} className="input" placeholder="499" min="0"/></div>
              {form.price && form.mrp && Number(form.mrp) > Number(form.price) && (
                <div className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg">Discount: {Math.round(((Number(form.mrp)-Number(form.price))/Number(form.mrp))*100)}% OFF</div>
              )}
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Stock Qty</label><input type="number" value={form.stock} onChange={e=>set('stock',e.target.value)} className="input" placeholder="100" min="0"/></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">SKU</label><input value={form.sku} onChange={e=>set('sku',e.target.value)} className="input" placeholder="RET-KEY-001"/></div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-gray-800 border-b pb-3 mb-4">Product Badges</h3>
              <div className="space-y-4">
                <Toggle k="isTrending" label="🔥 Trending"/>
                <Toggle k="isFeatured" label="⭐ Featured"/>
                <Toggle k="isNewArrival" label="✨ New Arrival"/>
                <Toggle k="isBestSeller" label="🏆 Best Seller"/>
                <Toggle k="giftWrapping" label="🎁 Gift Wrapping"/>
              </div>
            </div>

            <button type="submit" disabled={loading||uploading} className="btn-primary w-full py-3 text-base justify-center">
              {loading ? 'Saving…' : isEdit ? '✓ Update Product' : '✓ Create Product'}
            </button>
            <button type="button" onClick={() => navigate('/products')} className="btn-secondary w-full py-3 justify-center">Cancel</button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddProductPage
