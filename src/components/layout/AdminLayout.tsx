import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Calendar, Users, Layout, Image, BookOpen, MessageSquare,
  LogOut, Menu, X, BarChart2, QrCode,
} from "lucide-react";
import vibriaLogo from "@/assets/vibria-logo.svg";

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: BarChart2 },
  { to: "/admin/events", label: "Veranstaltungen", icon: Calendar },
  { to: "/admin/artists", label: "Künstler", icon: Users },
  { to: "/admin/board", label: "Vorstand", icon: Layout },
  { to: "/admin/gallery", label: "Galerie", icon: Image },
  { to: "/admin/reservations", label: "Reservierungen", icon: BookOpen },
  { to: "/admin/scan", label: "QR Scanner", icon: QrCode },
  { to: "/admin/messages", label: "Nachrichten", icon: MessageSquare },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("vibria_admin_token");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-primary flex flex-col transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-primary-foreground/10">
          <img src={vibriaLogo} alt="VIBRIA" className="h-8 brightness-0 invert" />
          <p className="text-primary-foreground/50 font-body text-xs mt-1 uppercase tracking-widest">
            Admin
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded text-sm font-body transition-colors ${
                  isActive
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-primary-foreground/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded text-sm font-body text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            <LogOut size={15} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (mobile) */}
        <div className="md:hidden bg-primary px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-primary-foreground/80"
          >
            <Menu size={20} />
          </button>
          <img src={vibriaLogo} alt="VIBRIA" className="h-7 brightness-0 invert" />
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
