import React, { useEffect, useState } from 'react'
import { ShoppingCart, User, Clock, Trash2, MessageCircle, AlertCircle, ShoppingBag, Loader2, Eye, X } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AbandonedCartsPage: React.FC = () => {
  const [carts, setCarts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCart, setSelectedCart] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchCarts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/abandoned-carts')
      setCarts(res.data.carts)
    } catch {
      toast.error('Failed to fetch abandoned carts')
    } finally {
      setLoading(false)
    }
  }

  const deleteCart = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this abandoned cart?')) return
    setDeleting(id)
    try {
      await api.delete(`/admin/abandoned-carts/${id}`)
      toast.success('Cart deleted')
      fetchCarts()
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => { fetchCarts() }, [])

  const stats = {
    total: carts.length,
    potentialRevenue: carts.reduce((acc, cart) => {
      return acc + cart.items.reduce((sum: number, it: any) => sum + (it.product?.price || 0) * it.quantity, 0)
    }, 0),
    totalItems: carts.reduce((acc, cart) => acc + cart.items.length, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="text-primary" /> Abandoned Carts
          </h1>
          <p className="text-gray-500 text-sm">Customers who left items in their cart without checking out</p>
        </div>
        <button onClick={fetchCarts} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Refresh List'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-5 bg-gradient-to-br from-white to-blue-50/30">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Abandoned Carts</p>
          <p className="text-3xl font-black text-blue-600">{stats.total}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-white to-green-50/30">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Potential Revenue</p>
          <p className="text-3xl font-black text-green-600">₹{stats.potentialRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-white to-orange-50/30">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Items</p>
          <p className="text-3xl font-black text-orange-600">{stats.totalItems}</p>
        </div>
      </div>

      <div className="card overflow-hidden border-0 shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cart Items</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Active</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4"><div className="h-16 skeleton rounded-2xl" /></td>
                  </tr>
                ))
              ) : carts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center text-slate-300">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <ShoppingBag size={40} className="opacity-20" />
                      </div>
                      <p className="font-black text-lg text-slate-400 tracking-tight">No abandoned carts found</p>
                      <p className="text-sm mt-1">Great! All your customers are completing their orders.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                carts.map(cart => {
                  const cartTotal = cart.items.reduce((sum: number, it: any) => sum + (it.product?.price || 0) * it.quantity, 0)
                  return (
                    <tr key={cart._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black shadow-inner shadow-primary/5">
                            {cart.user?.name?.[0] || <User size={20} />}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 tracking-tight">{cart.user?.name || 'Guest/Unknown'}</p>
                            <p className="text-xs text-slate-400 font-medium">{cart.user?.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                        <div className="flex -space-x-3 overflow-hidden mb-2">
                          {cart.items.slice(0, 4).map((it: any, i: number) => (
                            <img key={i} src={it.product?.images?.[0]?.url || 'https://placehold.co/40x40?text=P'} className="inline-block h-9 w-9 rounded-xl ring-2 ring-white object-cover shadow-sm" alt="" title={it.product?.name} />
                          ))}
                          {cart.items.length > 4 && (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-500 ring-2 ring-white shadow-sm uppercase">
                              +{cart.items.length - 4}
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 line-clamp-1 uppercase tracking-wider opacity-60">
                          {cart.items.map((it: any) => it.product?.name).join(', ')}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-900 text-lg">₹{cartTotal.toLocaleString()}</p>
                        <p className="text-[10px] text-primary/70 uppercase font-black tracking-tighter">{cart.items.length} ITEMS</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock size={14} className="text-primary/50" />
                          <span className="text-xs font-bold">{new Date(cart.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedCart(cart)}
                            className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {cart.user?.phone && (
                            <a 
                              href={`https://wa.me/${cart.user.phone.replace(/\D/g, '')}?text=Hi ${cart.user.name}, we noticed you left some items in your cart at Bafna Daily. Would you like to complete your order?`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-green-500 text-white rounded-xl transition-all shadow-md shadow-green-200 hover:shadow-green-300 hover:scale-105 active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider"
                            >
                              <MessageCircle size={14} /> Recovery
                            </a>
                          )}
                          <button 
                            onClick={() => deleteCart(cart._id)}
                            disabled={deleting === cart._id}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                            title="Delete Cart"
                          >
                            {deleting === cart._id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detailed View Modal ── */}
      {selectedCart && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedCart(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShoppingCart size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cart Details</h2>
                  <p className="text-sm text-slate-500 font-medium">{selectedCart.items.length} items in abandoned cart</p>
                </div>
              </div>
              <button onClick={() => setSelectedCart(null)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Customer Info Card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer Information</p>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-slate-900 tracking-tight">{selectedCart.user?.name || 'Guest'}</p>
                    <p className="text-sm text-slate-500 font-bold">{selectedCart.user?.phone || 'No phone number'}</p>
                    {selectedCart.user?.whatsapp && <p className="text-xs text-green-600 font-black">✓ WhatsApp Verified</p>}
                  </div>
                </div>
                <div className="p-6 bg-primary/5 rounded-[24px] border border-primary/10">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-3">Cart Value</p>
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-primary tracking-tighter">
                      ₹{selectedCart.items.reduce((sum: number, it: any) => sum + (it.product?.price || 0) * it.quantity, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-primary/60 font-black uppercase tracking-wider italic">Potential Sale</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag size={12} /> Items in Cart
                </p>
                <div className="space-y-3">
                  {selectedCart.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[20px] hover:border-primary/20 transition-colors group">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                        <img src={item.product?.images?.[0]?.url || 'https://placehold.co/60x60?text=P'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 truncate tracking-tight">{item.product?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase">{item.product?.sku || 'NO-SKU'}</span>
                          {item.variant && <span className="text-[10px] font-bold bg-primary/5 text-primary px-2 py-0.5 rounded-md uppercase">{item.variant}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">₹{item.product?.price?.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Abandoned {new Date(selectedCart.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => deleteCart(selectedCart._id)}
                  className="px-6 py-3 text-slate-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Delete Cart
                </button>
                {selectedCart.user?.phone && (
                  <a 
                    href={`https://wa.me/${selectedCart.user.phone.replace(/\D/g, '')}?text=Hi ${selectedCart.user.name}, we noticed you left some items in your cart at Bafna Daily. Would you like to complete your order?`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-green-500 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl shadow-green-200 hover:shadow-green-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <MessageCircle size={18} /> Recover via WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg shadow-slate-200/40 flex items-start gap-6">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner">
          <AlertCircle size={32} />
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-lg mb-2 tracking-tight">Recover Lost Revenue</h4>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            Abandoned carts are items that customers have added to their cart but did not complete the purchase. 
            Sending a friendly reminder via WhatsApp can recover up to **20% of these potential sales**! Click the "Recovery" button to start a conversation.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AbandonedCartsPage
