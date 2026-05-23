import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Search, CreditCard, CheckCircle, XCircle, Clock, Copy, ExternalLink } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const METHOD_ICON: Record<string, string> = {
  upi: '📱', card: '💳', netbanking: '🏦', wallet: '👛', emi: '📅',
}
const METHOD_LABEL: Record<string, string> = {
  upi: 'UPI', card: 'Card', netbanking: 'Netbanking', wallet: 'Wallet', emi: 'EMI',
}
const STATUS_STYLE: Record<string, string> = {
  captured:   'bg-green-100 text-green-700',
  authorized: 'bg-blue-100 text-blue-700',
  failed:     'bg-red-100 text-red-700',
  refunded:   'bg-purple-100 text-purple-700',
  created:    'bg-yellow-100 text-yellow-700',
}
const STATUS_DOT: Record<string, string> = {
  captured: '🟢', authorized: '🔵', failed: '🔴', refunded: '🟣', created: '🟡',
}

const RazorpayPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const COUNT = 25

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/razorpay/payments', { params: { count: COUNT, skip } })
      setPayments(res.data.payments || [])
      setTotal(res.data.total || 0)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to fetch payments')
    } finally { setLoading(false) }
  }, [skip])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || p.id?.toLowerCase().includes(q)
      || p.orderNumber?.toLowerCase().includes(q)
      || p.customerName?.toLowerCase().includes(q)
      || p.customerPhone?.includes(q)
      || p.vpa?.toLowerCase().includes(q)
      || p.contact?.includes(q)
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchMethod = !filterMethod || p.method === filterMethod
    return matchSearch && matchStatus && matchMethod
  })

  // Summary
  const captured  = payments.filter(p => p.status === 'captured')
  const failed    = payments.filter(p => p.status === 'failed')
  const refunded  = payments.filter(p => p.status === 'refunded')
  const totalAmt  = captured.reduce((s, p) => s + p.amount, 0)
  const totalFee  = captured.reduce((s, p) => s + (p.fee || 0), 0)
  const totalNet  = captured.reduce((s, p) => s + (p.net || p.amount), 0)

  const methodDetail = (p: any) => {
    if (p.method === 'upi')        return p.vpa || 'UPI'
    if (p.method === 'netbanking') return p.bank || 'Netbanking'
    if (p.method === 'card')       return [p.card_network, p.card_last4 ? `****${p.card_last4}` : ''].filter(Boolean).join(' ')
    if (p.method === 'wallet')     return p.wallet || 'Wallet'
    return ''
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const openOrder = (p: any) => {
    if (p.orderId || p.orderNumber) {
      window.open(`/orders`, '_blank')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={24} className="text-blue-500"/> Razorpay Payments
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Live transactions from Razorpay dashboard</p>
        </div>
        <button onClick={fetchPayments}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 border-l-4 border-green-400">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">₹{totalAmt.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{captured.length} payments</p>
        </div>
        <div className="card p-4 border-l-4 border-orange-300">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Razorpay Fee</p>
          <p className="text-2xl font-bold text-orange-500">₹{totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-0.5">platform charges</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-400">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Net Settlement</p>
          <p className="text-2xl font-bold text-blue-600">₹{totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-0.5">after fee deduction</p>
        </div>
        <div className="card p-4 border-l-4 border-red-300">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-500">{failed.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{refunded.length} refunded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pay ID, Order#, Customer, UPI..." className="input pl-9 py-2 w-full text-sm"/>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input py-2 w-40 text-sm">
          <option value="">All Status</option>
          <option value="captured">✅ Captured</option>
          <option value="failed">❌ Failed</option>
          <option value="refunded">🔄 Refunded</option>
          <option value="authorized">🕐 Authorized</option>
        </select>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="input py-2 w-40 text-sm">
          <option value="">All Methods</option>
          <option value="upi">📱 UPI</option>
          <option value="card">💳 Card</option>
          <option value="netbanking">🏦 Netbanking</option>
          <option value="wallet">👛 Wallet</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="th text-left">Pay ID</th>
                <th className="th text-left">Order #</th>
                <th className="th text-left">Customer</th>
                <th className="th text-left">Method</th>
                <th className="th text-right">Amount</th>
                <th className="th text-right">Fee</th>
                <th className="th text-right">Net</th>
                <th className="th text-left">Status</th>
                <th className="th text-left">Date</th>
                <th className="th text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={10} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>
              )) : filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  {/* Pay ID */}
                  <td className="td">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-blue-600 font-semibold cursor-pointer hover:underline"
                        onClick={() => setSelected(p)}>
                        {p.id?.slice(0, 14)}…
                      </span>
                      <button onClick={() => copy(p.id, 'Pay ID')}
                        className="p-0.5 text-gray-300 hover:text-gray-500" title="Copy">
                        <Copy size={11}/>
                      </button>
                    </div>
                  </td>

                  {/* Order # */}
                  <td className="td">
                    {p.orderNumber
                      ? <span className="font-bold text-gray-800 text-xs bg-gray-100 px-2 py-0.5 rounded-lg">#{p.orderNumber}</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>

                  {/* Customer */}
                  <td className="td">
                    <p className="font-semibold text-sm leading-tight">
                      {p.customerName || <span className="text-gray-400 font-normal text-xs">Unknown</span>}
                    </p>
                    <p className="text-xs text-gray-400">{p.customerPhone || p.contact?.replace('+91','') || ''}</p>
                  </td>

                  {/* Method */}
                  <td className="td">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{METHOD_ICON[p.method] || '💰'}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-700 leading-tight">{METHOD_LABEL[p.method] || p.method || '—'}</p>
                        <p className="text-[10px] text-gray-400 max-w-[110px] truncate leading-tight">{methodDetail(p)}</p>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="td text-right">
                    <span className="font-bold text-gray-800">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                  </td>

                  {/* Fee */}
                  <td className="td text-right">
                    {p.fee > 0
                      ? <span className="text-xs text-orange-500 font-semibold">-₹{Number(p.fee).toFixed(2)}</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>

                  {/* Net */}
                  <td className="td text-right">
                    {p.fee > 0
                      ? <span className="text-xs font-bold text-green-600">₹{Number(p.net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      : <span className="text-xs text-gray-400">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                    }
                  </td>

                  {/* Status */}
                  <td className="td">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_DOT[p.status]} {p.status}
                    </span>
                    {p.status === 'failed' && p.error_description && (
                      <p className="text-[10px] text-red-400 mt-0.5 max-w-[130px] truncate" title={p.error_description}>
                        {p.error_description}
                      </p>
                    )}
                  </td>

                  {/* Date */}
                  <td className="td text-xs text-gray-400 whitespace-nowrap">
                    {p.created_at
                      ? <>
                          <p>{new Date(p.created_at * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-[10px]">{new Date(p.created_at * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </>
                      : '—'}
                  </td>

                  {/* Action */}
                  <td className="td">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelected(p)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="View Details">
                        <CreditCard size={14}/>
                      </button>
                      {p.orderNumber && (
                        <a href={`/orders`} target="_blank" rel="noreferrer"
                          className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg" title="View Order">
                          <ExternalLink size={14}/>
                        </a>
                      )}
                      <button onClick={() => copy(p.id, 'Payment ID')}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Copy Pay ID">
                        <Copy size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <CreditCard size={40} className="mx-auto mb-3 opacity-30"/>
              <p>No payments found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between text-sm">
          <span className="text-gray-400 text-xs">
            Showing {skip + 1}–{Math.min(skip + COUNT, total)} of {total} payments
          </span>
          <div className="flex gap-2">
            <button onClick={() => setSkip(s => Math.max(0, s - COUNT))} disabled={skip === 0}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 font-medium">← Prev</button>
            <button onClick={() => setSkip(s => s + COUNT)} disabled={skip + COUNT >= total}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 font-medium">Next →</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CreditCard size={18} className="text-blue-500"/> Payment Details
              </h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Status Banner */}
              <div className={`rounded-xl p-4 ${STATUS_STYLE[selected.status] || 'bg-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg capitalize">{STATUS_DOT[selected.status]} {selected.status}</p>
                    <p className="text-2xl font-bold mt-1">₹{Number(selected.amount).toLocaleString('en-IN')}</p>
                  </div>
                  {selected.fee > 0 && (
                    <div className="text-right text-xs">
                      <p className="opacity-70">Fee: -₹{Number(selected.fee).toFixed(2)}</p>
                      <p className="opacity-70">Tax: -₹{Number(selected.tax).toFixed(2)}</p>
                      <p className="font-bold mt-1">Net: ₹{Number(selected.net).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-0 divide-y divide-gray-50 text-sm">
                {[
                  ['Payment ID',    <div className="flex items-center gap-2 justify-end">
                                      <span className="font-mono text-blue-600 text-xs">{selected.id}</span>
                                      <button onClick={() => copy(selected.id, 'Pay ID')} className="text-gray-400 hover:text-gray-600"><Copy size={12}/></button>
                                    </div>],
                  ['Order #',       selected.orderNumber ? <span className="font-bold">#{selected.orderNumber}</span> : <span className="text-gray-300">—</span>],
                  ['Customer',      selected.customerName || <span className="text-gray-400">Unknown</span>],
                  ['Phone',         selected.customerPhone || selected.contact || '—'],
                  ['Email',         selected.email || '—'],
                  ['Method',        `${METHOD_LABEL[selected.method] || selected.method}${methodDetail(selected) ? ' · ' + methodDetail(selected) : ''}`],
                  ['Amount',        `₹${Number(selected.amount).toLocaleString('en-IN')}`],
                  ['Fee',           selected.fee > 0 ? `-₹${Number(selected.fee).toFixed(2)}` : '—'],
                  ['Tax on Fee',    selected.tax > 0 ? `-₹${Number(selected.tax).toFixed(2)}` : '—'],
                  ['Net Received',  <span className="font-bold text-green-600">₹{Number(selected.net || selected.amount).toFixed(2)}</span>],
                  ['Date & Time',   selected.created_at ? new Date(selected.created_at * 1000).toLocaleString('en-IN') : '—'],
                  ['Order Status',  selected.orderStatus || '—'],
                ].map(([label, val]: any) => (
                  <div key={label} className="flex justify-between items-center gap-2 py-2.5">
                    <span className="text-gray-400 shrink-0 w-28 text-xs font-medium">{label}</span>
                    <span className="font-medium text-right break-all text-sm">{val}</span>
                  </div>
                ))}
              </div>

              {/* Error message */}
              {selected.status === 'failed' && selected.error_description && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">
                  <p className="font-bold mb-1">❌ Failure Reason</p>
                  <p>{selected.error_description}</p>
                </div>
              )}

              {/* Notes */}
              {selected.notes && Object.keys(selected.notes).length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Razorpay Notes</p>
                  {Object.entries(selected.notes).map(([k, v]: any) => (
                    <div key={k} className="flex justify-between text-xs py-1">
                      <span className="text-gray-400">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RazorpayPage
