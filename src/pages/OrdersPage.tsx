import React, { useEffect, useState, useCallback } from 'react'
import { Eye, ChevronDown, Truck, X, FileText } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const printInvoice = (order: any, settings: any) => {
  const win = window.open('', '_blank')
  if (!win) return
  const sa = order.shippingAddress || {}
  const u = order.user || {}
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  const printDate = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  const siteName = settings?.siteName || 'Store'
  const logo = settings?.siteLogo || ''

  const itemRows = (order.items || []).map((it: any, i: number) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b">${i+1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">
        <span style="font-weight:600;color:#1e293b">${it.name}</span>
        ${it.variant ? `<br/><span style="font-size:11px;color:#94a3b8">${it.variant}</span>` : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right">₹${Number(it.price).toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700">₹${(it.price*it.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('')

  const statusLabel = (s: string) => (s==='placed'||s==='confirmed'||s==='processing') ? 'Confirmed' : s.charAt(0).toUpperCase()+s.slice(1)

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Invoice ${order.orderNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;color:#1e293b;padding:32px;font-size:13px}
    .wrap{max-width:860px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid #e91e63;margin-bottom:22px}
    .brand{display:flex;align-items:center;gap:12px}
    .brand img{height:52px;object-fit:contain}
    .logo-box{width:48px;height:48px;background:#e91e63;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px}
    .brand-name{font-size:22px;font-weight:800;letter-spacing:-0.5px}
    .brand-sub{font-size:11px;color:#94a3b8;margin-top:2px}
    .inv-right{text-align:right}
    .inv-right h1{font-size:30px;font-weight:900;color:#e91e63;letter-spacing:3px}
    .inv-right p{font-size:12px;color:#64748b;margin-top:3px}
    .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:22px}
    .mc{background:#f8fafc;border-radius:10px;padding:13px 15px}
    .mc h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
    .mc p{font-size:13px;line-height:1.7}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:linear-gradient(135deg,#e91e63,#c2185b)}
    th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#fff}
    th:nth-child(1){text-align:center;width:36px}
    th:nth-child(3){text-align:center}
    th:nth-child(4),th:nth-child(5){text-align:right}
    .sum{margin-left:auto;width:260px;margin-top:4px}
    .sr{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9}
    .st{display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:800;border-top:2px solid #1e293b;margin-top:4px}
    .track{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#15803d}
    .foot{text-align:center;margin-top:28px;padding-top:18px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8}
    .no-print{text-align:center;margin-top:20px}
    .pbtn{padding:11px 28px;background:#e91e63;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px}
    .cbtn{padding:11px 22px;background:#64748b;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}
    @media print{body{padding:16px}.no-print{display:none}}
  </style>
  </head><body><div class="wrap">
  <div class="head">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="${siteName}"/>` : `<div class="logo-box">${siteName[0]}</div>`}
      <div><div class="brand-name">${siteName}</div><div class="brand-sub">Tax Invoice / Proforma Invoice</div></div>
    </div>
    <div class="inv-right">
      <h1>INVOICE</h1>
      <p>${order.orderNumber}</p>
      <p>Date: ${orderDate}</p>
      <p>Printed: ${printDate}</p>
    </div>
  </div>

  <div class="meta">
    <div class="mc">
      <h4>Customer</h4>
      <p><strong>${u.name || sa.name || '—'}</strong><br/>
      📞 ${u.phone || sa.phone || '—'}</p>
    </div>
    <div class="mc">
      <h4>Ship To</h4>
      <p>${sa.addressLine1 || '—'}${sa.addressLine2 ? ', '+sa.addressLine2 : ''}<br/>
      ${sa.city || ''}, ${sa.state || ''}<br/>
      PIN: ${sa.pincode || '—'}</p>
    </div>
    <div class="mc">
      <h4>Order Info</h4>
      <p>Order #: <strong>${order.orderNumber}</strong><br/>
      Date: ${orderDate}<br/>
      Payment: <strong style="color:${order.paymentMethod==='cod'?'#f59e0b':'#10b981'}">${(order.paymentMethod||'').toUpperCase()}</strong><br/>
      Status: <strong>${statusLabel(order.orderStatus)}</strong></p>
    </div>
  </div>

  ${order.trackingNumber ? `<div class="track">🚚 <strong>Shipped via ${order.courierName||'Courier'}</strong> &nbsp;·&nbsp; Tracking: <strong>${order.trackingNumber}</strong></div>` : ''}

  <table>
    <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="sum">
    <div class="sr"><span>Subtotal</span><span>₹${Number(order.subtotal||0).toLocaleString('en-IN')}</span></div>
    <div class="sr"><span>Shipping</span><span>${(order.shippingCharge||0)===0?'<span style="color:#10b981;font-weight:600">FREE</span>':'₹'+order.shippingCharge}</span></div>
    ${(order.discount||0)>0?`<div class="sr" style="color:#10b981"><span>Discount</span><span>-₹${Number(order.discount).toLocaleString('en-IN')}</span></div>`:''}
    <div class="st"><span>Grand Total</span><span>₹${Number(order.total||0).toLocaleString('en-IN')}</span></div>
  </div>

  <div class="foot">
    <p style="font-size:13px;font-weight:600;color:#475569;margin-bottom:4px">Thank you for your business! — ${siteName}</p>
    <p>This is a computer generated invoice.</p>
  </div>
  </div>
  <div class="no-print">
    <button class="pbtn" onclick="window.print()">🖨️ Print / Save PDF</button>
    <button class="cbtn" onclick="window.close()">Close</button>
  </div>
  </body></html>`)
  win.document.close()
}

// Dropdown mein sirf ye 4 options
const STATUS_OPT = ['confirmed','shipped','delivered','cancelled']
const SC: Record<string,string> = { placed:'bg-blue-100 text-blue-700', confirmed:'bg-blue-100 text-blue-700', processing:'bg-blue-100 text-blue-700', shipped:'bg-orange-100 text-orange-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' }

// placed/processing → "confirmed" ke roop mein dikhao
const displayStatus = (s: string) => (s === 'placed' || s === 'processing') ? 'confirmed' : s
const displayLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const BOX_WEIGHTS_KG: Record<string, number> = { A28: 8.46, A06: 10.75, A08: 15.68, A31: 34.18, A18: 2.42 }
const BOX_SIZES = ['A28','A06','A08','A31','A18'] as const
type BoxSize = typeof BOX_SIZES[number]

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<any>(null)
  const [updating, setUpdating] = useState<string|null>(null)
  const [siteSettings, setSiteSettings] = useState<any>(null)

  useEffect(() => { api.get('/settings').then(r => setSiteSettings(r.data.settings)).catch(() => {}) }, [])

  // Ship modal state
  const [shipOpen, setShipOpen] = useState(false)
  const [shipOrder, setShipOrder] = useState<any>(null)
  const [shipProvider, setShipProvider] = useState<'delhivery'|'shiprocket'|'manual'>('delhivery')
  const [manualTracking, setManualTracking] = useState('')
  const [manualCourier, setManualCourier] = useState('')
  const [boxes, setBoxes] = useState<Record<BoxSize, { qty: number; weight: number }>>({ A28:{qty:0,weight:0}, A06:{qty:0,weight:0}, A08:{qty:0,weight:0}, A31:{qty:0,weight:0}, A18:{qty:0,weight:0} })
  const [shipErr, setShipErr] = useState('')
  const [shipping, setShipping] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter) p.set('status', filter)
      const res = await api.get(`/orders?${p}`)
      setOrders(res.data.orders); setTotal(res.data.total)
    } catch {} finally { setLoading(false) }
  }, [filter, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (orderId: string, status: string) => {
    if (status === 'shipped') { openShipModal(orders.find(o => o._id === orderId)); return }
    setUpdating(orderId)
    try {
      await api.put(`/orders/${orderId}/status`, { status, note: `Updated to ${status} by admin` })
      toast.success(`Marked as ${status}`)
      fetchOrders()
      if (selected?._id === orderId) setSelected((s:any) => s ? {...s, orderStatus: status} : null)
    } catch { toast.error('Update failed') } finally { setUpdating(null) }
  }

  const openShipModal = (order: any) => {
    if (!order) return
    setShipOrder(order)
    setShipProvider('delhivery')
    setManualTracking(order.trackingNumber || '')
    setManualCourier(order.courierName || '')
    setBoxes({ A28:{qty:0,weight:0}, A06:{qty:0,weight:0}, A08:{qty:0,weight:0}, A31:{qty:0,weight:0}, A18:{qty:0,weight:0} })
    setShipErr('')
    setShipOpen(true)
  }

  const handleBoxQty = (size: BoxSize, val: string) => {
    const qty = Math.max(0, Number(val) || 0)
    setBoxes(prev => ({ ...prev, [size]: { qty, weight: qty * BOX_WEIGHTS_KG[size] } }))
  }

  const totalBoxQty = BOX_SIZES.reduce((s, k) => s + boxes[k].qty, 0)
  const totalBoxWeightKg = BOX_SIZES.reduce((s, k) => s + boxes[k].weight, 0)

  const submitShip = async () => {
    if (!shipOrder) return
    setShipErr('')

    const payload: any = { status: 'shipped', shipProvider }

    if (shipProvider === 'delhivery') {
      if (totalBoxQty === 0) { setShipErr('Kam se kam 1 box add karo.'); return }
      payload.packingDetails = BOX_SIZES.filter(k => boxes[k].qty > 0).map(k => ({ boxType: k, quantity: boxes[k].qty, totalWeight: boxes[k].weight }))
    } else {
      if (!manualTracking.trim()) { setShipErr('Tracking ID required.'); return }
      payload.trackingNumber = manualTracking.trim()
      payload.courierName = manualCourier.trim() || (shipProvider === 'shiprocket' ? 'Shiprocket' : manualCourier)
    }

    try {
      setShipping(true)
      await api.put(`/orders/${shipOrder._id}/status`, payload)
      toast.success('Order shipped! WhatsApp message bhi gaya 🚚')
      setShipOpen(false)
      fetchOrders()
      if (selected?._id === shipOrder._id) setSelected((s:any) => s ? { ...s, orderStatus: 'shipped' } : null)
    } catch (e: any) {
      setShipErr(e?.response?.data?.message || 'Shipping failed.')
    } finally { setShipping(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Orders</h1><p className="text-gray-500 text-sm">{total} total orders</p></div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className="input w-44 py-2">
          <option value="">All Orders</option>
          {STATUS_OPT.map(s => <option key={s} value={s} className="capitalize">{displayLabel(s)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Items</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th">Tracking</th><th className="th">Date</th><th className="th">Actions</th><th className="th">Invoice</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_,i) => (
                <tr key={i}><td colSpan={9} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>
              )) : orders.map(o => (
                <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                  <td className="td"><p className="font-bold text-sm">#{o.orderNumber}</p></td>
                  <td className="td"><p className="font-medium text-sm">{o.user?.name||'—'}</p><p className="text-xs text-gray-400">{o.user?.phone}</p></td>
                  <td className="td text-gray-600">{o.items?.length||0} item(s)</td>
                  <td className="td font-bold">₹{o.total}</td>
                  <td className="td"><span className={`badge ${o.paymentMethod==='cod'?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'} uppercase`}>{o.paymentMethod}</span></td>
                  <td className="td">
                    <div className="relative inline-block">
                      <select value={displayStatus(o.orderStatus)} onChange={e => updateStatus(o._id, e.target.value)} disabled={updating===o._id||o.orderStatus==='cancelled'}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-0 cursor-pointer appearance-none pr-6 ${SC[o.orderStatus]||'bg-gray-100 text-gray-600'} disabled:opacity-60`}>
                        {STATUS_OPT.map(s => <option key={s} value={s} className="bg-white text-gray-900 capitalize">{displayLabel(s)}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                    </div>
                  </td>
                  <td className="td text-xs text-gray-500">
                    {o.trackingNumber ? <span className="text-green-600 font-medium">{o.courierName}: {o.trackingNumber}</span> : '—'}
                    {o.wa?.trackingSent && <span className="ml-1 text-green-500 text-xs">✓WA</span>}
                  </td>
                  <td className="td text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="td">
                    <div className="flex gap-1">
                      <button onClick={() => setSelected(o)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="View"><Eye size={15}/></button>
                      <button onClick={() => openShipModal(o)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg" title="Ship"><Truck size={15}/></button>
                    </div>
                  </td>
                  <td className="td">
                    <button onClick={() => printInvoice(o, siteSettings)} className="p-1.5 text-pink-500 hover:bg-pink-50 rounded-lg" title="Invoice"><FileText size={15}/></button>
                  </td>
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

      {/* ── Order Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg">#{selected.orderNumber}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => printInvoice(selected, siteSettings)}
                  className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                  <FileText size={13}/> Invoice
                </button>
                <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">✕</button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-1">Customer</p><p className="font-bold">{selected.user?.name}</p><p className="text-gray-500 text-xs">{selected.user?.phone}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-1">Payment</p><p className="font-bold text-lg">₹{selected.total}</p><p className="uppercase text-orange-500 text-xs font-bold">{selected.paymentMethod}</p></div>
              </div>
              {selected.trackingNumber && (
                <div className="bg-green-50 rounded-xl p-3 text-sm">
                  <p className="text-green-700 font-semibold">🚚 {selected.courierName}: {selected.trackingNumber}</p>
                  {selected.wa?.trackingSent && <p className="text-green-500 text-xs mt-1">✓ WhatsApp tracking sent</p>}
                </div>
              )}
              <div><p className="font-bold text-sm mb-2">Delivery Address</p>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600"><p>{selected.shippingAddress?.name} · {selected.shippingAddress?.phone}</p><p>{selected.shippingAddress?.addressLine1}{selected.shippingAddress?.addressLine2?`, ${selected.shippingAddress.addressLine2}`:''}</p><p>{selected.shippingAddress?.city}, {selected.shippingAddress?.state} – {selected.shippingAddress?.pincode}</p></div>
              </div>
              <div><p className="font-bold text-sm mb-2">Items</p>
                <div className="space-y-2">{selected.items?.map((item:any,i:number) => (
                  <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    <img src={item.image||`https://placehold.co/48x48/FCE4EC/E91E63?text=P`} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt=""/>
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
                      className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold border transition-colors ${displayStatus(selected.orderStatus)===s?SC[s]+' border-transparent':'border-gray-200 hover:border-primary hover:text-primary'}`}>
                      {displayLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => printInvoice(selected, siteSettings)}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-pink-400 text-pink-500 hover:bg-pink-500 hover:text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  <FileText size={15}/> Print Invoice
                </button>
                <button onClick={() => openShipModal(selected)}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  <Truck size={16}/> Ship Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Ship Modal ── */}
      {shipOpen && shipOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShipOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg flex items-center gap-2"><Truck size={18} className="text-orange-500"/> Ship #{shipOrder.orderNumber}</h2>
              <button onClick={() => setShipOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Customer summary */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="font-semibold">{shipOrder.shippingAddress?.name}</p>
                <p className="text-gray-500 text-xs">{shipOrder.shippingAddress?.city}, {shipOrder.shippingAddress?.state} – {shipOrder.shippingAddress?.pincode}</p>
                <p className="text-orange-600 font-bold mt-1">₹{shipOrder.total} · {shipOrder.paymentMethod?.toUpperCase()}</p>
              </div>

              {/* Provider selector */}
              <div>
                <p className="text-sm font-semibold mb-2">Courier Provider</p>
                <div className="flex gap-2">
                  {([['delhivery','📦 Delhivery'],['shiprocket','🚀 Shiprocket'],['manual','✏️ Manual']] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setShipProvider(val)}
                      className={`flex-1 text-xs py-2 px-3 rounded-xl border font-semibold transition-colors ${shipProvider===val?'bg-orange-500 text-white border-orange-500':'border-gray-200 hover:border-orange-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delhivery: Box packing */}
              {shipProvider === 'delhivery' && (
                <div>
                  <p className="text-sm font-semibold mb-2">📦 Packing Details</p>
                  <div className="space-y-2">
                    {BOX_SIZES.map(size => (
                      <div key={size} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                        <span className="text-sm font-bold w-8 text-gray-700">{size}</span>
                        <input type="number" min="0" placeholder="Qty" value={boxes[size].qty || ''}
                          onChange={e => handleBoxQty(size, e.target.value)}
                          className="input flex-1 py-1.5 text-sm"/>
                        <span className="text-xs text-gray-400 w-16 text-right">
                          {boxes[size].weight > 0 ? `${(boxes[size].weight*1000).toLocaleString()}g` : `${BOX_WEIGHTS_KG[size]}kg/box`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {totalBoxQty > 0 && (
                    <div className="mt-2 bg-orange-50 rounded-xl p-2.5 text-sm flex justify-between">
                      <span className="text-orange-700 font-medium">{totalBoxQty} box{totalBoxQty>1?'es':''}</span>
                      <span className="text-orange-700 font-bold">{(totalBoxWeightKg*1000).toLocaleString()}g ({totalBoxWeightKg.toFixed(2)} kg)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Shiprocket / Manual: Tracking ID */}
              {(shipProvider === 'shiprocket' || shipProvider === 'manual') && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Tracking ID *</label>
                    <input type="text" value={manualTracking} onChange={e => setManualTracking(e.target.value)}
                      placeholder="Enter AWB / tracking number" className="input w-full py-2 text-sm"/>
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Courier Name</label>
                    <input type="text" value={manualCourier} onChange={e => setManualCourier(e.target.value)}
                      placeholder={shipProvider === 'shiprocket' ? 'e.g. Delhivery, DTDC' : 'Courier name'} className="input w-full py-2 text-sm"/>
                  </div>
                </div>
              )}

              {shipErr && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">⚠️ {shipErr}</div>}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShipOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={submitShip} disabled={shipping} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  {shipping ? 'Processing...' : <><Truck size={15}/> {shipProvider === 'delhivery' ? 'Generate AWB' : 'Mark Shipped'}</>}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">WhatsApp tracking message customer ko automatically jayega</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
