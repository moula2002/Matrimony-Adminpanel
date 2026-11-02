import React from "react";
import { X, Award, CheckCircle2, Phone, Mail, MapPin, Calendar, Briefcase, GraduationCap, Users as UsersIcon, Heart, Shield } from "lucide-react";
import { getImageUrl } from "../utils/api";

export default function MatrimonyProfileModal({ user, isOpen, onClose }) {
  if (!isOpen || !user) return null;

  const profile = user.profile || {};
  const preferences = user.preferences || {};
  const isPremium = user.premiumMembership?.isPremium;
  const planType = user.premiumMembership?.planType || "Free";

  const getProfilePhoto = () => {
    const photos = profile.rawPhotos || profile.photos;
    if (!photos || photos.length === 0) return null;
    const photo = photos[0];
    return typeof photo === "object" && photo !== null ? photo.url : photo;
  };

  const photoUrl = getImageUrl(getProfilePhoto());
  const displayName = profile.name || user.name || user.email || "Matrimony Member";
  const userUid = user.uid || (user._id ? user._id.slice(-6).toUpperCase() : "N/A");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
              <Heart className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Matrimony Profile
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                  ID: {userUid}
                </span>
              </h2>
              <p className="text-xs text-slate-500">Comprehensive matrimonial data & background</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Hero Profile Summary Card */}
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <div className="relative shrink-0">
              <div className="h-32 w-32 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-md">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff&size=200`;
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-purple-100 text-purple-600 text-4xl font-extrabold">
                    {displayName[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              {user.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow border-2 border-white" title="Verified Profile">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                {isPremium ? (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
                    <Award className="h-3 w-3" />
                    {planType} Member
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    Free Member
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mb-3">
                <span>UID: <strong className="font-mono text-slate-800">{userUid}</strong></span>
                <span>•</span>
                <span>Gender: <strong className="text-slate-800">{profile.gender || "Not specified"}</strong></span>
                <span>•</span>
                <span>Age: <strong className="text-slate-800">{profile.age ? `${profile.age} yrs` : "N/A"}</strong></span>
                <span>•</span>
                <span>Height: <strong className="text-slate-800">{profile.height || "N/A"}</strong></span>
              </p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-xs">
                {profile.profession && (
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-700 font-medium shadow-2xs">
                    <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                    {profile.profession}
                  </span>
                )}
                {profile.location && (
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-700 font-medium shadow-2xs">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    {profile.location}
                  </span>
                )}
                {profile.education && (
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-700 font-medium shadow-2xs">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                    {profile.education}
                  </span>
                )}
              </div>

              {profile.bio && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                  "{profile.bio}"
                </div>
              )}
            </div>
          </div>

          {/* Sectional Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Contact & Personal Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Phone className="h-4 w-4" />
                Contact & Personal
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800 font-mono">{user.phone || profile.phone || "Not available"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[150px]">{user.email || "Not available"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Marital Status:</span>
                  <span className="font-semibold text-slate-800">{profile.maritalStatus || "Never Married"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="font-semibold text-slate-800">
                    {profile.dob ? new Date(profile.dob).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">City / State:</span>
                  <span className="font-semibold text-slate-800">
                    {[profile.city, profile.state].filter(Boolean).join(", ") || profile.location || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Country:</span>
                  <span className="font-semibold text-slate-800">{profile.country || "India"}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Religion, Caste & Lifestyle */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                <UsersIcon className="h-4 w-4" />
                Religion & Community
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Religion:</span>
                  <span className="font-semibold text-slate-800">{profile.religion || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Caste:</span>
                  <span className="font-semibold text-slate-800">{profile.caste || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Community:</span>
                  <span className="font-semibold text-slate-800">{profile.community || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Diet:</span>
                  <span className="font-semibold text-slate-800">{profile.diet || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Languages:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {Array.isArray(profile.languages) ? profile.languages.join(", ") : profile.languages || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Income:</span>
                  <span className="font-semibold text-emerald-600">{profile.income || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Column 3: Partner Preferences */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Heart className="h-4 w-4" />
                Partner Preferences
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Age Preference:</span>
                  <span className="font-semibold text-slate-800">
                    {preferences.ageRange ? `${preferences.ageRange[0]} - ${preferences.ageRange[1]} yrs` : "Any"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Height Preference:</span>
                  <span className="font-semibold text-slate-800">
                    {preferences.heightRange ? `${preferences.heightRange[0]} - ${preferences.heightRange[1]}` : "Any"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Religion Preference:</span>
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(preferences.religion) ? preferences.religion.join(", ") : preferences.religion || "Any"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Marital Preference:</span>
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(preferences.maritalStatus) ? preferences.maritalStatus.join(", ") : preferences.maritalStatus || "Any"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location Preference:</span>
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(preferences.location) ? preferences.location.join(", ") : preferences.location || "Any"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors shadow-2xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
