import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Trash2, Image as ImageIcon, Loader2, Save, X, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface Banner {
  _id?: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  type: 'hero' | 'promo' | 'category';
  sortOrder: number;
}

const StorefrontPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  
  const [newBanner, setNewBanner] = useState<Banner>({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    type: 'hero',
    sortOrder: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/banners');
      setBanners(res.data.banners);
    } catch (err) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', e.target.files[0]);
      fd.append('folder', 'banners');
      const res = await api.post('/upload/images', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewBanner({ ...newBanner, image: res.data.images[0].url });
      toast.success('Banner image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!newBanner.image) return toast.error('Image is required');
    setSaving(true);
    try {
      await api.post('/banners', newBanner);
      toast.success('Banner added successfully');
      setShowAdd(false);
      setNewBanner({ title: '', subtitle: '', image: '', link: '', type: 'hero', sortOrder: 0 });
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Deleted');
      fetchBanners();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Storefront Manager</h1>
          <p className="text-sm text-slate-500">Control banners and promotions on your mobile app</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
        >
          {showAdd ? <X size={20} /> : <Plus size={20} />}
          {showAdd ? 'Cancel' : 'Add New Banner'}
        </button>
      </div>

      {showAdd && (
        <div className="card p-6 border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus size={20} className="text-primary" /> Create New Promo Banner
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label text-xs uppercase font-black text-slate-500">Banner Image *</label>
                <div className="mt-1 relative group">
                  {newBanner.image ? (
                    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border-2 border-primary group">
                      <img src={newBanner.image} className="w-full h-full object-cover" alt="Preview" />
                      <button 
                        onClick={() => setNewBanner({...newBanner, image: ''})}
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-[21/9] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-white cursor-pointer transition-all">
                      {uploading ? (
                        <Loader2 className="animate-spin text-primary" size={32} />
                      ) : (
                        <>
                          <ImageIcon className="text-slate-400 mb-2" size={32} />
                          <span className="text-sm text-slate-500 font-bold">Click to upload banner (21:9 ratio recommended)</span>
                        </>
                      )}
                      <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs uppercase font-black text-slate-500">Title</label>
                  <input 
                    className="input mt-1" 
                    placeholder="Big Summer Sale" 
                    value={newBanner.title}
                    onChange={e => setNewBanner({...newBanner, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label text-xs uppercase font-black text-slate-500">Banner Type</label>
                  <select 
                    className="input mt-1"
                    value={newBanner.type}
                    onChange={e => setNewBanner({...newBanner, type: e.target.value as any})}
                  >
                    <option value="hero">Hero (Home Slider)</option>
                    <option value="promo">Promo (Static Card)</option>
                    <option value="category">Category Special</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label text-xs uppercase font-black text-slate-500">Subtitle</label>
                <input 
                  className="input mt-1" 
                  placeholder="Get up to 50% off on all items" 
                  value={newBanner.subtitle}
                  onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})}
                />
              </div>
              <div>
                <label className="label text-xs uppercase font-black text-slate-500">Redirect Link (Optional)</label>
                <input 
                  className="input mt-1" 
                  placeholder="/category/fashion or product ID" 
                  value={newBanner.link}
                  onChange={e => setNewBanner({...newBanner, link: e.target.value})}
                />
              </div>
              <button 
                onClick={handleAdd}
                disabled={saving || uploading}
                className="btn-primary w-full py-3 justify-center gap-2 mt-4"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Confirm & Publish Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="mt-4 font-bold text-slate-500">Syncing storefront data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner._id} className="card overflow-hidden group">
              <div className="aspect-[21/9] relative">
                <img src={banner.image} className="w-full h-full object-cover" alt={banner.title} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handleDelete(banner._id!)}
                    className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm ${
                    banner.type === 'hero' ? 'bg-indigo-500' : banner.type === 'promo' ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}>
                    {banner.type}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white">
                <h4 className="font-bold text-slate-800">{banner.title || 'Untitled Banner'}</h4>
                <p className="text-xs text-slate-500 truncate">{banner.subtitle || 'No subtitle'}</p>
                {banner.link && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
                    <ExternalLink size={10} /> Links to: {banner.link}
                  </div>
                )}
              </div>
            </div>
          ))}
          {banners.length === 0 && !showAdd && (
            <div className="lg:col-span-3 card p-20 flex flex-col items-center border-dashed border-2">
              <ImageIcon className="text-slate-300 mb-4" size={50} />
              <p className="font-bold text-slate-500">No active banners. Add one to show on your app!</p>
              <button 
                onClick={() => setShowAdd(true)}
                className="mt-4 text-primary font-bold hover:underline"
              >
                + Create your first banner
              </button>
            </div>
          )}
        </div>
      )}

      {/* Featured Section Info */}
      <div className="bg-slate-800 p-8 rounded-[2rem] text-white overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <LayoutGrid className="text-primary" /> Want to control Products & Categories?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            You can mark products as "Featured" or "Trending" in the Inventory page. 
            The mobile app will automatically prioritize those items on the Home Screen.
          </p>
        </div>
        <LayoutGrid size={150} className="absolute -bottom-10 -right-10 text-white/5" />
      </div>
    </div>
  );
};

export default StorefrontPage;
