import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Sparkles,
  BarChart3,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ArrowDownToLine
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { fetchVipEnquiries, fetchAstrologers } from "../../utils/api";

const STATUS_COLORS = {
  New: "#3b82f6",
  Contacted: "#f59e0b",
  Interested: "#a855f7",
  Converted: "#10b981",
  Closed: "#64748b"
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState("vip"); // 'vip' | 'astrologers'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Raw data
  const [enquiries, setEnquiries] = useState([]);
  const [astrologers, setAstrologers] = useState([]);

  const loadReportData = async () => {
    setLoading(true);
    setError("");
    try {
      const [vipRes, astroRes] = await Promise.allSettled([
        fetchVipEnquiries({
          limit: 100,
          status: selectedStatus === "all" ? undefined : selectedStatus,
          startDate,
          endDate
        }),
        fetchAstrologers({ limit: 100 })
      ]);

      if (vipRes.status === "fulfilled" && vipRes.value.success) {
        setEnquiries(vipRes.value.data || []);
      }
      if (astroRes.status === "fulfilled" && astroRes.value.success) {
        setAstrologers(astroRes.value.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedStatus, startDate, endDate]);

  // Quick Date Filter Presets
  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  // VIP Enquiries metrics
  const vipMetrics = useMemo(() => {
    const counts = { New: 0, Contacted: 0, Interested: 0, Converted: 0, Closed: 0 };
    enquiries.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      }
    });

    const total = enquiries.length;
    const conversionRate = total > 0 ? Math.round((counts.Converted / total) * 100) : 0;

    const chartData = Object.keys(counts).map((key) => ({
      name: key,
      count: counts[key],
      fill: STATUS_COLORS[key]
    }));

    return { total, counts, conversionRate, chartData };
  }, [enquiries]);

  // Astrologer metrics
  const astroMetrics = useMemo(() => {
    const total = astrologers.length;
    const published = astrologers.filter((a) => a.isPublished).length;
    const unpublished = total - published;
    const online = astrologers.filter((a) => a.availability?.status === "online").length;
    const busy = astrologers.filter((a) => a.availability?.status === "busy").length;
    const offline = astrologers.filter((a) => a.availability?.status === "offline").length;

    const chartData = [
      { name: "Published", value: published, color: "#10b981" },
      { name: "Unpublished", value: unpublished, color: "#64748b" }
    ];

    const availabilityData = [
      { name: "Online", count: online, fill: "#10b981" },
      { name: "Busy", count: busy, fill: "#f59e0b" },
      { name: "Offline", count: offline, fill: "#94a3b8" }
    ];

    return { total, published, unpublished, online, busy, offline, chartData, availabilityData };
  }, [astrologers]);

  // Export to CSV Function
  const exportToCSV = () => {
    if (reportType === "vip") {
      if (enquiries.length === 0) {
        alert("No VIP Familiess enquiry records to export.");
        return;
      }

      const headers = ["Enquiry ID", "Name", "Phone", "Email", "User ID", "Profile ID", "Status", "Request Date", "Request Time"];
      const rows = enquiries.map((item) => [
        item._id,
        `"${(item.name || "").replace(/"/g, '""')}"`,
        `"${item.phone || ""}"`,
        `"${item.email || ""}"`,
        item.user?._id || "",
        item.user?.uid || "",
        item.status,
        new Date(item.createdAt || item.requestTimestamp).toLocaleDateString("en-IN"),
        new Date(item.createdAt || item.requestTimestamp).toLocaleTimeString("en-IN")
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `VIP_Familiess_Enquiries_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (astrologers.length === 0) {
        alert("No astrologer profiles to export.");
        return;
      }

      const headers = ["Astrologer ID", "Name", "Experience (Years)", "Consultation Fee (INR)", "Availability", "Is Published", "Specializations", "Languages", "Created Date"];
      const rows = astrologers.map((item) => [
        item._id,
        `"${(item.name || "").replace(/"/g, '""')}"`,
        item.experienceYears || 0,
        item.consultationFee || 0,
        item.availability?.status || "online",
        item.isPublished ? "Published" : "Unpublished",
        `"${(item.specializations || []).join("; ").replace(/"/g, '""')}"`,
        `"${(item.languages || []).join("; ").replace(/"/g, '""')}"`,
        new Date(item.createdAt).toLocaleDateString("en-IN")
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Astrologers_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              Reports & Analytics
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </h1>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
              Export Ready
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export comprehensive analytics for VIP Familiess enquiries and astrologer consultations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReportData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-semibold shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
            Refresh
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setReportType("vip")}
          className={`pb-3 transition-colors border-b-2 font-bold ${
            reportType === "vip"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          VIP Familiess Enquiries Report
        </button>
        <button
          onClick={() => setReportType("astrologers")}
          className={`pb-3 transition-colors border-b-2 font-bold ${
            reportType === "astrologers"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Astrologers & Consultation Report
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-purple-600" />
            Date Range:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
          />

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => applyPreset(7)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => applyPreset(30)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700"
            >
              All Time
            </button>
          </div>
        </div>

        {/* Status Filter for VIP */}
        {reportType === "vip" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        )}
      </div>

      {/* REPORT CONTENT: VIP SHAADI */}
      {reportType === "vip" && (
        <div className="space-y-6">
          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Filtered</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{vipMetrics.total}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-blue-600 font-semibold uppercase">New</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{vipMetrics.counts.New}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-amber-600 font-semibold uppercase">Contacted</span>
              <div className="text-2xl font-black text-amber-700 mt-1">{vipMetrics.counts.Contacted}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-purple-600 font-semibold uppercase">Interested</span>
              <div className="text-2xl font-black text-purple-700 mt-1">{vipMetrics.counts.Interested}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-emerald-600 font-semibold uppercase">Converted</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{vipMetrics.counts.Converted}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Conversion Rate</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{vipMetrics.conversionRate}%</div>
            </div>
          </div>

          {/* Visual Breakdown Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">VIP Familiess Enquiry Pipeline Breakdown</h3>
            <p className="text-xs text-slate-500 mb-6">Distribution across enquiry lead lifecycle stages</p>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vipMetrics.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#475569" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(val) => [`${val} enquiries`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {vipMetrics.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Report Data Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Enquiry Records ({enquiries.length})</h3>
              <button
                onClick={exportToCSV}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Request Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiries.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name || "Member"}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{item.phone || "N/A"}</td>
                      <td className="py-3 px-4 text-slate-500">{item.email || "N/A"}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {new Date(item.createdAt || item.requestTimestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: ASTROLOGERS */}
      {reportType === "astrologers" && (
        <div className="space-y-6">
          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Astrologers</span>
              <div className="text-3xl font-black text-slate-900 mt-1">{astroMetrics.total}</div>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-emerald-600 font-semibold uppercase">Published in App</span>
              <div className="text-3xl font-black text-emerald-700 mt-1">{astroMetrics.published}</div>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Unpublished</span>
              <div className="text-3xl font-black text-slate-600 mt-1">{astroMetrics.unpublished}</div>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-emerald-600 font-semibold uppercase">Online Now</span>
              <div className="text-3xl font-black text-emerald-600 mt-1">{astroMetrics.online}</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Publishing Status Distribution</h3>
              <p className="text-xs text-slate-500 mb-4">Published live vs hidden astrologers</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={astroMetrics.chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={4}
                    >
                      {astroMetrics.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} profiles`, "Count"]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Live Availability Breakdown</h3>
              <p className="text-xs text-slate-500 mb-4">Current availability state across astrologers</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={astroMetrics.availabilityData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#475569" }} allowDecimals={false} />
                    <Tooltip formatter={(val) => [`${val} astrologers`, "Count"]} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {astroMetrics.availabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
