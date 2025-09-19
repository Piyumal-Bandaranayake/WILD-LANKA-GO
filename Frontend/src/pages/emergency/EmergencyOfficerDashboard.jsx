/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

/* ================= Icons ================= */
const Icon = {
  grid:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>,
  siren:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16v-3a5 5 0 0 1 10 0v3"/><path d="M5 16h14l1 4H4l1-4z"/><path d="M6 8l-2-2"/><path d="M18 8l2-2"/><path d="M12 3v2"/></svg>,
  users:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  doc:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
  wrench:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a4 4 0 1 0-5.66 5.66L3 18l3 3 6.04-6.04a4 4 0 0 0 2.66-8.66z"/></svg>,
  phone:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92V21a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h4.09a2 2 0 0 1 2 1.72l.57 4a2 2 0 0 1-.57 1.64l-1.2 1.2a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 1.64-.57l4 .57A2 2 0 0 1 22 16.92z"/></svg>,
  report:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M7 7h10M7 12h10M7 17h6"/></svg>,
  cap:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>,
  user:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg>,
  check:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>,
  clock:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  map:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l-6 3V3l6-3 6 3 6-3v18l-6 3-6-3z"/><path d="M9 18V3"/><path d="M15 21V6"/></svg>,
  userCircle:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/><circle cx="12" cy="12" r="10"/></svg>,
  eye:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-6.94"/><path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 3-3"/><path d="M1 1l22 22"/></svg>,
  alert:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>,
  cloudRain:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 13a4 4 0 0 0 0-8 5 5 0 0 0-9.9 1A4 4 0 0 0 6 13"/><path d="M8 19v1M12 19v1M16 19v1"/></svg>,
  wind:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h13a3 3 0 1 0-3-3"/><path d="M5 16h9a2 2 0 1 1-2 2"/></svg>,
  broadcast:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><path d="M16.24 7.76a6 6 0 0 1 0 8.48M7.76 7.76a6 6 0 0 0 0 8.48M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  hospital:(c="")=><svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>,
};

/* =============== Sidebar =============== */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: Icon.grid },
  { key: "active", label: "Active Emergencies", icon: Icon.siren },
  { key: "protocols", label: "Emergency Protocols", icon: Icon.doc },
  { key: "comms", label: "Communication Hub", icon: Icon.phone },
  { key: "equipment", label: "Equipment Status", icon: Icon.wrench },
  { key: "reports", label: "Incident Reports", icon: Icon.report },
  { key: "training", label: "Training Programs", icon: Icon.cap },
  { key: "profile", label: "Profile Settings", icon: Icon.user },
];

/* =============== API =============== */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",
});

/* =============== Utils =============== */
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const parseDT = (date, time) => {
  try {
    if (!date) return null;
    const d = new Date(date);
    if (time) {
      const [hh, mm] = (time || "").split(":");
      if (!isNaN(+hh) && !isNaN(+mm)) d.setHours(+hh, +mm, 0, 0);
    }
    return d;
  } catch { return null; }
};
const timeAgo = (d) => {
  if (!d) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} min ago`;
  const h = Math.floor(diff / 60);
  return `${h} hr${h>1?"s":""} ago`;
};
const StatusDot = ({status}) => {
  const color = status === "resolved" ? "bg-emerald-500" : "bg-rose-500";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`}></span>;
};
const statusChip = (s) => {
  const map = {
    pending: "bg-rose-50 text-rose-600",
    "in-progress": "bg-amber-50 text-amber-700",
    resolved: "bg-emerald-50 text-emerald-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[s] || "bg-gray-100 text-gray-700"}`}>{s}</span>;
};

/* =============== Detail Modal =============== */
function DetailModal({ open, onClose, item, source }) {
  if (!open || !item) return null;
  const isForm = source === "form";
  const title = isForm
    ? `${capitalize(item.emergency_type)} Emergency (Form)`
    : `${capitalize(item.type)} Emergency (Call)`;
  const dt = parseDT(item.date, item.time);
  const Line = ({label, children}) => (
    <div className="flex gap-3">
      <div className="w-36 text-sm text-[var(--muted)]">{label}</div>
      <div className="flex-1 text-[var(--ink)]">{children ?? "—"}</div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl p-6">
        <div className="flex items-start justify-between">
          <h4 className="text-lg font-semibold text-[var(--ink)]">{title}</h4>
        </div>
        <div className="mt-4 space-y-3">
          {!isForm ? (
            <>
              <Line label="Type">{capitalize(item.type)}</Line>
              <Line label="Status">{statusChip(item.status)}</Line>
              <Line label="Location">{item.location}</Line>
              <Line label="Date & Time">{dt ? `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}` : "—"}</Line>
              <Line label="Description">{item.description}</Line>
            </>
          ) : (
            <>
              <Line label="Name">{item.name}</Line>
              <Line label="Phone">{item.phone ? <a className="text-[var(--brand-green-600)] hover:underline" href={`tel:${item.phone}`}>{item.phone}</a> : "—"}</Line>
              <Line label="Email">{item.email}</Line>
              <Line label="Property">{item.property_name}</Line>
              <Line label="Location">{item.location}</Line>
              <Line label="Type">{capitalize(item.emergency_type)}</Line>
              <Line label="Date & Time">{dt ? `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}` : "—"}</Line>
              <Line label="Description">{item.description}</Line>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="border border-gray-300 text-[var(--ink)] px-4 py-2 rounded-lg hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
}

/* =============== Page =============== */
export default function EmergencyOfficerDashboard() {
  const [selected, setSelected] = useState("active");

  // officer availability toggle
  const [onDuty, setOnDuty] = useState(() => {
    const v = localStorage.getItem("officer_on_duty");
    return v ? v === "true" : true;
  });
  useEffect(() => { localStorage.setItem("officer_on_duty", String(onDuty)); }, [onDuty]);

  // optional pending filter when clicking "View Critical Alerts"
  const [protocolsFilter, setProtocolsFilter] = useState("all"); // 'all' | 'pending'

  // data
  const [emergencies, setEmergencies] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  // right column toggle
  const [showAlerts, setShowAlerts] = useState(true);

  // details modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState(null);
  const [modalItem, setModalItem] = useState(null);

  // status picker
  const [pickerForId, setPickerForId] = useState(null);

  // anchors
  const activeRef = useRef(null);
  const protocolsRef = useRef(null);
  const commsRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [{ data: emData }, { data: fmData }] = await Promise.all([
          api.get("/api/emergencies"),
          api.get("/api/emergency-forms"),
        ]);
        if (mounted) {
          setEmergencies(Array.isArray(emData) ? emData : []);
          setForms(Array.isArray(fmData) ? fmData : []);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* ---------- Stats ---------- */
  const today = new Date(); today.setHours(0,0,0,0);
  const stats = useMemo(() => {
    const inProgress = emergencies.filter(e => e.status === "in-progress");
    const pending = emergencies.filter(e => e.status === "pending");
    const resolved = emergencies.filter(e => e.status === "resolved");
    const resolvedToday = resolved.filter(e => {
      const d = new Date(e.date); d.setHours(0,0,0,0);
      return d.getTime() === today.getTime();
    });
    return {
      activeCount: inProgress.length,
      pendingCount: pending.length,
      resolvedToday: resolvedToday.length,
      responseTeams: 12,
      avgResponseMin: 8,
    };
  }, [emergencies]);

  /* ---------- Lists ---------- */
  // ACTIVE: only in-progress emergencies + all forms
  const activeItems = useMemo(() => {
    const callItems = emergencies
      .filter(e => e.status === "in-progress")
      .map(e => ({
        id: e._id || e.id,
        source: "call",
        type: e.type,
        title: `${capitalize(e.type)} Emergency`,
        description: e.description,
        location: e.location,
        status: e.status,
        when: parseDT(e.date, e.time)
      }));
    const formItems = forms.map(f => ({
      id: f._id || f.id,
      source: "form",
      type: f.emergency_type,
      title: `${capitalize(f.emergency_type)} Emergency`,
      description: f.description,
      location: f.location,
      phone: f.phone,
      name: f.name,
      when: parseDT(f.date, f.time)
    }));
    return [...callItems, ...formItems].sort((a,b)=> (b.when?.getTime()||0)-(a.when?.getTime()||0));
  }, [emergencies, forms]);

  // PROTOCOLS rows (calls + forms)
  const protocolRows = useMemo(() => {
    const calls = emergencies.map(e => ({
      id: `call-${e._id || e.id}`, refId: e._id || e.id, refSource: "call",
      type: e.type, status: e.status, location: e.location, when: parseDT(e.date, e.time)
    }));
    const fm = forms.map(f => ({
      id: `form-${f._id || f.id}`, refId: f._id || f.id, refSource: "form",
      type: f.emergency_type, status: "pending", location: f.location, when: parseDT(f.date, f.time)
    }));
    let rows = [...calls, ...fm].sort((a,b)=> (b.when?.getTime()||0)-(a.when?.getTime()||0));
    if (protocolsFilter === "pending") rows = rows.filter(r => r.status === "pending");
    return rows;
  }, [emergencies, forms, protocolsFilter]);

  /* ---------- Helpers ---------- */
  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openDetails = (source, id) => {
    let item = null;
    if (source === "call") item = emergencies.find(e => (e._id || e.id) === id);
    if (source === "form") item = forms.find(f => (f._id || f.id) === id);
    setModalSource(source); setModalItem(item || null); setModalOpen(Boolean(item));
  };

  /* ---------- Protocol actions ---------- */
  async function deleteProtocol(row) {
    const ok = window.confirm("Are you sure you want to delete this item?");
    if (!ok) return;
    try {
      if (row.refSource === "form") {
        await api.delete(`/api/emergency-forms/${row.refId}`);
        setForms(prev => prev.filter(f => (f._id || f.id) !== row.refId));
      } else {
        await api.delete(`/api/emergencies/${row.refId}`);
        setEmergencies(prev => prev.filter(e => (e._id || e.id) !== row.refId));
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete. Check server logs.");
    }
  }

  async function updateStatusCall(emergencyId, newStatus) {
    try {
      await api.put(`/api/emergencies/update-status`, { id: emergencyId, status: newStatus });
      setEmergencies(prev => prev.map(e =>
        (e._id || e.id) === emergencyId ? { ...e, status: newStatus } : e
      ));
    } catch (err) {
      console.error("Update status failed", err);
      alert("Failed to update status.");
    }
  }

  /* ---------- UI bits ---------- */
  const SidebarItem = ({ item }) => {
    const isDashboard = item.key === "dashboard";
    const isSelected = selected === item.key;
    const base = "flex items-center gap-3 px-5 py-3 rounded-xl transition select-none";
    const iconCls = "w-5 h-5";
    const labelCls = "text-sm";
    const dashCls = "bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-600)] font-semibold shadow-sm";
    const otherCls = [
      "text-[var(--ink)] hover:bg-[var(--brand-green-100)] hover:text-[var(--brand-green-600)]",
      isSelected ? "bg-[var(--brand-green-50)] text-[var(--brand-green-600)] font-semibold ring-1 ring-[var(--brand-green-100)]" : "text-[var(--muted)]"
    ].join(" ");
    const handleClick = () => {
      if (isDashboard) return;
      setSelected(item.key);
      if (item.key === "active") scrollTo(activeRef);
      if (item.key === "protocols") scrollTo(protocolsRef);
      if (item.key === "comms") scrollTo(commsRef);
    };
    return (
      <button type="button" onClick={handleClick} className={`${base} ${isDashboard ? dashCls : otherCls}`}>
        {item.icon(iconCls)} <span className={labelCls}>{item.label}</span>
      </button>
    );
  };

  const Pill = ({ children, tone="neutral" }) => {
    const tones = { call: "bg-rose-100 text-rose-700", form: "bg-sky-100 text-sky-700", neutral: "bg-gray-100 text-gray-700" };
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${tones[tone]}`}>{children}</span>;
  };

  const StatTile = ({ icon, value, label, badge }) => (
    <div className="rounded-2xl bg-white shadow-[0_10px_25px_rgba(2,6,23,.06)] p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 text-[var(--muted)]">
            {icon("w-5 h-5")}
          </div>
          {badge != null && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${badge > 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"}`}>
              {badge > 0 ? `+${badge}` : `${badge}min`}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-semibold text-[var(--ink)]">{value ?? "—"}</div>
        <div className="text-sm text-[var(--muted)]">{label}</div>
      </div>
    </div>
  );

  const Card = ({ item }) => {
    const isForm = item.source === "form";
    return (
      <div className="rounded-2xl bg-white shadow-[0_10px_25px_rgba(2,6,23,.06)] overflow-hidden">
        <div className="grid grid-cols-[6px_1fr]">
          <div className={`${isForm ? "bg-sky-400" : "bg-rose-400"}`} />
          <div className="p-5 bg-[rgba(16,185,129,0.06)]/20">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  {isForm ? Icon.userCircle("w-5 h-5 text-sky-600") : Icon.siren("w-5 h-5 text-rose-600")}
                </div>
                <h4 className="font-semibold text-[var(--ink)]">{item.title}</h4>
              </div>
              <Pill tone={isForm ? "form" : "call"}>{isForm ? "form" : "call"}</Pill>
            </div>

            <p className="text-[var(--ink)]/90">{item.description}</p>

            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex items-center gap-2 text-[var(--muted)]">{Icon.map("w-4 h-4")} <span>{item.location}</span></li>
              <li className="flex items-center gap-2 text-[var(--muted)]">{Icon.clock("w-4 h-4")} <span>{timeAgo(item.when)}</span></li>
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {isForm ? (
                <a href={item.phone ? `tel:${item.phone}` : "#"} className="inline-flex items-center gap-2 bg-[var(--brand-green)] hover:bg-[var(--brand-green-600)] text-white font-medium px-4 py-2 rounded-lg">
                  {Icon.phone("w-4 h-4")} Contact
                </a>
              ) : (
                <button type="button" className="inline-flex items-center gap-2 bg-[var(--brand-green)] hover:bg-[var(--brand-green-600)] text-white font-medium px-4 py-2 rounded-lg">
                  {Icon.phone("w-4 h-4")} Contact Team
                </button>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || "")}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 border border-[var(--brand-green)] text-[var(--brand-green-600)] px-4 py-2 rounded-lg"
              >
                {Icon.map("w-4 h-4")} Track Location
              </a>
              <button
                type="button"
                onClick={() => openDetails(item.source, item.id)}
                className="inline-flex items-center gap-2 border border-[var(--brand-green)] text-[var(--brand-green-600)] px-4 py-2 rounded-lg hover:bg-[var(--brand-green)] hover:text-white"
              >
                {Icon.check("w-4 h-4")} Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =============== Render =============== */
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mx-auto grid gap-6" style={{ maxWidth: 1440, gridTemplateColumns: "340px minmax(820px,1fr) 380px" }}>
        {/* Sidebar */}
        <aside className="w-full" style={{ maxWidth: 380 }}>
          <div className="rounded-2xl p-6 shadow-[0_10px_25px_rgba(2,6,23,.06)] bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--avatar-soft, #FDECEC)" }}>
                {Icon.siren("w-6 h-6")}
              </div>
              <div>
                <div className="text-lg font-semibold" style={{ color: "var(--ink)" }}>Chief Bandara</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>Emergency Officer</div>
              </div>
            </div>
            <hr className="my-6 border-gray-200" />
            <div className="space-y-2">
              {NAV.map(n => <SidebarItem key={n.key} item={n} />)}
            </div>
          </div>
        </aside>

        {/* Center */}
        <main className="space-y-6">
          {/* Hero */}
          <section className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #DC2626 0%, #B91C1C 100%)" }}>
            {/* Availability toggle */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="text-xs opacity-90">{onDuty ? "On Duty" : "Off Duty"}</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={onDuty} onChange={(e) => setOnDuty(e.target.checked)} />
                <div className="w-11 h-6 bg-white/30 rounded-full peer-checked:bg-white/60 relative transition">
                  <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                </div>
              </label>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold">Emergency Command Center</h2>
            <p className="mt-2 opacity-95">
              {loading
                ? "Loading emergencies…"
                : `${stats.activeCount} active emergencies require coordination. All response teams are deployed and ready for action.`}
            </p>

            <button
              onClick={() => { setSelected("protocols"); setProtocolsFilter("pending"); protocolsRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className="mt-5 inline-flex items-center gap-2 bg-[var(--brand-green)] hover:bg-[var(--brand-green-600)] text-white font-medium px-4 py-2 rounded-lg shadow-sm"
              type="button"
            >
              {Icon.check("w-4 h-4")}
              <span>View Critical Alerts</span>
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">{stats.pendingCount}</span>
            </button>
          </section>

          {/* Tiles */}
          <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={Icon.siren} value={loading ? "…" : stats.activeCount} label="Active Emergencies" badge={+2} />
            <StatTile icon={Icon.users} value={stats.responseTeams} label="Response Teams" badge={+1} />
            <StatTile icon={Icon.phone} value={`${stats.avgResponseMin} min`} label="Avg Response Time" badge={-2} />
            <StatTile icon={Icon.check} value={loading ? "…" : stats.resolvedToday} label="Resolved Today" badge={+4} />
          </section>

          {/* Active Emergency Situations */}
          <section ref={activeRef} className="rounded-2xl bg-white shadow-[0_10px_25px_rgba(2,6,23,.06)] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[var(--ink)]">Active Emergency Situations</h3>
              <span className="text-sm px-3 py-1 rounded-full bg-rose-50 text-rose-600">{activeItems.length} Active</span>
            </div>
            <div className="mt-4 space-y-4">
              {loading ? <div className="text-[var(--muted)]">Loading…</div>
                : activeItems.length === 0 ? <div className="text-[var(--muted)]">No active emergencies.</div>
                : activeItems.map(item => <Card key={`${item.source}-${item.id}`} item={item} />)}
            </div>
          </section>

          {/* Emergency Protocols */}
          <section ref={protocolsRef} className="rounded-2xl bg-white shadow-[0_10px_25px_rgba(2,6,23,.06)] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[var(--ink)]">Emergency Protocols</h3>
              {protocolsFilter === "pending" && (
                <button className="text-sm underline text-[var(--muted)]" onClick={() => setProtocolsFilter("all")}>
                  Clear pending filter
                </button>
              )}
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {protocolRows.length === 0 ? (
                <div className="text-[var(--muted)]">No protocols.</div>
              ) : (
                protocolRows.map(row => {
                  const isForm = row.refSource === "form";
                  const dtStr = row.when
                    ? `${row.when.toLocaleDateString()} ${row.when.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`
                    : "—";
                  const callId = row.refId;

                  return (
                    <div key={row.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusDot status={row.status} />
                        <div className="truncate">
                          <div className="font-medium text-[var(--ink)] truncate flex items-center gap-2">
                            {capitalize(row.type)} protocol
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isForm ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"}`}>{row.refSource}</span>
                            {statusChip(row.status)}
                          </div>
                          <div className="text-sm text-[var(--muted)] flex flex-wrap gap-3">
                            <span className="flex items-center gap-1">{Icon.map("w-4 h-4")} {row.location}</span>
                            <span className="flex items-center gap-1">{Icon.clock("w-4 h-4")} {dtStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 relative">
                        <button
                          type="button"
                          onClick={() => openDetails(row.refSource, row.refId)}
                          className="text-sm border border-[var(--brand-green)] text-[var(--brand-green-600)] px-3 py-1.5 rounded-lg hover:bg-[var(--brand-green)] hover:text-white"
                        >
                          View
                        </button>

                        {!isForm && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setPickerForId(pickerForId === callId ? null : callId)}
                              className="text-sm border border-amber-500 text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-500 hover:text-white"
                            >
                              Edit
                            </button>
                            {pickerForId === callId && (
                              <div className="absolute right-0 mt-2 w-40 rounded-lg border bg-white shadow-lg z-10">
                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                  onClick={() => { setPickerForId(null); updateStatusCall(callId, "in-progress"); }}
                                >
                                  Set: in-progress
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                  onClick={() => { setPickerForId(null); updateStatusCall(callId, "resolved"); }}
                                >
                                  Set: resolved
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Communication Hub */}
          <section ref={commsRef} className="rounded-2xl bg-white shadow-[0_10px_25px_rgba(2,6,23,.06)] p-5">
            <h3 className="text-xl font-semibold text-[var(--ink)]">Communication Hub</h3>
            <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <button className="group rounded-2xl border-2 border-rose-300 px-6 py-6 text-center transition hover:bg-rose-50" type="button">
                <div className="flex flex-col items-center gap-2">
                  {Icon.siren("w-6 h-6 text-rose-500 group-hover:text-rose-600")}
                  <span className="font-medium text-rose-600">Declare Emergency</span>
                </div>
              </button>
              {[
                { icon: Icon.users, label: "Deploy Team" },
                { icon: Icon.phone, label: "Emergency Call" },
                { icon: Icon.wind, label: "Air Support" },
                { icon: Icon.hospital, label: "Medical Support" },
                { icon: Icon.broadcast, label: "Alert Broadcast" },
              ].map(({icon,label}) => (
                <button key={label} className="group rounded-2xl border-2 border-[var(--brand-green)] px-6 py-6 text-center transition hover:bg-[var(--brand-green)]" type="button">
                  <div className="flex flex-col items-center gap-2">
                    {icon(`w-6 h-6 text-[var(--brand-green)] group-hover:text-white`)}
                    <span className="font-medium text-[var(--brand-green)] group-hover:text-white">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </main>

        {/* Right column (alerts + summaries) */}
        <aside className="rounded-2xl bg-white shadow-[0_10px_25px_rgba(2,6,23,.06)] p-5">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[var(--ink)]">Weather Alerts</h4>
            <button type="button" onClick={() => setShowAlerts(s => !s)} className="p-1 rounded-md text-[var(--muted)] hover:bg-gray-100" title={showAlerts ? "Hide alerts" : "Show alerts"}>
              {showAlerts ? Icon.eyeOff("w-5 h-5") : Icon.eye("w-5 h-5")}
            </button>
          </div>

          {showAlerts && (
            <div className="mt-3 space-y-3 max-h-72 sm:max-h-80 overflow-auto pr-1">
              {[
                { id:"c1", kind:"critical", title:"CRITICAL: Landslide reported near Horton Plains access road", ago:"5 min ago" },
                { id:"w1", kind:"weather", title:"Weather Alert: Heavy rainfall expected in Yala National Park", ago:"30 min ago" },
                { id:"w2", kind:"weather", title:"Thunderstorm risk in Wilpattu—seek shelter, avoid tall trees", ago:"1 hr ago" },
                { id:"w3", kind:"weather", title:"Strong winds in Udawalawe—air ops on standby", ago:"2 hr ago" },
                { id:"w4", kind:"weather", title:"Elephant Corridor flooding risk near Minneriya", ago:"3 hr ago" },
              ].map(a => {
                const styles = a.kind==="critical" ? "bg-rose-50 border-l-4 border-rose-400" : "bg-amber-50 border-l-4 border-amber-400";
                const icon = a.kind==="critical" ? Icon.alert : Icon.cloudRain;
                return (
                  <div key={a.id} className={`rounded-xl p-3 ${styles}`}>
                    <div className="flex items-start gap-2">
                      {icon("w-4 h-4 mt-1")}
                      <div>
                        <div className="text-[var(--ink)]">{a.title}</div>
                        <div className="text-xs text-[var(--muted)] mt-1">{a.ago}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <hr className="my-4 border-gray-200" />

          <h5 className="font-semibold text-[var(--ink)] mb-2">Recent Incidents</h5>
          <div className="space-y-2">
            {emergencies
              .filter(e => e.status === "resolved")
              .sort((a,b)=> (parseDT(b.date,b.time)?.getTime()||0)-(parseDT(a.date,a.time)?.getTime()||0))
              .slice(0,5)
              .map(r => {
                const dt = parseDT(r.date, r.time);
                return (
                  <div key={r._id || r.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[var(--ink)]">{capitalize(r.type)} Emergency</div>
                      <div className="text-xs text-[var(--muted)]">{dt ? dt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : ""} • {r.location}</div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> <span className="text-sm">Resolved</span>
                    </div>
                  </div>
                );
              })}
          </div>

          <hr className="my-4 border-gray-200" />

          <h5 className="font-semibold text-[var(--ink)] mb-2">Today's Emergency Stats</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-[var(--muted)]">Total Calls</span><span className="font-medium text-[var(--ink)]">{[...emergencies, ...forms].filter(x => x.date && new Date(x.date).setHours(0,0,0,0)===today.getTime()).length}</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Response Time</span><span className="font-medium text-emerald-600">8 min avg</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Teams Deployed</span><span className="font-medium text-[var(--ink)]">12</span></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Success Rate</span><span className="font-medium text-emerald-600">
              {(() => {
                const totalToday = emergencies.filter(e => e.date && new Date(e.date).setHours(0,0,0,0)===today.getTime()).length + forms.filter(f => f.date && new Date(f.date).setHours(0,0,0,0)===today.getTime()).length;
                const resolvedToday = emergencies.filter(e => e.status==="resolved" && e.date && new Date(e.date).setHours(0,0,0,0)===today.getTime()).length;
                return totalToday ? Math.round((resolvedToday/totalToday)*100) : 0;
              })()}%
            </span></div>
          </div>
        </aside>
      </div>

      {/* Details Modal */}
      <DetailModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} source={modalSource} />
    </div>
  );
}
