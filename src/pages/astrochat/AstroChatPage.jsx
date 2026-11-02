import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Users,
  Eye,
  Plus,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  PhoneCall,
  Video,
  Power,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { fetchAstrologers, fetchConsultations, publishAstrologer, unpublishAstrologer, getImageUrl } from "../../utils/api";

export default function AstroChatPage() {
  const [astrologers, setAstrologers] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [astrologersRes, consultationsRes] = await Promise.allSettled([
        fetchAstrologers({ limit: 100 }),
        fetchConsultations({ limit: 10 })
      ]);

      if (astrologersRes.status === "fulfilled" && astrologersRes.value.success) {
        setAstrologers(astrologersRes.value.data || []);
      }
      if (consultationsRes.status === "fulfilled" && consultationsRes.value.success) {
        setConsultations(consultationsRes.value.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load AstroChat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePublish = async (astrologer) => {
    setTogglingId(astrologer._id);
    const willPublish = !astrologer.isPublished;
    try {
      if (willPublish) {
        await publishAstrologer(astrologer._id);
      } else {
        await unpublishAstrologer(astrologer._id);
      }
      setAstrologers((prev) =>
        prev.map((a) => (a._id === astrologer._id ? { ...a, isPublished: willPublish } : a))
      );
    } catch (err) {
      alert(err.message || "Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const totalAstrologers = astrologers.length;
  const publishedCount = astrologers.filter((a) => a.isPublished).length;
  const unpublishedCount = totalAstrologers - publishedCount;
  const onlineCount = astrologers.filter((a) => a.availability?.status === "online").length;
  const avgFee = totalAstrologers
    ? Math.round(astrologers.reduce((acc, a) => acc + (a.consultationFee || 0), 0) / totalAstrologers)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-150 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              AstroChat Management
              <Sparkles className="h-6 w-6 text-purple-600" />
            </h1>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
              Live Consultations
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Oversee certified astrologers, manage directory availability, and monitor consultation requests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm font-semibold shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
            Refresh
          </button>

          <Link
            to="/astrologers/add"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Astrologer
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Astrologers */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Astrologers</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalAstrologers}</span>
            <span className="text-xs text-slate-500 font-medium">registered profiles</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
            <span>Online now: <strong className="text-emerald-600">{onlineCount}</strong></span>
            <span>•</span>
            <span>Avg Fee: <strong className="text-purple-700">₹{avgFee}</strong></span>
          </div>
        </div>

        {/* Published Astrologers */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Published (In App)</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">{publishedCount}</span>
            <span className="text-xs text-slate-500 font-medium">live for users</span>
          </div>
          <div className="mt-3 text-xs text-emerald-700 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Visible to all mobile app members</span>
          </div>
        </div>

        {/* Unpublished Astrologers */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unpublished (Hidden)</span>
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Power className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-700">{unpublishedCount}</span>
            <span className="text-xs text-slate-500 font-medium">draft/offline</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
            Hidden from mobile app search
          </div>
        </div>

        {/* Quick Management Link */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 text-white shadow-md flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-purple-200">Directory Hub</span>
            <h3 className="text-lg font-bold mt-1">Manage Astrologers</h3>
            <p className="text-xs text-purple-200/80 mt-1">
              Edit rates, change availability, and configure consultation formats.
            </p>
          </div>
          <Link
            to="/astrologers"
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl transition-colors w-fit"
          >
            <span>Open Directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Directory Preview Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Astrologer Directory Preview</h2>
            <p className="text-xs text-slate-500">Quick view and publishing status control</p>
          </div>
          <Link
            to="/astrologers"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            Manage All {totalAstrologers} Profiles
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-500">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
          </div>
        ) : astrologers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No astrologers created yet. Click "Add Astrologer" to create the first profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {astrologers.slice(0, 6).map((astrologer) => {
              const photoUrl = getImageUrl(astrologer.photo);
              return (
                <div
                  key={astrologer._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={photoUrl}
                      alt={astrologer.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.name)}&background=8b5cf6&color=fff`;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{astrologer.name}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {astrologer.experienceYears} yrs • ₹{astrologer.consultationFee}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTogglePublish(astrologer)}
                    disabled={togglingId === astrologer._id}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      astrologer.isPublished
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {astrologer.isPublished ? "Published" : "Draft"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Consultations Overview (if consultations exist) */}
      {consultations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent AstroChat Consultations</h2>
              <p className="text-xs text-slate-500">Live booking sessions submitted by users</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Astrologer</th>
                  <th className="py-3 px-4">Consultation Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consultations.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 text-xs">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.user?.profile?.name || item.user?.email || "User"}
                    </td>
                    <td className="py-3 px-4 text-purple-700 font-medium">
                      {item.astrologer?.name || "Astrologer"}
                    </td>
                    <td className="py-3 px-4 capitalize">{item.consultationType || "Chat"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
