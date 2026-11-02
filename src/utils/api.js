// Centralized API configuration and service functions for Matrimony Admin Panel

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

// API fetch wrapper using the configured backend server URL
export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  return await fetch(url, options);
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (typeof imagePath === "object" && imagePath !== null) {
    imagePath = imagePath.url || imagePath.path;
  }
  if (!imagePath || typeof imagePath !== "string") return null;
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }
  if (imagePath.startsWith("/media_uploads/")) {
    return `${SERVER_BASE_URL}${imagePath}`;
  }
  if (imagePath.startsWith("/uploads/")) {
    return `${SERVER_BASE_URL}${imagePath}`;
  }
  return `${SERVER_BASE_URL}/media_uploads/${imagePath.replace(/^\//, "")}`;
};

// ==========================================
// VIP SHAADI ENQUIRIES API
// ==========================================

export const fetchVipEnquiries = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.status && params.status !== "all") query.append("status", params.status);
  if (params.search && params.search.trim()) query.append("search", params.search.trim());
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);

  const endpoint = `/vip-shaadi/enquiries${query.toString() ? `?${query.toString()}` : ""}`;
  
  try {
    const res = await apiFetch(endpoint, {
      headers: getAuthHeaders(),
    });

    if (res.status === 404) {
      // Graceful fallback when endpoint is pending deployment on server
      return { success: true, total: 0, data: [], page: 1, limit: params.limit || 10, totalPages: 1 };
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch VIP Shaadi enquiries (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    if (err.message && err.message.includes("404")) {
      return { success: true, total: 0, data: [], page: 1, limit: params.limit || 10, totalPages: 1 };
    }
    throw err;
  }
};

export const fetchVipEnquiryDetails = async (id) => {
  const res = await apiFetch(`/vip-shaadi/enquiries/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to fetch enquiry details (${res.status})`);
  }
  return await res.json();
};

export const updateVipEnquiryStatus = async (id, { status, note, assignedAdmin }) => {
  const res = await apiFetch(`/vip-shaadi/enquiries/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, note, assignedAdmin }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to update enquiry status (${res.status})`);
  }
  return await res.json();
};

// ==========================================
// ASTROLOGER MANAGEMENT API
// ==========================================

export const fetchAstrologers = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.search && params.search.trim()) query.append("search", params.search.trim());
  if (params.availability && params.availability !== "all") query.append("availability", params.availability);
  if (params.isPublished !== undefined && params.isPublished !== "all") {
    query.append("isPublished", params.isPublished);
  }

  const endpoint = `/admin/astrochat/astrologers${query.toString() ? `?${query.toString()}` : ""}`;
  
  try {
    const res = await apiFetch(endpoint, {
      headers: getAuthHeaders(),
    });

    if (res.status === 404) {
      return { success: true, total: 0, data: [], page: 1, limit: params.limit || 10, totalPages: 1 };
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch astrologers (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    if (err.message && err.message.includes("404")) {
      return { success: true, total: 0, data: [], page: 1, limit: params.limit || 10, totalPages: 1 };
    }
    throw err;
  }
};

export const fetchAstrologerDetails = async (id) => {
  const res = await apiFetch(`/admin/astrochat/astrologers/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to fetch astrologer (${res.status})`);
  }
  return await res.json();
};

export const createAstrologer = async (formData) => {
  const isFormData = formData instanceof FormData;
  const res = await apiFetch(`/admin/astrochat/astrologers`, {
    method: "POST",
    headers: getAuthHeaders(isFormData),
    body: isFormData ? formData : JSON.stringify(formData),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to create astrologer (${res.status})`);
  }

  return await res.json();
};

export const updateAstrologer = async (id, formData) => {
  const isFormData = formData instanceof FormData;
  const res = await apiFetch(`/admin/astrochat/astrologers/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(isFormData),
    body: isFormData ? formData : JSON.stringify(formData),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to update astrologer (${res.status})`);
  }

  return await res.json();
};

export const publishAstrologer = async (id) => {
  const res = await apiFetch(`/admin/astrochat/astrologers/${id}/publish`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to publish astrologer (${res.status})`);
  }

  return await res.json();
};

export const unpublishAstrologer = async (id) => {
  const res = await apiFetch(`/admin/astrochat/astrologers/${id}/unpublish`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to unpublish astrologer (${res.status})`);
  }

  return await res.json();
};

export const deleteAstrologer = async (id) => {
  const res = await apiFetch(`/admin/astrochat/astrologers/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to delete astrologer (${res.status})`);
  }

  return await res.json();
};

export const fetchConsultations = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.status && params.status !== "all") query.append("status", params.status);

  const endpoint = `/admin/astrochat/consultations${query.toString() ? `?${query.toString()}` : ""}`;
  
  try {
    const res = await apiFetch(endpoint, {
      headers: getAuthHeaders(),
    });

    if (res.status === 404) {
      return { success: true, total: 0, data: [], page: 1, limit: params.limit || 10, totalPages: 1 };
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch consultations (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    if (err.message && err.message.includes("404")) {
      return { success: true, total: 0, data: [], page: 1, limit: params.limit || 10, totalPages: 1 };
    }
    throw err;
  }
};

// ==========================================
// ADMIN NOTIFICATIONS API
// ==========================================

export const fetchAdminNotifications = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.read !== undefined && params.read !== "all") query.append("read", params.read);
  if (params.type && params.type !== "all") query.append("type", params.type);

  const endpoint = `/admin/notifications${query.toString() ? `?${query.toString()}` : ""}`;
  
  try {
    const res = await apiFetch(endpoint, {
      headers: getAuthHeaders(),
    });

    if (res.status === 404) {
      return { success: true, total: 0, unreadCount: 0, data: [], page: 1, limit: params.limit || 20, totalPages: 1 };
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to fetch notifications (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    if (err.message && err.message.includes("404")) {
      return { success: true, total: 0, unreadCount: 0, data: [], page: 1, limit: params.limit || 20, totalPages: 1 };
    }
    throw err;
  }
};

export const markNotificationRead = async (id) => {
  const res = await apiFetch(`/admin/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to mark notification as read (${res.status})`);
  }
  return await res.json();
};

export const markAllNotificationsRead = async () => {
  const res = await apiFetch(`/admin/notifications/mark-all-read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to mark all notifications as read (${res.status})`);
  }
  return await res.json();
};
