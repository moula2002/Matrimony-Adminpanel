import { useEffect, useState } from "react";
import { Check, X, Loader2, FileText } from "lucide-react";

export default function BioApprovalsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsersWithBios = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("https://server.familiess.com/api/admin/bio-approvals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load users with pending bios");
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithBios();
  }, []);

  const updateStatus = async (userId, status) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`https://server.familiess.com/api/admin/bio-approvals/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }), // 'approved' or 'rejected'
      });

      if (!res.ok) {
        throw new Error("Failed to update bio approval status");
      }

      // Remove the user from the list since we only show pending
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bio Verification</h1>
          <p className="text-sm text-slate-600">Review and approve user bios (About Me)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
            <span className="text-slate-600 text-sm font-medium">Loading bios...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-500">
              No pending bio verifications found.
            </div>
          ) : (
            users.map((user) => {
              const name = user.profile?.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || "No Profile Set";
              const bio = user.profile?.bio || "No bio provided.";

              return (
                <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{name}</h3>
                      <p className="text-xs text-slate-500">{user.uid} • {user.email || user.phone}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                      Pending
                    </span>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{bio}</p>
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                      onClick={() => updateStatus(user._id, 'rejected')}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg text-sm font-semibold border transition-all bg-white text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => updateStatus(user._id, 'approved')}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg text-sm font-semibold border transition-all bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
