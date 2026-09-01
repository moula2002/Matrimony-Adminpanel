import { useEffect, useState } from "react";
import { Check, X, Loader2, Image as ImageIcon } from "lucide-react";

export default function ImageApprovalsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/media_uploads/")) return `https://server.familiess.com${imagePath}`;
    return `https://server.familiess.com/media_uploads/${imagePath}`;
  };

  const fetchUsersWithPhotos = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("https://server.familiess.com/api/admin/photo-approvals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load users photos");
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithPhotos();
  }, []);

  const toggleApproval = async (userId, photoUrl, newStatus) => {
    try {
      const res = await fetch(`https://server.familiess.com/api/admin/photo-approvals/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ photoUrl, approved: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update photo approval status");
      }

      const data = await res.json();

      // Update local state
      setUsers(users.map(u => {
        if (u._id === userId) {
          const newPhotos = data.photos;
          const pendingCount = newPhotos.filter(p => typeof p === 'string' || (p && !p.approved)).length;
          
          if (pendingCount === 0) {
            return null; // Remove user if no pending photos
          }
          
          return {
            ...u,
            profile: {
              ...u.profile,
              rawPhotos: newPhotos,
              photos: newPhotos
            }
          };
        }
        return u;
      }).filter(Boolean));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Image Verification</h1>
          <p className="text-sm text-slate-600">Review and approve user photos</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
            <span className="text-slate-600 text-sm font-medium">Loading photos...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-500">
              No users with photos found.
            </div>
          ) : (
            users.map((user) => {
              const name = user.profile?.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || "No Profile Set";
              const photos = user.profile?.rawPhotos || user.profile?.photos || [];

              const pendingPhotos = photos.filter(photo => {
                const isObject = typeof photo === 'object' && photo !== null;
                const isApproved = isObject ? photo.approved : false;
                return !isApproved;
              });

              if (pendingPhotos.length === 0) return null;

              return (
                <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{name}</h3>
                      <p className="text-xs text-slate-500">{user.uid} • {user.email || user.phone}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                      Pending
                    </span>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      {pendingPhotos.map((photo, index) => {
                        const isObject = typeof photo === 'object' && photo !== null;
                        const photoUrl = isObject ? photo.url : photo;
                        const isApproved = isObject ? photo.approved : false; // Default to false if string (pending)

                        return (
                          <div key={index} className="flex flex-col gap-2 relative group">
                            <div 
                              className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative cursor-pointer"
                              onClick={() => setSelectedImage(getImageUrl(photoUrl))}
                            >
                              <img
                                src={getImageUrl(photoUrl)}
                                alt={`User photo ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 right-2">
                                {isApproved ? (
                                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => toggleApproval(user._id, photoUrl, false)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all bg-white text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                              <button
                                onClick={() => toggleApproval(user._id, photoUrl, true)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Full size view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
