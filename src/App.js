import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";

const MEMBERS = ["Ana", "Carlos", "María", "Luis", "Sara"];
const LABELS = ["Diseño", "Desarrollo", "Marketing", "QA", "Gestión"];
const PRIORITIES = ["Alta", "Media", "Baja"];
const STATUSES = ["Pendiente", "En progreso", "Completada"];

const LABEL_COLORS = {
  Diseño: "#a78bfa", Desarrollo: "#60a5fa", Marketing: "#f472b6",
  QA: "#34d399", Gestión: "#fbbf24"
};
const PRIORITY_COLORS = { Alta: "#ef4444", Media: "#f97316", Baja: "#22c55e" };
const STATUS_COLORS = { Pendiente: "#94a3b8", "En progreso": "#3b82f6", Completada: "#22c55e" };

function isOverdue(due, status) {
  return status !== "Completada" && new Date(due) < new Date(new Date().toDateString());
}
function isDueSoon(due, status) {
  const d = new Date(due), today = new Date(new Date().toDateString());
  return status !== "Completada" && d >= today && (d - today) / 86400000 <= 2;
}

function Badge({ text, color }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
      {text}
    </span>
  );
}

function Modal({ task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task || {
    title: "", description: "", assignee: MEMBERS[0], label: LABELS[0],
    priority: "Media", status: "Pendiente", due_date: new Date().toISOString().split("T")[0]
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420, maxWidth: "95vw", boxShadow: "0 8px 40px #0003" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, color: "#1e293b" }}>{task?.id ? "Editar tarea" : "Nueva tarea"}</h2>
        {[["Título", "title"], ["Descripción", "description"]].map(([label, key]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</label>
            <input value={form[key] || ""} onChange={e => set(key, e.target.value)}
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 14, marginTop: 4, boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[["Asignado a", "assignee", MEMBERS], ["Etiqueta", "label", LABELS], ["Prioridad", "priority", PRIORITIES], ["Estado", "status", STATUSES]].map(([label, key, opts]) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</label>
              <select value={form[key]} onChange={e => set(key, e.target.value)}
                style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 8px", fontSize: 13, marginTop: 4 }}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Fecha límite</label>
          <input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)}
            style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 14, marginTop: 4, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {task?.id && <button onClick={() => onDelete(task.id)} style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600 }}>Eliminar</button>}
          <button onClick={onClose} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 600 }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function StatsView({ tasks }) {
  const done = tasks.filter(t => t.status === "Completada").length;
  const byMember = MEMBERS.map(m => ({
    name: m,
    done: tasks.filter(t => t.assignee === m && t.status === "Completada").length,
    total: tasks.filter(t => t.assignee === m).length
  })).filter(m => m.total > 0);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>📊 Estadísticas</h2>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        {STATUSES.map(s => (
          <div key={s} style={{ flex: 1, minWidth: 110, background: STATUS_COLORS[s] + "15", borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: STATUS_COLORS[s] }}>{tasks.filter(t => t.status === s).length}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{s}</div>
          </div>
        ))}
        <div style={{ flex: 1, minWidth: 110, background: "#f1f5f9", borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#1e293b" }}>{tasks.length ? Math.round(done / tasks.length * 100) : 0}%</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Completado</div>
        </div>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Progreso por miembro</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {byMember.map(m => (
          <div key={m.name} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px #0001" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{m.name}</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>{m.done}/{m.total} tareas</span>
            </div>
            <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99 }}>
              <div style={{ height: 6, background: "#3b82f6", borderRadius: 99, width: `${m.total ? m.done / m.total * 100 : 0}%`, transition: "width .4s" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamView({ tasks }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>👥 Equipo</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {MEMBERS.map(m => {
          const myTasks = tasks.filter(t => t.assignee === m);
          return (
            <div key={m} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px #0001" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{m[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{m}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{myTasks.length} tarea(s) asignada(s)</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUSES.map(s => {
                  const c = myTasks.filter(t => t.status === s).length;
                  return c > 0 ? <Badge key={s} text={`${s}: ${c}`} color={STATUS_COLORS[s]} /> : null;
                })}
                {myTasks.length === 0 && <span style={{ fontSize: 12, color: "#cbd5e1" }}>Sin tareas</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TasksView({ tasks, setModal, loading }) {
  const [filterLabel, setFilterLabel] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterMember, setFilterMember] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => tasks.filter(t =>
    (filterLabel === "Todas" || t.label === filterLabel) &&
    (filterStatus === "Todos" || t.status === filterStatus) &&
    (filterMember === "Todos" || t.assignee === filterMember) &&
    (!search || t.title.toLowerCase().includes(search.toLowerCase()))
  ), [tasks, filterLabel, filterStatus, filterMember, search]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>📋 Tareas</h2>
        <button onClick={() => setModal({})} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>+ Nueva tarea</button>
      </div>

      {tasks.filter(t => isOverdue(t.due_date, t.status)).length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#ef4444" }}>
          ⚠️ <strong>{tasks.filter(t => isOverdue(t.due_date, t.status)).length} tarea(s) vencida(s):</strong> {tasks.filter(t => isOverdue(t.due_date, t.status)).map(t => t.title).join(", ")}
        </div>
      )}
      {tasks.filter(t => isDueSoon(t.due_date, t.status)).length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#d97706" }}>
          🔔 <strong>{tasks.filter(t => isDueSoon(t.due_date, t.status)).length} tarea(s) vencen pronto:</strong> {tasks.filter(t => isDueSoon(t.due_date, t.status)).map(t => t.title).join(", ")}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", marginBottom: 14, boxShadow: "0 1px 4px #0001", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..."
          style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", fontSize: 13, flex: 1, minWidth: 120 }} />
        {[["filterLabel", filterLabel, setFilterLabel, ["Todas", ...LABELS]],
          ["filterStatus", filterStatus, setFilterStatus, ["Todos", ...STATUSES]],
          ["filterMember", filterMember, setFilterMember, ["Todos", ...MEMBERS]]].map(([key, val, setter, opts]) => (
          <select key={key} value={val} onChange={e => setter(e.target.value)}
            style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#374151" }}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Cargando tareas...</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>No hay tareas con estos filtros</div>}
        {filtered.map(t => {
          const overdue = isOverdue(t.due_date, t.status), soon = isDueSoon(t.due_date, t.status);
          return (
            <div key={t.id} onClick={() => setModal(t)}
              style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px #0001", cursor: "pointer", borderLeft: `4px solid ${PRIORITY_COLORS[t.priority]}`, transition: "box-shadow .15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px #0002"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px #0001"}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: t.status === "Completada" ? "#94a3b8" : "#1e293b", textDecoration: t.status === "Completada" ? "line-through" : "none" }}>{t.title}</span>
                    {overdue && <span style={{ fontSize: 11, background: "#fee2e2", color: "#ef4444", borderRadius: 99, padding: "1px 8px", fontWeight: 600 }}>Vencida</span>}
                    {soon && !overdue && <span style={{ fontSize: 11, background: "#fef3c7", color: "#d97706", borderRadius: 99, padding: "1px 8px", fontWeight: 600 }}>Vence pronto</span>}
                  </div>
                  {t.description && <p style={{ margin: "3px 0 8px", fontSize: 12, color: "#94a3b8" }}>{t.description}</p>}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge text={t.label} color={LABEL_COLORS[t.label]} />
                    <Badge text={t.priority} color={PRIORITY_COLORS[t.priority]} />
                    <Badge text={t.status} color={STATUS_COLORS[t.status]} />
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{t.assignee}</div>
                  <div style={{ fontSize: 11, color: overdue ? "#ef4444" : "#94a3b8", marginTop: 4 }}>📅 {t.due_date}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NAV = [
  { id: "tasks", icon: "📋", label: "Tareas" },
  { id: "stats", icon: "📊", label: "Estadísticas" },
  { id: "team", icon: "👥", label: "Equipo" },
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState("tasks");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);

  // Cargar tareas desde Supabase
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (error) { setError(error.message); }
    else { setTasks(data); }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase.channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const saveTask = async (form) => {
    const payload = {
      title: form.title,
      description: form.description,
      assignee: form.assignee,
      label: form.label,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date,
    };
    if (form.id) {
      await supabase.from("tasks").update(payload).eq("id", form.id);
    } else {
      await supabase.from("tasks").insert([payload]);
    }
    setModal(null);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    setModal(null);
    fetchTasks();
  };

  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 220 : 64, background: "#1e293b", display: "flex", flexDirection: "column", transition: "width .25s", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ padding: sidebarOpen ? "24px 20px 20px" : "24px 0 20px", display: "flex", alignItems: "center", gap: 10, justifyContent: sidebarOpen ? "flex-start" : "center" }}>
          <span style={{ fontSize: 22 }}>🗂️</span>
          {sidebarOpen && <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9", whiteSpace: "nowrap" }}>TeamTask</span>}
        </div>
        <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: sidebarOpen ? "10px 12px" : "10px 0", justifyContent: sidebarOpen ? "flex-start" : "center", borderRadius: 10, border: "none", background: page === n.id ? "#3b82f6" : "transparent", color: page === n.id ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: page === n.id ? 600 : 400, width: "100%" }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{n.label}</span>}
              {n.id === "tasks" && overdueCount > 0 && sidebarOpen && (
                <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{overdueCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 10px" }}>
          <button onClick={() => { setPage("tasks"); setModal({}); }}
            style={{ width: "100%", background: "#3b82f620", color: "#60a5fa", border: "1px solid #3b82f640", borderRadius: 10, padding: sidebarOpen ? "9px 12px" : "9px 0", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "flex-start" : "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>➕</span>
            {sidebarOpen && <span>Nueva tarea</span>}
          </button>
        </div>
        <div style={{ padding: "12px 10px 20px", borderTop: "1px solid #334155" }}>
          <button onClick={() => setSidebarOpen(s => !s)}
            style={{ width: "100%", background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, padding: "6px 0", display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "flex-end" : "center" }}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#ef4444", fontSize: 13 }}>❌ Error de conexión: {error}</div>}
          {page === "tasks" && <TasksView tasks={tasks} setModal={setModal} loading={loading} />}
          {page === "stats" && <StatsView tasks={tasks} />}
          {page === "team" && <TeamView tasks={tasks} />}
        </div>
      </div>

      {modal !== null && <Modal task={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={saveTask} onDelete={deleteTask} />}
    </div>
  );
}