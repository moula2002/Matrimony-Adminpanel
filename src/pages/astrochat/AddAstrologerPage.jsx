import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowLeft,
  X,
  Check
} from "lucide-react";
import { createAstrologer } from "../../utils/api";

const PRESET_SPECIALIZATIONS = [
  "Vedic Astrology",
  "Kundali Matching",
  "Numerology",
  "Tarot Reading",
  "Palmistry",
  "Vastu Shastra",
  "Prashna Kundali",
  "Gemology",
  "Career Astrology",
  "Relationship & Marriage",
  "Nadi Astrology",
  "Lal Kitab"
];

const PRESET_LANGUAGES = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Punjabi"
];

export default function AddAstrologerPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [biography, setBiography] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [specializations, setSpecializations] = useState(["Vedic Astrology", "Kundali Matching"]);
  const [customSpec, setCustomSpec] = useState("");
  const [languages, setLanguages] = useState(["English", "Hindi"]);
  const [customLang, setCustomLang] = useState("");
  const [supportedMethods, setSupportedMethods] = useState(["chat", "call"]);
  const [availabilityStatus, setAvailabilityStatus] = useState("online");
  const [isPublished, setIsPublished] = useState(true);

  // Photo Upload & Preview
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Photo size cannot exceed 10MB.");
      return;
    }

    setError("");
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleSpecialization = (spec) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const addCustomSpec = () => {
    if (customSpec.trim() && !specializations.includes(customSpec.trim())) {
      setSpecializations((prev) => [...prev, customSpec.trim()]);
      setCustomSpec("");
    }
  };

  const toggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const addCustomLang = () => {
    if (customLang.trim() && !languages.includes(customLang.trim())) {
      setLanguages((prev) => [...prev, customLang.trim()]);
      setCustomLang("");
    }
  };

  const toggleMethod = (method) => {
    setSupportedMethods((prev) => {
      if (prev.includes(method)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((m) => m !== method);
      }
      return [...prev, method];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validations
    if (!name.trim()) {
      setError("Astrologer name is required.");
      return;
    }

    if (!photoFile) {
      setError("Please upload an astrologer profile photo.");
      return;
    }

    if (!description.trim()) {
      setError("Short description is required.");
      return;
    }

    if (!biography.trim()) {
      setError("Detailed biography is required.");
      return;
    }

    const exp = Number(experienceYears);
    if (isNaN(exp) || exp < 0) {
      setError("Please provide a valid non-negative number for experience years.");
      return;
    }

    const fee = Number(consultationFee);
    if (isNaN(fee) || fee < 0) {
      setError("Please provide a valid non-negative consultation fee.");
      return;
    }

    if (specializations.length === 0) {
      setError("Please select at least one specialization.");
      return;
    }

    if (languages.length === 0) {
      setError("Please select at least one language.");
      return;
    }

    if (supportedMethods.length === 0) {
      setError("Please select at least one consultation method (chat, call, or video).");
      return;
    }

    setSubmitting(true);

    try {
      // Build FormData for upload.single('photo')
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("photo", photoFile);
      formData.append("description", description.trim());
      formData.append("biography", biography.trim());
      formData.append("experienceYears", String(exp));
      formData.append("consultationFee", String(fee));
      formData.append("specializations", JSON.stringify(specializations));
      formData.append("languages", JSON.stringify(languages));
      formData.append("supportedMethods", JSON.stringify(supportedMethods));
      formData.append("availabilityStatus", availabilityStatus);
      formData.append("isPublished", isPublished ? "true" : "false");

      const res = await createAstrologer(formData);
      if (res && res.success) {
        setSuccessMessage("Astrologer profile created successfully!");
        setTimeout(() => {
          navigate("/astrologers");
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Failed to create astrologer profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              Add New Astrologer
              <Sparkles className="h-6 w-6 text-purple-600" />
            </h1>
            <p className="text-sm text-slate-500">
              Create an astrologer profile to provide consultation services in AstroChat
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/astrologers")}
          className="text-xs font-semibold text-purple-600 hover:text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
        >
          View All Astrologers
        </button>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Form Submission Error:</strong> {error}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="font-semibold">{successMessage} Redirecting to astrologers directory...</div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-8">
        {/* Section 1: Basic Identity & Profile Photo */}
        <div>
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center">1</span>
            Identity & Profile Photo
          </h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Photo Upload Box */}
            <div className="flex flex-col items-center">
              <label className="text-xs font-bold text-slate-700 mb-2 self-start">
                Profile Photo <span className="text-red-500">*</span>
              </label>

              <div className="relative group w-44 h-44 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-purple-50/50 hover:border-purple-400 transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow"
                        title="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 text-center"
                  >
                    <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-purple-600">Upload Photo</span>
                    <span className="text-[10px] text-slate-400 mt-1">JPEG, PNG up to 10MB</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {photoPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs font-semibold text-purple-600 hover:underline"
                >
                  Change Photo
                </button>
              )}
            </div>

            {/* Basic Info Inputs */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Astrologer Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acharya Rajesh Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Description / Tagline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Renowned Vedic Astrologer & Kundali Matching Specialist"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Consultation Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    placeholder="e.g. 499"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Biography <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Provide a comprehensive biography describing educational background, guidance approach, horoscope expertise, and consultation style..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Specializations & Languages */}
        <div>
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center">2</span>
            Specializations & Languages
          </h2>

          <div className="mt-6 space-y-6">
            {/* Specializations */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Specializations <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">({specializations.length} selected)</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_SPECIALIZATIONS.map((spec) => {
                  const active = specializations.includes(spec);
                  return (
                    <button
                      type="button"
                      key={spec}
                      onClick={() => toggleSpecialization(spec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        active
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300"
                      }`}
                    >
                      {active && <Check className="inline h-3 w-3 mr-1" />}
                      {spec}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Spec */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={customSpec}
                  onChange={(e) => setCustomSpec(e.target.value)}
                  placeholder="Add custom specialization..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={addCustomSpec}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Languages */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Languages Spoken <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">({languages.length} selected)</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_LANGUAGES.map((lang) => {
                  const active = languages.includes(lang);
                  return (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {active && <Check className="inline h-3 w-3 mr-1" />}
                      {lang}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Lang */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value)}
                  placeholder="Add custom language..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addCustomLang}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Consultation Method & Availability */}
        <div>
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center">3</span>
            Consultation Method & Availability
          </h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supported Methods */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Supported Consultation Methods <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "chat", label: "Astro Chat", desc: "Text session" },
                  { id: "call", label: "Voice Call", desc: "Audio session" },
                  { id: "video", label: "Video Call", desc: "Face-to-face" }
                ].map((item) => {
                  const active = supportedMethods.includes(item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleMethod(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? "bg-purple-50 border-purple-500 text-purple-900 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold capitalize">{item.label}</span>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          active ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300"
                        }`}>
                          {active && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Availability Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "online", label: "Online", color: "text-emerald-700 bg-emerald-50 border-emerald-400" },
                  { id: "busy", label: "Busy", color: "text-amber-700 bg-amber-50 border-amber-400" },
                  { id: "offline", label: "Offline", color: "text-slate-700 bg-slate-100 border-slate-300" }
                ].map((st) => {
                  const active = availabilityStatus === st.id;
                  return (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => setAvailabilityStatus(st.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active ? `${st.color} font-bold shadow-2xs` : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          st.id === "online" ? "bg-emerald-500" : st.id === "busy" ? "bg-amber-500" : "bg-slate-400"
                        }`} />
                        <span className="text-xs">{st.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Publish / Unpublish Toggle */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Publish Immediately to Mobile App</div>
              <p className="text-xs text-slate-500">
                When published, this astrologer will be immediately live and visible to all users in the mobile app.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/astrologers")}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Save & Add Astrologer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
