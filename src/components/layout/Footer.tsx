import { Link } from "react-router-dom";

const socialLinks = [
  { href: "https://www.facebook.com/vibria.art", icon: "/images/icons/icon-white-fb.svg", label: "Facebook" },
  { href: "https://www.instagram.com/vibria.art", icon: "/images/icons/icon-white-insta.svg", label: "Instagram" },
  { href: "https://bsky.app/profile/vibria-art.bsky.social", icon: "/images/icons/icon-white-bsky.svg", label: "Bluesky" },
  { href: "https://www.youtube.com/@vibria-kunst-und-kulturverein", icon: "/images/icons/icon-white-yt.svg", label: "YouTube" },
  { href: "https://s3m.io/x8cn5", icon: "/images/icons/icon-white-stio.svg", label: "StreamIO" },
  { href: "mailto:office@vibria.art", icon: "/images/icons/icon-white-mail.svg", label: "E-Mail" },
];

export default function Footer() {
  return (
    <footer className="bg-primary border-t border-primary-foreground/10 mt-auto">
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo + Description */}
          <div>
            <img
              src="/images/logos/vibria_logo_white.svg"
              alt="VIBRIA"
              className="h-8 mb-3 opacity-90"
            />
            <p className="text-primary-foreground/60 font-body text-xs leading-relaxed">
              Kunst- und Kulturverein im 15. Wiener Gemeindebezirk.<br />
              ZVR-Zahl: 1829365501
            </p>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-primary-foreground/90 font-heading text-sm uppercase tracking-wider mb-3">
              Adresse
            </h3>
            <address className="not-italic text-primary-foreground/60 font-body text-xs leading-relaxed">
              Reichsapfelgasse 1/30<br />
              1150 Wien, Österreich<br />
              <a href="mailto:office@vibria.art" className="hover:text-primary-foreground transition-colors mt-1 inline-block">
                office@vibria.art
              </a>
            </address>
          </div>

          {/* Social + Links */}
          <div>
            <h3 className="text-primary-foreground/90 font-heading text-sm uppercase tracking-wider mb-3">
              Folge uns
            </h3>
            <div className="flex gap-3 mb-4">
              {socialLinks.map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <img src={icon} alt={label} className="w-5 h-5" />
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <a
                href="https://citizen.bmi.gv.at/at.gv.bmi.zvnsrv-p/zvrlink/1829365501"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/50 font-body text-xs hover:text-primary-foreground/80 transition-colors"
              >
                Vereinsstatuten (PDF)
              </a>
              <Link
                to="/kontakt"
                className="text-primary-foreground/50 font-body text-xs hover:text-primary-foreground/80 transition-colors"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center">
          <p className="text-primary-foreground/30 font-body text-xs">
            © {new Date().getFullYear()} VIBRIA | Kunst- und Kulturverein Wien
          </p>
        </div>
      </div>
    </footer>
  );
}
