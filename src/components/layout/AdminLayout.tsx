import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Tag, Users,
  Image, Ticket, Settings, Menu, X, LogOut, Bell, ExternalLink, UserCheck, BarChart3, QrCode, Boxes, Smartphone, Monitor
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/customers', icon: UserCheck, label: 'Customers' },
  { to: '/users', icon: Users, label: 'Users (All)' },
  { to: '/banners', icon: Image, label: 'Banners' },
  { to: '/coupons', icon: Ticket, label: 'Coupons' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/staff-reports', icon: QrCode, label: 'Staff Reports' },
  { to: '/mobile-layout', icon: Smartphone, label: 'Mobile Layout' },
  { to: '/website-layout', icon: Monitor, label: 'Website Layout' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps { collapsed?: boolean; onClose?: () => void }

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onClose }) => {
  const navigate = useNavigate()
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}')

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/login')
  }

  return (
    <div className={`h-full flex flex-col bg-slate-900 text-white transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-slate-700 h-16 flex-shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
          <span className="font-bold text-xl leading-none">R</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-none">Reteiler</p>
            <p className="text-slate-400 text-[10px] mt-0.5">Admin Panel</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white ml-auto">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}>
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className={`p-3 border-t border-slate-700 flex items-center gap-3 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold border border-primary/40">
          {admin.name?.[0] || 'A'}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{admin.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 capitalize truncate">{admin.role || 'admin'} · {admin.email}</p>
            </div>
            <button onClick={logout} title="Logout" className="p-1.5 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between h-16 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <Menu size={20} />
            </button>
            <button onClick={() => setCollapsed(c => !c)} className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Menu size={20} />
            </button>
            <span className="font-bold text-gray-800 hidden sm:block text-sm">Reteiler Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
              <Bell size={18} />
            </button>
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-primary font-semibold border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
              <ExternalLink size={12} /> View Store
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
