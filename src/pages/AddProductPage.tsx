import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, X, ArrowLeft, Loader2, QrCode, Zap, Printer } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Barcode from 'react-barcode'

interface FormState {
  name:string; description:string; shortDescription:string; price:string; mrp:string; stock:string; sku:string;
  category:string; material:string; weight:string; tags:string;
  colors: { name: string; hex: string }[];
  isFeatured:boolean; isTrending:boolean; isNewArrival:boolean; isBestSeller:boolean; giftWrapping:boolean;
  images: {url:string; fileId?:string; colorName?:string}[];
  barcode: string;
  minQty: string;
  perPiecePrice: string;
  perPacketText: string;
}

const INIT: FormState = { name:'',description:'',shortDescription:'',price:'',mrp:'',stock:'',sku:'',category:'',material:'',weight:'',tags:'',colors:[],isFeatured:false,isTrending:false,isNewArrival:false,isBestSeller:false,giftWrapping:false,images:[], barcode: '', minQty: '1', perPiecePrice: '', perPacketText: '' }

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
        setForm({ 
          ...INIT, 
          ...p, 
          price: String(p.price), 
          mrp: String(p.mrp), 
          stock: String(p.stock), 
          minQty: String(p.minQty || 1), 
          tags: p.tags?.join(',') || '', 
          colors: p.colors || [], 
          category: p.category?._id || p.category || '', 
          images: p.images || [], 
          barcode: p.barcode || '',
          perPiecePrice: p.perPiecePrice || '',
          perPacketText: p.perPacketText || ''
        })
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
      const payload: any = { 
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription,
        price: Number(form.price), 
        mrp: Number(form.mrp || form.price), 
        stock: Number(form.stock || 0), 
        minQty: Number(form.minQty || 1), 
        sku: form.sku,
        category: form.category,
        material: form.material,
        weight: Number(form.weight || 0),
        ...(form.barcode ? { barcode: form.barcode } : {}),
        isFeatured: form.isFeatured,
        isTrending: form.isTrending,
        isNewArrival: form.isNewArrival,
        isBestSeller: form.isBestSeller,
        giftWrapping: form.giftWrapping,
        images: form.images.map(img => ({ url: img.url, fileId: img.fileId, colorName: img.colorName })),
        colors: form.colors.filter(c => c.name).map(c => ({ name: c.name, hex: c.hex })),
        tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
        perPiecePrice: form.perPiecePrice,
        perPacketText: form.perPacketText
      }
      
      console.log('Sending payload:', payload);

      if (isEdit) { 
        await api.put(`/products/${id}`, payload); 
        toast.success('Product updated!'); 
      }
      else { 
        await api.post('/products', payload); 
        toast.success('Product created!'); 
      }
      navigate('/products')
    } catch (err: any) { 
      console.error('Submit Error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to save product. Check console for details.'); 
    } finally { 
      setLoading(false); 
    }
  }

  const generateBarcode = () => {
    const prefix = form.sku ? form.sku.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() : 'RET'
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    const barcode = `${prefix}${random}`
    set('barcode', barcode)
  }

  const printLabel = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) {
      alert('Please allow pop-ups for this website to print labels.');
      return;
    }
    
    // Get the HTML content with all styles
    const barcodeElement = document.getElementById('barcode-to-print');
    if (!barcodeElement) {
      toast.error('Barcode preview not found');
      return;
    }
    
    const content = barcodeElement.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${form.barcode}</title>
          <style>
            @page { size: 50mm 25mm; margin: 0; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
            html, body { margin: 0 !important; padding: 0 !important; width: 50mm; height: 25mm; background: white; overflow: hidden; }
            .print-container { width: 50mm; height: 25mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; font-family: 'Segoe UI', sans-serif; padding: 1mm 1mm; text-align: center; }
            p { margin: 0; padding: 0; }
            .name { font-size: 7pt; font-weight: 900; text-transform: uppercase; margin-bottom: 0; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1; }
            .mrp { font-size: 11pt; font-weight: 900; margin-top: 0; color: black; line-height: 1; }
            .barcode-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden; padding: 0.5mm 0; }
            svg { max-width: 98%; height: auto !important; max-height: 15mm; shape-rendering: crispEdges; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div class="print-container">
            ${content}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
              </div>

              {/* Advanced Colors */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Product Colors</label>
                  <button type="button" onClick={() => set('colors', [...form.colors, { name: '', hex: '#000000' }])} className="text-xs font-bold text-primary hover:underline">+ Add Color</button>
                </div>
                <div className="space-y-3">
                  {form.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <input value={c.name} onChange={e => {
                          const newColors = [...form.colors]; newColors[i].name = e.target.value; set('colors', newColors)
                        }} className="input-sm w-full bg-white" placeholder="Color Name (e.g. Ruby Red)"/>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="color" value={c.hex} onChange={e => {
                          const newColors = [...form.colors]; newColors[i].hex = e.target.value; set('colors', newColors)
                        }} className="w-8 h-8 rounded cursor-pointer p-0 border-0 bg-transparent"/>
                        <input value={c.hex} onChange={e => {
                          const newColors = [...form.colors]; newColors[i].hex = e.target.value; set('colors', newColors)
                        }} className="input-sm w-24 bg-white font-mono text-xs uppercase" placeholder="#HEX"/>
                      </div>
                      <button type="button" onClick={() => set('colors', form.colors.filter((_, idx) => idx !== i))} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                    </div>
                  ))}
                  {form.colors.length === 0 && <p className="text-xs text-gray-400 italic">No colors added yet.</p>}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 border-b pb-3 mb-4">Product Images <span className="text-gray-400 font-normal text-sm">(Uploaded to ImageKit CDN)</span></h3>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-32 h-40 rounded-xl overflow-hidden border-2 border-gray-200 group flex flex-col">
                    <div className="relative flex-1">
                      <img src={img.url} alt="" className="w-full h-full object-cover"/>
                      <button type="button" onClick={() => removeImg(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <X size={20} className="text-white"/>
                      </button>
                      {i === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-primary text-white py-0.5 font-bold">MAIN</span>}
                    </div>
                    <div className="bg-gray-50 border-t p-1.5">
                      <select 
                        value={img.colorName || ''} 
                        onChange={e => {
                          const newImgs = [...form.images]; newImgs[i].colorName = e.target.value; set('images', newImgs)
                        }}
                        className="w-full text-[10px] font-bold bg-transparent border-0 outline-none cursor-pointer text-gray-600"
                      >
                        <option value="">No Color</option>
                        {form.colors.filter(c => c.name).map((c, ci) => (
                          <option key={ci} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
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
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Min Order Qty (MQ) 📦</label>
                <input type="number" value={form.minQty} onChange={e=>set('minQty',e.target.value)} className="input" placeholder="1" min="1"/>
                <p className="text-xs text-gray-400 mt-1">e.g. Set 3 → customer must buy min 3 pcs</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Per Piece Price</label>
                  <input value={form.perPiecePrice} onChange={e=>set('perPiecePrice',e.target.value)} className="input" placeholder="e.g. ₹22.00"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Per Packet Text</label>
                  <input value={form.perPacketText} onChange={e=>set('perPacketText',e.target.value)} className="input" placeholder="e.g. Pack of 4"/>
                </div>
              </div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">SKU</label><input value={form.sku} onChange={e=>set('sku',e.target.value)} className="input" placeholder="RET-KEY-001"/></div>
              <div className="pt-2 border-t mt-4">
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Identity & Barcode</label>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={form.barcode} 
                      onChange={e=>set('barcode',e.target.value)} 
                      className="input pl-9" 
                      placeholder="Auto-generate or scan"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={generateBarcode} 
                    className="flex items-center gap-2 px-4 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <Zap size={14} fill="currentColor" /> Generate
                  </button>
                </div>

                {form.barcode && (
                  <div className="relative group bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4 transition-all hover:border-primary/50 hover:bg-gray-50/50">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retail Tag Preview</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">READY TO PRINT</span>
                    </div>
                    
                    <div className="flex flex-col items-center justify-between h-[80px]" id="barcode-to-print">
                      <p className="name text-[7.5pt] font-black text-gray-800 uppercase line-clamp-1 w-full text-center">{form.name || 'PRODUCT NAME'}</p>
                      <div className="barcode-wrapper flex-1 flex items-center justify-center w-full">
                        <Barcode 
                          value={form.barcode} 
                          width={2.5} 
                          height={55} 
                          fontSize={16} 
                          background="transparent" 
                          fontOptions="bold"
                          margin={5}
                        />
                      </div>
                      <p className="mrp text-[11pt] font-black text-slate-800">MRP: ₹{form.mrp || form.price || '0.00'}</p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button 
                        type="button" 
                        onClick={printLabel} 
                        className="flex-1 btn bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white justify-center text-xs"
                      >
                        <Printer size={14} /> Print Label Sticker
                      </button>
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => set('barcode', '')} className="p-1 text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
