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

              if (photos.length === 0) return null;

              return (
                <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{name}</h3>
                      <p className="text-xs text-slate-500">{user.uid} • {user.email || user.phone}</p>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      {photos.map((photo, index) => {
                        const isObject = typeof photo === 'object' && photo !== null;
                        const photoUrl = isObject ? photo.url : photo;
                        
                        // Default to approved if old string, otherwise check verificationStatus (or legacy approved)
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
                          status = "pending"; // By default treat raw unmapped strings as pending if any leaked
                        }

                        return (
                          <div key={index} className="flex flex-col gap-2 relative group">
                            <div 
                              className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative cursor-pointer"
                              onClick={() => setSelectedImage(getImageUrl(photoUrl))}
                            >
                              <img
                                src={getImageUrl(photoUrl)}
                                alt={`User photo ${index + 1}`}
                                className={`w-full h-full object-cover hover:scale-105 transition-transform duration-300 ${status === 'rejected' ? 'opacity-50 grayscale' : ''}`}
                              />
                              <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                {status === 'approved' && (
                                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    Approved
                                  </span>
                                )}
                                {status === 'pending' && (
                                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    Pending
                                  </span>
                                )}
                                {status === 'rejected' && (
                                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {status === 'rejected' && reason && (
                              <div className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100 text-center leading-tight">
                                {reason}
                              </div>
                            )}

                            {status === 'pending' && (
                              <div className="flex justify-end gap-2 mt-1">
                                <button
                                  onClick={() => handleApproval(user._id, photoUrl, 'rejected')}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all bg-white text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                                <button
                                  onClick={() => handleApproval(user._id, photoUrl, 'approved')}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
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
