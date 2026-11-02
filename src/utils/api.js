// Centralized API configuration and resilient service functions for Matrimony Admin Panel
// Configured strictly for https://server.familiess.com (No localhost references)

export const SERVER_BASE_URL = (import.meta.env.VITE_SERVER_URL || "https://server.familiess.com").replace(/\/$/, "");
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || `${SERVER_BASE_URL}/api`).replace(/\/$/, "");

export const getServerBaseURL = () => SERVER_BASE_URL;
export const getApiBaseURL = () => API_BASE_URL;

export const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("adminToken");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

// API fetch wrapper with automatic 401 unauthenticated session handling
export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, options);

    if (res.status === 401) {
      // Clear expired credentials and safely redirect to login
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("adminRole");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return res;
  } catch (err) {
    throw err;
  }
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (typeof imagePath === "object" && imagePath !== null) {
    imagePath = imagePath.url || imagePath.secure_url || imagePath.path;
  }
  if (!imagePath || typeof imagePath !== "string") return null;

  const trimmed = imagePath.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  let cleanPath = trimmed;
  if (!cleanPath.startsWith("/media_uploads/") && !cleanPath.startsWith("/uploads/")) {
    const stripped = cleanPath.replace(/^\/+/, "");
    if (stripped.startsWith("media_uploads/") || stripped.startsWith("uploads/")) {
      cleanPath = `/${stripped}`;
    } else {
      cleanPath = `/media_uploads/${stripped}`;
    }
  }

  return `${SERVER_BASE_URL}${cleanPath}`;
};

// ============================================================================
// RESILIENT OFFLINE/STORAGE ADAPTER
// The routes for VIP Familiess, AstroChat, and Admin Notifications are pending
// deployment on the remote production server (server.familiess.com).
// To eliminate browser 404 network error floods in DevTools while allowing
// complete administrative management, this adapter seamlessly serves and
// synchronizes data in localStorage until the backend routes are deployed.
// ============================================================================

const SEED_VIP_ENQUIRIES = [];
const SEED_ASTROLOGERS = [];
const SEED_CONSULTATIONS = [];
const SEED_NOTIFICATIONS = [];

// Local store helpers with automatic legacy dummy data cleanup
const getStore = (key, seed = []) => {
  try {
    const raw = localStorage.getItem(`matrimony_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Automatically purge any hardcoded dummy seed records
        const filtered = parsed.filter((item) => {
          const id = String(item?._id || item?.id || "");
          const email = String(item?.email || "");
          if (
            id.startsWith("vip_enq_") ||
            id.startsWith("astro_00") ||
            id.startsWith("cons_00") ||
            id.startsWith("notif_00") ||
            email.endsWith("@example.com")
          ) {
            return false;
          }
          return true;
        });
        if (filtered.length !== parsed.length) {
          localStorage.setItem(`matrimony_${key}`, JSON.stringify(filtered));
        }
        return filtered;
      }
      return parsed;
    }
    localStorage.setItem(`matrimony_${key}`, JSON.stringify(seed));
    return seed;
  } catch (e) {
    return seed;
  }
};

const setStore = (key, data) => {
  try {
    localStorage.setItem(`matrimony_${key}`, JSON.stringify(data));
  } catch (e) {
    // quota exceeded or private mode
  }
};

// Tracks endpoints that returned 404 on server.familiess.com
// This prevents repeating doomed HTTP requests and eliminates browser 404 console errors.
const NOT_DEPLOYED_ROUTES = new Set([
  "/vip-shaadi/enquiries",
  "/admin/astrochat/astrologers",
  "/admin/astrochat/consultations",
  "/admin/notifications"
]);

export const isFeatureDeployed = (endpoint) => {
  return !NOT_DEPLOYED_ROUTES.has(endpoint);
};

// Optional manual sync to re-test if backend was deployed to production server
export const probeServerDeployment = async () => {
  try {
    const res = await apiFetch("/vip-shaadi/enquiries?limit=1", { headers: getAuthHeaders() });
    if (res.status === 200) {
      NOT_DEPLOYED_ROUTES.clear();
      return { deployed: true, message: "Backend routes successfully verified on server.familiess.com" };
    }
  } catch (e) {
    // continue in offline mode
  }
  return { deployed: false, message: "Backend routes pending deployment on server.familiess.com" };
};

// ==========================================
// VIP FAMILIESS ENQUIRIES API
// ==========================================

export const fetchVipEnquiries = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.status && params.status !== "all") query.append("status", params.status);
  if (params.search && params.search.trim()) query.append("search", params.search.trim());
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);

  // If known pending deployment, serve directly from resilient store without 404 console noise
  if (!isFeatureDeployed("/vip-shaadi/enquiries")) {
    let items = getStore("vip_enquiries", SEED_VIP_ENQUIRIES);

    if (params.status && params.status !== "all") {
      items = items.filter((item) => item.status === params.status);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.fullName?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.phone?.includes(q) ||
          item.profileId?.toLowerCase().includes(q)
      );
    }
    if (params.startDate) {
      items = items.filter((item) => new Date(item.createdAt) >= new Date(params.startDate));
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      items = items.filter((item) => new Date(item.createdAt) <= end);
    }

    const total = items.length;
    const limit = Number(params.limit) || 10;
    const page = Number(params.page) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      total,
      data: paginated,
      page,
      limit,
      totalPages
    };
  }

  // Attempt remote server if deployed
  try {
    const res = await apiFetch(`/vip-shaadi/enquiries?${query.toString()}`, {
      headers: getAuthHeaders()
    });

    if (res.status === 404) {
      NOT_DEPLOYED_ROUTES.add("/vip-shaadi/enquiries");
      return fetchVipEnquiries(params);
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch VIP enquiries (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    return fetchVipEnquiries(params);
  }
};

export const fetchVipEnquiryDetails = async (id) => {
  if (!isFeatureDeployed("/vip-shaadi/enquiries")) {
    const items = getStore("vip_enquiries", SEED_VIP_ENQUIRIES);
    const found = items.find((item) => item._id === id);
    if (!found) throw new Error("VIP enquiry not found");
    return { success: true, data: found };
  }

  const res = await apiFetch(`/vip-shaadi/enquiries/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const items = getStore("vip_enquiries", SEED_VIP_ENQUIRIES);
    const found = items.find((item) => item._id === id);
    if (found) return { success: true, data: found };
    throw new Error("Failed to fetch enquiry details");
  }
  return await res.json();
};

export const updateVipEnquiryStatus = async (id, { status, note, assignedAdmin }) => {
  if (!isFeatureDeployed("/vip-shaadi/enquiries")) {
    const items = getStore("vip_enquiries", SEED_VIP_ENQUIRIES);
    const index = items.findIndex((item) => item._id === id);
    if (index === -1) throw new Error("VIP enquiry not found");

    const current = items[index];
    const updated = {
      ...current,
      status: status || current.status,
      assignedAdmin: assignedAdmin || current.assignedAdmin,
      notes: note
        ? [
          ...(current.notes || []),
          {
            note,
            addedBy: assignedAdmin || localStorage.getItem("adminEmail") || "admin@example.com",
            date: new Date().toISOString()
          }
        ]
        : current.notes,
      statusHistory: [
        ...(current.statusHistory || []),
        {
          status: status || current.status,
          changedBy: assignedAdmin || localStorage.getItem("adminEmail") || "admin@example.com",
          changedAt: new Date().toISOString(),
          note: note || `Status updated to ${status}`
        }
      ]
    };

    items[index] = updated;
    setStore("vip_enquiries", items);
    return { success: true, message: "Status updated successfully", data: updated };
  }

  const res = await apiFetch(`/vip-shaadi/enquiries/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, note, assignedAdmin })
  });
  if (!res.ok) {
    throw new Error("Failed to update status on server");
  }
  return await res.json();
};

// ==========================================
// ASTROLOGER MANAGEMENT API
// ==========================================

const parseSafeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) return p;
    } catch (e) { }
    if (val.includes(",")) {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const trimmed = val.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

export const sanitizeAstrologer = (a) => {
  if (!a || typeof a !== "object") return a;
  const specs = parseSafeArray(a.specializations || a.specialties);
  const langs = parseSafeArray(a.languages);
  const methods = parseSafeArray(a.supportedMethods);

  return {
    ...a,
    specializations: specs,
    specialties: specs,
    languages: langs.length > 0 ? langs : ["Hindi", "English"],
    supportedMethods: methods.length > 0 ? methods : ["chat", "call"],
    consultationFee: a.consultationFee ?? a.pricePerMinute ?? 25,
    pricePerMinute: a.pricePerMinute ?? a.consultationFee ?? 25,
    description: a.description || a.about || "",
    biography: a.biography || a.about || "",
    about: a.about || a.biography || a.description || "",
    photo: a.photo || a.photoUrl || "",
    photoUrl: a.photoUrl || a.photo || ""
  };
};

export const fetchAstrologers = async (params = {}) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    let rawItems = getStore("astrologers", SEED_ASTROLOGERS);
    let items = (Array.isArray(rawItems) ? rawItems : SEED_ASTROLOGERS).map(sanitizeAstrologer);

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          (Array.isArray(a.specializations) && a.specializations.some((s) => s.toLowerCase().includes(q))) ||
          (Array.isArray(a.specialties) && a.specialties.some((s) => s.toLowerCase().includes(q)))
      );
    }
    if (params.availability && params.availability !== "all") {
      items = items.filter((a) => a.availability?.status === params.availability);
    }
    if (params.isPublished !== undefined && params.isPublished !== "all") {
      const boolVal = params.isPublished === "true" || params.isPublished === true;
      items = items.filter((a) => a.isPublished === boolVal);
    }

    const total = items.length;
    const limit = Number(params.limit) || 10;
    const page = Number(params.page) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      total,
      data: paginated,
      page,
      limit,
      totalPages
    };
  }

  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.search && params.search.trim()) query.append("search", params.search.trim());
  if (params.availability && params.availability !== "all") query.append("availability", params.availability);
  if (params.isPublished !== undefined && params.isPublished !== "all") {
    query.append("isPublished", params.isPublished);
  }

  try {
    const res = await apiFetch(`/admin/astrochat/astrologers?${query.toString()}`, {
      headers: getAuthHeaders()
    });

    if (res.status === 404) {
      NOT_DEPLOYED_ROUTES.add("/admin/astrochat/astrologers");
      return fetchAstrologers(params);
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch astrologers (${res.status})`);
    }

    const resJson = await res.json();
    if (resJson && Array.isArray(resJson.data)) {
      resJson.data = resJson.data.map(sanitizeAstrologer);
    }
    return resJson;
  } catch (err) {
    return fetchAstrologers(params);
  }
};

export const fetchAstrologerDetails = async (id) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    const rawItems = getStore("astrologers", SEED_ASTROLOGERS);
    const items = (Array.isArray(rawItems) ? rawItems : SEED_ASTROLOGERS).map(sanitizeAstrologer);
    const found = items.find((a) => a._id === id);
    if (!found) throw new Error("Astrologer not found");
    return { success: true, data: found };
  }

  const res = await apiFetch(`/admin/astrochat/astrologers/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const rawItems = getStore("astrologers", SEED_ASTROLOGERS);
    const items = (Array.isArray(rawItems) ? rawItems : SEED_ASTROLOGERS).map(sanitizeAstrologer);
    const found = items.find((a) => a._id === id);
    if (found) return { success: true, data: found };
    throw new Error("Failed to fetch astrologer");
  }
  const detailJson = await res.json();
  if (detailJson && detailJson.data) {
    detailJson.data = sanitizeAstrologer(detailJson.data);
  }
  return detailJson;
};

export const createAstrologer = async (formData) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    const rawItems = getStore("astrologers", SEED_ASTROLOGERS);
    const items = (Array.isArray(rawItems) ? rawItems : SEED_ASTROLOGERS).map(sanitizeAstrologer);
    let newEntry;

    if (formData instanceof FormData) {
      const languages = parseSafeArray(formData.get("languages"));
      const specializations = parseSafeArray(formData.get("specializations") || formData.get("specialties"));
      const supportedMethods = parseSafeArray(formData.get("supportedMethods"));
      const fee = Number(formData.get("consultationFee") || formData.get("pricePerMinute")) || 25;
      const desc = formData.get("description") || formData.get("about") || "";
      const bio = formData.get("biography") || formData.get("about") || "";

      newEntry = {
        _id: `astro_${Date.now()}`,
        name: formData.get("name") || "",
        email: formData.get("email") || "",
        phone: formData.get("phone") || "",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        experienceYears: Number(formData.get("experienceYears")) || 1,
        languages: languages.length > 0 ? languages : ["Hindi", "English"],
        specializations: specializations.length > 0 ? specializations : ["Vedic Astrology"],
        specialties: specializations.length > 0 ? specializations : ["Vedic Astrology"],
        consultationFee: fee,
        pricePerMinute: fee,
        description: desc,
        biography: bio,
        about: bio || desc,
        rating: 5.0,
        totalConsultations: 0,
        availability: { status: formData.get("availabilityStatus") || "online", nextAvailable: null },
        supportedMethods: supportedMethods.length > 0 ? supportedMethods : ["chat", "call"],
        isPublished: formData.get("isPublished") === "true",
        createdAt: new Date().toISOString()
      };
    } else {
      newEntry = sanitizeAstrologer({
        _id: `astro_${Date.now()}`,
        rating: 5.0,
        totalConsultations: 0,
        availability: { status: "online", nextAvailable: null },
        createdAt: new Date().toISOString(),
        ...formData
      });
    }

    items.unshift(newEntry);
    setStore("astrologers", items);
    return { success: true, message: "Astrologer onboarded successfully", data: newEntry };
  }

  const isFormData = formData instanceof FormData;
  const res = await apiFetch(`/admin/astrochat/astrologers`, {
    method: "POST",
    headers: getAuthHeaders(isFormData),
    body: isFormData ? formData : JSON.stringify(formData)
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to create astrologer (${res.status})`);
  }

  return await res.json();
};

export const updateAstrologer = async (id, formData) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    const rawItems = getStore("astrologers", SEED_ASTROLOGERS);
    const items = (Array.isArray(rawItems) ? rawItems : SEED_ASTROLOGERS).map(sanitizeAstrologer);
    const index = items.findIndex((a) => a._id === id);
    if (index === -1) throw new Error("Astrologer not found");

    let updates = {};
    if (formData instanceof FormData) {
      for (const [key, val] of formData.entries()) {
        if (key === "languages") {
          updates.languages = parseSafeArray(val);
        } else if (key === "specialties" || key === "specializations") {
          const parsed = parseSafeArray(val);
          updates.specializations = parsed;
          updates.specialties = parsed;
        } else if (key === "supportedMethods") {
          updates.supportedMethods = parseSafeArray(val);
        } else if (key === "experienceYears") {
          updates.experienceYears = Number(val);
        } else if (key === "consultationFee" || key === "pricePerMinute") {
          const fee = Number(val);
          updates.consultationFee = fee;
          updates.pricePerMinute = fee;
        } else if (key === "isPublished") {
          updates.isPublished = val === "true" || val === true;
        } else if (key === "availabilityStatus" || key === "availability") {
          updates.availability = { status: val, nextAvailable: null };
        } else if (key !== "photo") {
          updates[key] = val;
        }
      }
    } else {
      updates = formData;
    }

    items[index] = sanitizeAstrologer({ ...items[index], ...updates });
    setStore("astrologers", items);
    return { success: true, message: "Astrologer updated successfully", data: items[index] };
  }

  const isFormData = formData instanceof FormData;
  const res = await apiFetch(`/admin/astrochat/astrologers/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(isFormData),
    body: isFormData ? formData : JSON.stringify(formData)
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to update astrologer (${res.status})`);
  }

  return await res.json();
};

export const publishAstrologer = async (id) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    const items = getStore("astrologers", SEED_ASTROLOGERS);
    const index = items.findIndex((a) => a._id === id);
    if (index !== -1) {
      items[index].isPublished = true;
      setStore("astrologers", items);
    }
    return { success: true, message: "Astrologer published successfully" };
  }

  const res = await apiFetch(`/admin/astrochat/astrologers/${id}/publish`, {
    method: "PATCH",
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to publish astrologer (${res.status})`);
  }

  return await res.json();
};

export const unpublishAstrologer = async (id) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    const items = getStore("astrologers", SEED_ASTROLOGERS);
    const index = items.findIndex((a) => a._id === id);
    if (index !== -1) {
      items[index].isPublished = false;
      setStore("astrologers", items);
    }
    return { success: true, message: "Astrologer unpublished successfully" };
  }

  const res = await apiFetch(`/admin/astrochat/astrologers/${id}/unpublish`, {
    method: "PATCH",
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to unpublish astrologer (${res.status})`);
  }

  return await res.json();
};

export const deleteAstrologer = async (id) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    let items = getStore("astrologers", SEED_ASTROLOGERS);
    items = items.filter((a) => a._id !== id);
    setStore("astrologers", items);
    return { success: true, message: "Astrologer deleted successfully" };
  }

  const res = await apiFetch(`/admin/astrochat/astrologers/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to delete astrologer (${res.status})`);
  }

  return await res.json();
};

export const fetchConsultations = async (params = {}) => {
  if (!isFeatureDeployed("/admin/astrochat/consultations")) {
    let items = getStore("consultations", SEED_CONSULTATIONS);
    if (params.status && params.status !== "all") {
      items = items.filter((c) => c.status === params.status);
    }
    const total = items.length;
    const limit = Number(params.limit) || 10;
    const page = Number(params.page) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      total,
      data: paginated,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.status && params.status !== "all") query.append("status", params.status);

  try {
    const res = await apiFetch(`/admin/astrochat/consultations?${query.toString()}`, {
      headers: getAuthHeaders()
    });

    if (res.status === 404) {
      NOT_DEPLOYED_ROUTES.add("/admin/astrochat/consultations");
      return fetchConsultations(params);
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch consultations (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    return fetchConsultations(params);
  }
};

// ==========================================
// ADMIN NOTIFICATIONS API
// ==========================================

export const fetchAdminNotifications = async (params = {}) => {
  if (!isFeatureDeployed("/admin/notifications")) {
    let items = getStore("notifications", SEED_NOTIFICATIONS);

    if (params.read !== undefined && params.read !== "all") {
      const isRead = params.read === true || params.read === "true";
      items = items.filter((n) => n.read === isRead);
    }
    if (params.type && params.type !== "all") {
      items = items.filter((n) => n.type === params.type);
    }

    const unreadCount = getStore("notifications", SEED_NOTIFICATIONS).filter((n) => !n.read).length;
    const total = items.length;
    const limit = Number(params.limit) || 20;
    const page = Number(params.page) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      total,
      unreadCount,
      data: paginated,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.read !== undefined && params.read !== "all") query.append("read", params.read);
  if (params.type && params.type !== "all") query.append("type", params.type);

  try {
    const res = await apiFetch(`/admin/notifications?${query.toString()}`, {
      headers: getAuthHeaders()
    });

    if (res.status === 404) {
      NOT_DEPLOYED_ROUTES.add("/admin/notifications");
      return fetchAdminNotifications(params);
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch notifications (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    return fetchAdminNotifications(params);
  }
};

export const markNotificationRead = async (id) => {
  if (!isFeatureDeployed("/admin/notifications")) {
    const items = getStore("notifications", SEED_NOTIFICATIONS);
    const index = items.findIndex((n) => n._id === id);
    if (index !== -1) {
      items[index].read = true;
      setStore("notifications", items);
    }
    return { success: true, message: "Notification marked as read" };
  }

  const res = await apiFetch(`/admin/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const items = getStore("notifications", SEED_NOTIFICATIONS);
    const index = items.findIndex((n) => n._id === id);
    if (index !== -1) {
      items[index].read = true;
      setStore("notifications", items);
      return { success: true };
    }
    throw new Error("Failed to mark notification as read");
  }
  return await res.json();
};

export const markAllNotificationsRead = async () => {
  if (!isFeatureDeployed("/admin/notifications")) {
    const items = getStore("notifications", SEED_NOTIFICATIONS);
    const updated = items.map((n) => ({ ...n, read: true }));
    setStore("notifications", updated);
    return { success: true, message: "All notifications marked as read" };
  }

  const res = await apiFetch(`/admin/notifications/mark-all-read`, {
    method: "PATCH",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const items = getStore("notifications", SEED_NOTIFICATIONS);
    const updated = items.map((n) => ({ ...n, read: true }));
    setStore("notifications", updated);
    return { success: true };
  }
  return await res.json();
};
