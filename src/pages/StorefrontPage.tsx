import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Trash2, Image as ImageIcon, Loader2, Save, X, ExternalLink, Pencil, Check, Smartphone, Globe, Tag } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface Banner {
  _id?: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  type: 'hero' | 'promo' | 'category' | 'hanging';
  isActive?: boolean;
  showOnMobile?: boolean;
  showOnWebsite?: boolean;
  sortOrder: number;
  category?: any; // can be object or string ID
}

interface Category {
  _id: string;
  name: string;
}

// ── Per-card component for hanging images ─────────────────────────────────────
const HangingCard: React.FC<{ 
  banner: Banner; 
  categories: Category[]; 
  onDelete: (id: string) => void; 
  onRefresh: () => void 
}> = ({ banner, categories, onDelete, onRefresh }) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(banner.title || '');
  const [showMobile, setShowMobile] = useState(banner.showOnMobile !== false);
  const [showWeb, setShowWeb] = useState(banner.showOnWebsite !== false);
  const [catId, setCatId] = useState(banner.category?._id || banner.category || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/banners/${banner._id}`, { 
        title: label, 
        showOnMobile: showMobile, 
        showOnWebsite: showWeb,
        category: catId || null
      });
      setEditing(false);
      onRefresh();
    } catch { } finally { setSaving(false); }
  };

  const toggleMobile = async () => {
    const next = !showMobile;
    setShowMobile(next);
    try { await api.put(`/banners/${banner._id}`, { showOnMobile: next }); onRefresh(); } catch { setShowMobile(!next); }
  };

  const toggleWeb = async () => {
    const next = !showWeb;
    setShowWeb(next);
    try { await api.put(`/banners/${banner._id}`, { showOnWebsite: next }); onRefresh(); } catch { setShowWeb(!next); }
  };

  const anyActive = showMobile || showWeb;

  return (
    <div className="flex flex-col items-center" style={{ width: 110 }}>
      {/* Rope string */}
      <div style={{ width: 2, height: 36, background: 'linear-gradient(180deg,#f43f8e,#c084fc)', borderRadius: 1 }} />
      {/* Card */}
      <div className={`rounded-2xl overflow-hidden shadow-md border-2 transition-all relative ${
        anyActive ? 'border-pink-200' : 'border-slate-200 opacity-50'
      }`} style={{ width: 100 }}>
        <img src={banner.image} alt="hanging" className="w-full object-cover" style={{ height: 140 }} />
        {/* Label badge below image */}
        {label && <div className="bg-pink-500 text-white text-[10px] font-black text-center py-1 px-2 truncate">{label}</div>}
        {banner.category && !editing && (
          <div className="absolute top-1 left-1 bg-white/90 text-primary text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-primary/20">
            {categories.find(c => c._id === (banner.category?._id || banner.category))?.name || 'Cat'}
          </div>
        )}
      </div>
      {/* Action bar */}
      <div className="flex flex-col gap-2 mt-2 w-full px-1">
        {editing ? (
          <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-pink-100 shadow-xl z-10 absolute bottom-0 left-0 right-0">
            <label className="text-[8px] font-bold text-slate-400 uppercase">Label</label>
            <input
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-[10px] w-full outline-none focus:border-pink-500"
            />
            <label className="text-[8px] font-bold text-slate-400 uppercase mt-1">Assignment</label>
            <select 
              value={catId} 
              onChange={e => setCatId(e.target.value)}
              className="border border-slate-200 rounded-md px-1 py-1 text-[9px] w-full bg-white"
            >
              <option value="">🏠 Home Page</option>
              {categories.map(c => <option key={c._id} value={c._id}>📂 {c.name}</option>)}
            </select>
            <div className="flex gap-1 mt-2">
              <button onClick={save} disabled={saving} className="p-1 bg-green-500 text-white rounded-lg hover:bg-green-600 flex-1 flex justify-center">
                {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button onClick={() => setEditing(false)} className="p-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex-1 flex justify-center">
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <button onClick={() => setEditing(true)} title="Edit settings" className="p-1 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 flex-1 flex justify-center">
              <Pencil size={12} />
            </button>
            <button onClick={toggleMobile} title={showMobile ? 'Hide on Mobile' : 'Show on Mobile'} className={`p-1 rounded-lg transition-colors flex-1 flex justify-center ${
              showMobile ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <Smartphone size={12} />
            </button>
            <button onClick={toggleWeb} title={showWeb ? 'Hide on Website' : 'Show on Website'} className={`p-1 rounded-lg transition-colors flex-1 flex justify-center ${
              showWeb ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <Globe size={12} />
            </button>
            <button onClick={() => onDelete(banner._id!)} title="Delete" className="p-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex-1 flex justify-center">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StorefrontPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHang, setUploadingHang] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewByCat, setViewByCat] = useState<string>('all');

  const [newBanner, setNewBanner] = useState<Banner>({
    title: '', subtitle: '', image: '', link: '',
    type: 'hero', showOnMobile: true, showOnWebsite: true,
    sortOrder: 0, category: ''
  });

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/all');
      setCategories(res.data.categories || []);
    } catch { }
  };

  const fetchBanners = async () => {
    try {
      // Changed to use all=true so category-specific ones are visible
      const res = await api.get('/banners?all=true');
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
      fd.append('image', e.target.files[0]);
      fd.append('folder', 'banners');
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewBanner({ ...newBanner, image: res.data.url });
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (b: Banner) => {
    setEditId(b._id!);
    setNewBanner({
      title: b.title || '',
      subtitle: b.subtitle || '',
      image: b.image || '',
      link: b.link || '',
      type: b.type,
      showOnMobile: b.showOnMobile !== false,
      showOnWebsite: b.showOnWebsite !== false,
      sortOrder: b.sortOrder || 0,
      category: b.category?._id || b.category || ''
    });
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!newBanner.image) return toast.error('Image is required');
    setSaving(true);
    try {
      const payload = { ...newBanner, category: newBanner.category || null };
      if (editId) {
        await api.put(`/banners/${editId}`, payload);
        toast.success('Updated successfully');
      } else {
        await api.post('/banners', payload);
        toast.success('Added successfully');
      }
      setShowAdd(false);
      setEditId(null);
      setNewBanner({ title: '', subtitle: '', image: '', link: '', type: 'hero', sortOrder: 0, category: '' });
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    try { await api.delete(`/banners/${id}`); toast.success('Deleted'); fetchBanners(); } catch { toast.error('Delete failed'); }
  };

  const handleHangingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingHang(true);
    try {
      const currentCat = viewByCat === 'all' ? (newBanner.category || null) : viewByCat;
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('folder', 'hanging');
        const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        await api.post('/banners', {
          title: '', subtitle: '', link: '',
          image: res.data.url,
          type: 'hanging', sortOrder: 0, isActive: true,
          category: currentCat
        });
      }
      toast.success(`${files.length} image(s) added!`);
      fetchBanners();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingHang(false);
    }
  };

  // Filter logic for visual display
  const filteredBanners = banners.filter(b => {
    if (viewByCat === 'all') return true;
    const bCatId = b.category?._id || b.category;
    if (viewByCat === 'home') return !bCatId;
    return bCatId === viewByCat;
  });

  const heroBanners = filteredBanners.filter(b => b.type !== 'hanging');
  const hangingBanners = filteredBanners.filter(b => b.type === 'hanging');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Storefront Manager</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase font-black text-slate-400">Viewing:</span>
              <select 
                value={viewByCat} 
                onChange={e => setViewByCat(e.target.value)}
                className="text-[10px] font-bold text-primary bg-primary/5 border-none rounded-md px-2 py-0.5 outline-none cursor-pointer"
              >
                <option value="all">🌐 All Pages Combined</option>
                <option value="home">🏠 Home Page Banners</option>
                {categories.map(c => <option key={c._id} value={c._id}>📂 {c.name} Category</option>)}
              </select>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            if (showAdd) { setEditId(null); setNewBanner({ title: '', subtitle: '', image: '', link: '', type: 'hero', sortOrder: 0, category: '' }); }
            setShowAdd(!showAdd);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95 text-sm"
        >
          {showAdd ? <X size={18} /> : <Plus size={18} />}
          {showAdd ? 'Cancel' : 'Add New Banner'}
        </button>
      </div>

      {showAdd && (
        <div className="card p-6 border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            {editId ? <Pencil size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
            {editId ? 'Edit Banner Details' : 'Create New Promo Banner'}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label text-[10px] uppercase font-black text-slate-500">Banner Image *</label>
                <div className="mt-1 relative group">
                  {newBanner.image ? (
                    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border-2 border-primary group">
                      <img src={newBanner.image} className="w-full h-full object-cover" alt="Preview" />
                      <button onClick={() => setNewBanner({...newBanner, image: ''})} className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-[21/9] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-white cursor-pointer transition-all">
                      {uploading ? <Loader2 className="animate-spin text-primary" size={32} /> : (
                        <>
                          <ImageIcon className="text-slate-400 mb-2" size={32} />
                          <span className="text-[11px] text-slate-500 font-bold px-4 text-center">Click to upload banner (21:9 ratio recommended)</span>
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
                  <label className="label text-[10px] uppercase font-black text-slate-500">Assignment</label>
                  <select className="input mt-1 bg-white h-10 text-[11px] font-bold" value={newBanner.category || ''} onChange={e => setNewBanner({...newBanner, category: e.target.value})}>
                    <option value="">Home Page (Global)</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-[10px] uppercase font-black text-slate-500">Banner Type</label>
                  <select className="input mt-1 bg-white h-10 text-[11px] font-bold" value={newBanner.type} onChange={e => setNewBanner({...newBanner, type: e.target.value as any})}>
                    <option value="hero">Hero (Main Slider)</option>
                    <option value="promo">Promo (Static Card)</option>
                    <option value="category">Category Highlight</option>
                    <option value="hanging">Hanging Strip</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-[10px] uppercase font-black text-slate-500">Title</label>
                  <input className="input mt-1 h-10 text-[11px]" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} />
                </div>
                <div>
                  <label className="label text-[10px] uppercase font-black text-slate-500">Redirect Link</label>
                  <input className="input mt-1 h-10 text-[11px]" placeholder="/category/slug" value={newBanner.link} onChange={e => setNewBanner({...newBanner, link: e.target.value})} />
                </div>
              </div>
              <button 
                onClick={handleAdd}
                disabled={saving || uploading}
                className="btn-primary w-full py-3 justify-center gap-2 mt-2 rounded-[1.2rem] shadow-xl shadow-primary/20"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                Confirm & {editId ? 'Update' : 'Publish'} Banner
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
        <>
          {/* Main Banners Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-bold text-slate-800">Main Banners</h2>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase ml-1">Hero & Promo</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {heroBanners.map((banner) => (
                <div key={banner._id} className="card overflow-hidden group border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[21/9] relative">
                    <img src={banner.image} className="w-full h-full object-cover" alt={banner.title} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => handleEdit(banner)} className="p-3 bg-white text-primary rounded-xl hover:scale-110 transition-transform shadow-xl"><Pencil size={20} /></button>
                      <button onClick={() => handleDelete(banner._id!)} className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform shadow-xl"><Trash2 size={20} /></button>
                    </div>
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm ${banner.type === 'hero' ? 'bg-indigo-500' : 'bg-orange-500'}`}>{banner.type}</span>
                      {banner.category && (
                        <span className="px-2 py-1 bg-white text-primary text-[8px] font-bold rounded-lg border border-primary/20 shadow-sm inline-flex items-center gap-1">
                          <Tag size={10} /> {categories.find(c => c._id === (banner.category?._id || banner.category))?.name || 'Linked'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{banner.title || 'Untitled Banner'}</h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{banner.link || 'No path set'}</p>
                  </div>
                </div>
              ))}
              {heroBanners.length === 0 && (
                <div className="lg:col-span-3 py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <ImageIcon size={40} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">No banners found for this filter</p>
                </div>
              )}
            </div>
          </div>

          {/* Hanging Images Section */}
          <div className="card p-6 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">🪢 Hanging Keychain Images</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Portrait (9:16) images that sway dynamically</p>
                </div>
              </div>
              <label className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-bold text-xs cursor-pointer transition-all active:scale-95 ${uploadingHang ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-pink-500 text-white hover:shadow-lg shadow-pink-500/20'}`}>
                {uploadingHang ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                {uploadingHang ? 'Uploading...' : 'Upload Portrait Images'}
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingHang} onChange={handleHangingUpload} />
              </label>
            </div>

            {hangingBanners.length === 0 ? (
              <div className="border-2 border-dashed border-slate-100 rounded-2xl p-12 flex flex-col items-center text-center">
                <ImageIcon className="text-slate-200 mb-2" size={40} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No hanging items found</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-5 justify-center py-4 bg-slate-50/30 rounded-3xl border border-slate-50">
                {hangingBanners.map((banner) => (
                  <HangingCard 
                    key={banner._id} 
                    banner={banner} 
                    categories={categories}
                    onDelete={handleDelete} 
                    onRefresh={fetchBanners} 
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Info Section */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            💡 Pro Tip: Customizing Category Pages
          </h2>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Select a category from the dropdown above to manage banners specifically for that category. 
            <strong>Home Page</strong> banners are global and show by default if no category banner is set.
          </p>
        </div>
        <LayoutGrid size={180} className="absolute -bottom-10 -right-10 text-white/5 group-hover:scale-110 transition-transform duration-700" />
      </div>
    </div>
  );
};

export default StorefrontPage;
