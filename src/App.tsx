import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import AddProductPage from './pages/AddProductPage'
import OrdersPage from './pages/OrdersPage'
import CategoriesPage from './pages/CategoriesPage'
import UsersPage from './pages/UsersPage'
import CustomersPage from './pages/CustomersPage'
import StorefrontPage from './pages/StorefrontPage'
import CouponsPage from './pages/CouponsPage'
import SettingsPage from './pages/SettingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import InventoryPage from './pages/InventoryPage'
import StaffReportsPage from './pages/StaffReportsPage'
import MobileLayoutPage from './pages/MobileLayoutPage'
import WebsiteLayoutPage from './pages/WebsiteLayoutPage'

const isAdmin = () => !!localStorage.getItem('adminToken')

const Guard: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isAdmin() ? <>{children}</> : <Navigate to="/login" replace />

const App: React.FC = () => (
  <BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        style: { fontFamily: 'Inter', fontSize: '14px' },
        success: { iconTheme: { primary: '#E91E63', secondary: '#fff' } },
      }}
    />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Guard>
            <AdminLayout />
          </Guard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/add" element={<AddProductPage />} />
        <Route path="products/edit/:id" element={<AddProductPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="banners" element={<StorefrontPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="staff-reports" element={<StaffReportsPage />} />
        <Route path="mobile-layout" element={<MobileLayoutPage />} />
        <Route path="website-layout" element={<WebsiteLayoutPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default App
