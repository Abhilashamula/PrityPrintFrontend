import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Link2,
  LogOut,
  ListChecks,
  LockKeyhole,
  Menu,
  Printer,
  RefreshCw,
  Search,
  Send,
  Settings,
  House,
  IndianRupee,
  ServerCog,
  X,
} from "lucide-react";
import {
  apiClient,
  type AdminDashboard,
  type AdminMediaConfig,
  type AdminPrinter,
  type AdminTransaction,
  type PageResult,
  type SupportedMedia,
} from "../lib/apiClient";
import AdminPricingPanel from "../components/AdminPricingPanel";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ToastProvider";

type View = "dashboard" | "transactions" | "printers" | "settings";
const emptyPage: PageResult<AdminTransaction> = {
  items: [],
  page: 0,
  size: 20,
  total: 0,
  totalPages: 0,
};
const emptyMedia: AdminMediaConfig = {
  id: null,
  paperSource: "",
  paperSize: "",
  paperType: "",
  printQuality: "",
  borderless: false,
  duplexSupported: false,
  colorSupported: true,
  monoSupported: true,
  enabled: true,
  priceBwMinor: 200,
  priceColorMinor: 500,
};

export default function AdminScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("pingprint_admin_token"),
  );
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [view, setView] = useState<View>("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [printers, setPrinters] = useState<AdminPrinter[]>([]);
  const [transactions, setTransactions] = useState(emptyPage);
  const [filters, setFilters] = useState({
    search: "",
    paymentStatus: "",
    printStatus: "",
    printerId: "",
    from: "",
    to: "",
    includeArchived: "",
    page: 0,
  });
  const [selectedTransaction, setSelectedTransaction] =
    useState<AdminTransaction | null>(null);
  const [selected, setSelected] = useState<AdminPrinter | null>(null);
  const [supported, setSupported] = useState<SupportedMedia[]>([]);
  const [configured, setConfigured] = useState<AdminMediaConfig[]>([]);
  const [mediaDraft, setMediaDraft] = useState(emptyMedia);
  const [addForm, setAddForm] = useState({
    name: "",
    campusName: "",
    location: "",
    imageUrl: "",
    provider: "EPSON_CONNECT",
  });
  const [confirm, setConfirm] = useState<{
    kind: "disable";
    printer: AdminPrinter;
  } | {
    kind: "archive";
    printer: AdminPrinter;
  } | {
    kind: "refund";
    transaction: AdminTransaction;
  } | {
    kind: "archiveTransaction";
    transaction: AdminTransaction;
  } | {
    kind: "restoreTransaction";
    transaction: AdminTransaction;
  } | null>(null);

  const fail = useCallback(
    (cause: unknown, fallback: string) =>
      toast.push(cause instanceof Error ? cause.message : fallback, "error"),
    [toast],
  );
  useEffect(() => {
    if (token) apiClient.setAdminAccessToken(token);
  }, [token]);
  useEffect(() => {
    const expired = () => {
      apiClient.clearAdminAccessToken();
      setToken(null);
      toast.push("Your admin session expired. Please sign in again.", "warning");
    };
    window.addEventListener("pingprint:admin-session-expired", expired);
    return () =>
      window.removeEventListener("pingprint:admin-session-expired", expired);
  }, [toast]);

  const loadBase = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [metrics, list, recent] = await Promise.all([
        apiClient.adminDashboard(),
        apiClient.adminPrinters(),
        apiClient.adminTransactions({ page: 0, size: 6 }),
      ]);
      setDashboard(metrics);
      setPrinters(list);
      setTransactions(recent);
    } catch (cause) {
      fail(cause, "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [token, fail]);
  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("epson");
    if (!result) return;
    if (result === "connected") {
      toast.push("Epson printer connected. Configure its loaded media next.", "success");
      setView("printers");
    } else {
      toast.push(params.get("message") || "Epson authorization failed.", "error");
    }
    window.history.replaceState({}, "", "/admin");
  }, [token, toast]);

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setTransactions(await apiClient.adminTransactions(filters));
    } catch (cause) {
      fail(cause, "Unable to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [token, filters, fail]);
  useEffect(() => {
    if (view === "transactions") void loadTransactions();
  }, [view, loadTransactions]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await apiClient.adminLogin(
        credentials.username,
        credentials.password,
      );
      apiClient.setAdminAccessToken(result.accessToken);
      setToken(result.accessToken);
    } catch (cause) {
      fail(cause, "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }
  async function addPrinter(event: React.FormEvent) {
    event.preventDefault();
    try {
      const printer = await apiClient.adminAddPrinter(addForm);
      setAddForm({ name: "", campusName: "", location: "", imageUrl: "", provider: "EPSON_CONNECT" });
      toast.push("Printer record created. Continue in Epson to authorize the physical printer.", "success");
      const { authorizationUrl } = await apiClient.adminEpsonConnect(printer.id);
      window.location.assign(authorizationUrl);
    } catch (cause) {
      fail(cause, "Unable to add printer.");
    }
  }
  async function selectPrinter(printer: AdminPrinter) {
    setSelected(printer);
    setConfigured([]);
    setSupported([]);
    try {
      setConfigured(await apiClient.adminMedia(printer.id));
      if (
        printer.provider === "EPSON_CONNECT" &&
        printer.connectionState === "CONNECTED"
      )
        setSupported(await apiClient.adminSupportedMedia(printer.id));
    } catch (cause) {
      fail(cause, "Unable to load printer configuration.");
    }
  }
  async function saveMedia(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      await apiClient.adminConfigureMedia(selected.id, mediaDraft);
      toast.push("Printer media saved.", "success");
      await selectPrinter(selected);
    } catch (cause) {
      fail(cause, "Unable to save media.");
    }
  }
  async function performConfirmed() {
    if (!confirm) return;
    try {
      if (confirm.kind === "refund") {
        const result = await apiClient.adminRefundTransaction(confirm.transaction.transaction_id, confirm.transaction.failure_reason || "Print job failed");
        toast.push(
          result.refundStatus === "FAILED" ? "Razorpay rejected the refund request. Review the transaction and retry after resolving the cause." : "Refund request submitted to Razorpay.",
          result.refundStatus === "FAILED" ? "error" : "success",
        );
        setSelectedTransaction(await apiClient.adminTransaction(confirm.transaction.transaction_id));
        await loadTransactions();
      } else if (confirm.kind === "archiveTransaction" || confirm.kind === "restoreTransaction") {
        const restoring = confirm.kind === "restoreTransaction";
        if (restoring) await apiClient.adminRestoreTransaction(confirm.transaction.transaction_id);
        else await apiClient.adminArchiveTransaction(confirm.transaction.transaction_id);
        toast.push(restoring ? "Transaction restored." : "Transaction archived.", "success");
        setSelectedTransaction(null);
        await loadTransactions();
      } else if (confirm.kind === "archive") {
        await apiClient.adminArchivePrinter(confirm.printer.id);
        toast.push("Printer archived.", "success");
      } else {
        await apiClient.adminUpdatePrinter(confirm.printer.id, {
          name: confirm.printer.name,
          campusName: confirm.printer.campusName,
          location: confirm.printer.location,
          imageUrl: confirm.printer.imageUrl ?? "",
          active: false,
        });
        toast.push("Printer disabled.", "success");
      }
      if (confirm.kind === "archive" || confirm.kind === "disable") {
        setSelected(null);
        await loadBase();
      }
    } catch (cause) {
      fail(cause, "Unable to update printer.");
    } finally {
      setConfirm(null);
    }
  }

  if (!token)
    return (
      <main className="flex min-h-screen items-center justify-center bg-lux-paper px-4">
        <div className="w-full max-w-md">
        <button onClick={() => navigate("/")} className="mb-4 flex min-h-11 items-center gap-2 text-sm font-bold text-lux-ink/65 hover:text-lux-copper">
          <House size={17} /> Welcome page
        </button>
        <form
          onSubmit={login}
          className="w-full max-w-md border bg-white p-7 shadow-lg"
        >
          <LockKeyhole />
          <h1 className="mt-4 font-display text-4xl">Admin login</h1>
          <label className="mt-6 block text-sm font-bold">
            Username
            <input
              autoComplete="username"
              required
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              className="mt-2 min-h-12 w-full border px-3 text-base"
            />
          </label>
          <label className="mt-4 block text-sm font-bold">
            Password
            <input
              autoComplete="current-password"
              required
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              className="mt-2 min-h-12 w-full border px-3 text-base"
            />
          </label>
          <button
            disabled={loading}
            className="mt-6 min-h-12 w-full bg-lux-ink font-bold text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        </div>
      </main>
    );

  const nav = (
    <>
      {(["dashboard", "transactions", "printers", "settings"] as View[]).map(
        (item) => (
          <button
            key={item}
            onClick={() => {
              setView(item);
              setDrawer(false);
            }}
            className={`flex min-h-11 w-full items-center gap-3 px-4 text-left text-sm font-bold capitalize ${view === item ? "bg-white text-lux-ink" : "text-white/65 hover:text-white"}`}
          >
            {item === "dashboard" ? (
              <Gauge size={18} />
            ) : item === "transactions" ? (
              <ListChecks size={18} />
            ) : item === "printers" ? (
              <Printer size={18} />
            ) : (
              <Settings size={18} />
            )}
            {item}
          </button>
        ),
      )}
      <div className="mt-8 border-t border-white/15 pt-4">
        <button onClick={() => navigate("/")} className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-sm font-bold text-white/65 hover:text-white">
          <House size={18} /> Welcome page
        </button>
        <button onClick={() => { apiClient.clearAdminAccessToken(); setToken(null); navigate("/"); }} className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-sm font-bold text-white/65 hover:text-white">
          <LogOut size={18} /> Log out
        </button>
      </div>
    </>
  );
  return (
    <main className="min-h-screen bg-[#f3f5f4] text-lux-ink lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden min-h-screen border-r border-white/10 bg-lux-ink p-4 lg:block">
        <div className="mb-8 px-4 pt-3"><p className="text-lg font-extrabold text-white">Ping<span className="text-lux-copper">&amp;</span>Print</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Operations console</p></div>
        <nav className="space-y-1">{nav}</nav>
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-50 bg-black/45 lg:hidden">
          <aside className="h-full w-[280px] bg-lux-ink p-4">
            <button
              onClick={() => setDrawer(false)}
              className="mb-5 ml-auto block p-3 text-white"
              aria-label="Close navigation"
            >
              <X />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="header-enter sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-lux-ink/10 bg-white/90 px-4 backdrop-blur-md sm:px-7">
          <button
            onClick={() => setDrawer(true)}
            className="p-3 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <div><h1 className="text-lg font-extrabold capitalize">{view}</h1><p className="hidden text-xs text-lux-ink/45 sm:block">Monitor payments, print delivery and connected devices</p></div>
          <button
            onClick={() =>
              void (view === "transactions" ? loadTransactions() : loadBase())
            }
            className="p-3"
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-7">
          {loading && !dashboard ? (
            <Skeleton />
          ) : view === "dashboard" ? (
            <Dashboard
              data={dashboard}
              transactions={transactions.items}
              printers={printers}
            />
          ) : view === "transactions" ? (
            <Transactions
              page={transactions}
              filters={filters}
              setFilters={setFilters}
              loading={loading}
              printers={printers}
              onView={async (id) => {
                try {
                  setSelectedTransaction(await apiClient.adminTransaction(id));
                } catch (cause) {
                  fail(cause, "Unable to load transaction.");
                }
              }}
              onExport={async () => {
                try {
                  const blob = await apiClient.adminExportTransactions();
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `ping-print-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                } catch (cause) {
                  fail(cause, "Unable to export transactions.");
                }
              }}
            />
          ) : view === "settings" ? (
            <AdminPricingPanel />
          ) : (
            <Printers
              printers={printers}
              selected={selected}
              configured={configured}
              supported={supported}
              addForm={addForm}
              setAddForm={setAddForm}
              mediaDraft={mediaDraft}
              setMediaDraft={setMediaDraft}
              onAdd={addPrinter}
              onSelect={selectPrinter}
              onDisable={(printer) => setConfirm({ kind: "disable", printer })}
              onArchive={(printer) => setConfirm({ kind: "archive", printer })}
              onConnect={async (printer) => {
                try {
                  window.location.assign(
                    (await apiClient.adminEpsonConnect(printer.id))
                      .authorizationUrl,
                  );
                } catch (cause) {
                  fail(cause, "Unable to authorize Epson.");
                }
              }}
              onRefresh={async (printer) => {
                try {
                  await apiClient.adminRefreshEpsonCapabilities(printer.id);
                  toast.push("Capabilities refreshed.", "success");
                  await selectPrinter(printer);
                } catch (cause) {
                  fail(cause, "Unable to refresh capabilities.");
                }
              }}
              onTest={async (printer) => {
                try {
                  const result = await apiClient.adminTestPrint(printer.id);
                  toast.push(result.message, "success");
                } catch (cause) {
                  fail(cause, "Unable to submit test print.");
                }
              }}
              onSaveMedia={saveMedia}
              onViewTransactions={(printer) => {
                setFilters({ ...filters, printerId: printer.id, page: 0 });
                setView("transactions");
              }}
            />
          )}
        </div>
      </div>
      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.kind === "refund"
            ? "Issue full refund?"
            : confirm?.kind === "archiveTransaction"
              ? "Archive transaction?"
              : confirm?.kind === "restoreTransaction"
                ? "Restore transaction?"
            : confirm?.kind === "archive"
            ? `Archive ${confirm.printer.name}?`
            : `Disable ${confirm?.printer.name ?? "printer"}?`
        }
        description={
          confirm?.kind === "refund"
            ? "This sends an irreversible full refund to Razorpay. It is allowed only because the print job has definitely failed."
            : confirm?.kind === "archiveTransaction"
              ? "This hides the transaction from the normal list but preserves its financial audit record."
              : confirm?.kind === "restoreTransaction"
                ? "This returns the transaction to the normal admin list."
            : confirm?.kind === "archive"
            ? "The printer will remain in historical orders but cannot be enabled without a future restore action."
            : "Students will no longer be able to select this printer. Existing order and transaction history remains unchanged."
        }
        confirmLabel={
          confirm?.kind === "refund" ? "Issue refund" : confirm?.kind === "archiveTransaction" ? "Archive transaction" : confirm?.kind === "restoreTransaction" ? "Restore transaction" : confirm?.kind === "archive" ? "Archive printer" : "Disable printer"
        }
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => void performConfirmed()}
      />
      {selectedTransaction && (
        <Detail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onRefund={() => setConfirm({ kind: "refund", transaction: selectedTransaction })}
          onArchive={() => setConfirm({ kind: selectedTransaction.archived ? "restoreTransaction" : "archiveTransaction", transaction: selectedTransaction })}
        />
      )}
    </main>
  );
}

function Dashboard({
  data,
  transactions,
  printers,
}: {
  data: AdminDashboard | null;
  transactions: AdminTransaction[];
  printers: AdminPrinter[];
}) {
  const metrics = data
    ? [
        { label: "Revenue", value: money(data.revenue_minor), icon: IndianRupee, tone: "bg-emerald-50 text-emerald-700" },
        { label: "Paid orders", value: data.successful_payments, icon: CreditCard, tone: "bg-sky-50 text-sky-700" },
        { label: "Completed jobs", value: data.completed_jobs, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
        { label: "Active printers", value: data.active_printers, icon: Printer, tone: "bg-lux-paper text-lux-copper" },
        { label: "Jobs in queue", value: data.queued_jobs, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
        { label: "Needs attention", value: data.failed_jobs + data.pending_refunds, icon: AlertCircle, tone: "bg-red-50 text-red-700" },
      ]
    : [];
  return (
    <div className="surface-enter">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-lux-copper">Live operations</p><h2 className="mt-2 font-display text-4xl font-semibold leading-none">Campus at a glance.</h2></div><p className="text-xs text-lux-ink/45">{data?.total_orders ?? 0} orders recorded</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="motion-card border border-lux-ink/10 bg-white p-5 shadow-[0_8px_24px_rgba(23,33,31,0.04)]">
            <div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold text-lux-ink/55">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-full ${tone}`}><Icon size={17} /></span></div>
            <p className="mt-4 text-3xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      {data && (data.payment_failures > 0 || data.unknown_jobs > 0 || data.pending_refunds > 0) && <section className="mt-5 grid gap-3 border border-amber-200 bg-amber-50 p-4 text-sm sm:grid-cols-3"><p><strong className="block text-lg">{data.payment_failures}</strong>Failed payment attempts</p><p><strong className="block text-lg">{data.unknown_jobs}</strong>Unknown print outcomes</p><p><strong className="block text-lg">{data.pending_refunds}</strong>Pending refunds</p></section>}
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="border border-lux-ink/10 bg-white p-5 shadow-[0_8px_24px_rgba(23,33,31,0.04)]">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-lux-copper">Devices</p><h3 className="mt-1 font-extrabold">Printer availability</h3></div><ServerCog size={20} className="text-lux-ink/35" /></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {printers.length ? (
            printers.slice(0, 6).map((printer) => (
              <div key={printer.id} className="flex items-center justify-between border border-lux-ink/10 p-3">
                <span>
                  <strong className="block">{printer.name}</strong>
                  <small>{printer.location}</small>
                </span>
                <Status
                  value={printer.archived ? "ARCHIVED" : printer.studentAvailable ? "AVAILABLE" : printer.active ? printer.status : "DISABLED"}
                />
              </div>
            ))
          ) : (
            <Empty text="No printers have been configured yet." />
          )}
        </div>
      </section>
      <section className="border border-lux-ink/10 bg-white p-5 shadow-[0_8px_24px_rgba(23,33,31,0.04)]"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-lux-copper">Payments</p><h3 className="mt-1 font-extrabold">Recent activity</h3><div className="mt-4 divide-y divide-lux-ink/10">{transactions.length ? transactions.slice(0, 6).map((t) => <div key={t.transaction_id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{t.student_name}</p><p className="truncate text-xs text-lux-ink/45">{t.printer_name} · {date(t.created_at)}</p></div><div className="text-right"><p className="text-sm font-extrabold">{money(t.amount_minor)}</p><Status value={t.payment_status} /></div></div>) : <Empty text="No payment activity yet." />}</div></section>
      </div>
    </div>
  );
}
function Transactions({
  page,
  filters,
  setFilters,
  loading,
  printers,
  onView,
  onExport,
}: {
  page: PageResult<AdminTransaction>;
  filters: any;
  setFilters: (value: any) => void;
  loading: boolean;
  printers: AdminPrinter[];
  onView: (id: string) => void;
  onExport: () => void;
}) {
  const change = (key: string, value: string | number) =>
    setFilters({ ...filters, [key]: value, page: key === "page" ? value : 0 });
  return (
    <>
      <div className="grid gap-3 border bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="relative md:col-span-2">
          <span className="sr-only">Search transactions</span>
          <Search className="absolute left-3 top-3" size={17} />
          <input
            value={filters.search}
            onChange={(e) => change("search", e.target.value)}
            placeholder="Search ID or student"
            className="min-h-11 w-full border pl-10 pr-3"
          />
        </label>
        <select aria-label="Printer" value={filters.printerId} onChange={(e) => change("printerId", e.target.value)} className="min-h-11 border px-2">
          <option value="">All printers</option>
          {printers.map((printer) => <option key={printer.id} value={printer.id}>{printer.name} · {printer.location}</option>)}
        </select>
        <Filter
          value={filters.paymentStatus}
          label="Payment"
          values={["CAPTURED", "CREATED", "FAILED", "REFUNDED"]}
          onChange={(v) => change("paymentStatus", v)}
        />
        <Filter
          value={filters.printStatus}
          label="Print"
          values={[
            "QUEUED",
            "SUBMITTING",
            "SUBMITTED",
            "PRINTING",
            "COMPLETED",
            "FAILED",
            "STATUS_UNKNOWN",
          ]}
          onChange={(v) => change("printStatus", v)}
        />
        <input
          aria-label="From date"
          type="date"
          value={filters.from}
          onChange={(e) => change("from", e.target.value)}
          className="min-h-11 border px-2"
        />
        <label className="flex min-h-11 items-center gap-2 border px-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={filters.includeArchived === "true"}
            onChange={(e) => change("includeArchived", e.target.checked ? "true" : "")}
          />
          Show archived
        </label>
        <button onClick={onExport} className="flex min-h-11 items-center justify-center gap-2 border px-3 font-bold">
          <Download size={17} /> Export CSV
        </button>
        <input
          aria-label="To date"
          type="date"
          value={filters.to}
          onChange={(e) => change("to", e.target.value)}
          className="min-h-11 border px-2"
        />
      </div>
      {loading ? (
        <Skeleton />
      ) : page.items.length === 0 ? (
        <div className="mt-4 border bg-white p-8">
          <Empty text="Transactions will appear after students place orders." />
        </div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto border bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5f6f4]">
                <tr>
                  {[
                    "Transaction",
                    "Student",
                    "Printer",
                    "Amount",
                    "Payment",
                    "Print",
                    "Date",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.items.map((t) => (
                  <tr key={t.transaction_id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">
                      {short(t.transaction_id)}
                    </td>
                    <td className="px-4 py-3">{t.student_name}</td>
                    <td className="px-4 py-3">{t.printer_name}</td>
                    <td className="px-4 py-3 font-bold">
                      {money(t.amount_minor)}
                    </td>
                    <td className="px-4 py-3">
                      <Status value={t.payment_status} />
                    </td>
                    <td className="px-4 py-3">
                      <Status value={t.print_status} />
                    </td>
                    <td className="px-4 py-3">{date(t.created_at)}</td>
                    <td>
                      <button
                        onClick={() => onView(t.transaction_id)}
                        className="p-3 font-bold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 md:hidden">
            {page.items.map((t) => (
              <button
                key={t.transaction_id}
                onClick={() => onView(t.transaction_id)}
                className="border bg-white p-4 text-left"
              >
                <div className="flex justify-between">
                  <strong>{money(t.amount_minor)}</strong>
                  <Status value={t.payment_status} />
                </div>
                <p className="mt-3 font-bold">{t.student_name}</p>
                <p className="text-sm text-lux-ink/55">{t.printer_name}</p>
                <div className="mt-3 flex justify-between text-xs">
                  <span>Order {short(t.order_id)}</span>
                  <Status value={t.print_status} />
                </div>
                <p className="mt-2 text-xs text-lux-ink/45">
                  {date(t.created_at)}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm">{page.total} transactions</span>
        <div className="flex gap-2">
          <button
            disabled={page.page === 0}
            onClick={() => change("page", page.page - 1)}
            className="border p-3 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            disabled={page.page + 1 >= page.totalPages}
            onClick={() => change("page", page.page + 1)}
            className="border p-3 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </>
  );
}
interface PrintersProps {
  printers: AdminPrinter[];
  selected: AdminPrinter | null;
  configured: AdminMediaConfig[];
  supported: SupportedMedia[];
  addForm: { name: string; campusName: string; location: string; imageUrl: string; provider: string };
  setAddForm: (value: {
    name: string;
    campusName: string;
    location: string;
    imageUrl: string;
    provider: string;
  }) => void;
  mediaDraft: AdminMediaConfig;
  setMediaDraft: (value: AdminMediaConfig) => void;
  onAdd: (event: React.FormEvent) => void;
  onSelect: (printer: AdminPrinter) => void;
  onDisable: (printer: AdminPrinter) => void;
  onArchive: (printer: AdminPrinter) => void;
  onConnect: (printer: AdminPrinter) => void;
  onRefresh: (printer: AdminPrinter) => void;
  onTest: (printer: AdminPrinter) => void;
  onSaveMedia: (event: React.FormEvent) => void;
  onViewTransactions: (printer: AdminPrinter) => void;
}
function Printers(props: PrintersProps) {
  const labels = useMemo(
    () =>
      props.supported.map(
        (m: SupportedMedia) =>
          `${m.paperSize} / ${m.paperType} / ${m.paperSource} / ${m.printQuality}`,
      ),
    [props.supported],
  );
  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <div>
        <form onSubmit={props.onAdd} className="border bg-white p-5">
          <h2 className="font-extrabold">Connect Epson printer</h2>
          <p className="mt-2 text-sm leading-5 text-lux-ink/55">Name and location label the printer on campus. After this step, Epson opens so you can authorize the physical printer; its device ID and model are imported automatically.</p>
          <label className="mt-4 block text-sm font-bold">
            Friendly name
            <input
              required
              value={props.addForm.name}
              onChange={(e) =>
                props.setAddForm({ ...props.addForm, name: e.target.value })
              }
              className="mt-1 min-h-11 w-full border px-3"
            />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Campus name
            <input required value={props.addForm.campusName} onChange={(e) => props.setAddForm({ ...props.addForm, campusName: e.target.value })} placeholder="Main Campus" className="mt-1 min-h-11 w-full border px-3" />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Location
            <input
              required
              value={props.addForm.location}
              onChange={(e) =>
                props.setAddForm({ ...props.addForm, location: e.target.value })
              }
              className="mt-1 min-h-11 w-full border px-3"
            />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Printer image URL <span className="font-normal text-lux-ink/45">(optional)</span>
            <input type="url" value={props.addForm.imageUrl} onChange={(e) => props.setAddForm({ ...props.addForm, imageUrl: e.target.value })} placeholder="https://..." className="mt-1 min-h-11 w-full border px-3" />
          </label>
          <button className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 bg-lux-ink font-bold text-white">
            <Link2 size={17} /> Add and connect Epson
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {props.printers.length ? (
            props.printers.map((p: AdminPrinter) => (
              <button
                key={p.id}
                onClick={() => props.onSelect(p)}
                className={`w-full border bg-white p-4 text-left ${props.selected?.id === p.id ? "border-lux-copper" : ""}`}
              >
                <div className="flex gap-3">
                  <img src={p.imageUrl || "/assets/printer-fallback.png"} alt="" className="h-14 w-16 shrink-0 object-cover" onError={(event) => { event.currentTarget.src = "/assets/printer-fallback.png"; }} />
                  <span className="min-w-0 flex-1"><span className="flex justify-between gap-2">
                  <strong>{p.name}</strong>
                  <Status value={p.archived ? "ARCHIVED" : p.status} />
                  </span><span className="mt-1 block text-xs font-bold text-lux-copper">{p.campusName}</span><span className="mt-1 block text-sm text-lux-ink/55">{p.location} · {p.model ?? p.provider}</span></span>
                </div>
              </button>
            ))
          ) : (
            <Empty text="No printers configured." />
          )}
        </div>
      </div>
      <div>
        {props.selected ? (
          <section className="border bg-white p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <img src={props.selected.imageUrl || "/assets/printer-fallback.png"} alt="" className="mb-4 h-32 w-44 object-cover" onError={(event) => { event.currentTarget.src = "/assets/printer-fallback.png"; }} />
                <h2 className="text-2xl font-extrabold">
                  {props.selected.name}
                </h2>
                <p className="text-sm text-lux-ink/55">
                  {props.selected.campusName} · {props.selected.location} · {props.selected.connectionState} ·{" "}
                  {props.selected.active ? "Enabled" : "Disabled"}
                </p>
                {props.selected.providerDeviceId && <p className="mt-1 text-xs text-lux-ink/45">Epson device ID: {props.selected.providerDeviceId}</p>}
                {props.selected.studentAvailable ? (
                  <p className="mt-3 text-sm font-bold text-emerald-700">Available to students</p>
                ) : (
                  <div className="mt-3 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-bold">Not available to students</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {props.selected.availabilityIssues.map((issue) => <li key={issue}>{issue}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => props.onViewTransactions(props.selected!)} className="min-h-11 border px-4 font-bold">View transactions</button>
                {props.selected.connectionState !== "CONNECTED" && (
                  <button
                    onClick={() => props.onConnect(props.selected!)}
                    className="flex min-h-11 items-center gap-2 bg-lux-copper px-4 font-bold text-white"
                  >
                    <Link2 size={16} /> Connect
                  </button>
                )}
                {props.selected.connectionState === "CONNECTED" && <>
                  <button onClick={() => props.onRefresh(props.selected!)} className="min-h-11 border px-4 font-bold">Refresh capabilities</button>
                  <button onClick={() => props.onTest(props.selected!)} className="flex min-h-11 items-center gap-2 border px-4 font-bold"><Send size={16} /> Send test print</button>
                </>}
                {props.selected.active && (
                  <button
                    onClick={() => props.onDisable(props.selected!)}
                    className="min-h-11 border px-4 font-bold"
                  >
                    Disable
                  </button>
                )}
                <button
                  onClick={() => props.onArchive(props.selected!)}
                  className="flex min-h-11 items-center gap-2 border border-red-200 px-4 font-bold text-red-700"
                >
                  <Archive size={16} /> Archive
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-bold">Loaded media</h3>
                {props.configured.length ? (
                  props.configured.map((m: AdminMediaConfig) => (
                    <div key={m.id} className="mt-2 border p-3 text-sm">
                      <strong>
                        {m.paperSize} · {m.paperType}
                      </strong>
                      <p>
                        {m.paperSource} · {m.enabled ? "Enabled" : "Disabled"} ·{" "}
                        {money(m.priceBwMinor)} B&amp;W
                      </p>
                    </div>
                  ))
                ) : (
                  <Empty text="No loaded media configured." />
                )}
              </div>
              <form onSubmit={props.onSaveMedia}>
                <h3 className="font-bold">Configure media</h3>
                <select
                  required
                  defaultValue=""
                  onChange={(e) => {
                    const option = props.supported[Number(e.target.value)];
                    if (option)
                      props.setMediaDraft({ ...emptyMedia, ...option });
                  }}
                  className="mt-2 min-h-11 w-full border px-3"
                >
                  <option value="" disabled>
                    Select supported media
                  </option>
                  {labels.map((label: string, i: number) => (
                    <option key={label + i} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="mt-3 block text-sm font-bold">
                  B&amp;W price (paise)
                  <input
                    type="number"
                    min="1"
                    value={props.mediaDraft.priceBwMinor}
                    onChange={(e) =>
                      props.setMediaDraft({
                        ...props.mediaDraft,
                        priceBwMinor: Number(e.target.value),
                      })
                    }
                    className="mt-1 min-h-11 w-full border px-3"
                  />
                </label>
                <label className="mt-3 block text-sm font-bold">
                  Color price (paise)
                  <input
                    type="number"
                    min="1"
                    value={props.mediaDraft.priceColorMinor}
                    onChange={(e) =>
                      props.setMediaDraft({
                        ...props.mediaDraft,
                        priceColorMinor: Number(e.target.value),
                      })
                    }
                    className="mt-1 min-h-11 w-full border px-3"
                  />
                </label>
                <button
                  disabled={!props.mediaDraft.paperSource}
                  className="mt-4 min-h-11 w-full bg-lux-ink font-bold text-white disabled:opacity-40"
                >
                  Save loaded media
                </button>
              </form>
            </div>
          </section>
        ) : (
          <div className="border bg-white p-10">
            <Empty text="Select a printer to view its configuration." />
          </div>
        )}
      </div>
    </div>
  );
}
function Detail({
  transaction: t,
  onClose,
  onRefund,
  onArchive,
}: {
  transaction: AdminTransaction;
  onClose: () => void;
  onRefund: () => void;
  onArchive: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-black/45"
      role="dialog"
      aria-modal="true"
    >
      <div className="h-full w-full overflow-y-auto bg-white p-6 sm:max-w-lg">
        <button
          onClick={onClose}
          className="ml-auto block p-3"
          aria-label="Close details"
        >
          <X />
        </button>
        <h2 className="text-2xl font-extrabold">Transaction details</h2>
        <dl className="mt-6 divide-y">
          {Object.entries({
            Transaction: t.transaction_id,
            Order: t.order_id,
            "Razorpay order": t.razorpay_order_id,
            "Razorpay payment": t.razorpay_payment_id,
            Student: t.student_name,
            Printer: t.printer_name,
            Amount: money(t.amount_minor),
            Payment: t.payment_status,
            Print: t.print_status,
            Created: date(t.created_at),
            Failure: t.failure_reason,
            "Refund status": t.refund_status,
            "Refund ID": t.refund_id,
            "Refund amount": t.refund_amount_minor == null ? null : money(t.refund_amount_minor),
            "Refund reason": t.refund_reason,
            "Refund failure": t.refund_failure_reason,
            "Refunded at": t.refunded_at ? date(t.refunded_at) : null,
            Archived: t.archived ? "Yes" : "No",
          }).map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-[120px_1fr] gap-3 py-3 text-sm"
            >
              <dt className="text-lux-ink/50">{k}</dt>
              <dd className="break-all font-semibold">{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
        {t.attempts && t.attempts.length > 0 && <section className="mt-7 border-t border-lux-ink/10 pt-6"><h3 className="font-extrabold">Payment attempts</h3><div className="mt-3 space-y-3">{t.attempts.map((attempt) => <div key={attempt.provider_payment_id} className="border border-lux-ink/10 bg-[#f7f8f6] p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs">{attempt.provider_payment_id}</span><Status value={attempt.status} /></div><p className="mt-2 text-xs text-lux-ink/50">{attempt.method?.toUpperCase() ?? "Unknown method"} · {date(attempt.created_at)}</p>{attempt.failure_reason && <p className="mt-2 text-xs font-semibold text-red-700">{attempt.failure_reason}</p>}</div>)}</div></section>}
        {t.payment_status === "CAPTURED" && t.print_status === "FAILED" && t.refund_status !== "PROCESSED" && t.refund_status !== "PENDING" && (
          <button onClick={onRefund} className="mt-6 min-h-11 w-full bg-red-700 px-4 font-bold text-white">
            Issue full refund
          </button>
        )}
        <button onClick={onArchive} className="mt-3 min-h-11 w-full border px-4 font-bold">
          {t.archived ? "Restore transaction" : "Archive transaction"}
        </button>
      </div>
    </div>
  );
}
function Filter({
  value,
  label,
  values,
  onChange,
}: {
  value: string;
  label: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 border px-2"
    >
      <option value="">All {label.toLowerCase()}</option>
      {values.map((v) => (
        <option key={v}>{v}</option>
      ))}
    </select>
  );
}
function Status({ value }: { value: string }) {
  const tone = ["CAPTURED", "COMPLETED", "ONLINE"].includes(value)
    ? "bg-emerald-100 text-emerald-800"
    : ["FAILED", "STATUS_UNKNOWN", "ERROR", "ARCHIVED"].includes(value)
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-900";
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-bold ${tone}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-lux-ink/50">{text}</p>;
}
function Skeleton() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Loading">
      <div className="h-24 animate-pulse bg-black/5" />
      <div className="h-24 animate-pulse bg-black/5" />
      <div className="h-24 animate-pulse bg-black/5" />
    </div>
  );
}
function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format((value ?? 0) / 100);
}
function date(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function short(value: string) {
  return "#" + value.slice(0, 8);
}
