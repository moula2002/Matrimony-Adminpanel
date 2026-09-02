import { useState, useEffect } from "react";
import { 
  Gift, 
  CheckCircle, 
  Clock, 
  Users, 
  RefreshCw, 
  Save, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export default function ReferralsPage() {
  const [stats, setStats] = useState({ totalReferrals: 0, successfulReferrals: 0, pendingReferrals: 0 });
  const [history, setHistory] = useState([]);
  
  const [config, setConfig] = useState({
    isActive: true,
    rewardType: 'premium_days',
    rewardAmount: 7,
    eligibilityRule: 'subscription_purchased'
  });

  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      
      // Fetch stats and history
      const res = await fetch("https://server.familiess.com/api/referral/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setStats(data.stats);
        setHistory(data.history);
      }
      
      // Fetch current settings to get config (we can use the general settings endpoint)
      const settingsRes = await fetch("https://server.familiess.com/api/admin/settings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const settingsData = await settingsRes.json();
      
      if (settingsData.success && settingsData.data && settingsData.data.referralConfig) {
        setConfig(settingsData.data.referralConfig);
      }
    } catch (error) {
      console.error("Failed to fetch referral data", error);
      setMessage({ type: "error", text: "Failed to load referral data." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setSavingConfig(true);
    
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("https://server.familiess.com/api/referral/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      
      if (res.ok) {
        const updatedConfig = await res.json();
        setConfig(updatedConfig);
        setMessage({ type: "success", text: "Referral configuration updated successfully!" });
      } else {
        const errorData = await res.json();
        setMessage({ type: "error", text: errorData.message || "Failed to update configuration." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server error updating configuration." });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleBackfill = async () => {
    if (!confirm("Are you sure you want to generate missing referral codes for all users? This might take a few moments.")) {
      return;
    }
    
    setMessage({ type: "", text: "" });
    setBackfilling(true);
    
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("https://server.familiess.com/api/referral/admin/backfill", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Successfully generated missing referral codes." });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to generate missing codes." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server error during backfill process." });
    } finally {
      setBackfilling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'successful':
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20"><CheckCircle className="h-3 w-3" /> Successful</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600 border border-red-500/20"><AlertCircle className="h-3 w-3" /> Failed</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 border border-amber-500/20"><Clock className="h-3 w-3" /> Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-purple-500 animate-spin" />
          <span className="text-slate-600 text-sm font-medium">Loading Referral Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Referral Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor referral statistics, configure rewards, and view referral history.
        </p>
      </div>

      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-xl border text-sm font-medium ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-600 border-red-200' 
            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
        }`}>
          {message.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Referrals</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalReferrals}</p>
          </div>
          <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
            <Users className="h-8 w-8" />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Successful Referrals</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.successfulReferrals}</p>
          </div>
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle className="h-8 w-8" />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Referrals</p>
            <p className="text-3xl font-bold text-amber-500 mt-1">{stats.pendingReferrals}</p>
          </div>
          <div className="p-4 bg-amber-100 text-amber-600 rounded-xl">
            <Clock className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Configuration</h2>
                  <p className="text-xs text-slate-500">Manage referral rules & rewards</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleUpdateConfig} className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Enable Referral System</p>
                    <p className="text-xs text-slate-500 mt-0.5">Allow users to refer others</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                    className={`transition-colors ${config.isActive ? 'text-emerald-500' : 'text-slate-400'}`}
                  >
                    {config.isActive ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reward Type</label>
                  <select
                    value={config.rewardType}
                    onChange={(e) => setConfig({ ...config, rewardType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="premium_days">Premium Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reward Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={config.rewardAmount}
                    onChange={(e) => setConfig({ ...config, rewardAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of premium days awarded.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility Rule</label>
                  <select
                    value={config.eligibilityRule}
                    onChange={(e) => setConfig({ ...config, eligibilityRule: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="subscription_purchased">When referred user buys subscription</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={savingConfig}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {savingConfig ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
                  Save Configuration
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Backfill Missing Codes</h3>
            <p className="text-xs text-slate-500 mb-4">
              Generate referral codes for any existing users who signed up before the referral system was introduced.
            </p>
            <button
              onClick={handleBackfill}
              disabled={backfilling}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl border border-slate-300 transition-all disabled:opacity-50"
            >
              {backfilling ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" /> : <RefreshCw className="h-4 w-4" />}
              Generate Missing Codes
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Referrals</h2>
                <p className="text-xs text-slate-500">History of all user referrals</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 whitespace-nowrap">Referrer</th>
                    <th className="px-6 py-4 whitespace-nowrap">Referred User</th>
                    <th className="px-6 py-4 whitespace-nowrap">Code Used</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No referrals found.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                          {item.referrer?.profile?.name || item.referrer?.email || 'Unknown User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                          {item.referredUser?.profile?.name || item.referredUser?.email || 'Unknown User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                          {item.referralCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
