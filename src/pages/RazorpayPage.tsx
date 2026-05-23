import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Search, CreditCard, Smartphone, Building2, Wallet, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const METHOD_ICON: Record<string, React.ReactNode> = {
  upi:        <span title="UPI">📱</span>,
  card:       <span title="Card">💳</span>,
  netbanking: <span title="Netbanking">🏦</span>,
  wallet:     <span title="Wallet">👛</span>,
  emi:        <span title="EMI">📅</span>,
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

const STATUS_ICON: Record<string, React.ReactNode> = {
  captured:   <CheckCircle size={12}/>,
  authorized: <Clock size={12}/>,
  failed:     <XCircle size={12}/>,
  refunded:   <RefreshCw size={12}/>,
  created:    <AlertCircle size={12}/>,
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
    const matchSearch = !q || p.id?.includes(q) || p.orderNumber?.toLowerCase().includes(q)
      || p.customerName?.toLowerCase().includes(q) || p.customerPhone?.includes(q)
      || p.vpa?.toLowerCase().includes(q) || p.contact?.includes(q)
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchMethod = !filterMethod || p.method === filterMethod
    return matchSearch && matchStatus && matchMethod
  })

  // Summary cards
  const captured   = payments.filter(p => p.status === 'captured')
  const failed     = payments.filter(p => p.status === 'failed')
  const refunded   = payments.filter(p => p.status === 'refunded')
  const totalAmt   = captured.reduce((s, p) => s + p.amount, 0)

  const methodLabel = (p: any) => {
    if (p.method === 'upi')        return p.vpa || 'UPI'
    if (p.method === 'netbanking') return p.bank || 'Netbanking'
    if (p.method === 'card')       return `${p.card_network || ''} ****${p.card_last4 || ''}`
    if (p.method === 'wallet')     return p.wallet || 'Wallet'
    return METHOD_LABEL[p.method] || p.method || '—'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={24} className="text-blue-500"/> Razorpay Payments
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Live transactions from Razorpay</p>
        </div>
        <button onClick={fetchPayments} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">₹{totalAmt.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{captured.length} successful</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Successful</p>
          <p className="text-2xl font-bold text-green-500">{captured.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">captured payments</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Failed</p>
          <p className="text-2xl font-bold text-red-500">{failed.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">failed payments</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Refunded</p>
          <p className="text-2xl font-bold text-purple-500">{refunded.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">refunded payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by Pay ID, Order#, Customer, UPI..."
              className="input pl-9 py-2 w-full text-sm"/>
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input py-2 w-40 text-sm">
            <option value="">All Status</option>
            <option value="captured">✅ Captured</option>
            <option value="failed">❌ Failed</option>
            <option value="refunded">🔄 Refunded</option>
            <option value="authorized">🕐 Authorized</option>
            <option value="created">🆕 Created</option>
          </select>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="input py-2 w-40 text-sm">
            <option value="">All Methods</option>
            <option value="upi">📱 UPI</option>
            <option value="card">💳 Card</option>
            <option value="netbanking">🏦 Netbanking</option>
            <option value="wallet">👛 Wallet</option>
            <option value="emi">📅 EMI</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="th">Pay ID</th>
                <th className="th">Order #</th>
                <th className="th">Customer</th>
                <th className="th">Method</th>
                <th className="th">Amount</th>
                <th className="th">Status</th>
                <th className="th">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>
              )) : filtered.map((p: any) => (
                <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="td">
                    <span className="font-mono text-xs text-blue-600 font-semibold">{p.id}</span>
                  </td>
                  <td className="td">
                    {p.orderNumber
                      ? <span className="font-bold text-sm text-gray-800">#{p.orderNumber}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="td">
                    <p className="font-medium text-sm">{p.customerName || <span className="text-gray-400">Unknown</span>}</p>
                    <p className="text-xs text-gray-400">{p.customerPhone || p.contact || ''}</p>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{METHOD_ICON[p.method] || '💰'}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-700">{METHOD_LABEL[p.method] || p.method || '—'}</p>
                        <p className="text-[10px] text-gray-400 max-w-[120px] truncate">{methodLabel(p)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <span className={`font-bold text-sm ${p.status === 'captured' ? 'text-green-600' : p.status === 'failed' ? 'text-red-500' : 'text-gray-700'}`}>
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="td">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_ICON[p.status]} {p.status}
                    </span>
                    {p.status === 'failed' && p.error_description && (
                      <p className="text-[10px] text-red-400 mt-0.5 max-w-[140px] truncate" title={p.error_description}>{p.error_description}</p>
                    )}
                  </td>
                  <td className="td text-xs text-gray-400">
                    {p.created_at ? new Date(p.created_at * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    <br/>
                    <span className="text-[10px]">{p.created_at ? new Date(p.created_at * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
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
          <span className="text-gray-400 text-xs">{skip + 1}–{Math.min(skip + COUNT, total)} of {total} payments</span>
          <div className="flex gap-2">
            <button onClick={() => setSkip(s => Math.max(0, s - COUNT))} disabled={skip === 0}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium">← Prev</button>
            <button onClick={() => setSkip(s => s + COUNT)} disabled={skip + COUNT >= total}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium">Next →</button>
          </div>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CreditCard size={18} className="text-blue-500"/> Payment Detail
              </h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Status Banner */}
              <div className={`rounded-xl p-3 flex items-center gap-3 ${STATUS_STYLE[selected.status] || 'bg-gray-100'}`}>
                <span className="text-2xl">{selected.status === 'captured' ? '✅' : selected.status === 'failed' ? '❌' : '🔄'}</span>
                <div>
                  <p className="font-bold capitalize">{selected.status}</p>
                  <p className="text-lg font-bold">₹{Number(selected.amount).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                {[
                  ['Payment ID', <span className="font-mono text-blue-600 text-xs">{selected.id}</span>],
                  ['Order #', selected.orderNumber ? `#${selected.orderNumber}` : '—'],
                  ['Customer', selected.customerName || '—'],
                  ['Phone', selected.customerPhone || selected.contact || '—'],
                  ['Email', selected.email || '—'],
                  ['Method', `${METHOD_LABEL[selected.method] || selected.method} — ${methodLabel(selected)}`],
                  ['Date', selected.created_at ? new Date(selected.created_at * 1000).toLocaleString('en-IN') : '—'],
                ].map(([label, val]: any) => (
                  <div key={label} className="flex justify-between items-start gap-2 py-2 border-b border-gray-50">
                    <span className="text-gray-400 shrink-0 w-28">{label}</span>
                    <span className="font-medium text-right break-all">{val}</span>
                  </div>
                ))}
                {selected.status === 'failed' && selected.error_description && (
                  <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600">
                    <p className="font-bold mb-1">❌ Failure Reason</p>
                    <p>{selected.error_description}</p>
                  </div>
                )}
                {selected.notes && Object.keys(selected.notes).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Notes</p>
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
        </div>
      )}
    </div>
  )
}

export default RazorpayPage
