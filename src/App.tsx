import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import DeviceVerification from "./pages/DeviceVerification";
import Fights from "./pages/Fights";
import FightDetails from "./pages/FightDetails";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import MyBets from "./pages/MyBets";
import AvailableBets from "./pages/AvailableBets"; // NOUVELLE PAGE
import WalletPage from "./pages/Wallet";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAdmin } from "@/components/common/RequireAdmin";
import { ADMIN_PATH } from "@/config/admin";
import AdminLogin from "./pages/admin/AdminLogin";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminFights from "./pages/admin/Fights";
import AdminEvents from "./pages/admin/Events";
import AdminWithdrawals from "./pages/admin/Withdrawals";
import AdminNotifications from "./pages/admin/Notifications";
import AdminFighters from "./pages/admin/Fighters";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import { Outlet } from "react-router-dom";

const Layout = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Page d'accueil */}
              <Route path="/" element={<Index />} />

              {/* Authentification */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth type="login" />} />
              <Route path="/register" element={<Auth type="register" />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/device-verification" element={<DeviceVerification />} />

              {/* Routes avec barre de navigation */}
              <Route element={<Layout />}>
                <Route path="/fights" element={<Fights />} />
                <Route path="/fights/:id" element={<FightDetails />} />
                <Route path="/fight/:id" element={<FightDetails />} />

                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />

                <Route path="/my-bets" element={<MyBets />} />
                <Route path="/available-bets" element={<AvailableBets />} />
                <Route path="/bets" element={<AvailableBets />} />
                <Route path="/bet/:id" element={<MyBets />} />

                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/wallet/deposit" element={<WalletPage tab="deposit" />} />
                <Route path="/wallet/withdraw" element={<WalletPage tab="withdraw" />} />
                <Route path="/wallet/history" element={<WalletPage tab="history" />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/settings" element={<Profile tab="settings" />} />
                <Route path="/profile/security" element={<Profile tab="security" />} />

                <Route path="/notifications" element={<Profile tab="notifications" />} />
                <Route path="/help" element={<Profile tab="help" />} />
              </Route>






              <Route path={`${ADMIN_PATH}/login`} element={<AdminLogin />} />

              <Route path={ADMIN_PATH} element={<RequireAdmin />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="fights" element={<AdminFights />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="fighters" element={<AdminFighters />} />
                <Route path="audit" element={<AdminAuditLogs />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;