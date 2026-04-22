import React, { useEffect, useState } from 'react'
import { Search, Eye, X, CheckCircle, ExternalLink, Image as ImageIcon, MessageCircle } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const fetch = () => {
    setLoading(true)
    const p = new URLSearchParams({ limit: '100' })
    if (search) p.set('search', search)
    api.get(`/admin/users?${p}`).then(r => { setUsers(r.data.users); setTotal(r.data.total) }).finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [search])

  const isNewUser = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    return diff < 48 * 60 * 60 * 1000 // 48 hours
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Customers</h1><p className="text-gray-500 text-sm">{total} registered users</p></div>
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 py-2 w-60" placeholder="Search name or phone…"/></div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="th">User</th>
              <th className="th">Phone</th>
              <th className="th">Business</th>
              <th className="th text-center">Info</th>
              <th className="th">Joined</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? Array(8).fill(0).map((_,i) => <tr key={i}><td colSpan={6} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>) :
              users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" /> : (u.name?.[0]?.toUpperCase()||'?')}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate">{u.name||'No name'}</p>
                          {isNewUser(u.createdAt) && <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">New</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{u.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td text-gray-600 font-medium">+91 {u.phone}</td>
                  <td className="td">
                    <div className="max-w-[150px]">
                      <p className="text-sm font-semibold truncate">{u.businessName || '—'}</p>
                      {u.gstNumber && <p className="text-[9px] text-primary font-bold">{u.gstNumber}</p>}
                    </div>
                  </td>
                  <td className="td text-center">
                    <div className="flex items-center justify-center gap-2">
                      {u.whatsapp && <span title={`WA: ${u.whatsapp}`}><MessageCircle size={14} className="text-green-500"/></span>}
                      {u.visitingCard && <span title="Visiting Card Available"><ImageIcon size={14} className="text-blue-500"/></span>}
                      {u.addresses?.length > 0 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold" title={`${u.addresses.length} addresses`}>{u.addresses.length}A</span>}
                    </div>
                  </td>
                  <td className="td text-gray-400 text-[11px] whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</td>
                  <td className="td text-right">
                    <button onClick={() => setSelectedUser(u)} className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all text-gray-400 hover:text-primary active:scale-90">
                      <Eye size={16}/>
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && users.length === 0 && <div className="text-center py-16 text-gray-400">No users found</div>}
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)}/>
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative animate-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center font-bold text-primary text-xl">
                  {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full rounded-2xl object-cover" /> : (selectedUser.name?.[0]?.toUpperCase()||'?')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedUser.name || 'Customer'}</h2>
                    {isNewUser(selectedUser.createdAt) && <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-lg">NEW USER</span>}
                  </div>
                  <p className="text-gray-500 text-sm">{selectedUser.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20}/></button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Business Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Business Details</h3>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Shop Name</span>
                      <span className="font-bold">{selectedUser.businessName || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">GST Number</span>
                      <span className="font-bold text-primary">{selectedUser.gstNumber || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">WhatsApp</span>
                      <span className="font-bold">{selectedUser.whatsapp || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Account Stats */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Info</h3>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Joined Date</span>
                      <span className="font-bold">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Customer Type</span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase">{selectedUser.customerType || 'retail'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total Orders</span>
                      <span className="font-bold">{selectedUser.totalOrders || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visiting Card */}
              {selectedUser.visitingCard && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Visiting Card</h3>
                    <a href={selectedUser.visitingCard} target="_blank" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                      View Full <ExternalLink size={12}/>
                    </a>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-[24px] p-2 bg-gray-50/50">
                    <img src={selectedUser.visitingCard} className="w-full rounded-[16px] shadow-sm" alt="Visiting Card" />
                  </div>
                </div>
              )}

              {/* Addresses */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Saved Addresses ({selectedUser.addresses?.length || 0})</h3>
                {selectedUser.addresses?.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedUser.addresses.map((a: any, i: number) => (
                      <div key={i} className="border border-gray-100 rounded-2xl p-4 text-sm bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold">{a.shopName || a.name}</p>
                          {a.isDefault && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">DEFAULT</span>}
                        </div>
                        <p className="text-gray-500 text-xs">{a.addressLine1}, {a.addressLine2 && `${a.addressLine2}, `}{a.city}, {a.state} - {a.pincode}</p>
                        <p className="text-gray-400 text-[10px] mt-2">Phone: {a.phone} | WA: {a.whatsapp || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-2xl text-gray-400 text-xs italic">No addresses saved yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
