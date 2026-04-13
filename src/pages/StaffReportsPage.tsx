import React, { useState, useEffect } from 'react'
import { Download, Calendar, User, Search, RefreshCw, ImageIcon, ExternalLink, FileDown, Package, X, CheckSquare, Square } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface StaffReport {
  _id: string;
  imageUrl: string;
  staffName: string;
  productCode?: string;
  createdAt: string;
}

const StaffReportsPage: React.FC = () => {
  const [reports, setReports] = useState<StaffReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/staff-reports')
      if (data.success) {
        setReports(data.reports)
      }
    } catch (err: any) {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (report: StaffReport, format: 'png' | 'webp') => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()}...`)
      const response = await fetch(report.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${report.productCode || 'report'}_${report._id}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.dismiss()
      toast.success('Download started')
    } catch (err) {
      toast.dismiss()
      toast.error('Download failed')
    }
  }

  const handleBulkDownload = async () => {
    const toDownload = reports.filter(r => selectedIds.includes(r._id))
    if (toDownload.length === 0) return toast.error('Select items to download')
    
    toast.loading(`Starting download of ${toDownload.length} items...`)
    for (const report of toDownload) {
      // Triggering browser downloads in sequence
      const link = document.createElement('a')
      link.href = report.imageUrl
      link.setAttribute('download', `${report.productCode || 'report'}_${report._id}.png`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Small delay to prevent browser choke
      await new Promise(r => setTimeout(r, 300))
    }
    toast.dismiss()
    toast.success('Bulk download triggered')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selectedIds.length === filteredReports.length) setSelectedIds([])
    else setSelectedIds(filteredReports.map(r => r._id))
  }

  const filteredReports = reports.filter(r => 
    r.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Photo Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Found {filteredReports.length} reports in system</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDownload}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-200"
            >
              <Download size={18} />
              Download ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-primary rounded-xl hover:bg-pink-100 transition-colors font-semibold"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by staff name or product code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={toggleAll}
          className="whitespace-nowrap flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
        >
          {selectedIds.length === filteredReports.length ? <CheckSquare size={18} className="text-primary"/> : <Square size={18}/>}
          Select All
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <RefreshCw className="animate-spin text-primary mb-4" size={32} />
          <p className="text-gray-500">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 opacity-60">
          <ImageIcon size={64} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No reports found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReports.map((report) => (
            <div key={report._id} className={`bg-white rounded-2xl overflow-hidden border transition-all group relative ${selectedIds.includes(report._id) ? 'ring-2 ring-primary border-primary shadow-lg' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
              {/* Selection Checkbox */}
              <button 
                onClick={() => toggleSelect(report._id)}
                className="absolute top-3 left-3 z-10 w-6 h-6 rounded-lg bg-white shadow-md flex items-center justify-center border border-gray-200 hover:scale-110 transition-transform"
              >
                {selectedIds.includes(report._id) ? <CheckSquare size={16} className="text-primary" /> : <div className="w-3 h-3 rounded-sm border border-gray-300" />}
              </button>

              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden cursor-zoom-in" onClick={() => setPreviewImage(report.imageUrl)}>
                <img 
                  src={report.imageUrl} 
                  alt="Staff Report"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {report.productCode && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 border border-white/20">
                    <Package size={10} />
                    {report.productCode}
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-primary border border-pink-100">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{report.staffName}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                      <Calendar size={10} />
                      {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(report, 'png'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <FileDown size={14} />
                    PNG
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(report, 'webp'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#E91E63] text-white rounded-lg text-xs font-semibold hover:bg-[#AD1457] shadow-sm shadow-pink-100 transition-all active:scale-95"
                  >
                    <FileDown size={14} />
                    WEBP
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200"
            alt="Preview"
          />
        </div>
      )}
    </div>
  )
}

export default StaffReportsPage
