import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Copy } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface CouponForm { code:string; description:string; discountType:string; discountValue:string; minOrderAmount:string; maxDiscount:string; usageLimit:number; validFrom:string; validTill:string; isActive:boolean }
const CINIT: CouponForm = { code:'',description:'',discountType:'percent',discountValue:'',minOrderAmount:'',maxDiscount:'',usageLimit:100,validFrom:'',validTill:'',isActive:true }

const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<CouponForm>(CINIT)
  const [saving, setSaving] = useState(false)

  const fetch = () => { setLoading(true); api.get('/coupons').then(r => setCoupons(r.data.coupons)).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, code: form.code.toUpperCase(), discountValue: Number(form.discountValue), minOrderAmount: Number(form.minOrderAmount||0), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined }
      if (editing) { await api.put(`/coupons/${editing._id}`, payload); toast.success('Updated!') }
      else { await api.post('/coupons', payload); toast.success('Coupon created!') }
      setOpen(false); fetch()
    } catch (err: any) { toast.error(err.response?.data?.message||'Failed') } finally { setSaving(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete coupon?')) return
    try { await api.delete(`/coupons/${id}`); toast.success('Deleted'); fetch() } catch { toast.error('Failed') }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Coupons & Discounts</h1><p className="text-gray-500 text-sm">{coupons.length} coupons</p></div>
        <button onClick={() => { setEditing(null); setForm(CINIT); setOpen(true) }} className="btn-primary"><Plus size={17}/> Add Coupon</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="th">Code</th><th className="th">Discount</th><th className="th">Min Order</th><th className="th">Used / Limit</th><th className="th">Valid Till</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? Array(5).fill(0).map((_,i) => <tr key={i}><td colSpan={7} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>) :
              coupons.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg text-sm tracking-wider">{c.code}</span>
                      <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Copied!') }} className="p-1 text-gray-400 hover:text-gray-600"><Copy size={12}/></button>
                    </div>
                    {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="td font-bold">{c.discountType==='percent'?`${c.discountValue}%`:`₹${c.discountValue}`}{c.maxDiscount&&<span className="text-xs text-gray-400 ml-1">(max ₹{c.maxDiscount})</span>}</td>
                  <td className="td text-gray-500">{c.minOrderAmount>0?`₹${c.minOrderAmount}`:'None'}</td>
                  <td className="td"><span className="font-semibold">{c.usedCount}</span><span className="text-gray-400">/{c.usageLimit}</span></td>
                  <td className="td text-gray-500 text-xs">{c.validTill?new Date(c.validTill).toLocaleDateString('en-IN'):'No expiry'}</td>
                  <td className="td"><span className={`badge ${c.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{c.isActive?'Active':'Inactive'}</span></td>
                  <td className="td">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(c); setForm({...CINIT,...c,discountValue:String(c.discountValue),minOrderAmount:String(c.minOrderAmount||''),maxDiscount:String(c.maxDiscount||''),validFrom:c.validFrom?.split('T')[0]||'',validTill:c.validTill?.split('T')[0]||''}); setOpen(true) }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14}/></button>
                      <button onClick={() => del(c._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && coupons.length === 0 && <div className="text-center py-16 text-gray-400">No coupons yet. Create your first discount!</div>}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white"><h2 className="font-bold text-lg">{editing?'Edit':'New'} Coupon</h2><button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button></div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Coupon Code *</label><input value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))} className="input font-mono font-bold tracking-widest text-primary" placeholder="SAVE20" required/></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Description</label><input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="input" placeholder="20% off on all orders"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Type</label>
                  <select value={form.discountType} onChange={e => setForm(f=>({...f,discountType:e.target.value}))} className="input"><option value="percent">Percentage (%)</option><option value="flat">Flat (₹)</option></select>
                </div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Value *</label><input type="number" value={form.discountValue} onChange={e => setForm(f=>({...f,discountValue:e.target.value}))} className="input" placeholder={form.discountType==='percent'?'20':'50'} required min="0"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Min Order (₹)</label><input type="number" value={form.minOrderAmount} onChange={e => setForm(f=>({...f,minOrderAmount:e.target.value}))} className="input" placeholder="0"/></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Max Discount (₹)</label><input type="number" value={form.maxDiscount} onChange={e => setForm(f=>({...f,maxDiscount:e.target.value}))} className="input" placeholder="Optional"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Valid From</label><input type="date" value={form.validFrom} onChange={e => setForm(f=>({...f,validFrom:e.target.value}))} className="input" min={today}/></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Valid Till</label><input type="date" value={form.validTill} onChange={e => setForm(f=>({...f,validTill:e.target.value}))} className="input" min={today}/></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Usage Limit</label><input type="number" value={form.usageLimit} onChange={e => setForm(f=>({...f,usageLimit:Number(e.target.value)}))} className="input" min="1"/></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f=>({...f,isActive:e.target.checked}))} className="accent-primary w-4 h-4"/><span className="text-sm font-semibold">Active</span></label>
              <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Saving…':'Save Coupon'}</button><button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CouponsPage
