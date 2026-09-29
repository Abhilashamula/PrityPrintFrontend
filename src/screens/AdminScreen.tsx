import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Link2,
  ListChecks,
  LockKeyhole,
  Menu,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Settings,
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
    location: "",
    provider: "EPSON_CONNECT",
  });
  const [confirm, setConfirm] = useState<{
    kind: "disable" | "archive";
    printer: AdminPrinter;
  } | null>(null);

  const fail = useCallback(
    (cause: unknown, fallback: string) =>
      toast.push(cause instanceof Error ? cause.message : fallback, "error"),
    [toast],
  );
  useEffect(() => {
    if (token) apiClient.setAdminAccessToken(token);
  }, [token]);

  const loadBase = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [metrics, list] = await Promise.all([
        apiClient.adminDashboard(),
        apiClient.adminPrinters(),
      ]);
      setDashboard(metrics);
      setPrinters(list);
    } catch (cause) {
      fail(cause, "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [token, fail]);
  useEffect(() => {
    void loadBase();
  }, [loadBase]);

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
      await apiClient.adminAddPrinter(addForm);
      setAddForm({ name: "", location: "", provider: "EPSON_CONNECT" });
      toast.push("Printer added successfully.", "success");
      await loadBase();
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
      if (confirm.kind === "archive") {
        await apiClient.adminArchivePrinter(confirm.printer.id);
        toast.push("Printer archived.", "success");
      } else {
        await apiClient.adminUpdatePrinter(confirm.printer.id, {
          name: confirm.printer.name,
          location: confirm.printer.location,
          active: false,
        });
        toast.push("Printer disabled.", "success");
      }
      setSelected(null);
      await loadBase();
    } catch (cause) {
      fail(cause, "Unable to update printer.");
    } finally {
      setConfirm(null);
    }
  }

  if (!token)
    return (
      <main className="flex min-h-screen items-center justify-center bg-lux-paper px-4">
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
    </>
  );
  return (
    <main className="min-h-screen bg-[#f4f5f3] text-lux-ink lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden min-h-screen bg-lux-ink p-4 lg:block">
        <p className="mb-8 px-4 pt-3 text-lg font-extrabold text-white">
          Ping &amp; Print
        </p>
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
        <header className="flex min-h-16 items-center justify-between border-b bg-white px-4 sm:px-7">
          <button
            onClick={() => setDrawer(true)}
            className="p-3 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <h1 className="text-lg font-extrabold capitalize">{view}</h1>
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
              onView={async (id) => {
                try {
                  setSelectedTransaction(await apiClient.adminTransaction(id));
                } catch (cause) {
                  fail(cause, "Unable to load transaction.");
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
            />
          )}
        </div>
      </div>
      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.kind === "archive"
            ? `Archive ${confirm.printer.name}?`
            : `Disable ${confirm?.printer.name ?? "printer"}?`
        }
        description={
          confirm?.kind === "archive"
            ? "The printer will remain in historical orders but cannot be enabled without a future restore action."
            : "Students will no longer be able to select this printer. Existing order and transaction history remains unchanged."
        }
        confirmLabel={
          confirm?.kind === "archive" ? "Archive printer" : "Disable printer"
        }
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => void performConfirmed()}
      />
      {selectedTransaction && (
        <Detail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </main>
  );
}

function Dashboard({
  data,
  printers,
}: {
  data: AdminDashboard | null;
  transactions: AdminTransaction[];
  printers: AdminPrinter[];
}) {
  const metrics = data
    ? [
        ["Total orders", data.total_orders],
        ["Successful payments", data.successful_payments],
        ["Revenue", money(data.revenue_minor)],
        ["Queued jobs", data.queued_jobs],
        ["Failed jobs", data.failed_jobs],
        ["Active printers", data.active_printers],
      ]
    : [];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="border bg-white p-5">
            <p className="text-sm text-lux-ink/55">{label}</p>
            <p className="mt-2 text-3xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      <section className="mt-7 border bg-white p-5">
        <h2 className="font-extrabold">Printer status</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {printers.length ? (
            printers.slice(0, 6).map((printer) => (
              <div key={printer.id} className="flex justify-between border p-3">
                <span>
                  <strong className="block">{printer.name}</strong>
                  <small>{printer.location}</small>
                </span>
                <Status
                  value={printer.archived ? "ARCHIVED" : printer.status}
                />
              </div>
            ))
          ) : (
            <Empty text="No printers have been configured yet." />
          )}
        </div>
      </section>
    </>
  );
}
function Transactions({
  page,
  filters,
  setFilters,
  loading,
  onView,
}: {
  page: PageResult<AdminTransaction>;
  filters: any;
  setFilters: (value: any) => void;
  loading: boolean;
  onView: (id: string) => void;
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
  addForm: { name: string; location: string; provider: string };
  setAddForm: (value: {
    name: string;
    location: string;
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
          <h2 className="font-extrabold">Add Epson printer</h2>
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
          <button className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 bg-lux-ink font-bold text-white">
            <Plus size={17} /> Add printer
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
                <div className="flex justify-between">
                  <strong>{p.name}</strong>
                  <Status value={p.archived ? "ARCHIVED" : p.status} />
                </div>
                <p className="mt-1 text-sm text-lux-ink/55">
                  {p.location} · {p.model ?? p.provider}
                </p>
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
                <h2 className="text-2xl font-extrabold">
                  {props.selected.name}
                </h2>
                <p className="text-sm text-lux-ink/55">
                  {props.selected.connectionState} ·{" "}
                  {props.selected.active ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {props.selected.connectionState !== "CONNECTED" && (
                  <button
                    onClick={() => props.onConnect(props.selected!)}
                    className="flex min-h-11 items-center gap-2 bg-lux-copper px-4 font-bold text-white"
                  >
                    <Link2 size={16} /> Connect
                  </button>
                )}
                <button
                  onClick={() => props.onRefresh(props.selected!)}
                  className="min-h-11 border px-4 font-bold"
                >
                  Refresh capabilities
                </button>
                <button
                  onClick={() => props.onTest(props.selected!)}
                  className="flex min-h-11 items-center gap-2 border px-4 font-bold"
                >
                  <Send size={16} /> Send test print
                </button>
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
}: {
  transaction: AdminTransaction;
  onClose: () => void;
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
