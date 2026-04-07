import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Enter email and password'); return }
    setLoading(true)
    try {
      const res = await api.post('/admin/auth/login', { email, password })
      localStorage.setItem('adminToken', res.data.token)
      localStorage.setItem('adminUser', JSON.stringify(res.data.admin))
      toast.success(`Welcome, ${res.data.admin.name}! 🎉`)
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/40">
            <span className="text-white font-bold text-3xl">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reteiler Admin</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in with your admin credentials</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input pl-10" placeholder="admin@reteiler.in" required autoFocus />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base justify-center">
              {loading ? 'Signing in…' : 'Sign In to Admin'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl text-xs text-blue-700">
            <p className="font-bold mb-1">Default Credentials (first run):</p>
            <p>Email: <strong>admin@reteiler.in</strong></p>
            <p>Password: <strong>Admin@123</strong></p>
            <p className="mt-1 text-blue-500">⚠️ Change after first login!</p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">Reteiler Admin Panel v2.0</p>
      </div>
    </div>
  )
}

export default LoginPage
