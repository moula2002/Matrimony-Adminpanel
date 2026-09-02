import { useEffect, useState } from "react";
import { Check, X, Loader2, Image as ImageIcon, ShieldCheck } from "lucide-react";

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

  const handleApproval = async (userId, photoUrl, status) => {
    let reason = "";
    if (status === 'rejected') {
      const inputReason = window.prompt("Optional: Enter a reason for rejection", "Photo does not meet verification requirements.");
      if (inputReason === null) return; // cancelled
      reason = inputReason || "Photo does not meet verification requirements.";
    }

    try {
      const res = await fetch(`https://server.familiess.com/api/admin/photo-approvals/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ photoUrl, status, reason }),
      });

      if (!res.ok) {
        throw new Error("Failed to update photo approval status");
      }

      const data = await res.json();

      // Update local state
      setUsers(users.map(u => {
        if (u._id === userId) {
          return {
            ...u,
            profile: {
              ...u.profile,
              rawPhotos: data.photos,
              photos: data.photos
            }
          };
        }
        return u;
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Image Verification</h1>
          </div>
          <p className="text-sm text-slate-500 md:ml-11">Review and approve user profile photos securely.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <span className="text-slate-600 font-medium">Fetching photos for review...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border-l-4 border-red-500 p-6 shadow-sm flex items-start gap-4">
          <X className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Error Loading Data</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
          {users.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">All caught up!</h3>
              <p className="text-slate-500 max-w-sm">There are no pending user photos requiring verification at this time.</p>
            </div>
          ) : (
            users.map((user) => {
              const name = user.profile?.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || "No Profile Set";
              const photos = user.profile?.rawPhotos || user.profile?.photos || [];

              if (photos.length === 0) return null;

              return (
                <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/60 flex flex-col w-full overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-800 text-xl truncate" title={name}>{name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">{user.uid}</span>
                        <span className="text-sm text-slate-500 truncate" title={user.email || user.phone}>{user.email || user.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {photos.map((photo, index) => {
                        const isObject = typeof photo === 'object' && photo !== null;
                        const photoUrl = isObject ? photo.url : photo;
                        
                        // Defensive check: skip rendering if URL is corrupted or missing
                        if (!photoUrl || typeof photoUrl !== 'string' || photoUrl === '[object Object]') {
                           return null; 
                        }

                        let status = "pending";
                        let reason = "";

                        if (isObject) {
                          if (photo.verificationStatus) {
                            status = photo.verificationStatus;
                          } else if (photo.approved === true) {
                            status = "approved";
                          }
                          reason = photo.rejectionReason || "";
                        } else {
                          status = "pending";
                        }

                        return (
                          <div key={index} className="flex flex-col gap-3 group relative w-full">
                            <div
                              className="aspect-[4/5] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 relative cursor-pointer ring-2 ring-transparent transition-all duration-300 hover:ring-indigo-500/30 w-full"
                              onClick={() => setSelectedImage(getImageUrl(photoUrl))}
                            >
                              <img
                                src={getImageUrl(photoUrl)}
                                alt={`User photo ${index + 1}`}
                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${status === 'rejected' ? 'opacity-40 grayscale blur-[1px]' : ''}`}
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              <div className="absolute top-2 right-2 z-10">
                                {status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    <Check className="w-3 h-3" /> Approved
                                  </span>
                                )}
                                {status === 'pending' && (
                                  <span className="inline-flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                                    Pending
                                  </span>
                                )}
                                {status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    <X className="w-3 h-3" /> Rejected
                                  </span>
                                )}
                              </div>
                            </div>

                            {status === 'rejected' && reason && (
                              <div className="text-[11px] text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100/50 text-center leading-snug">
                                <span className="font-semibold block mb-0.5">Reason:</span>
                                {reason}
                              </div>
                            )}

                            {status === 'pending' && (
                              <div className="flex flex-col 2xl:flex-row gap-2 w-full">
                                <button
                                  onClick={() => handleApproval(user._id, photoUrl, 'rejected')}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold border-2 transition-all bg-white text-red-600 border-red-100 hover:border-red-500 hover:bg-red-50 hover:text-red-700 focus:ring-4 focus:ring-red-500/20 w-full"
                                >
                                  <X className="w-4 h-4" /> Reject
                                </button>
                                <button
                                  onClick={() => handleApproval(user._id, photoUrl, 'approved')}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 focus:ring-4 focus:ring-emerald-500/20 w-full"
                                >
                                  <Check className="w-4 h-4" /> Approve
                                </button>
                              </div>
                            )}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md transition-opacity"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 sm:-right-12 sm:top-0 text-white/70 hover:text-white p-2 transition-colors hover:bg-white/10 rounded-full"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Detailed user photo view"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
