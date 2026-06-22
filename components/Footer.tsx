import Image from "next/image";
import logoIcon from "@/public/logo-icon.png";

const year = new Date().getFullYear();

const services = [
  "Web Design & Development",
  "Graphic Design",
  "Video Ads",
  "Web POS Systems",
  "SaaS Development",
];

const explore = [
  { href: "#services", label: "Services" },
  { href: "#projects", label: "Projects" },
  { href: "#work", label: "Work" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Contact" },
];

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
      <path d="M2 4h20v16H2V4zm10 7L3.5 5.5h17L12 11zm0 2.2L3.5 7.7V18h17V7.7L12 13.2z" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.6c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1l-2.3 2.2z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
      <path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.18em] text-white/45";

export default function Footer() {
  return (
    <footer className="relative bg-ink text-white">
      {/* gradient top accent */}
      <div className="h-px w-full bg-brand-gradient opacity-70" />

      <div className="mx-auto max-w-7xl container-px py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* brand */}
          <div className="lg:col-span-4">
            <a href="#top" className="flex items-center gap-2.5">
              <Image
                src={logoIcon}
                alt="LYTRIX CONSULT logo"
                className="h-9 w-auto"
              />
              <span className="font-display text-lg font-bold tracking-tight">
                LYTRIX <span className="text-cyan-brand">CONSULT</span>
              </span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              A creative &amp; software studio crafting standout websites,
              graphic design, video ads, web POS systems and SaaS products —
              one team, end to end.
            </p>
            <a
              href="https://wa.me/233207779304"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-brand/40 bg-cyan-brand/10 px-4 py-2 text-sm font-medium text-cyan-brand transition-colors hover:bg-cyan-brand/20"
            >
              <WhatsAppIcon />
              Chat on WhatsApp
            </a>
          </div>

          {/* services */}
          <div className="lg:col-span-3">
            <h4 className={labelClass}>Services</h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/55">
              {services.map((s) => (
                <li key={s}>
                  <a href="#services" className="transition-colors hover:text-white">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* explore */}
          <div className="lg:col-span-2">
            <h4 className={labelClass}>Company</h4>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm text-white/55">
              {explore.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          {/* contact */}
          <div className="lg:col-span-3">
            <h4 className={labelClass}>Get in touch</h4>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/55">
              <a
                href="mailto:elia@lytrixconsult.com"
                className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <MailIcon />
                elia@lytrixconsult.com
              </a>
              <a
                href="tel:+233594518462"
                className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <PhoneIcon />
                0594518462
              </a>
              <a
                href="tel:+233207779304"
                className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <PhoneIcon />
                0207779304
              </a>
              <span className="inline-flex items-start gap-2.5 text-white/55">
                <span className="mt-0.5">
                  <PinIcon />
                </span>
                Lapaz — beside Fraga Oil, Accra, Ghana
              </span>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {year} LYTRIX CONSULT. All rights reserved.</p>
          <p>
            CEO ·{" "}
            <span className="text-white/60">Korsah Elia Ankama Sarkwa</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
