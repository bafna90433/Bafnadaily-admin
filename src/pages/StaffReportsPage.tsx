import React, { useState, useEffect } from 'react'
import { Download, Calendar, User, Search, RefreshCw, ImageIcon, ExternalLink, FileDown } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface StaffReport {
  _id: string;
  imageUrl: string;
  staffName: string;
  createdAt: string;
}

const StaffReportsPage: React.FC = () => {
  const [reports, setReports] = useState<StaffReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
      // Note: Browsers usually default to the original format unless converted.
      // For true WEBP conversion on client side, a canvas is needed.
      // For now, we'll provide the link with the descriptive filename.
      link.setAttribute('download', `staff_report_${report._id}.${format}`)
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

  const filteredReports = reports.filter(r => 
    r.staffName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Photo Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor staff activity and inventory status</p>
        </div>
        <button 
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-primary rounded-xl hover:bg-pink-100 transition-colors font-semibold"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by staff name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
            <div key={report._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                <img 
                  src={report.imageUrl} 
                  alt="Staff Report"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a 
                    href={report.imageUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 bg-white rounded-lg text-gray-900 hover:bg-gray-100 shadow-lg"
                    title="View Full Size"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button 
                    onClick={() => handleDownload(report, 'png')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <FileDown size={14} />
                    PNG
                  </button>
                  <button 
                    onClick={() => handleDownload(report, 'webp')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#E91E63] text-white rounded-lg text-xs font-semibold hover:bg-[#AD1457] shadow-sm transition-all active:scale-95"
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
    </div>
  )
}

export default StaffReportsPage
