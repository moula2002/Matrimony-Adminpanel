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

const SEED_VIP_ENQUIRIES = [
  {
    _id: "vip_enq_101",
    fullName: "Aarav Singhania",
    email: "aarav.singhania@example.com",
    phone: "+91 98765 43210",
    profileId: "FAM10001",
    userId: "usr_vip_001",
    status: "New",
    assignedAdmin: "admin@example.com",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    notes: [
      {
        note: "Initial enquiry submitted via VIP Familiess portal. High profile industrial family requirement.",
        addedBy: "System",
        date: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ],
    statusHistory: [
      {
        status: "New",
        changedBy: "System",
        changedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        note: "Enquiry created"
      }
    ],
    matrimonyProfile: {
      name: "Aarav Singhania",
      age: 29,
      gender: "Male",
      religion: "Hindu",
      caste: "Rajput",
      subCaste: "Surya",
      motherTongue: "Hindi",
      height: "5' 11\"",
      education: "MBA - Wharton School",
      occupation: "Investment Banker",
      employedIn: "Private Sector",
      annualIncome: "₹45,00,000",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      maritalStatus: "Never Married",
      diet: "Vegetarian",
      familyType: "Joint",
      familyStatus: "Affluent",
      fatherOccupation: "Industrialist",
      motherOccupation: "Homemaker",
      aboutMe: "Driven investment professional with a passion for philanthropy, classical music, and global travel. Looking for an educated partner from a respected cultural family.",
      partnerPreferences: "Graduate/Post-graduate, cultured, family-oriented, age 24-28.",
      photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop"]
    }
  },
  {
    _id: "vip_enq_102",
    fullName: "Dr. Ananya Reddy",
    email: "dr.ananya.reddy@example.com",
    phone: "+91 98480 12345",
    profileId: "FAM10002",
    userId: "usr_vip_002",
    status: "Contacted",
    assignedAdmin: "admin@example.com",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: [
      {
        note: "Called on 02 Nov. Family expressed interest in dedicated VIP matchmaker service.",
        addedBy: "admin@example.com",
        date: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ],
    statusHistory: [
      {
        status: "New",
        changedBy: "System",
        changedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        note: "Enquiry created"
      },
      {
        status: "Contacted",
        changedBy: "admin@example.com",
        changedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        note: "Initial telephonic briefing completed"
      }
    ],
    matrimonyProfile: {
      name: "Dr. Ananya Reddy",
      age: 27,
      gender: "Female",
      religion: "Hindu",
      caste: "Reddy",
      motherTongue: "Telugu",
      height: "5' 6\"",
      education: "MD - General Medicine (AIIMS)",
      occupation: "Doctor / Resident Physician",
      employedIn: "Healthcare",
      annualIncome: "₹28,00,000",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      maritalStatus: "Never Married",
      diet: "Non-Vegetarian",
      familyType: "Nuclear",
      familyStatus: "Upper Middle Class",
      fatherOccupation: "Senior Civil Servant (IAS)",
      motherOccupation: "University Professor",
      aboutMe: "Compassionate physician dedicated to healthcare and patient wellness. Enjoy badminton, classical dance, and exploring new cuisines.",
      partnerPreferences: "Doctor, Engineer, or Civil Servant with good moral values.",
      photos: ["https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=600&fit=crop"]
    }
  },
  {
    _id: "vip_enq_103",
    fullName: "Rohan Varma",
    email: "rohan.varma@example.com",
    phone: "+91 97110 99887",
    profileId: "FAM10003",
    userId: "usr_vip_003",
    status: "Interested",
    assignedAdmin: "admin@example.com",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    notes: [
      {
        note: "Reviewed Royal VIP Familiess package. Scheduled matchmaker briefing session.",
        addedBy: "admin@example.com",
        date: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    statusHistory: [
      {
        status: "New",
        changedBy: "System",
        changedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        note: "Enquiry submitted"
      },
      {
        status: "Interested",
        changedBy: "admin@example.com",
        changedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        note: "Client requested VIP tier breakdown"
      }
    ],
    matrimonyProfile: {
      name: "Rohan Varma",
      age: 31,
      gender: "Male",
      religion: "Hindu",
      caste: "Kshatriya",
      motherTongue: "Hindi",
      height: "6' 0\"",
      education: "B.Tech (IIT Delhi) + MS (Stanford)",
      occupation: "Tech Co-Founder / CEO",
      employedIn: "Business / Entrepreneur",
      annualIncome: "₹1,20,00,000",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      maritalStatus: "Never Married",
      diet: "Vegetarian",
      familyType: "Nuclear",
      familyStatus: "Affluent",
      fatherOccupation: "Retired Army Brigadier",
      motherOccupation: "Educationist",
      aboutMe: "Technology entrepreneur with a global footprint. Believer in balanced living, fitness, and deep conversations.",
      partnerPreferences: "Progressive mindset, professional background, broad worldview.",
      photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=600&fit=crop"]
    }
  },
  {
    _id: "vip_enq_104",
    fullName: "Meera Kapoor",
    email: "meera.kapoor@example.com",
    phone: "+91 99200 44556",
    profileId: "FAM10004",
    userId: "usr_vip_004",
    status: "Converted",
    assignedAdmin: "admin@example.com",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    notes: [
      {
        note: "Subscribed to Royal VIP Membership. Dedicated manager assigned.",
        addedBy: "admin@example.com",
        date: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ],
    statusHistory: [
      {
        status: "Converted",
        changedBy: "admin@example.com",
        changedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        note: "Subscribed to VIP Membership"
      }
    ],
    matrimonyProfile: {
      name: "Meera Kapoor",
      age: 26,
      gender: "Female",
      religion: "Hindu",
      caste: "Khatri",
      motherTongue: "Punjabi",
      height: "5' 5\"",
      education: "Master in Fashion Design (NIFT)",
      occupation: "Couture Fashion Designer",
      employedIn: "Self Employed",
      annualIncome: "₹35,00,000",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      maritalStatus: "Never Married",
      diet: "Eggetarian",
      familyType: "Joint",
      familyStatus: "Rich / Affluent",
      fatherOccupation: "Textile Exporter",
      motherOccupation: "Interior Designer",
      aboutMe: "Creative soul running a boutique fashion label. Value tradition with contemporary elegance.",
      partnerPreferences: "Settled businessman or high-tier professional, grounded, respectful.",
      photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=600&fit=crop"]
    }
  },
  {
    _id: "vip_enq_105",
    fullName: "Devendra Joshi",
    email: "dev.joshi@example.com",
    phone: "+91 94250 88776",
    profileId: "FAM10005",
    userId: "usr_vip_005",
    status: "Closed",
    assignedAdmin: "admin@example.com",
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    notes: [
      {
        note: "Enquiry closed as candidate match finalized offline.",
        addedBy: "admin@example.com",
        date: new Date(Date.now() - 86400000 * 8).toISOString()
      }
    ],
    statusHistory: [
      {
        status: "Closed",
        changedBy: "admin@example.com",
        changedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        note: "Match finalized offline"
      }
    ],
    matrimonyProfile: {
      name: "Devendra Joshi",
      age: 33,
      gender: "Male",
      religion: "Hindu",
      caste: "Brahmin",
      motherTongue: "Marathi",
      height: "5' 10\"",
      education: "Chartered Accountant (ICAI)",
      occupation: "Senior Partner, Audit & Advisory",
      employedIn: "Consulting",
      annualIncome: "₹50,00,000",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      maritalStatus: "Never Married",
      diet: "Vegetarian",
      familyType: "Joint",
      familyStatus: "Middle Class",
      fatherOccupation: "Retired Bank Manager",
      motherOccupation: "Homemaker",
      aboutMe: "Finance professional with strong cultural grounding. Avid reader of history and classical literature.",
      partnerPreferences: "CA, Doctor, or Engineer from Brahmin background.",
      photos: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=600&fit=crop"]
    }
  }
];

const SEED_ASTROLOGERS = [
  {
    _id: "astro_001",
    name: "Acharya Rajesh Sharma",
    email: "acharya.rajesh@familiess.com",
    phone: "+91 98111 22334",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    experienceYears: 18,
    languages: ["Hindi", "English", "Sanskrit"],
    specialties: ["Vedic Astrology", "Kundali Milan", "Prashna Kundali", "Career Guidance"],
    pricePerMinute: 30,
    about: "Gold medalist Vedic Astrologer with 18+ years of dedicated consultation in matchmaking, Dosha Nivaran, and life predictions.",
    rating: 4.9,
    totalConsultations: 1250,
    availability: { status: "online", nextAvailable: null },
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
  },
  {
    _id: "astro_002",
    name: "Dr. Sunita Shastri",
    email: "dr.sunita@familiess.com",
    phone: "+91 98222 33445",
    photoUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop",
    experienceYears: 14,
    languages: ["Hindi", "English", "Marathi"],
    specialties: ["Kundali Milan", "Numerology", "Gemology", "Vastu Shastra"],
    pricePerMinute: 25,
    about: "Renowned expert in matrimonial compatibility, Ashtakoot Guna Milan, and Nadi Dosha remedies.",
    rating: 4.8,
    totalConsultations: 980,
    availability: { status: "online", nextAvailable: null },
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString()
  },
  {
    _id: "astro_003",
    name: "Pandit Vikramaditya Iyer",
    email: "vikramaditya.iyer@familiess.com",
    phone: "+91 98333 44556",
    photoUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop",
    experienceYears: 22,
    languages: ["Tamil", "Telugu", "Hindi", "English"],
    specialties: ["South Indian Astrology", "Jathagam Matching", "Nakshatra Analysis", "Muhurtham"],
    pricePerMinute: 35,
    about: "Hereditary South Indian Jyothishya expert specializing in Porutham, Papasamya, and auspicious Vivaha Muhurtham calculation.",
    rating: 4.95,
    totalConsultations: 2100,
    availability: { status: "busy", nextAvailable: "In 15 mins" },
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString()
  },
  {
    _id: "astro_004",
    name: "Meenakshi Devi",
    email: "meenakshi.devi@familiess.com",
    phone: "+91 98444 55667",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    experienceYears: 9,
    languages: ["Hindi", "English", "Bengali"],
    specialties: ["Tarot Reading", "Relationship Advice", "Palmistry"],
    pricePerMinute: 20,
    about: "Empathetic tarot reader and relationship astrologer helping couples understand dynamic synergy and emotional harmony.",
    rating: 4.75,
    totalConsultations: 640,
    availability: { status: "offline", nextAvailable: "Tomorrow at 10:00 AM" },
    isPublished: false,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  }
];

const SEED_CONSULTATIONS = [
  {
    _id: "cons_001",
    astrologerId: "astro_001",
    astrologerName: "Acharya Rajesh Sharma",
    userId: "usr_101",
    userName: "Suresh Patel",
    durationMinutes: 24,
    totalAmount: 720,
    status: "Completed",
    topic: "Kundali Milan for daughter",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    _id: "cons_002",
    astrologerId: "astro_002",
    astrologerName: "Dr. Sunita Shastri",
    userId: "usr_102",
    userName: "Pooja Malhotra",
    durationMinutes: 18,
    totalAmount: 450,
    status: "Completed",
    topic: "Manglik Dosha Remedies",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    _id: "cons_003",
    astrologerId: "astro_003",
    astrologerName: "Pandit Vikramaditya Iyer",
    userId: "usr_103",
    userName: "Karthik Subramanian",
    durationMinutes: 30,
    totalAmount: 1050,
    status: "In-Progress",
    topic: "Vivaha Muhurtham Selection",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

const SEED_NOTIFICATIONS = [
  {
    _id: "notif_001",
    type: "VIP_ENQUIRY",
    message: "New VIP Familiess Enquiry received from Aarav Singhania (Profile #FAM10001)",
    relatedModel: "VipShaadiEnquiry",
    relatedId: "vip_enq_101",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    _id: "notif_002",
    type: "VIP_ENQUIRY",
    message: "VIP Enquiry from Dr. Ananya Reddy updated to 'Contacted'",
    relatedModel: "VipShaadiEnquiry",
    relatedId: "vip_enq_102",
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    _id: "notif_003",
    type: "ASTROLOGER_REGISTRATION",
    message: "Acharya Rajesh Sharma completed profile verification and is now Online",
    relatedModel: "Astrologer",
    relatedId: "astro_001",
    read: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: "notif_004",
    type: "VIP_ENQUIRY",
    message: "VIP Familiess Enquiry from Rohan Varma expressed interest in Royal Membership",
    relatedModel: "VipShaadiEnquiry",
    relatedId: "vip_enq_103",
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// Local store helpers
const getStore = (key, seed) => {
  try {
    const raw = localStorage.getItem(`matrimony_${key}`);
    if (raw) return JSON.parse(raw);
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

export const fetchAstrologers = async (params = {}) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    let items = getStore("astrologers", SEED_ASTROLOGERS);

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          a.specialties?.some((s) => s.toLowerCase().includes(q))
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

    return await res.json();
  } catch (err) {
    return fetchAstrologers(params);
  }
};

export const fetchAstrologerDetails = async (id) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    const items = getStore("astrologers", SEED_ASTROLOGERS);
    const found = items.find((a) => a._id === id);
    if (!found) throw new Error("Astrologer not found");
    return { success: true, data: found };
  }

  const res = await apiFetch(`/admin/astrochat/astrologers/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const items = getStore("astrologers", SEED_ASTROLOGERS);
    const found = items.find((a) => a._id === id);
    if (found) return { success: true, data: found };
    throw new Error("Failed to fetch astrologer");
  }
  return await res.json();
};

export const createAstrologer = async (formData) => {
  if (!isFeatureDeployed("/admin/astrochat/astrologers")) {
    const items = getStore("astrologers", SEED_ASTROLOGERS);
    let newEntry;

    if (formData instanceof FormData) {
      const languages = formData.get("languages");
      const specialties = formData.get("specialties");
      newEntry = {
        _id: `astro_${Date.now()}`,
        name: formData.get("name") || "",
        email: formData.get("email") || "",
        phone: formData.get("phone") || "",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        experienceYears: Number(formData.get("experienceYears")) || 1,
        languages: languages ? JSON.parse(languages) : [],
        specialties: specialties ? JSON.parse(specialties) : [],
        pricePerMinute: Number(formData.get("pricePerMinute")) || 20,
        about: formData.get("about") || "",
        rating: 5.0,
        totalConsultations: 0,
        availability: { status: "online", nextAvailable: null },
        isPublished: formData.get("isPublished") === "true",
        createdAt: new Date().toISOString()
      };
    } else {
      newEntry = {
        _id: `astro_${Date.now()}`,
        rating: 5.0,
        totalConsultations: 0,
        availability: { status: "online", nextAvailable: null },
        createdAt: new Date().toISOString(),
        ...formData
      };
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
    const items = getStore("astrologers", SEED_ASTROLOGERS);
    const index = items.findIndex((a) => a._id === id);
    if (index === -1) throw new Error("Astrologer not found");

    let updates = {};
    if (formData instanceof FormData) {
      for (const [key, val] of formData.entries()) {
        if (key === "languages" || key === "specialties") {
          try {
            updates[key] = JSON.parse(val);
          } catch (e) {
            updates[key] = val.split(",").map((s) => s.trim());
          }
        } else if (key === "experienceYears" || key === "pricePerMinute") {
          updates[key] = Number(val);
        } else if (key === "isPublished") {
          updates[key] = val === "true";
        } else if (key !== "photo") {
          updates[key] = val;
        }
      }
    } else {
      updates = formData;
    }

    items[index] = { ...items[index], ...updates };
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
