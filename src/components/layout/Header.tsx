import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import vibriaLogo from "@/assets/vibria-logo.svg";

const navLinks = [
  { to: "/", label: "Start" },
  { to: "/verein", label: "Der Verein" },
  { to: "/raeumlichkeiten", label: "Räumlichkeiten" },
  { to: "/veranstaltungen", label: "Veranstaltungen" },
  { to: "/veranstaltungen/archiv", label: "Archiv" },
  { to: "/kuenstler", label: "Künstler" },
  { to: "/kontakt", label: "Kontakt" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="bg-primary sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">
        {/* Logo */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex-shrink-0"
        >
          <img
            src={vibriaLogo}
            alt="VIBRIA Kunst- und Kulturverein"
            className="h-10 md:h-14 brightness-0 invert"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `text-xs font-body uppercase tracking-widest transition-colors ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-primary-foreground/60 hover:text-primary-foreground"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-primary-foreground/80 hover:text-primary-foreground p-1"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü öffnen"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-accent border-t border-primary-foreground/10">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `text-sm font-body uppercase tracking-widest py-2 border-b border-primary-foreground/10 transition-colors ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
