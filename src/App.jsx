import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import LoginPage from "./pages/login/LoginPage";
import UsersPage from "./pages/users/UsersPage";
import ManageUsersPage from "./pages/manage-users/ManageUsersPage";
import RevenuePage from "./pages/revenue/RevenuePage";
import SubscriptionsPage from "./pages/subscriptions/SubscriptionsPage";
import ApprovalsPage from "./pages/approvals/ApprovalsPage";
import ContentManagerPage from "./pages/content/ContentManagerPage";
import ActiveSubscriptionsPage from "./pages/active-subscriptions/ActiveSubscriptionsPage";
import PaymentsPage from "./pages/payments/PaymentsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import ImageApprovalsPage from "./pages/image-approvals/ImageApprovalsPage";
import BioApprovalsPage from "./pages/bio-approvals/BioApprovalsPage";
import BannerPage from "./pages/banner/BannerPage";
import ReferralsPage from "./pages/referrals/ReferralsPage";
import VipShaadiPage from "./pages/vip-shaadi/VipShaadiPage";
import AstroChatPage from "./pages/astrochat/AstroChatPage";
import AddAstrologerPage from "./pages/astrochat/AddAstrologerPage";
import ManageAstrologersPage from "./pages/astrochat/ManageAstrologersPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import ReportsPage from "./pages/reports/ReportsPage";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("adminRole");
  if (!token || role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Admin Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/vip-shaadi" element={<VipShaadiPage />} />
          <Route path="/vip-familiess" element={<VipShaadiPage />} />
          <Route path="/astrochat" element={<AstroChatPage />} />
          <Route path="/astrologers/add" element={<AddAstrologerPage />} />
          <Route path="/astrochat/add" element={<AddAstrologerPage />} />
          <Route path="/astrologers" element={<ManageAstrologersPage />} />
          <Route path="/astrochat/manage" element={<ManageAstrologersPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* Secondary preserved routes */}
          <Route path="/manage-users" element={<ManageUsersPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/image-approvals" element={<ImageApprovalsPage />} />
          <Route path="/bio-approvals" element={<BioApprovalsPage />} />
          <Route path="/content" element={<ContentManagerPage />} />
          <Route path="/active-subscriptions" element={<ActiveSubscriptionsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/banner" element={<BannerPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
