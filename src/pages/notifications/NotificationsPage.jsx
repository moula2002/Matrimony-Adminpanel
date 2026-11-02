import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Heart,
  Eye,
  CheckCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox
} from "lucide-react";
import { fetchAdminNotifications, markNotificationRead, markAllNotificationsRead } from "../../utils/api";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterRead, setFilterRead] = useState("all"); // 'all', 'false' (unread), 'true' (read)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminNotifications({
        page,
        limit: 25,
        read: filterRead === "all" ? undefined : filterRead
      });

      if (data && data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page, filterRead]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.message || "Failed to update notification");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err.message || "Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (item) => {
    // If not read, mark as read
    if (!item.read) {
      markNotificationRead(item._id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Deep-link to target page
    if (item.relatedModel === "VipShaadiEnquiry") {
      navigate(`/vip-shaadi?id=${item.relatedId}`);
    } else if (item.relatedModel === "AstroConsultation") {
      navigate(`/astrochat`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              Notifications
              <Bell className="h-6 w-6 text-purple-600" />
            </h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time administrative alerts for new VIP Shaadi enquiries and astrologer consultations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-semibold shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        {[
          { id: "all", label: "All Notifications" },
          { id: "false", label: `Unread (${unreadCount})` },
          { id: "true", label: "Read" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setFilterRead(tab.id); setPage(1); }}
            className={`pb-3 transition-colors border-b-2 font-bold ${
              filterRead === tab.id
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            <span className="text-sm font-medium">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Failed to load notifications</h3>
            <p className="text-xs text-slate-500 mt-1 mb-3">{error}</p>
            <button
              onClick={loadNotifications}
              className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Notifications</h3>
            <p className="text-xs text-slate-500 mt-1">
              You are all caught up! No notifications match the selected filter.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isVip = item.relatedModel === "VipShaadiEnquiry" || item.type?.toLowerCase().includes("vip");
            const isAstro = item.relatedModel === "AstroConsultation" || item.type?.toLowerCase().includes("astro");

            return (
              <div
                key={item._id}
                onClick={() => handleNotificationClick(item)}
                className={`p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer hover:bg-purple-50/40 ${
                  !item.read ? "bg-purple-50/20" : "bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                    isVip
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : isAstro
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}>
                    {isVip ? (
                      <Heart className="h-5 w-5 fill-purple-600" />
                    ) : isAstro ? (
                      <Sparkles className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>

                  {/* Message & Meta */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.message}</span>
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-purple-600 inline-block" title="Unread" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-600 capitalize">
                        {item.relatedModel === "VipShaadiEnquiry" ? "VIP Shaadi Enquiry" : item.relatedModel || "System Alert"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {isVip && (
                      <div className="text-[11px] text-purple-600 font-medium pt-1 flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Click to open VIP enquiry details
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action */}
                <div className="shrink-0 flex items-center gap-2">
                  {!item.read ? (
                    <button
                      onClick={(e) => handleMarkAsRead(e, item._id)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                      title="Mark as Read"
                    >
                      Mark Read
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Read</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
