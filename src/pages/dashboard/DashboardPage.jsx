import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Heart,
  DollarSign,
  ShieldAlert,
  Loader2,
  TrendingUp,
  Award,
  Activity,
  Crown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { fetchVipEnquiries, fetchAstrologers } from "../../utils/api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dynamic VIP Shaadi & Astrologers metrics calculated from existing APIs
  const [vipStats, setVipStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    converted: 0,
    closed: 0
  });

  const [astroStats, setAstroStats] = useState({
    total: 0,
    published: 0,
    unpublished: 0
  });

  const fetchAllDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("adminToken");

      // Concurrently fetch existing core dashboard, VIP enquiries, and astrologers
      const [coreRes, vipRes, astroRes] = await Promise.allSettled([
        fetch("https://server.familiess.com/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to load dashboard metrics");
          return res.json();
        }),
        fetchVipEnquiries({ limit: 100 }),
        fetchAstrologers({ limit: 100 })
      ]);

      if (coreRes.status === "fulfilled") {
        setStats(coreRes.value.stats);
        setTiers(coreRes.value.tierDistribution || []);
        setAnalytics(coreRes.value.analytics || null);
      } else {
        throw new Error(coreRes.reason?.message || "Failed to load core metrics");
      }

      // Calculate dynamic VIP metrics
      if (vipRes.status === "fulfilled" && vipRes.value.success) {
        const enquiries = vipRes.value.data || [];
        const counts = {
          total: vipRes.value.total || enquiries.length,
          new: enquiries.filter((e) => e.status === "New").length,
          contacted: enquiries.filter((e) => e.status === "Contacted").length,
          interested: enquiries.filter((e) => e.status === "Interested").length,
          converted: enquiries.filter((e) => e.status === "Converted").length,
          closed: enquiries.filter((e) => e.status === "Closed").length
        };
        setVipStats(counts);
      }

      // Calculate dynamic Astrologer metrics
      if (astroRes.status === "fulfilled" && astroRes.value.success) {
        const astrologers = astroRes.value.data || [];
        const total = astroRes.value.total || astrologers.length;
        const published = astrologers.filter((a) => a.isPublished).length;
        const unpublished = total - published;
        setAstroStats({
          total,
          published,
          unpublished
        });
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const totalTierUsers = tiers.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-600">Real-time statistics, VIP Shaadi leads, and Astrologer metrics</p>
        </div>
        <button
          onClick={fetchAllDashboardData}
          className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-all duration-200 shadow-2xs"
        >
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
            <span className="text-slate-600 text-sm font-medium">Gathering metrics...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-red-500">
          <ShieldAlert className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load metrics</h3>
            <p className="text-sm text-red-500/80">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main User & Platform Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {/* Card 0: Currently Online */}
            <div className="relative overflow-hidden rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-900">
                <Activity className="h-20 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700">Currently Online</span>
                <div className="flex items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-2 text-emerald-600 relative">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-xl bg-emerald-400 opacity-75"></span>
                  <Activity className="h-5 w-5 relative" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-emerald-900">{stats?.onlineUsers || 0}</h3>
                <p className="mt-1 text-xs text-emerald-600">Active in last 15 mins</p>
              </div>
            </div>

            {/* Card 1: Total Users */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900">
                <Users className="h-20 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Total Users</span>
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2 text-blue-500">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">{stats?.totalUsers || 0}</h3>
                <p className="mt-1 text-xs text-slate-500">Registered accounts</p>
              </div>
            </div>

            {/* Card 2: Total Matches */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900">
                <Heart className="h-20 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Mutual Matches</span>
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-2 text-purple-500">
                  <Heart className="h-5 w-5 fill-purple-500/20" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">{stats?.totalMatches || 0}</h3>
                <p className="mt-1 text-xs text-slate-500">Accepted interest connections</p>
              </div>
            </div>

            {/* Card 3: Payments Revenue */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900">
                <DollarSign className="h-20 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Payments Revenue</span>
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-500">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">
                  ₹{stats?.totalRevenue ? stats.totalRevenue.toLocaleString("en-IN") : "0"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">Successful subscriptions revenue</p>
              </div>
            </div>

            {/* Card 4: Active Subscriptions */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900">
                <Award className="h-20 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Active Subscriptions</span>
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-2 text-purple-500">
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-slate-900">{stats?.activeSubscribers || 0}</h3>
                <p className="mt-1 text-xs text-slate-500">Premium members</p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* VIP SHAADI ENQUIRIES SUMMARY CARDS SECTION */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">VIP Shaadi Enquiries</h2>
                  <p className="text-xs text-slate-500">Dynamic summary of personalized matchmaking enquiries</p>
                </div>
              </div>

              <Link
                to="/vip-shaadi"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors"
              >
                Manage All Enquiries
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Total VIP Shaadi Enquiries */}
              <Link
                to="/vip-shaadi"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="text-xs uppercase tracking-wider font-bold text-slate-500 group-hover:text-purple-600 transition-colors">
                  Total Enquiries
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">{vipStats.total}</div>
                <div className="text-[11px] text-slate-400 mt-1">All recorded leads</div>
              </Link>

              {/* New Enquiries */}
              <Link
                to="/vip-shaadi?status=New"
                className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  New
                </div>
                <div className="text-3xl font-black text-blue-900 mt-2">{vipStats.new}</div>
                <div className="text-[11px] text-blue-600/80 mt-1">Awaiting initial action</div>
              </Link>

              {/* Contacted Enquiries */}
              <Link
                to="/vip-shaadi?status=Contacted"
                className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Contacted
                </div>
                <div className="text-3xl font-black text-amber-900 mt-2">{vipStats.contacted}</div>
                <div className="text-[11px] text-amber-600/80 mt-1">Admin reached out</div>
              </Link>

              {/* Interested Enquiries */}
              <Link
                to="/vip-shaadi?status=Interested"
                className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-purple-700">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Interested
                </div>
                <div className="text-3xl font-black text-purple-900 mt-2">{vipStats.interested}</div>
                <div className="text-[11px] text-purple-600/80 mt-1">Evaluating package</div>
              </Link>

              {/* Converted Enquiries */}
              <Link
                to="/vip-shaadi?status=Converted"
                className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Converted
                </div>
                <div className="text-3xl font-black text-emerald-900 mt-2">{vipStats.converted}</div>
                <div className="text-[11px] text-emerald-600/80 mt-1">Enrolled into VIP Shaadi</div>
              </Link>

              {/* Closed Enquiries */}
              <Link
                to="/vip-shaadi?status=Closed"
                className="p-5 rounded-2xl bg-slate-100/70 border border-slate-300 hover:border-slate-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Closed
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">{vipStats.closed}</div>
                <div className="text-[11px] text-slate-500 mt-1">Resolved or closed</div>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ASTROCHAT MANAGEMENT SUMMARY CARDS SECTION */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AstroChat Management</h2>
                  <p className="text-xs text-slate-500">Overview of certified astrologer profiles and publishing status</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/astrologers/add"
                  className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
                >
                  + Add Astrologer
                </Link>
                <Link
                  to="/astrologers"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors"
                >
                  Manage Astrologers
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Total Astrologers */}
              <Link
                to="/astrologers"
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Astrologers</span>
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-3">{astroStats.total}</div>
                <p className="text-xs text-slate-400 mt-1">Total astrologer accounts created</p>
              </Link>

              {/* Published Astrologers */}
              <Link
                to="/astrologers?status=published"
                className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Published Astrologers</span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-800 mt-3">{astroStats.published}</div>
                <p className="text-xs text-emerald-600/80 mt-1">Currently live and discoverable in mobile app</p>
              </Link>

              {/* Unpublished Astrologers */}
              <Link
                to="/astrologers?status=unpublished"
                className="p-6 rounded-2xl bg-slate-50 border border-slate-300 hover:border-slate-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Unpublished Astrologers</span>
                  <div className="h-8 w-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-3">{astroStats.unpublished}</div>
                <p className="text-xs text-slate-500 mt-1">Draft or hidden profiles (not visible in app)</p>
              </Link>
            </div>
          </div>

          {/* Custom Premium Chart & breakdown */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Chart container */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 md:col-span-2 shadow-xs">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">User Tier Distribution</h3>
                  <p className="text-xs text-slate-600">Comparison of users registered across subscription tiers</p>
                </div>
                <TrendingUp className="h-5 w-5 text-slate-500" />
              </div>

              {/* SVG/CSS Chart */}
              <div className="space-y-4">
                {tiers.map((tier) => {
                  const percentage = Math.round((tier.count / totalTierUsers) * 100);
                  return (
                    <div key={tier.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">{tier.name}</span>
                        <span className="text-slate-600">
                          {tier.count} {tier.count === 1 ? "user" : "users"} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            tier.name === "Free"
                              ? "bg-gradient-to-r from-zinc-600 to-zinc-400"
                              : tier.name.includes("Gold")
                              ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                              : tier.name.includes("Diamond")
                              ? "bg-gradient-to-r from-blue-500 to-indigo-400"
                              : "bg-gradient-to-r from-purple-600 to-indigo-600"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side Card info */}
            <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-b from-purple-500/10 to-indigo-500/5 border border-purple-500/20 p-6">
              <div>
                <h3 className="text-lg font-bold text-purple-600">Welcome to Admin Hub</h3>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                  Here you can oversee all core metrics, manage VIP Shaadi enquiries, manage certified astrologers, and review payment logs.
                </p>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                  Use the left navigation to inspect enquiries, update consultation settings, or generate reports.
                </p>
              </div>
              <div className="mt-6 border-t border-purple-500/10 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Backend Connectivity</span>
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          {analytics && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Caste Revenue */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
                <h3 className="font-semibold text-sm text-slate-900 mb-4">Revenue by Caste</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.revenueByCaste} margin={{ bottom: 25 }}>
                      <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 10, fill: "#475569" }} height={40} />
                      <YAxis tick={{ fontSize: 12, fill: "#475569" }} width={40} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* State Revenue */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
                <h3 className="font-semibold text-sm text-slate-900 mb-4">Revenue by State</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.revenueByLocation}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={80}
                        innerRadius={60}
                        paddingAngle={2}
                      >
                        {analytics.revenueByLocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Community Revenue */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
                <h3 className="font-semibold text-sm text-slate-900 mb-4">Revenue by Community</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.revenueByCommunity} margin={{ bottom: 25 }}>
                      <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 10, fill: "#475569" }} height={40} />
                      <YAxis tick={{ fontSize: 12, fill: "#475569" }} width={40} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
