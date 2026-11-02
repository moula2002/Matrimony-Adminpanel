import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowUpDown,
  FileText,
  UserCheck,
  X
} from "lucide-react";
import { fetchVipEnquiries, fetchVipEnquiryDetails, updateVipEnquiryStatus, getImageUrl } from "../../utils/api";
import MatrimonyProfileModal from "../../components/MatrimonyProfileModal";

const STATUS_CONFIG = {
  New: {
    label: "New",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "bg-blue-500",
    dot: "bg-blue-500"
  },
  Contacted: {
    label: "Contacted",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    badge: "bg-amber-500",
    dot: "bg-amber-500"
  },
  Interested: {
    label: "Interested",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    badge: "bg-purple-500",
    dot: "bg-purple-500"
  },
  Converted: {
    label: "Converted",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-500",
    dot: "bg-emerald-500"
  },
  Closed: {
    label: "Closed",
    bg: "bg-slate-100 text-slate-700 border-slate-300",
    badge: "bg-slate-500",
    dot: "bg-slate-400"
  }
};

const STATUS_OPTIONS = ["New", "Contacted", "Interested", "Converted", "Closed"];

export default function VipShaadiPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewingProfileUser, setViewingProfileUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "all");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest'
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status update modal state
  const [statusModalEnquiry, setStatusModalEnquiry] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Reveal authorized contact numbers state
  const [revealedContacts, setRevealedContacts] = useState({});

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadEnquiries = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchVipEnquiries({
        page,
        limit,
        status: selectedStatus,
        search: searchTerm,
        startDate,
        endDate
      });

      if (data && data.success) {
        setEnquiries(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);

        // Check if query param specifies enquiry ID
        const targetId = searchParams.get("id") || searchParams.get("enquiryId");
        if (targetId) {
          const matched = (data.data || []).find((e) => e._id === targetId);
          if (matched) {
            setSelectedEnquiry(matched);
          } else {
            // Fetch individually
            fetchVipEnquiryDetails(targetId)
              .then((res) => {
                if (res?.data) setSelectedEnquiry(res.data);
              })
              .catch(() => {});
          }
        }
      } else {
        setEnquiries([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load VIP Familiess enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [page, selectedStatus, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadEnquiries();
  };

  const handleQuickStatusChange = async (enquiryId, status) => {
    setUpdatingId(enquiryId);
    try {
      const res = await updateVipEnquiryStatus(enquiryId, {
        status,
        note: `Status updated to ${status} via VIP Familiess management panel`
      });

      if (res && res.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e._id === enquiryId ? { ...e, status, statusHistory: res.data?.statusHistory || e.statusHistory } : e))
        );
        if (selectedEnquiry && selectedEnquiry._id === enquiryId) {
          setSelectedEnquiry((prev) => ({
            ...prev,
            status,
            statusHistory: res.data?.statusHistory || prev.statusHistory
          }));
        }
        showToast(`Enquiry status updated to "${status}"`);
      }
    } catch (err) {
      alert(err.message || "Failed to update enquiry status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDetailedStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalEnquiry || !newStatus) return;

    setUpdatingId(statusModalEnquiry._id);
    try {
      const res = await updateVipEnquiryStatus(statusModalEnquiry._id, {
        status: newStatus,
        note: statusNote.trim() || `Status updated to ${newStatus}`
      });

      if (res && res.success) {
        setEnquiries((prev) =>
          prev.map((item) =>
            item._id === statusModalEnquiry._id
              ? { ...item, status: newStatus, statusHistory: res.data?.statusHistory || item.statusHistory }
              : item
          )
        );

        if (selectedEnquiry && selectedEnquiry._id === statusModalEnquiry._id) {
          setSelectedEnquiry(res.data);
        }

        showToast(`Status successfully changed to ${newStatus}`);
        setStatusModalEnquiry(null);
        setStatusNote("");
      }
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleRevealContact = (id) => {
    setRevealedContacts((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Sorted list based on client sortOrder toggle
  const displayedEnquiries = useMemo(() => {
    return [...enquiries].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.requestTimestamp || 0).getTime();
      const dateB = new Date(b.createdAt || b.requestTimestamp || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [enquiries, sortOrder]);

  // Statistics calculation for summary badges
  const stats = useMemo(() => {
    const counts = { total: totalCount, New: 0, Contacted: 0, Interested: 0, Converted: 0, Closed: 0 };
    enquiries.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      }
    });
    return counts;
  }, [enquiries, totalCount]);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">VIP Familiess Enquiries</h1>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              Exclusive Management
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review and manage personalized matrimony requests submitted by mobile app users
          </p>
        </div>

        <button
          onClick={loadEnquiries}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm font-semibold shadow-2xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => { setSelectedStatus("all"); setPage(1); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedStatus === "all"
              ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20"
              : "bg-white border-slate-200 text-slate-800 hover:border-purple-300"
          }`}
        >
          <div className="text-xs uppercase tracking-wider font-semibold opacity-80">Total Enquiries</div>
          <div className="text-2xl font-black mt-1">{totalCount}</div>
        </button>

        {STATUS_OPTIONS.map((statusKey) => {
          const cfg = STATUS_CONFIG[statusKey];
          const isSelected = selectedStatus === statusKey;
          return (
            <button
              key={statusKey}
              onClick={() => { setSelectedStatus(statusKey); setPage(1); }}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span>{cfg.label}</span>
              </div>
              <div className="text-2xl font-black mt-1">
                {enquiries.filter((e) => e.status === statusKey).length}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by User Name, User ID, Profile ID, Email or Phone..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                title="Start Date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                title="End Date"
              />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Toggle sorting order"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-purple-600" />
              <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Listing */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            <span className="text-sm font-medium">Loading VIP Familiess enquiries...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">Unable to load enquiries</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
            <button
              onClick={loadEnquiries}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        ) : displayedEnquiries.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <UserCheck className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No VIP Familiess Enquiries Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no VIP Familiess enquiries matching your filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">User & Profile</th>
                  <th className="py-4 px-6">Registered Mobile</th>
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Current Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedEnquiries.map((enquiry) => {
                  const userObj = enquiry.user || {};
                  const userProfile = userObj.profile || {};
                  const displayName = enquiry.name || userProfile.name || userObj.email || "Matrimony Member";
                  const uid = userObj.uid || (enquiry.matrimonyProfileId ? String(enquiry.matrimonyProfileId).slice(-6).toUpperCase() : "N/A");
                  const profilePhoto = userProfile.rawPhotos?.[0]?.url || userProfile.photos?.[0] || null;
                  const reqDate = new Date(enquiry.createdAt || enquiry.requestTimestamp || Date.now());
                  const statusCfg = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.New;
                  const isContactRevealed = revealedContacts[enquiry._id];

                  return (
                    <tr key={enquiry._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* User & Profile */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="h-11 w-11 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                            {profilePhoto ? (
                              <img
                                src={getImageUrl(profilePhoto)}
                                alt={displayName}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff`;
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-purple-600 bg-purple-100">
                                {displayName[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-purple-600 transition-colors">
                              {displayName}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>Profile ID: <strong className="font-mono text-purple-700">{uid}</strong></span>
                              {userObj._id && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] text-slate-400">UID: {userObj._id.slice(-6)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Registered Mobile Number (Authorized Access) */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {isContactRevealed ? (
                              <span className="font-mono font-bold text-slate-800 text-xs">
                                {enquiry.phone || userObj.phone || "No phone registered"}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-500 text-xs tracking-wider">
                                {enquiry.phone
                                  ? `${enquiry.phone.slice(0, 3)}•••••${enquiry.phone.slice(-2)}`
                                  : "••••••••••"}
                              </span>
                            )}
                            <button
                              onClick={() => toggleRevealContact(enquiry._id)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors ml-1"
                              title={isContactRevealed ? "Hide Number" : "Reveal Authorized Number"}
                            >
                              {isContactRevealed ? "Hide" : "Reveal"}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{enquiry.email || userObj.email || "No email"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Request Date & Time */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5 text-xs text-slate-700">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <span>{reqDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{reqDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </td>

                      {/* Enquiry Status (Badge & Quick Switch) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.badge}`} />
                            {statusCfg.label}
                          </span>

                          {/* Quick Status Select */}
                          <select
                            value={enquiry.status}
                            disabled={updatingId === enquiry._id}
                            onChange={(e) => handleQuickStatusChange(enquiry._id, e.target.value)}
                            className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
                            title="Quick Change Status"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedEnquiry(enquiry)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors border border-purple-200"
                            title="View Full Enquiry Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Details
                          </button>

                          <button
                            onClick={() => {
                              if (userObj && (userObj.profile || userObj._id)) {
                                setViewingProfileUser(userObj);
                              } else {
                                alert("No linked matrimony profile details found for this enquiry.");
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200"
                            title="Inspect Matrimony Profile"
                          >
                            <User className="h-3.5 w-3.5" />
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalCount} total enquiries)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ENQUIRY DETAILS MODAL */}
      {/* ========================================================= */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 via-white to-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">VIP Familiess Enquiry Details</h2>
                  <p className="text-xs text-slate-500 font-mono">Enquiry ID: {selectedEnquiry._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* User Overview Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-lg border border-purple-200">
                    {(selectedEnquiry.name || "U")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{selectedEnquiry.name || "User"}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>User ID: <strong className="font-mono text-slate-800">{selectedEnquiry.user?._id || "N/A"}</strong></span>
                      <span>•</span>
                      <span>Profile UID: <strong className="font-mono text-purple-700">{selectedEnquiry.user?.uid || "N/A"}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Direct Profile Viewer Button */}
                <button
                  onClick={() => {
                    if (selectedEnquiry.user) {
                      setViewingProfileUser(selectedEnquiry.user);
                    } else {
                      alert("No linked matrimony profile details found.");
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Open Matrimony Profile
                </button>
              </div>

              {/* Status & Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact & Access</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registered Phone:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedEnquiry.phone || selectedEnquiry.user?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email Address:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedEnquiry.email || selectedEnquiry.user?.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">User Verified:</span>
                      <span className={selectedEnquiry.user?.isVerified ? "text-emerald-600 font-semibold" : "text-amber-600 font-medium"}>
                        {selectedEnquiry.user?.isVerified ? "Verified User" : "Pending Verification"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Membership Tier:</span>
                      <span className="font-semibold text-purple-700">
                        {selectedEnquiry.user?.premiumMembership?.planType || "Free Plan"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Submission Details</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Request Date:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(selectedEnquiry.createdAt || selectedEnquiry.requestTimestamp).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Request Time:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(selectedEnquiry.createdAt || selectedEnquiry.requestTimestamp).toLocaleTimeString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Current Status:</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${STATUS_CONFIG[selectedEnquiry.status]?.bg || "bg-slate-100"}`}>
                        {selectedEnquiry.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Admin:</span>
                      <span className="font-semibold text-slate-700">
                        {selectedEnquiry.assignedAdmin?.profile?.name || selectedEnquiry.assignedAdmin?.email || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update Action Box */}
              <div className="p-5 bg-purple-50/70 rounded-2xl border border-purple-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    Update Enquiry Status
                  </h4>
                  <span className="text-xs text-purple-700 font-medium">Reflects immediately on save</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((st) => {
                    const isCurrent = selectedEnquiry.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleQuickStatusChange(selectedEnquiry._id, st)}
                        disabled={updatingId === selectedEnquiry._id || isCurrent}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isCurrent
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:border-purple-400 hover:bg-purple-100/40"
                        }`}
                      >
                        {isCurrent ? `✓ ${st}` : `Set ${st}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status History / Audit Trail */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  Status History & Notes
                </h4>
                {selectedEnquiry.statusHistory && selectedEnquiry.statusHistory.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {selectedEnquiry.statusHistory.map((hist, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{hist.status}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">
                              by {hist.changedBy?.profile?.name || hist.changedBy?.email || "Admin"}
                            </span>
                          </div>
                          {hist.note && (
                            <p className="text-slate-600 mt-1 italic">"{hist.note}"</p>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(hist.changedAt).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic text-center">
                    No status transition history recorded yet. Initial status: {selectedEnquiry.status}.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matrimony Profile Modal */}
      <MatrimonyProfileModal
        user={viewingProfileUser}
        isOpen={Boolean(viewingProfileUser)}
        onClose={() => setViewingProfileUser(null)}
      />
    </div>
  );
}
