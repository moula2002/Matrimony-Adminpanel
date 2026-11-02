import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BadgePercent,
  LogOut,
  Menu,
  X,
  CheckSquare,
  FileText,
  BarChart3,
  Wallet,
  Settings,
  Image,
  Layers,
  Gift,
  Crown,
  Sparkles,
  UserPlus,
  Star,
  Bell,
  ChevronDown
} from "lucide-react";
import logo from "../assets/logo.png";
import { fetchAdminNotifications, fetchVipEnquiries } from "../utils/api";

export default function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newVipCount, setNewVipCount] = useState(0);
  const [showSecondary, setShowSecondary] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const email = localStorage.getItem("adminEmail");
    const role = localStorage.getItem("adminRole");

    if (!token || role !== "admin") {
      navigate("/login");
    } else {
      setAdminEmail(email || "admin@example.com");
    }
  }, [navigate]);

  // Fetch notification and enquiry badges
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    let isMounted = true;
    const fetchBadges = async () => {
      const currentToken = localStorage.getItem("adminToken");
      if (!currentToken || !isMounted) return;

      try {
        const [notifRes, vipRes] = await Promise.allSettled([
          fetchAdminNotifications({ read: false, limit: 1 }),
          fetchVipEnquiries({ status: "New", limit: 1 })
        ]);

        if (!isMounted) return;

        if (notifRes.status === "fulfilled" && notifRes.value?.success) {
          setUnreadCount(notifRes.value.unreadCount ?? notifRes.value.total ?? 0);
        }
        if (vipRes.status === "fulfilled" && vipRes.value?.success) {
          setNewVipCount(vipRes.value.total || 0);
        }
      } catch (e) {
        // Silent fail for badges
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60000); // 60s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    navigate("/login");
  };

  // Primary 8 Menu Items strictly matching requirements
  const primaryNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "User Management", href: "/users", icon: Users },
    { name: "VIP Familiess Enquiries", href: "/vip-shaadi", icon: Crown, badge: newVipCount > 0 ? newVipCount : null },
    { name: "AstroChat Management", href: "/astrochat", icon: Sparkles },
    { name: "Add Astrologer", href: "/astrologers/add", icon: UserPlus },
    { name: "Manage Astrologers", href: "/astrologers", icon: Star },
    { name: "Notifications", href: "/notifications", icon: Bell, badge: unreadCount > 0 ? unreadCount : null, badgeColor: "bg-red-500" },
    { name: "Reports", href: "/reports", icon: BarChart3 }
  ];

  // Secondary Preserved Items
  const secondaryNavItems = [
    { name: "Managed Users", href: "/manage-users", icon: Users },
    { name: "Pending Approvals", href: "/approvals", icon: CheckSquare },
    { name: "Image Verification", href: "/image-approvals", icon: Image },
    { name: "Bio Verification", href: "/bio-approvals", icon: FileText },
    { name: "Subscription Plans", href: "/subscriptions", icon: CreditCard },
    { name: "Active Subscriptions", href: "/active-subscriptions", icon: BadgePercent },
    { name: "Payments", href: "/payments", icon: Wallet },
    { name: "Referrals", href: "/referrals", icon: Gift },
    { name: "Banners", href: "/banner", icon: Layers },
    { name: "Settings", href: "/settings", icon: Settings }
  ];

  const isItemActive = (href) => {
    if (href === "/dashboard" && pathname === "/") return true;
    if (href === "/astrologers" && (pathname === "/astrologers" || pathname === "/astrochat/manage")) return true;
    if (href === "/astrologers/add" && (pathname === "/astrologers/add" || pathname === "/astrochat/add")) return true;
    return pathname === href;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between bg-white px-4 py-3 text-slate-900 border-b border-slate-200 lg:hidden sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Familiess Matrimony" className="h-8 object-contain" />
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Link
              to="/notifications"
              className="relative p-1.5 text-slate-600 hover:text-purple-600 rounded-lg"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-slate-200 bg-white text-slate-800 transition-transform duration-300 lg:static lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo / Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center">
            <img src={logo} alt="Familiess Matrimony" className="h-9 w-auto object-contain" />
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Admin
          </span>
        </div>

        {/* Navigation Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation (The 8 requested options) */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Main Menu
            </div>
            <nav className="space-y-1">
              {primaryNavItems.map((item) => {
                const isActive = isItemActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      group flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150
                      ${
                        isActive
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 ${
                          isActive ? "text-white" : "text-slate-500 group-hover:text-purple-600"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white text-purple-700"
                            : item.badgeColor
                            ? `${item.badgeColor} text-white`
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Secondary Modules (Preserving all existing features) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowSecondary(!showSecondary)}
              className="w-full flex items-center justify-between px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span>Platform Tools</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showSecondary ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            {showSecondary && (
              <nav className="space-y-0.5">
                {secondaryNavItems.map((item) => {
                  const isActive = isItemActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group flex items-center gap-3 px-3.5 py-2 text-xs font-medium rounded-xl transition-all duration-150
                        ${
                          isActive
                            ? "bg-purple-50 text-purple-700 font-bold border border-purple-200"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }
                      `}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        </div>

        {/* Admin User Footer info */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              AD
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-800 truncate">{adminEmail}</span>
              <span className="text-[10px] text-slate-500 font-medium">Administrator</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
