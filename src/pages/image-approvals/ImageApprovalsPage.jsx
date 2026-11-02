import { useEffect, useState } from "react";
import {
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye
} from "lucide-react";
import { apiFetch, getAuthHeaders, getImageUrl } from "../../utils/api";

export default function ImageApprovalsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // `${userId}_${photoUrl}`

  // Resilient fallback for failed image requests directly to standard placeholder
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://ui-avatars.com/api/?name=User+Photo&background=f1f5f9&color=64748b";
  };

  const fetchUsersWithPhotos = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch("/admin/photo-approvals", {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to load users photos");
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "An error occurred while loading photo approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithPhotos();
  }, []);

  const handleApproval = async (userId, photoUrl, status) => {
    let reason = "";
    if (status === "rejected") {
      const inputReason = window.prompt("Optional: Enter a reason for rejection", "Photo does not meet verification requirements.");
      if (inputReason === null) return; // cancelled
      reason = inputReason || "Photo does not meet verification requirements.";
    }

    const key = `${userId}_${photoUrl}`;
    try {
      setActionLoading(key);

      const res = await apiFetch(`/admin/photo-approvals/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ photoUrl, status, reason }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update photo approval status");
      }

      const data = await res.json();

      // Update state locally
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u._id === userId) {
            const updatedPhotos = (u.profile?.photos || []).map((p) => {
              const pUrl = typeof p === "object" ? p.url : p;
              if (pUrl === photoUrl) {
                return {
                  ...(typeof p === "object" ? p : { url: p }),
                  verificationStatus: status,
                  approved: status === "approved",
                  rejectionReason: status === "rejected" ? reason : undefined,
                };
              }
              return p;
            });

            return {
              ...u,
              profile: {
                ...u.profile,
                photos: data.photos || updatedPhotos,
              },
            };
          }
          return u;
        })
      );
    } catch (err) {
      alert(err.message || "Failed to update photo verification status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate statistics
  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  users.forEach((user) => {
    const photos = user.profile?.photos || [];
    photos.forEach((photo) => {
      stats.total++;
      const isObj = typeof photo === "object" && photo !== null;
      const status = isObj
        ? photo.verificationStatus || (photo.approved ? "approved" : "pending")
        : "pending";
      if (status === "approved") stats.approved++;
      else if (status === "rejected") stats.rejected++;
      else stats.pending++;
    });
  });

  // Filter users and photos
  const filteredUsers = users
    .map((user) => {
      const name = user.profile?.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || "";
      const matchesSearch =
        !searchTerm.trim() ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return null;

      const photos = (user.profile?.photos || []).filter((photo) => {
        if (!photo) return false;
        const isObj = typeof photo === "object" && photo !== null;
        const status = isObj
          ? photo.verificationStatus || (photo.approved ? "approved" : "pending")
          : "pending";

        if (activeFilter === "pending") return status === "pending";
        if (activeFilter === "approved") return status === "approved";
        if (activeFilter === "rejected") return status === "rejected";
        return true;
      });

      if (photos.length === 0) return null;

      return {
        ...user,
        filteredPhotos: photos,
      };
    })
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Image Verification & Approvals
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, approve, or reject user profile photos. Approved photos are immediately published on the website profile side.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchUsersWithPhotos}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Stats & Filter Tabs */}
      <div className="mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Photos ({stats.total})
          </button>
          <button
            onClick={() => setActiveFilter("pending")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-slate-600 hover:text-amber-700 hover:bg-amber-50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending ({stats.pending})
            {stats.pending > 0 && (
              <span className="h-2 w-2 rounded-full bg-white animate-ping ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveFilter("approved")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setActiveFilter("rejected")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "rejected"
                ? "bg-red-600 text-white shadow-xs"
                : "text-slate-600 hover:text-red-700 hover:bg-red-50"
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Rejected ({stats.rejected})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-slate-600 text-xs font-semibold">Loading user photos...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 shadow-sm flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h3 className="text-red-900 font-bold text-sm">Failed to Load Photo Approvals</h3>
            <p className="text-red-600 text-xs mt-0.5">{error}</p>
            <button
              onClick={fetchUsersWithPhotos}
              className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {activeFilter === "pending"
              ? "No Pending Photos!"
              : activeFilter === "approved"
              ? "No Approved Photos Found"
              : activeFilter === "rejected"
              ? "No Rejected Photos Found"
              : "No User Photos Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {activeFilter === "pending"
              ? "All submitted profile photos have been reviewed and processed."
              : "Try adjusting your search query or filter selection."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const name =
              user.profile?.name ||
              `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() ||
              "No Name Set";
            const photos = user.filteredPhotos || [];

            return (
              <div
                key={user._id}
                className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow duration-200 border border-slate-200/80 flex flex-col w-full overflow-hidden"
              >
                {/* User Card Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-base truncate" title={name}>
                      {name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md shrink-0">
                        {user.uid || "NO UID"}
                      </span>
                      <span className="text-xs text-slate-500 truncate" title={user.email || user.phone}>
                        {user.email || user.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photos Grid */}
                <div className="p-4 flex-1 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {photos.map((photo, index) => {
                      const isObject = typeof photo === "object" && photo !== null;
                      const photoUrl = isObject ? photo.url : photo;

                      if (!photoUrl || typeof photoUrl !== "string" || photoUrl === "[object Object]") {
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
                      }

                      const actionKey = `${user._id}_${photoUrl}`;
                      const isActionBusy = actionLoading === actionKey;
                      const resolvedUrl = getImageUrl(photoUrl);

                      return (
                        <div key={index} className="flex flex-col gap-2 group relative w-full">
                          {/* Image Thumbnail Container */}
                          <div
                            className="aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative cursor-pointer ring-2 ring-transparent transition-all duration-200 hover:ring-indigo-500/40 w-full"
                            onClick={() => setSelectedImage(resolvedUrl)}
                            title="Click to view full photo"
                          >
                            <img
                              src={resolvedUrl}
                              alt={`User photo ${index + 1}`}
                              onError={handleImageError}
                              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                                status === "rejected" ? "opacity-45 grayscale" : ""
                              }`}
                              loading="lazy"
                            />

                            {/* Hover overlay hint */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <Eye className="w-4 h-4" /> View
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2 z-10">
                              {status === "approved" && (
                                <span className="inline-flex items-center gap-1 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                  <Check className="w-3 h-3" /> Approved
                                </span>
                              )}
                              {status === "pending" && (
                                <span className="inline-flex items-center gap-1 bg-amber-500/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                              {status === "rejected" && (
                                <span className="inline-flex items-center gap-1 bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                  <X className="w-3 h-3" /> Rejected
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Rejection Reason Display */}
                          {status === "rejected" && reason && (
                            <div className="text-[10px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 leading-snug">
                              <span className="font-bold">Reason:</span> {reason}
                            </div>
                          )}

                          {/* Approval / Rejection Controls */}
                          <div className="mt-1 flex flex-col gap-1.5 w-full">
                            {status === "pending" && (
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() => handleApproval(user._id, photoUrl, "rejected")}
                                  disabled={isActionBusy}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all bg-white text-red-600 border-red-200 hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {isActionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApproval(user._id, photoUrl, "approved")}
                                  disabled={isActionBusy}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs disabled:opacity-50"
                                >
                                  {isActionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  Approve
                                </button>
                              </div>
                            )}

                            {status === "rejected" && (
                              <button
                                onClick={() => handleApproval(user._id, photoUrl, "approved")}
                                disabled={isActionBusy}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs disabled:opacity-50"
                              >
                                {isActionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Approve Photo
                              </button>
                            )}

                            {status === "approved" && (
                              <button
                                onClick={() => handleApproval(user._id, photoUrl, "rejected")}
                                disabled={isActionBusy}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all bg-white text-slate-500 border-slate-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                {isActionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                Revoke Approval
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/90 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 sm:-right-12 sm:top-0 text-white/80 hover:text-white p-2 transition-colors hover:bg-white/10 rounded-full"
              title="Close Preview"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={selectedImage}
              alt="Detailed user photo view"
              onError={handleImageError}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 bg-black/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
