import { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Trash2, Plus, Edit } from "lucide-react";

export default function BannerPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newBannerLink, setNewBannerLink] = useState("");
  const [editingBanner, setEditingBanner] = useState(null);

  const token = localStorage.getItem("adminToken");
  const baseUrl = "https://server.familiess.com";

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load banners");
      const data = await res.json();
      setBanners(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("media", selectedFile);

      // 1. Upload file to /api/upload
      const uploadRes = await fetch(`${baseUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image");
      const uploadData = await uploadRes.json();

      // 2. Create banner record with the uploaded image URL and link
      const url = uploadData.urls && uploadData.urls.length > 0 ? uploadData.urls[0] : null;
      if (url) {
        const createRes = await fetch(`${baseUrl}/api/admin/banners`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: `Banner ${Date.now()}`,
            imageUrl: url,
            linkUrl: newBannerLink,
            isActive: true
          })
        });
        if (!createRes.ok) throw new Error("Failed to save banner record");
      }

      // Refresh list
      fetchBanners();
      setShowAddModal(false);
      setSelectedFile(null);
      setNewBannerLink("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const res = await fetch(`${baseUrl}/api/admin/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete banner");

      setBanners(banners.filter(b => b._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleStatus = async (banner) => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/banners/${banner._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !banner.isActive })
      });
      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();
      setBanners(banners.map(b => b._id === banner._id ? updated : b));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      setError("");
      
      let finalImageUrl = editingBanner.imageUrl;

      // If a new file is selected, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append("media", selectedFile);

        const uploadRes = await fetch(`${baseUrl}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!uploadRes.ok) throw new Error("Failed to upload new image");
        const uploadData = await uploadRes.json();
        
        if (uploadData.urls && uploadData.urls.length > 0) {
          finalImageUrl = uploadData.urls[0];
        }
      }

      const res = await fetch(`${baseUrl}/api/admin/banners/${editingBanner._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          linkUrl: newBannerLink,
          imageUrl: finalImageUrl
        })
      });
      
      if (!res.ok) throw new Error("Failed to update banner");

      const updated = await res.json();
      setBanners(banners.map(b => b._id === editingBanner._id ? updated : b));
      
      setEditingBanner(null);
      setSelectedFile(null);
      setNewBannerLink("");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${baseUrl}${url}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Banners</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload and manage app banners (images are uploaded like profile photos)
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Banner
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Add New Banner</h3>
              <button
                onClick={() => !uploading && setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBannerSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    disabled={uploading}
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={newBannerLink}
                    onChange={(e) => setNewBannerLink(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? "Uploading..." : "Upload Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Edit Banner</h3>
              <button
                onClick={() => {
                  if (uploading) return;
                  setEditingBanner(null);
                  setSelectedFile(null);
                  setNewBannerLink("");
                }}
                disabled={uploading}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Replace Image (Optional)</label>
                  <div className="flex items-center gap-4 mb-3">
                    <img 
                      src={getFullImageUrl(editingBanner.imageUrl)} 
                      alt="Current banner" 
                      className="w-20 h-12 object-cover rounded border border-slate-200"
                    />
                    <span className="text-xs text-slate-500">Current image</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://example.com or /about"
                    value={newBannerLink}
                    onChange={(e) => setNewBannerLink(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (uploading) return;
                    setEditingBanner(null);
                    setSelectedFile(null);
                    setNewBannerLink("");
                  }}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {banners.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>No banners found. Upload some to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div key={banner._id} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 flex flex-col">
                  <div className="h-48 w-full bg-slate-200">
                    <img
                      src={getFullImageUrl(banner.imageUrl)}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-white">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Link</label>
                    <div className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 truncate" title={banner.linkUrl || "No link provided"}>
                      {banner.linkUrl ? (
                        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                          {banner.linkUrl}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No link provided</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between bg-white border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={banner.isActive}
                          onChange={() => toggleStatus(banner)}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        <span className="ml-2 text-xs font-medium text-slate-600">
                          {banner.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBanner(banner);
                          setNewBannerLink(banner.linkUrl || "");
                          setSelectedFile(null);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit banner"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBanner(banner._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
