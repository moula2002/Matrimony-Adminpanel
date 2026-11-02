import { useEffect, useState } from "react";
import {
  Check,
  X,
  Trash2,
  Search,
  UserCheck,
  UserX,
  Loader2,
  Award,
  Filter,
  UserPlus,
  Edit,
  PhoneCall,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import AddUserModal from "./AddUserModal";
import { apiFetch, getAuthHeaders, getImageUrl } from "../../utils/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterPremium, setFilterPremium] = useState("all"); // all, premium, free
  const [filterInactive, setFilterInactive] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // users, admins
  const [viewUser, setViewUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Deletion modal and feedback states
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const getProfilePhoto = (user) => {
    const photos = user.profile?.rawPhotos || user.profile?.photos;
    if (!photos || photos.length === 0) return null;
    const photo = photos[0];
    return typeof photo === 'object' && photo !== null ? photo.url : photo;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch("/admin/users", {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to load users list");
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleVerification = async (userId, currentStatus) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isVerified: !currentStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update verification status");
      }

      setUsers(users.map(u => u._id === userId ? { ...u, isVerified: !currentStatus } : u));
      if (viewUser && viewUser._id === userId) {
        setViewUser((prev) => ({ ...prev, isVerified: !currentStatus }));
      }
    } catch (err) {
      alert(err.message || "Failed to update verification status");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const res = await apiFetch(`/admin/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      if (viewUser && viewUser._id === userToDelete._id) {
        setViewUser(null);
      }

      const deletedName = userToDelete.profile?.name || userToDelete.email || "User";
      setUserToDelete(null);
      setToastMessage({ type: "success", text: `${deletedName} and all associated data deleted successfully.` });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert(err.message || "An error occurred while deleting user");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    // Filter by role tab
    const isTabMatch = activeTab === "admins" ? user.role === "admin" : user.role !== "admin";
    if (!isTabMatch) return false;

    const name = user.profile?.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || user.name || "";
    const email = user.email || "";
    const phone = user.phone || "";
    const uid = user.uid || "";
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.includes(q) ||
      uid.toLowerCase().includes(q);

    const isPremium = user.premiumMembership?.isPremium || false;
    const matchesFilter = filterPremium === "all" ||
      (filterPremium === "premium" && isPremium) ||
      (filterPremium === "free" && !isPremium);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const isInactive = user.lastActive && new Date(user.lastActive) < sixtyDaysAgo;
    
    if (filterInactive && !isInactive) return false;

    // Show all registered users without excluding incomplete onboarding
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Accounts</h1>
          <p className="text-sm text-slate-600">View, search, verify, and delete user profiles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Tab Selection */}
      <div className="flex border-b border-slate-300 mb-6 gap-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === "users"
            ? "border-purple-500 text-purple-550 font-bold text-purple-500"
            : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
        >
          Registered Users ({users.filter(u => u.role !== "admin").length})
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === "admins"
            ? "border-purple-500 text-purple-550 font-bold text-purple-500"
            : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
        >
          Administrators ({users.filter(u => u.role === "admin").length})
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-200/70 py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none bg-slate-200/70 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-purple-400 transition-colors">
            <input 
              type="checkbox" 
              checked={filterInactive} 
              onChange={(e) => setFilterInactive(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
            Inactive &gt; 2 Months
          </label>
          <div className="hidden sm:block w-px h-6 bg-slate-300"></div>
          <Filter className="h-5 w-5 text-slate-500 hidden sm:block" />
          <select
            value={filterPremium}
            onChange={(e) => setFilterPremium(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-200/70 px-4 py-2.5 text-sm text-slate-700 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="premium">Premium Members Only</option>
            <option value="free">Free Users Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
            <span className="text-slate-600 text-sm font-medium">Loading user accounts...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100">
          <table className="w-full border-collapse text-left text-sm text-slate-700">
            <thead className="bg-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Name / ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Gender & Age</th>
                <th className="px-6 py-4 whitespace-nowrap">Mobile Number</th>
                <th className="px-6 py-4 whitespace-nowrap">Tier Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Verification</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No user records match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const name = user.profile?.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || user.name || (user.email ? user.email.split("@")[0] : null) || `User ${user.uid || (user._id ? user._id.slice(-6).toUpperCase() : "")}`;
                  const isPremium = user.premiumMembership?.isPremium || false;
                  const profilePhoto = getProfilePhoto(user);
                  return (
                    <tr key={user._id} className="hover:bg-purple-50 cursor-pointer transition-colors group" onClick={() => setViewUser(user)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm shadow-xs">
                            {profilePhoto ? (
                              <img
                                src={getImageUrl(profilePhoto)}
                                alt={name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff`;
                                }}
                              />
                            ) : (
                              <span>{name[0]?.toUpperCase() || "U"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {name}
                              {user.uid && (
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  {user.uid}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{user.email || user.phone || "No email"}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {user.role === "admin" && (
                                <span className="inline-flex items-center rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600 border border-purple-500/20">
                                  Admin
                                </span>
                              )}
                              {user.settings?.isHidden && (
                                <span className="inline-flex items-center rounded-md bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-500/20">
                                  Hidden Profile
                                </span>
                              )}
                              {user.role !== "admin" && (
                                user.profile?.is_onboarding_complete ? (
                                  <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-500/20">
                                    Profile Complete
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-500/20">
                                    Onboarding Incomplete
                                  </span>
                                )
                              )}
                              {(user.lastActive && new Date(user.lastActive) < new Date(Date.now() - 60*24*60*60*1000)) && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 border border-orange-500/20">
                                  <PhoneCall className="w-3 h-3" />
                                  Needs Call
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-700">{user.profile?.gender || "—"}</span>
                        {user.profile?.age && (
                          <span className="text-slate-500">, {user.profile.age} yrs</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {user.phone || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPremium ? (
                          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                            <Award className="h-4 w-4" />
                            {user.premiumMembership?.planType || "Premium"}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Free Tier</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleVerification(user._id, user.isVerified); }}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all duration-200 ${user.isVerified
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-white text-slate-600 border-slate-300 hover:text-slate-800"
                            }`}
                        >
                          {user.isVerified ? (
                            <>
                              <Check className="h-3 w-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" />
                              Unverified
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingUser(user); setShowAddModal(true); }}
                            title="Edit User"
                            className="p-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-500 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVerification(user._id, user.isVerified); }}
                            title={user.isVerified ? "Revoke Verification" : "Verify User"}
                            className={`p-1.5 rounded-lg border text-slate-600 hover:text-white transition-all ${user.isVerified ? "border-slate-300 hover:bg-slate-200" : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400"
                              }`}
                          >
                            {user.isVerified ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(user);
                            }}
                            title="Delete User"
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View User Details Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewUser(null)} />
          <div className="relative w-[95vw] max-w-7xl h-[95vh] overflow-y-auto rounded-2xl bg-white shadow-xl flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-8 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">User Details</h2>
                <p className="text-xs text-slate-500">{viewUser.uid}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserToDelete(viewUser)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-semibold transition-all"
                  title="Delete User"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete User</span>
                </button>
                <button
                  onClick={() => setViewUser(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-slate-100 pb-8">
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-slate-100 shadow-sm bg-slate-200">
                    {getProfilePhoto(viewUser) ? (
                      <img
                        src={getImageUrl(getProfilePhoto(viewUser))}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewUser.profile?.name || viewUser.email || 'U')}&background=random`;
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500 text-5xl font-bold">
                        {(viewUser.profile?.name || viewUser.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                  <h3 className="text-3xl font-bold text-slate-900 mb-2">
                    {viewUser.profile?.name || viewUser.name || (viewUser.email ? viewUser.email.split("@")[0] : "Registered User")}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {viewUser.uid || (viewUser._id ? viewUser._id.slice(-6).toUpperCase() : "N/A")} • {viewUser.profile?.gender || "Gender not specified"} • {viewUser.email || "No email"}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start text-sm">
                    {viewUser.profile?.age && <span className="bg-slate-100 px-3 py-1.5 rounded-md text-slate-700">{viewUser.profile.age} yrs</span>}
                    {viewUser.profile?.height && <span className="bg-slate-100 px-3 py-1.5 rounded-md text-slate-700">{viewUser.profile.height}</span>}
                    {viewUser.profile?.location && <span className="bg-slate-100 px-3 py-1.5 rounded-md text-slate-700">{viewUser.profile.location}</span>}
                    {viewUser.profile?.profession && <span className="bg-slate-100 px-3 py-1.5 rounded-md text-slate-700">{viewUser.profile.profession}</span>}
                  </div>
                  {viewUser.profile?.bio && (
                    <p className="mt-4 text-sm text-slate-600 max-w-2xl">{viewUser.profile.bio}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Column 1 */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">Basic & Contact Info</h3>
                    <div className="space-y-3 text-sm text-slate-700">
                      <p><span className="font-semibold">DOB:</span> {viewUser.profile?.dob ? new Date(viewUser.profile.dob).toLocaleDateString() : "N/A"}</p>
                      <p><span className="font-semibold">Marital Status:</span> {viewUser.profile?.maritalStatus || "N/A"}</p>
                      <p><span className="font-semibold">Phone:</span> {viewUser.phone || "N/A"}</p>
                      <p><span className="font-semibold">City:</span> {viewUser.profile?.city || "N/A"}</p>
                      <p><span className="font-semibold">State:</span> {viewUser.profile?.state || "N/A"}</p>
                      <p><span className="font-semibold">Country:</span> {viewUser.profile?.country || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">Religion & Community</h3>
                    <div className="space-y-3 text-sm text-slate-700">
                      <p><span className="font-semibold">Religion:</span> {viewUser.profile?.religion || "N/A"}</p>
                      <p><span className="font-semibold">Caste:</span> {viewUser.profile?.caste || "N/A"}</p>
                      <p><span className="font-semibold">Community:</span> {viewUser.profile?.community || "N/A"}</p>
                      <p><span className="font-semibold">Sub Community:</span> {viewUser.profile?.subCommunity || "N/A"}</p>
                      <p><span className="font-semibold">Languages Spoken:</span> {Array.isArray(viewUser.profile?.languages) ? viewUser.profile.languages.join(", ") : viewUser.profile?.languages || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">Education & Career</h3>
                    <div className="space-y-3 text-sm text-slate-700">
                      <p><span className="font-semibold">Education:</span> {viewUser.profile?.education || "N/A"}</p>
                      <p><span className="font-semibold">College:</span> {viewUser.profile?.college || "N/A"}</p>
                      <p><span className="font-semibold">Profession:</span> {viewUser.profile?.profession || "N/A"}</p>
                      <p><span className="font-semibold">Work Role:</span> {viewUser.profile?.workRole || "N/A"}</p>
                      <p><span className="font-semibold">Company:</span> {viewUser.profile?.companyName || "N/A"}</p>
                      <p><span className="font-semibold">Income:</span> {viewUser.profile?.income || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">Family & Lifestyle</h3>
                    <div className="space-y-3 text-sm text-slate-700">
                      <p><span className="font-semibold">Diet:</span> {viewUser.profile?.diet || "N/A"}</p>
                      {viewUser.profile?.maritalStatus && viewUser.profile.maritalStatus !== "Never Married" && (
                        <>
                          <p><span className="font-semibold">Have Children:</span> {viewUser.profile?.hasChildren || "N/A"}</p>
                          {viewUser.profile?.hasChildren === "Yes" && (
                            <p><span className="font-semibold">Children Living With:</span> {viewUser.profile?.childrenStayingWith || "N/A"}</p>
                          )}
                        </>
                      )}
                      <p><span className="font-semibold">Family Status:</span> {viewUser.profile?.familyFinancialStatus || "N/A"}</p>
                      <p><span className="font-semibold">Father Status:</span> {viewUser.profile?.fatherStatus || "N/A"}</p>
                      <p><span className="font-semibold">Mother Status:</span> {viewUser.profile?.motherStatus || "N/A"}</p>
                      <p><span className="font-semibold">Siblings:</span> {viewUser.profile?.brothersCount || "0"} Brothers, {viewUser.profile?.sistersCount || "0"} Sisters</p>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">Partner Preferences</h3>
                    <div className="space-y-3 text-sm text-slate-700">
                      <p><span className="font-semibold">Age Range:</span> {viewUser.preferences?.ageRange?.[0] || "Any"} - {viewUser.preferences?.ageRange?.[1] || "Any"}</p>
                      <p><span className="font-semibold">Height Range:</span> {viewUser.preferences?.heightRange?.[0] || "Any"} - {viewUser.preferences?.heightRange?.[1] || "Any"}</p>
                      <p><span className="font-semibold">Marital Status:</span> {Array.isArray(viewUser.preferences?.maritalStatus) ? viewUser.preferences.maritalStatus.join(", ") : viewUser.preferences?.maritalStatus || "Any"}</p>
                      <p><span className="font-semibold">Religion:</span> {Array.isArray(viewUser.preferences?.religion) ? viewUser.preferences.religion.join(", ") : viewUser.preferences?.religion || "Any"}</p>
                      <p><span className="font-semibold">Caste:</span> {Array.isArray(viewUser.preferences?.caste) ? viewUser.preferences.caste.join(", ") : viewUser.preferences?.caste || "Any"}</p>
                      <p><span className="font-semibold">Mother Tongue:</span> {Array.isArray(viewUser.preferences?.motherTongue) ? viewUser.preferences.motherTongue.join(", ") : viewUser.preferences?.motherTongue || "Any"}</p>
                      <p><span className="font-semibold">Education:</span> {Array.isArray(viewUser.preferences?.education) ? viewUser.preferences.education.join(", ") : viewUser.preferences?.education || "Any"}</p>
                      <p><span className="font-semibold">Income:</span> {Array.isArray(viewUser.preferences?.income) ? viewUser.preferences.income.join(", ") : viewUser.preferences?.income || "Any"}</p>
                      <p><span className="font-semibold">Location:</span> {Array.isArray(viewUser.preferences?.location) ? viewUser.preferences.location.join(", ") : viewUser.preferences?.location || "Any"}</p>
                      <p><span className="font-semibold">Diet:</span> {Array.isArray(viewUser.preferences?.diet) ? viewUser.preferences.diet.join(", ") : viewUser.preferences?.diet || "Any"}</p>
                    </div>
                  </div>

                  {viewUser.premiumMembership?.isPremium && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 mb-4 border-b border-purple-100 pb-2">Premium Membership</h3>
                      <div className="space-y-3 text-sm text-slate-700 bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <p><span className="font-semibold text-purple-900">Active Plan:</span> <span className="font-bold text-purple-700">{viewUser.premiumMembership.planType}</span></p>
                        <p><span className="font-semibold text-purple-900">Valid Until:</span> {viewUser.premiumMembership.expiryDate ? new Date(viewUser.premiumMembership.expiryDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        editingUser={editingUser}
        onClose={() => {
          setShowAddModal(false);
          setEditingUser(null);
        }}
        onUserAdded={(newUser) => {
          setUsers(prev => [newUser, ...prev]);
        }}
        onUserUpdated={(updatedUser) => {
          setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
          if (viewUser && viewUser._id === updatedUser._id) {
            setViewUser(updatedUser);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !deleting && setUserToDelete(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Delete User Account?
                  </h3>
                  <p className="text-xs text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm overflow-hidden flex-shrink-0">
                    {getProfilePhoto(userToDelete) ? (
                      <img
                        src={getImageUrl(getProfilePhoto(userToDelete))}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userToDelete.profile?.name || userToDelete.email || 'U')}&background=random`;
                        }}
                      />
                    ) : (
                      (userToDelete.profile?.name || userToDelete.email || "U")[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {userToDelete.profile?.name || userToDelete.name || userToDelete.email || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {userToDelete.uid ? `UID: ${userToDelete.uid} • ` : ""}{userToDelete.email || userToDelete.phone || "No contact info"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                Deleting this account will permanently remove the profile, photos, chat messages, partner preferences, and subscription records from the database.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
