import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Phone,
  MessageSquare,
  Video,
  Check,
  ShieldAlert,
  Power,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  fetchAstrologers,
  updateAstrologer,
  publishAstrologer,
  unpublishAstrologer,
  deleteAstrologer,
  getImageUrl
} from "../../utils/api";

const PRESET_SPECIALIZATIONS = [
  "Vedic Astrology",
  "Kundali Matching",
  "Numerology",
  "Tarot Reading",
  "Palmistry",
  "Vastu Shastra",
  "Prashna Kundali",
  "Gemology",
  "Career Astrology",
  "Relationship & Marriage"
];

const PRESET_LANGUAGES = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati"
];

// Robust array parser to handle arrays, JSON strings, comma-separated strings, and fallbacks
export const ensureArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    if (val.includes(",")) {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const trimmed = val.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

const getSpecializations = (astrologer) => {
  if (!astrologer) return [];
  const list = ensureArray(astrologer.specializations);
  if (list.length > 0) return list;
  return ensureArray(astrologer.specialties);
};

const getLanguages = (astrologer) => {
  if (!astrologer) return [];
  return ensureArray(astrologer.languages);
};

const getMethods = (astrologer) => {
  if (!astrologer) return ["chat"];
  const list = ensureArray(astrologer.supportedMethods);
  return list.length > 0 ? list : ["chat"];
};

export default function ManageAstrologersPage() {
  const navigate = useNavigate();
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterPublished, setFilterPublished] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [viewingAstrologer, setViewingAstrologer] = useState(null);
  const [editingAstrologer, setEditingAstrologer] = useState(null);
  const [deletingAstrologer, setDeletingAstrologer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Edit form state
  const editFileInputRef = useRef(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBiography, setEditBiography] = useState("");
  const [editExperienceYears, setEditExperienceYears] = useState("");
  const [editConsultationFee, setEditConsultationFee] = useState("");
  const [editSpecializations, setEditSpecializations] = useState([]);
  const [editLanguages, setEditLanguages] = useState([]);
  const [editMethods, setEditMethods] = useState([]);
  const [editAvailability, setEditAvailability] = useState("online");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editNewPhotoFile, setEditNewPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editFormError, setEditFormError] = useState("");

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAstrologers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAstrologers({
        page,
        limit: 20,
        search: searchTerm,
        availability: filterAvailability,
        isPublished: filterPublished
      });

      if (data && data.success) {
        setAstrologers(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      } else {
        setAstrologers([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load astrologers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAstrologers();
  }, [page, filterAvailability, filterPublished]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadAstrologers();
  };

  // Publish / Unpublish Toggle
  const handleTogglePublish = async (astrologer) => {
    setTogglingId(astrologer._id);
    const willPublish = !astrologer.isPublished;
    try {
      if (willPublish) {
        await publishAstrologer(astrologer._id);
        showToast(`${astrologer.name} is now published and live in AstroChat!`);
      } else {
        await unpublishAstrologer(astrologer._id);
        showToast(`${astrologer.name} has been unpublished from AstroChat.`);
      }

      setAstrologers((prev) =>
        prev.map((a) => (a._id === astrologer._id ? { ...a, isPublished: willPublish } : a))
      );
      if (viewingAstrologer && viewingAstrologer._id === astrologer._id) {
        setViewingAstrologer((prev) => ({ ...prev, isPublished: willPublish }));
      }
    } catch (err) {
      alert(err.message || "Failed to toggle publishing status");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingAstrologer) return;
    setIsDeleting(true);
    try {
      await deleteAstrologer(deletingAstrologer._id);
      showToast(`Astrologer ${deletingAstrologer.name} was successfully removed.`);
      setAstrologers((prev) => prev.filter((a) => a._id !== deletingAstrologer._id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setDeletingAstrologer(null);
    } catch (err) {
      alert(err.message || "Failed to delete astrologer. Active consultations may conflict.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (astrologer) => {
    setEditingAstrologer(astrologer);
    setEditName(astrologer.name || "");
    setEditDescription(astrologer.description || astrologer.about || "");
    setEditBiography(astrologer.biography || astrologer.about || "");
    setEditExperienceYears(String(astrologer.experienceYears || 0));
    setEditConsultationFee(String(astrologer.consultationFee ?? astrologer.pricePerMinute ?? 0));
    setEditSpecializations(getSpecializations(astrologer));
    setEditLanguages(getLanguages(astrologer));
    setEditMethods(getMethods(astrologer));
    setEditAvailability(astrologer.availability?.status || "online");
    setEditIsPublished(astrologer.isPublished || false);
    setEditNewPhotoFile(null);
    setEditPhotoPreview(astrologer.photo || astrologer.photoUrl ? getImageUrl(astrologer.photo || astrologer.photoUrl) : null);
    setEditFormError("");
  };

  const handleEditPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditFormError("Please select a valid image file.");
      return;
    }

    setEditFormError("");
    setEditNewPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setEditPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAstrologer) return;

    if (!editName.trim()) {
      setEditFormError("Astrologer name is required.");
      return;
    }

    if (editSpecializations.length === 0) {
      setEditFormError("At least one specialization is required.");
      return;
    }

    if (editLanguages.length === 0) {
      setEditFormError("At least one language is required.");
      return;
    }

    if (editMethods.length === 0) {
      setEditFormError("At least one consultation method is required.");
      return;
    }

    setIsUpdating(true);
    setEditFormError("");

    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      formData.append("description", editDescription.trim());
      formData.append("biography", editBiography.trim());
      formData.append("experienceYears", editExperienceYears);
      formData.append("consultationFee", editConsultationFee);
      formData.append("specializations", JSON.stringify(editSpecializations));
      formData.append("languages", JSON.stringify(editLanguages));
      formData.append("supportedMethods", JSON.stringify(editMethods));
      formData.append("availabilityStatus", editAvailability);
      formData.append("isPublished", editIsPublished ? "true" : "false");

      if (editNewPhotoFile) {
        formData.append("photo", editNewPhotoFile);
      }

      const res = await updateAstrologer(editingAstrologer._id, formData);
      if (res && res.success) {
        const updated = res.data;
        setAstrologers((prev) =>
          prev.map((a) => (a._id === editingAstrologer._id ? { ...a, ...updated } : a))
        );
        showToast("Astrologer details updated successfully!");
        setEditingAstrologer(null);
      }
    } catch (err) {
      setEditFormError(err.message || "Failed to update astrologer.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Toast Alert */}
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
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Manage Astrologers</h1>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
              {totalCount} Active Profiles
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse, edit, publish, unpublish, and configure astrologer consultation rates and availability
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadAstrologers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm font-semibold shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
            Refresh
          </button>

          <Link
            to="/astrologers/add"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Astrologer
          </Link>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search astrologers by name, specialization, language, or bio..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Availability Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterAvailability}
                onChange={(e) => { setFilterAvailability(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="all">All Availability</option>
                <option value="online">Online</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {/* Published Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <select
                value={filterPublished}
                onChange={(e) => { setFilterPublished(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="all">All Publish Statuses</option>
                <option value="true">Published (Live in App)</option>
                <option value="false">Unpublished (Hidden)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid / Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading astrologers directory...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">Failed to load astrologers</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
          <button
            onClick={loadAstrologers}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      ) : astrologers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Astrologer Profiles Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
            No astrologers match the current filters. Add new astrologers or clear search criteria.
          </p>
          <Link
            to="/astrologers/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20"
          >
            <Plus className="h-4 w-4" />
            Add First Astrologer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {astrologers.map((astrologer) => {
            const photoUrl = getImageUrl(astrologer.photo || astrologer.photoUrl);
            const isOnline = astrologer.availability?.status === "online";
            const isBusy = astrologer.availability?.status === "busy";
            const isToggling = togglingId === astrologer._id;
            const specs = getSpecializations(astrologer);
            const methods = getMethods(astrologer);

            return (
              <div
                key={astrologer._id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-lg ${
                  astrologer.isPublished
                    ? "border-slate-200 hover:border-purple-300"
                    : "border-slate-300 bg-slate-50/50 opacity-90"
                }`}
              >
                {/* Card Top */}
                <div className="p-6">
                  {/* Photo & Availability Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={astrologer.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.name)}&background=8b5cf6&color=fff&size=160`;
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-extrabold text-purple-600 text-2xl bg-purple-100">
                            {astrologer.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Live status dot */}
                      <span
                        className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                          isOnline ? "bg-emerald-500" : isBusy ? "bg-amber-500" : "bg-slate-400"
                        }`}
                        title={`Availability: ${astrologer.availability?.status || "offline"}`}
                      />
                    </div>

                    {/* Publishing Badge */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          astrologer.isPublished
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${astrologer.isPublished ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {astrologer.isPublished ? "Published" : "Unpublished"}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {astrologer.experienceYears} Years Exp.
                      </span>
                    </div>
                  </div>

                  {/* Name & Headline */}
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{astrologer.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {astrologer.description || astrologer.about || ""}
                    </p>
                  </div>

                  {/* Fee & Consultation Methods */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Rate:</span>{" "}
                      <strong className="text-purple-700 text-sm font-black">
                        ₹{astrologer.consultationFee ?? astrologer.pricePerMinute ?? 0}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      {methods.includes("chat") && (
                        <span className="p-1 bg-purple-50 text-purple-700 rounded" title="Chat Supported">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {methods.includes("call") && (
                        <span className="p-1 bg-blue-50 text-blue-700 rounded" title="Audio Call Supported">
                          <Phone className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {methods.includes("video") && (
                        <span className="p-1 bg-rose-50 text-rose-700 rounded" title="Video Call Supported">
                          <Video className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specializations & Languages Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {specs.slice(0, 3).map((spec, i) => (
                      <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {spec}
                      </span>
                    ))}
                    {specs.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                        +{specs.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Bottom */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingAstrologer(astrologer)}
                      className="p-2 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-white transition-colors"
                      title="View Full Profile"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(astrologer)}
                      className="p-2 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-white transition-colors"
                      title="Edit Astrologer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingAstrologer(astrologer)}
                      className="p-2 rounded-lg text-slate-600 hover:text-red-600 hover:bg-white transition-colors"
                      title="Delete Astrologer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 1-Click Publish / Unpublish Toggle Button */}
                  <button
                    onClick={() => handleTogglePublish(astrologer)}
                    disabled={isToggling}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      astrologer.isPublished
                        ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                        : "bg-purple-600 text-white hover:bg-purple-700 shadow-xs"
                    }`}
                  >
                    {isToggling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Power className="h-3.5 w-3.5" />
                    )}
                    {astrologer.isPublished ? "Unpublish" : "Publish to App"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalCount} total astrologers)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW ASTROLOGER MODAL */}
      {/* ========================================================= */}
      {viewingAstrologer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{viewingAstrologer.name}</h2>
                  <p className="text-xs text-slate-500 font-mono">ID: {viewingAstrologer._id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingAstrologer(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                <img
                  src={getImageUrl(viewingAstrologer.photo || viewingAstrologer.photoUrl)}
                  alt={viewingAstrologer.name}
                  className="h-28 w-28 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingAstrologer.name)}&background=8b5cf6&color=fff&size=160`;
                  }}
                />
                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="font-bold text-slate-900 text-lg">{viewingAstrologer.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      viewingAstrologer.isPublished
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-300"
                    }`}>
                      {viewingAstrologer.isPublished ? "Published" : "Unpublished"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{viewingAstrologer.description || viewingAstrologer.about || ""}"</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-700 pt-1">
                    <span>Experience: <strong>{viewingAstrologer.experienceYears} Years</strong></span>
                    <span>•</span>
                    <span>Fee: <strong className="text-purple-700">₹{viewingAstrologer.consultationFee ?? viewingAstrologer.pricePerMinute ?? 0} / session</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="capitalize">{viewingAstrologer.availability?.status || "online"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Biography */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Biography</h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {viewingAstrologer.biography || viewingAstrologer.about || "No detailed biography provided."}
                </div>
              </div>

              {/* Specializations & Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700">Specializations</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {getSpecializations(viewingAstrologer).map((spec, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-semibold border border-purple-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Languages Spoken</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {getLanguages(viewingAstrologer).map((lang, i) => (
                      <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-semibold border border-indigo-200">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  const target = viewingAstrologer;
                  setViewingAstrologer(null);
                  openEditModal(target);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Edit Astrologer
              </button>
              <button
                onClick={() => setViewingAstrologer(null)}
                className="px-5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT ASTROLOGER MODAL */}
      {/* ========================================================= */}
      {editingAstrologer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 via-white to-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Edit Astrologer Profile</h2>
                  <p className="text-xs text-slate-500 font-mono">Modifying: {editingAstrologer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAstrologer(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="overflow-y-auto p-6 space-y-6">
              {editFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              {/* Photo replacement */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow shrink-0">
                  {editPhotoPreview ? (
                    <img src={editPhotoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-purple-600 font-bold">No Photo</div>
                  )}
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-bold text-slate-900">Profile Photo</div>
                  <p className="text-[11px] text-slate-500">
                    Upload a new photo to replace the existing photo or keep current.
                  </p>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 bg-white hover:bg-purple-50 transition-colors"
                  >
                    Replace Photo
                  </button>
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Astrologer Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editConsultationFee}
                    onChange={(e) => setEditConsultationFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editExperienceYears}
                    onChange={(e) => setEditExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Availability Status</label>
                  <select
                    value={editAvailability}
                    onChange={(e) => setEditAvailability(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="online">Online</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Biography</label>
                <textarea
                  rows={4}
                  required
                  value={editBiography}
                  onChange={(e) => setEditBiography(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Specializations selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Specializations</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SPECIALIZATIONS.map((spec) => {
                    const active = editSpecializations.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => {
                          setEditSpecializations((prev) =>
                            prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                          active
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {active && "✓ "} {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Languages</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LANGUAGES.map((lang) => {
                    const active = editLanguages.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => {
                          setEditLanguages((prev) =>
                            prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                          active
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {active && "✓ "} {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consultation Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Supported Methods</label>
                <div className="flex gap-4">
                  {["chat", "call", "video"].map((m) => (
                    <label key={m} className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editMethods.includes(m)}
                        onChange={(e) => {
                          if (e.target.checked) setEditMethods([...editMethods, m]);
                          else if (editMethods.length > 1) setEditMethods(editMethods.filter((item) => item !== m));
                        }}
                        className="rounded text-purple-600"
                      />
                      <span className="capitalize">{m} Session</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Publish Checkbox */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Publish in Mobile App</div>
                  <div className="text-[11px] text-slate-500">Enable to make profile instantly visible in AstroChat</div>
                </div>
                <input
                  type="checkbox"
                  checked={editIsPublished}
                  onChange={(e) => setEditIsPublished(e.target.checked)}
                  className="h-5 w-5 rounded text-purple-600"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingAstrologer(null)}
                  className="px-5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================= */}
      {deletingAstrologer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Delete Astrologer Profile?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <strong className="text-slate-900">{deletingAstrologer.name}</strong>?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 text-left">
                <strong>Note:</strong> Historical consultation sessions will be securely preserved, but this astrologer will be permanently removed from AstroChat.
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingAstrologer(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
