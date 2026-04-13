import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AdminLayout from "@/components/layout/AdminLayout";

import Home from "@/pages/Home";
import Verein from "@/pages/Verein";
import Raeumlichkeiten from "@/pages/Raeumlichkeiten";
import Veranstaltungen from "@/pages/Veranstaltungen";
import Veranstaltungsarchiv from "@/pages/Veranstaltungsarchiv";
import EventDetail from "@/pages/EventDetail";
import Kuenstler from "@/pages/Kuenstler";
import Kontakt from "@/pages/Kontakt";
import NotFound from "@/pages/NotFound";

import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminEvents from "@/pages/admin/Events";
import AdminArtists from "@/pages/admin/Artists";
import AdminBoard from "@/pages/admin/Board";
import AdminGallery from "@/pages/admin/Gallery";
import AdminCommunication from "@/pages/admin/Communication";
import EventGuestList from "@/pages/admin/EventGuestList";
import ScanCheckIn from "@/pages/admin/ScanCheckIn";
import CheckInByToken from "@/pages/admin/CheckInByToken";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes with Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/verein" element={<Verein />} />
              <Route path="/raeumlichkeiten" element={<Raeumlichkeiten />} />
              <Route path="/veranstaltungen" element={<Veranstaltungen />} />
              <Route path="/veranstaltungen/archiv" element={<Veranstaltungsarchiv />} />
              <Route path="/veranstaltungen/:id" element={<EventDetail />} />
              <Route path="/kuenstler" element={<Kuenstler />} />
              <Route path="/kontakt" element={<Kontakt />} />
            </Route>

            {/* Admin login (no layout) */}
            <Route path="/admin" element={<AdminLogin />} />

            {/* Protected admin routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/events" element={<AdminEvents />} />
                <Route path="/admin/events/:id/guests" element={<EventGuestList />} />
                <Route path="/admin/artists" element={<AdminArtists />} />
                <Route path="/admin/board" element={<AdminBoard />} />
                <Route path="/admin/gallery" element={<AdminGallery />} />
                <Route path="/admin/scan" element={<ScanCheckIn />} />
                <Route path="/admin/checkin/:token" element={<CheckInByToken />} />
                <Route path="/admin/communication" element={<AdminCommunication />} />
                <Route path="/admin/messages" element={<Navigate to="/admin/communication" replace />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
