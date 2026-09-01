import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function PendingPaymentsPopup() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const location = useLocation();

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const res = await fetch("https://server.familiess.com/api/admin/payments/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      
      // Fetch users to get their profile names
      const usersRes = await fetch("https://server.familiess.com/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let usersMap = {};
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        usersMap = (usersData.data || usersData).reduce((acc, user) => {
          acc[user._id] = user;
          return acc;
        }, {});
      }

      // Merge full user info into payments
      const paymentsWithUsers = (data || []).map(payment => {
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

      setPendingPayments(paymentsWithUsers);

      if (paymentsWithUsers && paymentsWithUsers.length > 0) {
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error("Error fetching pending payments:", err);
    }
  };

  const handleVerifyPayment = async (id, status) => {
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, rejectionReason })
      });
      if (!res.ok) throw new Error("Failed to update payment");

      const updatedList = pendingPayments.filter(p => p._id !== id);
      setPendingPayments(updatedList);
      if (updatedList.length === 0) setShowPaymentModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchPendingPayments();

    // Poll every 30 seconds
    const intervalId = setInterval(fetchPendingPayments, 30000);
    return () => clearInterval(intervalId);
  }, [location.pathname]); // Re-fetch on route change

  if (!showPaymentModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Pending Payments</h3>
            <p className="text-sm text-slate-500">Approve or reject recent transactions</p>
          </div>
          <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {pendingPayments.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No pending payments.</div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">User Details</div>
                        <div className="font-semibold text-slate-900">
                          {payment.user?.profile?.name || payment.user?.name || [payment.user?.firstName || payment.user?.profile?.firstName, payment.user?.lastName || payment.user?.profile?.lastName].filter(Boolean).join(" ") || "No Name Provided"}
                        </div>
                        <div className="text-xs text-slate-500">{payment.user?.email || payment.user?.phone}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Payment Info</div>
                        <div className="text-sm font-mono text-slate-600 mb-1">
                          ID: {payment.transactionId || "N/A"}
                        </div>
                        <div className="text-sm text-slate-700">
                          Plan: <span className="font-semibold text-purple-600">{payment.plan?.name || "Unknown Plan"}</span> (₹{payment.amount})
                        </div>
                      </div>
                      
                      <div className="sm:col-span-2 flex justify-between items-center border-t border-slate-100 pt-3 mt-1">
                        <div className="text-xs text-slate-500">
                          Date: {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          {payment.screenshotUrl ? (
                            <a 
                              href={payment.screenshotUrl.startsWith('http') ? payment.screenshotUrl : `https://server.familiess.com/media_uploads/${payment.screenshotUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-purple-600 hover:text-purple-700 font-semibold text-xs underline"
                            >
                              View Proof
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Screenshot</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto min-w-[100px] shrink-0 mt-4 sm:mt-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-4">
                    <button
                      onClick={() => handleVerifyPayment(payment._id, 'success')}
                      className="flex-1 flex justify-center items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(payment._id, 'failed')}
                      className="flex-1 flex justify-center items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
