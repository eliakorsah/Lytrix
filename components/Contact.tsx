"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const CONTACT_EMAIL = "elia@lytrixconsult.com";

const services = [
  "Web Design",
  "Graphic Design",
  "Video Ads",
  "Web POS System",
  "SaaS Product",
  "Something else",
];

export default function Contact() {
  const [service, setService] = useState(services[0]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const message = String(data.get("message") || "");
    const subject = encodeURIComponent(`New project enquiry — ${service}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <section id="contact" className="relative bg-ink py-24 sm:py-32 text-white">
      <div className="mx-auto max-w-7xl container-px">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-ink-card">
          <div className="grid gap-0 lg:grid-cols-2">
            {/* left: pitch */}
            <div className="relative overflow-hidden p-8 sm:p-12">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-magenta-brand/20 blur-[100px]" />
              <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan-brand/20 blur-[100px]" />
              <div className="relative">
                <Reveal>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-brand">
                    Get in touch
                  </p>
                </Reveal>
                <Reveal delay={1}>
                  <h2 className="font-display font-bold text-fluid-section">
                    Let&apos;s build something{" "}
                    <span className="text-gradient">great</span>.
                  </h2>
                </Reveal>
                <Reveal delay={2}>
                  <p className="mt-6 max-w-md text-white/60">
                    Tell us about your project and we&apos;ll get back to you
                    within one business day.
                  </p>
                </Reveal>
                <Reveal delay={3}>
                  <div className="mt-8 space-y-3 text-sm">
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="block font-display text-lg font-semibold text-white underline decoration-cyan-brand decoration-2 underline-offset-4"
                    >
                      {CONTACT_EMAIL}
                    </a>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/70">
                      <a href="tel:+233594518462" className="hover:text-white">
                        0594518462
                      </a>
                      <a href="tel:+233207779304" className="hover:text-white">
                        0207779304
                      </a>
                    </div>
                    <a
                      href="https://wa.me/233207779304"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-brand/40 bg-cyan-brand/10 px-4 py-2 font-medium text-cyan-brand transition-colors hover:bg-cyan-brand/20"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 fill-current"
                        aria-hidden
                      >
                        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      WhatsApp us
                    </a>
                  </div>
                </Reveal>
              </div>
            </div>

            {/* right: form */}
            <div className="border-t border-white/10 bg-ink-soft p-8 sm:p-12 lg:border-l lg:border-t-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field name="name" label="Your name" placeholder="Jane Doe" />
                <Field
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="jane@company.com"
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    What do you need?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setService(s)}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                          service === s
                            ? "border-cyan-brand bg-cyan-brand/10 text-white"
                            : "border-white/15 text-white/60 hover:text-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Project details
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    required
                    placeholder="Tell us a bit about it..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-brand"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-brand-gradient py-3.5 font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  Send enquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/70">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-brand"
      />
    </div>
  );
}
