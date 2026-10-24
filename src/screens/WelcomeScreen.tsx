import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  LogIn,
  MapPin,
  Menu,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  Globe,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import AccountMenu from "../components/AccountMenu";
import PrinterScene from "../components/PrinterScene";
import { useAuthStore } from "../store/authStore";
import { apiClient, type AvailablePrinter } from "../lib/apiClient";
import { useSessionStore } from "../store/sessionStore";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Files are used only for your print job and deleted after printing. Your documents are never stored longer than necessary.",
    gradient: "from-brand to-[#9561FF]",
  },
  {
    icon: Zap,
    title: "Low-cost printing",
    body: "Transparent per-page pricing with colour vs B&W differentiation. No surprise charges or hidden fees.",
    gradient: "from-accent-orange to-accent-pink",
  },
  {
    icon: Globe,
    title: "Multi-campus network",
    body: "Epson Cloud-connected printers across multiple college campuses. Just pick a location and print instantly.",
    gradient: "from-accent-teal to-brand",
  },
];

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const logoutMessage = useAuthStore((state) => state.logoutMessage);
  const clearLogoutMessage = useAuthStore((state) => state.clearLogoutMessage);
  const setPrinter = useSessionStore((state) => state.setPrinter);
  const [printers, setPrinters] = useState<AvailablePrinter[]>([]);
  const [printerLoading, setPrinterLoading] = useState(true);
  const [printerError, setPrinterError] = useState<string | null>(null);
  const [printerPickerOpen, setPrinterPickerOpen] = useState(false);

  const loadPrinters = async () => {
    setPrinterLoading(true);
    setPrinterError(null);
    try {
      const available = await apiClient.availablePrinters();
      setPrinters(available.filter((p) => p.status === "ONLINE" || p.status === "BUSY"));
    } catch (error) {
      setPrinterError(error instanceof Error ? error.message : "Could not load printers.");
    } finally {
      setPrinterLoading(false);
    }
  };

  const startPrinting = () => {
    setPrinterPickerOpen(true);
    if (!printers.length && !printerLoading) void loadPrinters();
  };

  const choosePrinter = (printer: AvailablePrinter) => {
    setPrinter(printer.id, printer.name);
    setPrinterPickerOpen(false);
    navigate("/upload");
  };

  useEffect(() => {
    if (!logoutMessage) return;
    const timer = window.setTimeout(clearLogoutMessage, 3500);
    return () => window.clearTimeout(timer);
  });

  useEffect(() => { void loadPrinters(); }, []);

  return (
    <main className="min-h-screen overflow-hidden text-ink screen-enter" style={{ background: 'linear-gradient(180deg, #091525 0%, #0f1923 100%)' }}>

      {/* ── Background orbs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb orb-purple" style={{ width: 600, height: 600, top: '-10%', left: '-8%', opacity: 0.7 }} />
        <div className="orb orb-pink"   style={{ width: 400, height: 400, top: '20%', right: '-5%', opacity: 0.5 }} />
        <div className="orb orb-teal"   style={{ width: 350, height: 350, bottom: '10%', left: '30%', opacity: 0.5 }} />
        <div className="dot-grid absolute inset-0 opacity-30" />
      </div>

      {/* ── Navigation ── */}
      <nav
        className="header-enter relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-10"
        aria-label="Main navigation"
      >
        <a
          href="/"
          className="flex items-center gap-3 glass rounded-2xl px-3 py-2"
          aria-label="Ping and Print home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #FF3CAC 100%)' }}>
            <Printer size={20} className="text-white" strokeWidth={1.8} />
          </span>
          <span className="leading-none">
            <span className="block text-lg font-extrabold tracking-tight font-display" style={{ fontFamily: 'Syne, sans-serif' }}>
              Ping<span className="text-gradient-brand">&</span>Print
            </span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.20em] text-ink-dim">
              Campus printing
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-2 glass rounded-2xl p-1.5 md:flex">
          <a className="rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
             href="#why">Why it works</a>
          <a className="rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
             href="#campus">For campus</a>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <span className="badge-online">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse" /> Online
          </span>
          <AccountMenu />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="touch-target glass rounded-full p-3 text-ink"
            aria-label="Toggle menu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div className="menu-enter absolute right-4 top-20 flex w-64 flex-col gap-3 glass rounded-2xl p-5 text-sm font-bold shadow-premium md:hidden z-50">
            <a href="#why" onClick={() => setMenuOpen(false)} className="text-ink-muted hover:text-ink">Why Ping & Print</a>
            <a href="#campus" onClick={() => setMenuOpen(false)} className="text-ink-muted hover:text-ink">For your campus</a>
            <div className="border-t border-white/10 pt-3 space-y-2">
              <button className="flex w-full items-center gap-2 text-ink-muted hover:text-ink"
                onClick={() => { setMenuOpen(false); navigate("/login"); }}>
                <LogIn size={16} /> Log in
              </button>
              <button className="flex w-full items-center gap-2 text-ink-muted hover:text-ink"
                onClick={() => { setMenuOpen(false); navigate("/signup"); }}>
                Create account
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Logout message ── */}
      {logoutMessage && (
        <div className="mx-auto mt-3 flex max-w-7xl items-center gap-2 rounded-2xl border border-accent-teal/30 bg-accent-teal/10 px-5 py-3 text-sm font-bold text-accent-teal"
          role="status">
          <Check size={17} /> {logoutMessage}
        </div>
      )}

      {/* ── Printer picker modal ── */}
      {printerPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4"
          style={{ background: 'rgba(9,21,37,0.88)' }}
          role="dialog" aria-modal="true" aria-labelledby="printer-picker-title"
        >
          <div style={{ backdropFilter: 'blur(32px)', background: 'rgba(20, 29, 46, 0.96)', border: '1px solid rgba(255,255,255,0.10)' }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] p-5 shadow-premium sm:max-w-lg sm:rounded-[32px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gradient-brand">Step 01 / Choose a printer</p>
                <h2 id="printer-picker-title" className="mt-2 text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Where should we print?
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  Pick an Epson Cloud-connected printer at any campus location.
                </p>
              </div>
              <button onClick={() => setPrinterPickerOpen(false)}
                className="touch-target shrink-0 glass rounded-full p-2.5 text-ink-muted hover:text-ink"
                aria-label="Close printer selection">
                <X size={18} />
              </button>
            </div>

            {printerLoading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm font-bold text-ink-muted">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                Finding printers...
              </div>
            ) : printerError ? (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300" role="alert">
                <p>{printerError}</p>
                <button onClick={() => void loadPrinters()}
                  className="mt-3 flex items-center gap-2 font-bold text-red-200 hover:text-red-100">
                  <RefreshCw size={15} /> Try again
                </button>
              </div>
            ) : printers.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300" role="status">
                <p className="font-bold">No printers are online right now.</p>
                <p className="mt-1 text-yellow-400/70">Please try again when a printer is available.</p>
                <button onClick={() => void loadPrinters()}
                  className="mt-3 flex items-center gap-2 font-bold text-yellow-200">
                  <RefreshCw size={15} /> Refresh
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {printers.map((printer) => (
                  <button key={printer.id} onClick={() => choosePrinter(printer)}
                    className="group overflow-hidden rounded-2xl text-left transition-all duration-300 hover:-translate-y-1"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <span className="block aspect-[16/8] overflow-hidden rounded-t-2xl"
                      style={{ background: 'rgba(108,99,255,0.08)' }}>
                      <img
                        src={printer.imageUrl || "https://images.unsplash.com/photo-1612815150548-99483ceb0b5e?auto=format&fit=crop&w=600&q=80"}
                        alt=""
                        className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"; }}
                      />
                    </span>
                    <span className="flex items-center gap-3 p-4">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-gradient-brand">{printer.campusName}</span>
                        <span className="block truncate text-sm font-extrabold text-ink mt-0.5">{printer.name}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-dim">
                          <MapPin size={12} /> {printer.location}
                        </span>
                        {printer.model && <span className="mt-0.5 block truncate text-[11px] text-ink-dim/60">{printer.model}</span>}
                      </span>
                      <span className={printer.status === "BUSY" ? "badge-busy" : "badge-online"}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: printer.status === 'BUSY' ? '#FFD60A' : '#00D4AA' }} />
                        {printer.status === "BUSY" ? "Busy" : "Ready"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hero section ── */}
      <section className="welcome-hero relative mx-4 mt-3 overflow-hidden rounded-3xl px-6 pb-16 pt-12 sm:mx-6 lg:mx-10 lg:min-h-[640px] lg:px-16 lg:pb-20 lg:pt-20"
        style={{ background: 'linear-gradient(160deg, rgba(108,99,255,0.10) 0%, rgba(15,25,35,0.8) 60%)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="welcome-hero__paper welcome-hero__paper--one" />
        <div className="welcome-hero__paper welcome-hero__paper--two" />
        <div className="absolute inset-0 luxury-grid opacity-40 pointer-events-none" />

        <div className="hero-copy relative z-10 max-w-2xl">
          <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-gradient-teal">
            <Sparkles size={14} /> Campus printing, reimagined
          </p>

          <div className="scene-enter relative mx-auto mb-8 h-[220px] w-full max-w-[340px] lg:hidden">
            <PrinterScene />
          </div>

          <h1 className="max-w-2xl text-5xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            A smarter way to{" "}
            <span className="text-gradient-brand">bring ideas</span>
            {" "}to paper.
          </h1>

          <p className="mt-7 max-w-lg text-base leading-7 text-ink-muted sm:text-lg">
            Ping & Print connects every student to Epson Cloud-powered printers across multiple campuses.
            Upload, choose colour or B&W, pay via Razorpay, and print instantly.
          </p>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button onClick={startPrinting}
              className="btn-primary shine-on-hover relative touch-target flex items-center gap-3">
              Start printing <ArrowRight size={18} />
            </button>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
              <ShieldCheck size={16} className="text-accent-teal" /> Private by default
            </span>
          </div>

          {/* Stats row */}
          <div className="mt-9 grid max-w-xl grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {[
              { label: "Status", value: "Online", dot: "#00D4AA" },
              { label: "Formats", value: "PDF · JPG · PNG" },
              { label: "Access", value: "Secure sign-in" },
            ].map((stat, i) => (
              <div key={stat.label} className="px-4 py-4" style={{ background: 'rgba(15,25,35,0.70)' }}>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-ink-dim">{stat.label}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-ink">
                  {stat.dot && <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: stat.dot }} />}
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="scene-enter perspective-stage relative mx-auto mt-14 hidden h-[290px] max-w-[430px] sm:h-[360px] lg:absolute lg:bottom-8 lg:right-12 lg:mt-0 lg:block lg:h-[480px] lg:w-[520px]">
          <PrinterScene />
        </div>
      </section>

      {/* ── Benefits section ── */}
      <section id="why" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-gradient-teal">
              The Ping & Print difference
            </p>
            <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: 'Syne, sans-serif' }}>
              Less friction.
              <br />
              <span className="text-gradient-brand">More printing.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-ink-muted">
            A premium campus utility that respects your time, attention, and work.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {BENEFITS.map((benefit, index) => (
            <article key={benefit.title}
              className="group card relative overflow-hidden p-7 lg:p-8 cursor-default">
              <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${benefit.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${benefit.gradient} mb-6 shadow-glow-brand`}>
                <benefit.icon size={22} className="text-white" strokeWidth={1.8} />
              </span>
              <span className="block text-sm font-extrabold uppercase tracking-[0.16em] text-ink-dim mb-3">
                0{index + 1}
              </span>
              <h3 className="text-lg font-extrabold text-ink mb-3">{benefit.title}</h3>
              <p className="text-sm leading-6 text-ink-muted">{benefit.body}</p>
              <Check size={18} className="mt-6 text-accent-teal" />
            </article>
          ))}
        </div>
      </section>

      {/* ── Campus CTA section ── */}
      <section id="campus" className="mx-4 mb-10 rounded-3xl px-6 py-16 sm:mx-6 lg:mx-10 lg:px-16 lg:py-24"
        style={{ background: 'linear-gradient(160deg, rgba(108,99,255,0.14) 0%, rgba(255,60,172,0.08) 100%)', border: '1px solid rgba(108,99,255,0.22)' }}>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.26em] text-accent-teal">
              For the places that shape tomorrow
            </p>
            <h2 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl" style={{ fontFamily: 'Syne, sans-serif' }}>
              Give your campus
              <br />
              <span className="text-gradient-brand">room to create.</span>
            </h2>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-bold text-ink-muted">
              {["Epson Cloud Printers", "Razorpay Payments", "Colour & B&W", "Multi-Campus"].map((tag) => (
                <span key={tag} className="glass rounded-full px-4 py-2">
                  <Users size={14} className="mr-1.5 inline-block text-brand" />{tag}
                </span>
              ))}
            </div>
          </div>
          <button onClick={startPrinting}
            className="btn-primary shine-on-hover relative touch-target flex w-fit items-center gap-3 whitespace-nowrap">
            Use the kiosk <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="flex flex-col justify-between gap-3 px-6 py-7 text-xs font-bold uppercase tracking-[0.15em] text-ink-dim sm:flex-row lg:px-10">
        <span className="text-gradient-brand">Ping & Print</span>
        <span>Built for learning in motion</span>
      </footer>
    </main>
  );
}
