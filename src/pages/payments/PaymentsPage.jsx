import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import PendingPaymentsPopup from "../../components/PendingPaymentsPopup";
export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [customDate, setCustomDate] = useState("");

  const fetchPaymentsAndUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      
      // Fetch users first to get their profile names
      const usersRes = await fetch("https://server.familiess.com/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let usersMap = {};
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        // Create a map of userId -> user details
        usersMap = (usersData.data || usersData).reduce((acc, user) => {
          acc[user._id] = user;
          return acc;
        }, {});
        setUsers(usersMap);
      }

      // Build query string for payments
      const params = new URLSearchParams();
      if (filterPeriod && filterPeriod !== "custom") {
        params.append("period", filterPeriod);
      }
      if (filterStatus) {
        params.append("status", filterStatus);
      }

      const res = await fetch(`https://server.familiess.com/api/admin/payments/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      
      // Merge full user info into payments
      const paymentsWithUsers = (data.data || []).map(payment => {
        if (payment.user && payment.user._id) {
          const fullUser = usersMap[payment.user._id];
          if (fullUser) {
            payment.user = { ...payment.user, ...fullUser };
          }
        } else if (payment.user && typeof payment.user === 'string') {
          const fullUser = usersMap[payment.user];
          if (fullUser) {
             payment.user = fullUser;
          }
        }
        return payment;
      });
      
      setPayments(paymentsWithUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndUsers();
  }, [filterPeriod, filterStatus]);

  const filteredPayments = payments.filter((payment) => {
    let matchPeriod = true;
    let matchStatus = true;
    
    if (filterStatus) {
      matchStatus = payment.status === filterStatus;
    }

    if (filterPeriod) {
      const paymentDate = new Date(payment.createdAt);
      const now = new Date();
      if (filterPeriod === 'day') {
        matchPeriod = paymentDate.toDateString() === now.toDateString();
      } else if (filterPeriod === 'month') {
        matchPeriod = paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
      } else if (filterPeriod === 'year') {
        matchPeriod = paymentDate.getFullYear() === now.getFullYear();
      } else if (filterPeriod === 'custom' && customDate) {
        // customDate comes from input type="date" which gives YYYY-MM-DD in local time
        // We compare the local date strings
        const customDateObj = new Date(customDate);
        matchPeriod = paymentDate.toDateString() === customDateObj.toDateString();
      }
    }

    return matchPeriod && matchStatus;
  });

  const handleVerify = async (id, status) => {
    try {
      let rejectionReason = null;
      if (status === "failed") {
        rejectionReason = window.prompt("Enter reason for rejection:");
        if (rejectionReason === null) return; // User cancelled the prompt
      }

      const token = localStorage.getItem("adminToken");
      const res = await fetch(`https://server.familiess.com/api/admin/payments/${id}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPaymentsAndUsers(); // Refresh the list
      } else {
        alert(data.message || "Verification failed");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle className="h-3 w-3" /> Success
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      case "incomplete":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            <Clock className="h-3 w-3" /> Incomplete
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        
        <div className="flex gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <select 
              value={filterPeriod} 
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none"
            >
              <option value="">All Time</option>
              <option value="day">Today</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Date</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          {filterPeriod === "custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          )}
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed / Rejected</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Transaction ID</th>
                <th className="px-6 py-4 whitespace-nowrap">User</th>
                <th className="px-6 py-4 whitespace-nowrap">Plan</th>
                <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Screenshot</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Reason</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-purple-600"></div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const imageUrl = payment.screenshotUrl?.startsWith('http') ? payment.screenshotUrl : `https://server.familiess.com/media_uploads/${payment.screenshotUrl}`;
                  return (
                    <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">{payment.transactionId || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.user ? (
                          <div>
                            <div className="font-medium text-slate-900">
                              {payment.user?.profile?.name || payment.user?.name || [payment.user?.firstName || payment.user?.profile?.firstName, payment.user?.lastName || payment.user?.profile?.lastName].filter(Boolean).join(" ") || "No Name Provided"}
                            </div>
                            <div className="text-xs text-slate-500">{payment.user?.email || payment.user?.phone}</div>
                          </div>
                        ) : (
                          "Unknown User"
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        {payment.plan ? payment.plan.name : "N/A"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        ₹{payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.screenshotUrl ? (
                          <a href={imageUrl} target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-700 font-semibold text-xs underline">
                            View Proof
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {payment.rejectionReason || "-"}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {payment.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVerify(payment._id, "success")}
                              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleVerify(payment._id, "failed")}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pending payments pop-up for this page only */}
      <PendingPaymentsPopup />
    </div>
  );
}
