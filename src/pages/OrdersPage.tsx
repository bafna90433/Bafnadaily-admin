import React, { useEffect, useState, useCallback } from 'react'
import { Eye, ChevronDown } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const STATUS_OPT = ['placed','confirmed','processing','shipped','delivered','cancelled']
const SC: Record<string,string> = { placed:'bg-blue-100 text-blue-700', confirmed:'bg-purple-100 text-purple-700', processing:'bg-yellow-100 text-yellow-700', shipped:'bg-orange-100 text-orange-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' }

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<any>(null)
  const [updating, setUpdating] = useState<string|null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter) p.set('status', filter)
      const res = await api.get(`/orders?${p}`)
      setOrders(res.data.orders); setTotal(res.data.total)
    } catch {} finally { setLoading(false) }
  }, [filter, page])

  useEffect(() => { fetch() }, [fetch])

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId)
    try {
      await api.put(`/orders/${orderId}/status`, { status, note: `Updated to ${status} by admin` })
      toast.success(`Marked as ${status}`)
      fetch()
      if (selected?._id === orderId) setSelected((s:any) => s ? {...s, orderStatus: status} : null)
    } catch { toast.error('Update failed') } finally { setUpdating(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Orders</h1><p className="text-gray-500 text-sm">{total} total orders</p></div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className="input w-44 py-2">
          <option value="">All Orders</option>
          {STATUS_OPT.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Items</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th">Date</th><th className="th">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_,i) => (
                <tr key={i}><td colSpan={8} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>
              )) : orders.map(o => (
                <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                  <td className="td"><p className="font-bold text-sm">#{o.orderNumber}</p></td>
                  <td className="td"><p className="font-medium text-sm">{o.user?.name||'—'}</p><p className="text-xs text-gray-400">{o.user?.phone}</p></td>
                  <td className="td text-gray-600">{o.items?.length||0} item(s)</td>
                  <td className="td font-bold">₹{o.total}</td>
                  <td className="td"><span className={`badge ${o.paymentMethod==='cod'?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'} uppercase`}>{o.paymentMethod}</span></td>
                  <td className="td">
                    <div className="relative inline-block">
                      <select value={o.orderStatus} onChange={e => updateStatus(o._id, e.target.value)} disabled={updating===o._id||o.orderStatus==='cancelled'}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-0 cursor-pointer appearance-none pr-6 ${SC[o.orderStatus]||'bg-gray-100 text-gray-600'} disabled:opacity-60`}>
                        {STATUS_OPT.map(s => <option key={s} value={s} className="bg-white text-gray-900 capitalize">{s}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                    </div>
                  </td>
                  <td className="td text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="td"><button onClick={() => setSelected(o)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={15}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && orders.length === 0 && <div className="text-center py-16 text-gray-400">No orders found</div>}
        </div>
        {total > 20 && (
          <div className="p-4 border-t flex justify-center gap-2">
            {Array(Math.min(Math.ceil(total/20),7)).fill(0).map((_,i) => (
              <button key={i} onClick={() => setPage(i+1)} className={`w-9 h-9 rounded-lg text-sm font-medium ${page===i+1?'bg-primary text-white':'hover:bg-gray-100'}`}>{i+1}</button>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg">#{selected.orderNumber}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-1">Customer</p><p className="font-bold">{selected.user?.name}</p><p className="text-gray-500 text-xs">{selected.user?.phone}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-1">Payment</p><p className="font-bold text-lg">₹{selected.total}</p><p className="uppercase text-orange-500 text-xs font-bold">{selected.paymentMethod}</p></div>
              </div>
              <div><p className="font-bold text-sm mb-2">Delivery Address</p>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600"><p>{selected.shippingAddress?.name} · {selected.shippingAddress?.phone}</p><p>{selected.shippingAddress?.addressLine1}{selected.shippingAddress?.addressLine2?`, ${selected.shippingAddress.addressLine2}`:''}</p><p>{selected.shippingAddress?.city}, {selected.shippingAddress?.state} – {selected.shippingAddress?.pincode}</p></div>
              </div>
              <div><p className="font-bold text-sm mb-2">Items</p>
                <div className="space-y-2">{selected.items?.map((item:any,i:number) => (
                  <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    <img src={item.image||`https://placehold.co/48x48/FCE4EC/E91E63?text=P`} className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                    <div className="text-sm flex-1"><p className="font-semibold line-clamp-1">{item.name}</p><p className="text-gray-400 text-xs">{item.variant||''}</p><p className="text-gray-600 mt-0.5">₹{item.price} × {item.quantity} = <strong>₹{item.price*item.quantity}</strong></p></div>
                  </div>
                ))}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{selected.subtotal}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{selected.shippingCharge===0?'FREE':'₹'+selected.shippingCharge}</span></div>
                {selected.discount>0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{selected.discount}</span></div>}
                <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>₹{selected.total}</span></div>
              </div>
              <div><p className="font-bold text-sm mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPT.map(s => (
                    <button key={s} onClick={() => updateStatus(selected._id, s)}
                      className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold border transition-colors ${selected.orderStatus===s?SC[s]+' border-transparent':'border-gray-200 hover:border-primary hover:text-primary'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
