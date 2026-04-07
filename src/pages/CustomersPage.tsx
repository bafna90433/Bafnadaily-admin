import React, { useEffect, useState, useCallback } from 'react'
import { Search, Ban, CheckCircle, Star, ShoppingBag, IndianRupee, Eye, X } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const TYPE_COLORS: Record<string, string> = {
  retail: 'bg-gray-100 text-gray-600',
  wholesale: 'bg-blue-100 text-blue-700',
  b2b: 'bg-purple-100 text-purple-700',
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [blockedFilter, setBlockedFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any>(null)
  const [blockModal, setBlockModal] = useState<any>(null)
  const [blockReason, setBlockReason] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) p.set('search', search)
      if (typeFilter) p.set('type', typeFilter)
      if (blockedFilter) p.set('blocked', blockedFilter)
      const res = await api.get(`/settings/customers?${p}`)
      setCustomers(res.data.customers); setTotal(res.data.total)
    } catch {} finally { setLoading(false) }
  }, [search, typeFilter, blockedFilter, page])

  useEffect(() => { fetch() }, [fetch])

  const updateCustomer = async (id: string, data: any) => {
    setSaving(true)
    try {
      await api.put(`/settings/customers/${id}`, data)
      toast.success('Updated!')
      fetch()
      if (selected?._id === id) setSelected((s: any) => ({ ...s, ...data }))
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleBlock = async () => {
    if (!blockModal) return
    setSaving(true)
    try {
      await api.put(`/settings/customers/${blockModal._id}/block`, {
        isBlocked: !blockModal.isBlocked,
        blockReason: !blockModal.isBlocked ? blockReason : '',
      })
      toast.success(!blockModal.isBlocked ? '🚫 Customer blocked' : '✅ Customer unblocked')
      setBlockModal(null); setBlockReason(''); fetch()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Customers</h1><p className="text-gray-500 text-sm">{total} registered</p></div>
        <div className="flex gap-3">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input w-36 py-2">
            <option value="">All Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="b2b">B2B</option>
          </select>
          <select value={blockedFilter} onChange={e => setBlockedFilter(e.target.value)} className="input w-36 py-2">
            <option value="">All Status</option>
            <option value="true">Blocked Only</option>
          </select>
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 py-2 w-56" placeholder="Name, phone, business…"/></div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr><th className="th">Customer</th><th className="th">Phone</th><th className="th">Type</th><th className="th">COD</th><th className="th">Special</th><th className="th">Status</th><th className="th">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_,i) => <tr key={i}><td colSpan={7} className="p-3"><div className="h-10 skeleton rounded"/></td></tr>) :
                customers.map(c => (
                  <tr key={c._id} className={`hover:bg-gray-50 transition-colors ${c.isBlocked ? 'bg-red-50/50' : ''}`}>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${c.isBlocked ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>{c.name?.[0]?.toUpperCase()||'?'}</div>
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1">{c.name||'No name'}{c.isSpecialCustomer && <Star size={12} className="fill-yellow-400 text-yellow-400"/>}</p>
                          {c.businessName && <p className="text-xs text-gray-400">{c.businessName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="td text-gray-600">+91 {c.phone}</td>
                    <td className="td"><span className={`badge capitalize ${TYPE_COLORS[c.customerType]||'bg-gray-100'}`}>{c.customerType}</span></td>
                    <td className="td">
                      <button onClick={() => updateCustomer(c._id, { codEnabled: !c.codEnabled })}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${c.codEnabled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        COD {c.codEnabled ? 'ON' : 'OFF'}
                      </button>
                    </td>
                    <td className="td">
                      <button onClick={() => updateCustomer(c._id, { isSpecialCustomer: !c.isSpecialCustomer })}
                        className={`p-1.5 rounded-lg transition-colors ${c.isSpecialCustomer ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:bg-gray-100'}`}>
                        <Star size={16} className={c.isSpecialCustomer ? 'fill-yellow-400' : ''}/>
                      </button>
                    </td>
                    <td className="td"><span className={`badge ${c.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{c.isBlocked ? '🚫 Blocked' : '✅ Active'}</span></td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button onClick={() => setSelected(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="View Details"><Eye size={15}/></button>
                        <button onClick={() => { setBlockModal(c); setBlockReason('') }}
                          className={`p-1.5 rounded-lg transition-colors ${c.isBlocked ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                          title={c.isBlocked ? 'Unblock' : 'Block'}>
                          {c.isBlocked ? <CheckCircle size={15}/> : <Ban size={15}/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          {!loading && customers.length === 0 && <div className="text-center py-16 text-gray-400">No customers found</div>}
        </div>
        {total > 20 && (
          <div className="p-4 border-t flex justify-center gap-2">
            {Array(Math.min(Math.ceil(total/20),7)).fill(0).map((_,i) => (
              <button key={i} onClick={() => setPage(i+1)} className={`w-9 h-9 rounded-lg text-sm font-medium ${page===i+1?'bg-primary text-white':'hover:bg-gray-100'}`}>{i+1}</button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg">Customer Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Profile */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">{selected.name?.[0]||'?'}</div>
                <div><p className="font-bold text-lg">{selected.name}</p><p className="text-gray-500">+91 {selected.phone}</p>{selected.email&&<p className="text-xs text-gray-400">{selected.email}</p>}</div>
              </div>

              {/* Editable fields */}
              <div className="space-y-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Customer Type</label>
                  <select value={selected.customerType} onChange={e => { setSelected((s:any) => ({...s,customerType:e.target.value})); updateCustomer(selected._id,{customerType:e.target.value}) }} className="input">
                    <option value="retail">Retail</option><option value="wholesale">Wholesale</option><option value="b2b">B2B</option>
                  </select>
                </div>
                {(selected.customerType === 'wholesale' || selected.customerType === 'b2b') && (
                  <>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Business Name</label><input value={selected.businessName||''} onChange={e => setSelected((s:any) => ({...s,businessName:e.target.value}))} onBlur={() => updateCustomer(selected._id,{businessName:selected.businessName})} className="input text-sm"/></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">GST Number</label><input value={selected.gstNumber||''} onChange={e => setSelected((s:any) => ({...s,gstNumber:e.target.value}))} onBlur={() => updateCustomer(selected._id,{gstNumber:selected.gstNumber})} className="input text-sm"/></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Credit Limit (₹)</label><input type="number" value={selected.creditLimit||0} onChange={e => setSelected((s:any) => ({...s,creditLimit:Number(e.target.value)}))} onBlur={() => updateCustomer(selected._id,{creditLimit:selected.creditLimit})} className="input text-sm"/></div>
                  </>
                )}
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Admin Notes</label><textarea value={selected.notes||''} onChange={e => setSelected((s:any) => ({...s,notes:e.target.value}))} onBlur={() => updateCustomer(selected._id,{notes:selected.notes})} className="input text-sm resize-none" rows={2} placeholder="Internal notes…"/></div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 border-t pt-3">
                {[
                  { key:'codEnabled', label:'COD Enabled', desc:'Allow Cash on Delivery for this customer' },
                  { key:'isSpecialCustomer', label:'⭐ Special Customer', desc:'Mark as VIP / preferred customer' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div><p className="font-semibold text-sm">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                    <button onClick={() => { const v = !selected[key]; setSelected((s:any) => ({...s,[key]:v})); updateCustomer(selected._id,{[key]:v}) }}
                      className={`relative w-11 h-6 rounded-full transition-colors ${selected[key]?'bg-primary':'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${selected[key]?'translate-x-6':'translate-x-1'}`}/>
                    </button>
                  </div>
                ))}
              </div>

              {/* Block */}
              <button onClick={() => { setBlockModal(selected); setBlockReason('') }}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm border-2 transition-colors ${selected.isBlocked?'border-green-200 text-green-600 hover:bg-green-50':'border-red-200 text-red-600 hover:bg-red-50'}`}>
                {selected.isBlocked ? '✅ Unblock Customer' : '🚫 Block Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock Modal */}
      {blockModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setBlockModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">{blockModal.isBlocked ? '✅ Unblock' : '🚫 Block'} Customer</h2>
            <p className="text-gray-600 text-sm mb-4">
              {blockModal.isBlocked
                ? `Unblock <strong>${blockModal.name}</strong>? They will be able to login and place orders.`
                : `Block <strong>${blockModal.name}</strong>? They won't be able to login.`}
            </p>
            {!blockModal.isBlocked && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Block Reason (optional)</label>
                <input value={blockReason} onChange={e => setBlockReason(e.target.value)} className="input" placeholder="e.g. Suspicious activity"/>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleBlock} disabled={saving}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors ${blockModal.isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {saving ? 'Processing…' : blockModal.isBlocked ? 'Yes, Unblock' : 'Yes, Block'}
              </button>
              <button onClick={() => setBlockModal(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersPage
