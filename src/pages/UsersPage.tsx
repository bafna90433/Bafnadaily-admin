import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)

  const fetch = () => {
    setLoading(true)
    const p = new URLSearchParams({ limit: '50' })
    if (search) p.set('search', search)
    api.get(`/admin/users?${p}`).then(r => { setUsers(r.data.users); setTotal(r.data.total) }).finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [search])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Customers</h1><p className="text-gray-500 text-sm">{total} registered users</p></div>
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 py-2 w-60" placeholder="Search name or phone…"/></div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="th">User</th><th className="th">Phone</th><th className="th">Email</th><th className="th">Addresses</th><th className="th">Joined</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? Array(8).fill(0).map((_,i) => <tr key={i}><td colSpan={5} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>) :
              users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="td"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">{u.name?.[0]?.toUpperCase()||'?'}</div><p className="font-semibold text-sm">{u.name||'No name'}</p></div></td>
                  <td className="td text-gray-600">+91 {u.phone}</td>
                  <td className="td text-gray-500 text-xs">{u.email||'—'}</td>
                  <td className="td text-gray-500">{u.addresses?.length||0}</td>
                  <td className="td text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && users.length === 0 && <div className="text-center py-16 text-gray-400">No users found</div>}
      </div>
    </div>
  )
}

export default UsersPage
