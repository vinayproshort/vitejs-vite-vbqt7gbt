// @ts-nocheck
import { useState, useEffect, useRef } from 'react';

const TEAM = ['Vinay Raghavendran', 'Rahul Aggarwal', 'Lokesh Sharma', 'Tech Team'];
const STATUSES = ['New', 'In Progress', 'Waiting', 'Resolved'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const BRAND = {
  blue: '#2668F6',
  blue60: 'rgba(38,104,246,0.6)',
  blue40: 'rgba(38,104,246,0.4)',
  blue10: 'rgba(38,104,246,0.1)',
  blue05: 'rgba(38,104,246,0.05)',
  orange: '#FF9280',
  orange40: 'rgba(255,146,128,0.4)',
  orange10: 'rgba(255,146,128,0.1)',
  black: '#141414',
  neutral80: 'rgba(20,20,20,0.8)',
  neutral60: 'rgba(20,20,20,0.6)',
  neutral30: 'rgba(20,20,20,0.3)',
  neutral10: 'rgba(20,20,20,0.1)',
  neutral05: 'rgba(20,20,20,0.05)',
};

const STATUS_STYLES = {
  New: {
    bg: BRAND.blue05,
    border: BRAND.blue40,
    text: BRAND.blue,
    dot: BRAND.blue,
  },
  'In Progress': {
    bg: 'rgba(94,184,162,0.08)',
    border: 'rgba(94,184,162,0.5)',
    text: '#3a9e85',
    dot: '#5EB8A2',
  },
  Waiting: {
    bg: BRAND.orange10,
    border: BRAND.orange40,
    text: '#d96a50',
    dot: BRAND.orange,
  },
  Resolved: {
    bg: BRAND.neutral05,
    border: BRAND.neutral10,
    text: BRAND.neutral30,
    dot: BRAND.neutral30,
  },
};

const PRIORITY_COLORS = {
  Critical: '#e03e3e',
  High: BRAND.orange,
  Medium: BRAND.blue,
  Low: BRAND.neutral30,
};

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultRequests = [
  {
    id: generateId(),
    title: 'Login button broken on mobile',
    customer: 'Acme Corp',
    slackChannel: '#support-acme',
    assignee: 'Alex',
    status: 'In Progress',
    priority: 'Critical',
    due: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    created: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: 'Reproducible on iOS Safari. Dev team notified.',
    source: 'manual',
  },
  {
    id: generateId(),
    title: 'Need bulk export feature for invoices',
    customer: 'Globex Inc',
    slackChannel: '#support-globex',
    assignee: 'Sam',
    status: 'New',
    priority: 'Medium',
    due: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    created: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: '',
    source: 'slack',
  },
  {
    id: generateId(),
    title: 'Billing cycle showing wrong dates',
    customer: 'Pied Piper',
    slackChannel: '#support-general',
    assignee: 'Jordan',
    status: 'Waiting',
    priority: 'High',
    due: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    created: new Date(Date.now() - 3600000 * 18).toISOString(),
    notes: 'Waiting on customer to confirm billing period.',
    source: 'slack',
  },
];

const STORAGE_KEY = 'cs-tracker-v2';
function loadRequests() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : defaultRequests;
  } catch {
    return defaultRequests;
  }
}
function saveRequests(r) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  } catch {}
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function dueBadge(due, status) {
  if (!due || status === 'Resolved') return null;
  const days = Math.ceil((new Date(due) - Date.now()) / 86400000);
  if (days < 0)
    return {
      label: `${Math.abs(days)}d overdue`,
      color: '#e03e3e',
      bg: 'rgba(224,62,62,0.08)',
    };
  if (days === 0)
    return { label: 'Due today', color: BRAND.orange, bg: BRAND.orange10 };
  if (days === 1)
    return {
      label: 'Due tomorrow',
      color: '#c49a20',
      bg: 'rgba(196,154,32,0.08)',
    };
  return {
    label: `${days}d left`,
    color: BRAND.neutral60,
    bg: BRAND.neutral05,
  };
}

const EMPTY_FORM = {
  title: '',
  customer: '',
  slackChannel: '',
  assignee: TEAM[0],
  status: 'New',
  priority: 'Medium',
  due: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  notes: '',
  source: 'manual',
};

export default function App() {
  const [requests, setRequests] = useState(loadRequests);
  const [filter, setFilter] = useState({
    status: 'All',
    assignee: 'All',
    priority: 'All',
    search: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);
  const [showWebhook, setShowWebhook] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const formRef = useRef(null);

  useEffect(() => {
    saveRequests(requests);
  }, [requests]);
  useEffect(() => {
    if (showForm && formRef.current)
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showForm]);

  const filtered = requests
    .filter((r) => {
      if (filter.status !== 'All' && r.status !== filter.status) return false;
      if (filter.assignee !== 'All' && r.assignee !== filter.assignee)
        return false;
      if (filter.priority !== 'All' && r.priority !== filter.priority)
        return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.customer.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority')
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === 'due')
        return new Date(a.due || '9999') - new Date(b.due || '9999');
      return new Date(b.created) - new Date(a.created);
    });

  const stats = [
    {
      label: 'Open',
      value: requests.filter((r) => r.status !== 'Resolved').length,
      color: BRAND.blue,
      bg: BRAND.blue05,
    },
    {
      label: 'New',
      value: requests.filter((r) => r.status === 'New').length,
      color: '#3a9e85',
      bg: 'rgba(94,184,162,0.08)',
    },
    {
      label: 'Critical',
      value: requests.filter(
        (r) => r.priority === 'Critical' && r.status !== 'Resolved'
      ).length,
      color: '#e03e3e',
      bg: 'rgba(224,62,62,0.07)',
    },
    {
      label: 'Overdue',
      value: requests.filter(
        (r) => r.due && new Date(r.due) < new Date() && r.status !== 'Resolved'
      ).length,
      color: BRAND.orange,
      bg: BRAND.orange10,
    },
  ];

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }
  function openEdit(r) {
    setForm({ ...r });
    setEditId(r.id);
    setShowForm(true);
  }
  function submitForm() {
    if (!form.title.trim() || !form.customer.trim()) return;
    if (editId) {
      setRequests((prev) =>
        prev.map((r) => (r.id === editId ? { ...form, id: editId } : r))
      );
    } else {
      setRequests((prev) => [
        { ...form, id: generateId(), created: new Date().toISOString() },
        ...prev,
      ]);
    }
    setShowForm(false);
    setEditId(null);
  }
  function deleteReq(id) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  }
  function quickStatus(id, status) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  const inp = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1.5px solid ${BRAND.neutral10}`,
    fontFamily: "'Poppins', sans-serif",
    fontSize: 13,
    color: BRAND.black,
    background: '#fff',
    outline: 'none',
  };
  const lbl = {
    fontSize: 11,
    fontWeight: 600,
    color: BRAND.neutral60,
    display: 'block',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F4F7FF',
        fontFamily: "'Poppins', sans-serif",
        color: BRAND.black,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${BRAND.neutral30}; border-radius: 2px; }
        .inp:focus { border-color: ${BRAND.blue} !important; box-shadow: 0 0 0 3px ${BRAND.blue10}; }
        .btn { border: none; cursor: pointer; border-radius: 8px; font-family: 'Poppins', sans-serif; font-weight: 600; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
        .btn:hover { filter: brightness(0.94); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .btn:active { transform: scale(0.97) translateY(0); filter: brightness(0.9); }
        .card { background: #fff; border-radius: 12px; border: 1.5px solid ${BRAND.neutral10}; transition: box-shadow 0.2s, border-color 0.2s; }
        .card:hover { box-shadow: 0 4px 20px rgba(38,104,246,0.07); border-color: ${BRAND.blue10}; }
        .tag { border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .row-in { animation: sIn 0.2s ease; }
        @keyframes sIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fIn 0.25s ease; }
        @keyframes fIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: white; }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: '#fff',
          borderBottom: `1.5px solid ${BRAND.neutral10}`,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 1px 12px rgba(38,104,246,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              background: BRAND.blue,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 19,
              boxShadow: `0 4px 12px ${BRAND.blue40}`,
            }}
          >
            ⚡
          </div>
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: BRAND.black,
                lineHeight: 1.1,
              }}
            >
              CS Tracker
            </div>
            <div
              style={{ fontSize: 11, color: BRAND.neutral60, fontWeight: 400 }}
            >
              Slack Request Management
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn"
            onClick={() => setShowWebhook((v) => !v)}
            style={{
              background: BRAND.blue05,
              color: BRAND.blue,
              padding: '9px 16px',
              fontSize: 13,
              border: `1.5px solid ${BRAND.blue10}`,
            }}
          >
            🔗 Webhook Setup
          </button>
          <button
            className="btn"
            onClick={openAdd}
            style={{
              background: BRAND.blue,
              color: '#fff',
              padding: '9px 20px',
              fontSize: 13,
              boxShadow: `0 4px 14px ${BRAND.blue40}`,
            }}
          >
            + New Request
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1180, margin: '0 auto' }}>
        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                borderRadius: 12,
                padding: '18px 22px',
                border: `1.5px solid ${s.color}20`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: s.color,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: s.color,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Webhook Panel */}
        {showWebhook && (
          <div
            className="card fade"
            style={{
              marginBottom: 22,
              padding: 24,
              borderColor: BRAND.blue40,
              background: BRAND.blue05,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: BRAND.blue,
                marginBottom: 14,
              }}
            >
              🔗 Slack Webhook Auto-Import Setup
            </div>
            <div
              style={{ fontSize: 13, color: BRAND.neutral80, lineHeight: 1.9 }}
            >
              <p style={{ marginBottom: 10 }}>
                Connect a Slack channel so requests auto-populate here:
              </p>
              <ol
                style={{
                  paddingLeft: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <li>
                  In Slack → <strong>Tools → Workflow Builder</strong> → Create
                  Workflow
                </li>
                <li>
                  Trigger:{' '}
                  <strong>
                    When a message is posted in #your-support-channel
                  </strong>
                </li>
                <li>
                  Add step: <strong>Send a webhook</strong> → paste your tracker
                  ingest URL
                </li>
                <li>
                  Map:{' '}
                  <code
                    style={{
                      background: BRAND.blue10,
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    message.text
                  </code>{' '}
                  → title,{' '}
                  <code
                    style={{
                      background: BRAND.blue10,
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    user.name
                  </code>{' '}
                  → customer
                </li>
                <li>
                  Or use <strong>Zapier / Make</strong>: Slack new message →
                  POST to this app
                </li>
              </ol>
              <div
                style={{
                  marginTop: 14,
                  background: '#fff',
                  borderRadius: 8,
                  padding: '12px 16px',
                  border: `1.5px solid ${BRAND.blue10}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: BRAND.neutral60,
                    marginBottom: 6,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Example Payload (POST /api/requests)
                </div>
                <pre
                  style={{
                    color: BRAND.blue,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    lineHeight: 1.7,
                  }}
                >{`{
  "title": "User can't reset password",
  "customer": "Acme Corp",
  "slackChannel": "#support-acme",
  "priority": "High",
  "assignee": "Alex"
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 18,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14,
                color: BRAND.neutral30,
              }}
            >
              🔍
            </span>
            <input
              className="inp"
              placeholder="Search requests or customers..."
              value={filter.search}
              onChange={(e) =>
                setFilter((f) => ({ ...f, search: e.target.value }))
              }
              style={{ ...inp, paddingLeft: 36 }}
            />
          </div>
          {[
            { key: 'status', opts: ['All', ...STATUSES], lbl: 'Statuses' },
            {
              key: 'priority',
              opts: ['All', ...PRIORITIES],
              lbl: 'Priorities',
            },
            { key: 'assignee', opts: ['All', ...TEAM], lbl: 'Assignees' },
          ].map(({ key, opts, lbl: l }) => (
            <select
              key={key}
              className="inp"
              value={filter[key]}
              onChange={(e) =>
                setFilter((f) => ({ ...f, [key]: e.target.value }))
              }
              style={{ ...inp, width: 'auto', cursor: 'pointer' }}
            >
              {opts.map((o) => (
                <option key={o}>{o === 'All' ? `All ${l}` : o}</option>
              ))}
            </select>
          ))}
          <select
            className="inp"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ ...inp, width: 'auto', cursor: 'pointer' }}
          >
            <option value="priority">Sort: Priority</option>
            <option value="due">Sort: Due Date</option>
            <option value="created">Sort: Newest</option>
          </select>
        </div>

        {/* Form */}
        {showForm && (
          <div
            ref={formRef}
            className="card fade"
            style={{ marginBottom: 20, padding: 28, borderColor: BRAND.blue }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: BRAND.blue,
                marginBottom: 20,
              }}
            >
              {editId ? '✏️  Edit Request' : '➕  Log New Request'}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Request Title *</label>
                <input
                  className="inp"
                  style={inp}
                  placeholder="e.g. Can't export data as CSV"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={lbl}>Customer *</label>
                <input
                  className="inp"
                  style={inp}
                  placeholder="Company or person"
                  value={form.customer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={lbl}>Slack Channel</label>
                <input
                  className="inp"
                  style={inp}
                  placeholder="#support-channel"
                  value={form.slackChannel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slackChannel: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={lbl}>Assignee</label>
                <select
                  className="inp"
                  style={{ ...inp, cursor: 'pointer' }}
                  value={form.assignee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignee: e.target.value }))
                  }
                >
                  {TEAM.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <select
                  className="inp"
                  style={{ ...inp, cursor: 'pointer' }}
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select
                  className="inp"
                  style={{ ...inp, cursor: 'pointer' }}
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Due Date</label>
                <input
                  type="date"
                  className="inp"
                  style={inp}
                  value={form.due}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, due: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={lbl}>Source</label>
                <select
                  className="inp"
                  style={{ ...inp, cursor: 'pointer' }}
                  value={form.source}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, source: e.target.value }))
                  }
                >
                  <option value="manual">Manual (pasted from Slack)</option>
                  <option value="slack">Slack webhook</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Notes / Context</label>
                <textarea
                  className="inp"
                  style={{ ...inp, minHeight: 90, resize: 'vertical' }}
                  placeholder="Paste the Slack message or add context..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                className="btn"
                onClick={submitForm}
                style={{
                  background: BRAND.blue,
                  color: '#fff',
                  padding: '10px 22px',
                  fontSize: 14,
                  boxShadow: `0 4px 14px ${BRAND.blue40}`,
                }}
              >
                {editId ? 'Save Changes' : 'Add Request'}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
                style={{
                  background: BRAND.neutral05,
                  color: BRAND.neutral60,
                  padding: '10px 18px',
                  fontSize: 14,
                  border: `1.5px solid ${BRAND.neutral10}`,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '64px 0',
                color: BRAND.neutral30,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                No requests match your filters
              </div>
            </div>
          )}
          {filtered.map((r) => {
            const sc = STATUS_STYLES[r.status];
            const pc = PRIORITY_COLORS[r.priority];
            const due = dueBadge(r.due, r.status);
            const isExp = expandedId === r.id;
            return (
              <div
                key={r.id}
                className="card row-in"
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    padding: '15px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExp ? null : r.id)}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: pc,
                      flexShrink: 0,
                      boxShadow: `0 0 0 3px ${pc}22`,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 3,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color:
                            r.status === 'Resolved'
                              ? BRAND.neutral30
                              : BRAND.black,
                          textDecoration:
                            r.status === 'Resolved' ? 'line-through' : 'none',
                        }}
                      >
                        {r.title}
                      </span>
                      {r.source === 'slack' && (
                        <span
                          style={{
                            fontSize: 10,
                            background: BRAND.blue05,
                            color: BRAND.blue,
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontWeight: 600,
                            border: `1px solid ${BRAND.blue10}`,
                          }}
                        >
                          ⚡ slack
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: BRAND.neutral60,
                          fontWeight: 500,
                        }}
                      >
                        {r.customer}
                      </span>
                      {r.slackChannel && (
                        <span style={{ fontSize: 11, color: BRAND.neutral30 }}>
                          {r.slackChannel}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: BRAND.neutral30 }}>
                        · {timeAgo(r.created)}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexShrink: 0,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span
                      className="tag"
                      style={{
                        background: sc.bg,
                        color: sc.text,
                        border: `1.5px solid ${sc.border}`,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: sc.dot,
                          marginRight: 5,
                        }}
                      />
                      {r.status}
                    </span>
                    <span
                      className="tag"
                      style={{
                        background: `${pc}12`,
                        color: pc,
                        border: `1.5px solid ${pc}30`,
                      }}
                    >
                      {r.priority}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: BRAND.neutral60,
                        fontWeight: 500,
                        minWidth: 64,
                        textAlign: 'right',
                      }}
                    >
                      👤 {r.assignee}
                    </span>
                    {due && (
                      <span
                        className="tag"
                        style={{
                          background: due.bg,
                          color: due.color,
                          border: `1.5px solid ${due.color}30`,
                        }}
                      >
                        {due.label}
                      </span>
                    )}
                    <span
                      style={{
                        color: BRAND.neutral30,
                        fontSize: 11,
                        marginLeft: 4,
                      }}
                    >
                      {isExp ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {isExp && (
                  <div
                    className="fade"
                    style={{
                      borderTop: `1.5px solid ${BRAND.neutral10}`,
                      padding: '18px 20px 20px',
                      background: BRAND.blue05,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        {r.notes && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={lbl}>Notes / Context</div>
                            <div
                              style={{
                                fontSize: 13,
                                color: BRAND.neutral80,
                                background: '#fff',
                                padding: '12px 16px',
                                borderRadius: 8,
                                border: `1.5px solid ${BRAND.neutral10}`,
                                lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {r.notes}
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: BRAND.neutral30 }}>
                          Due:{' '}
                          <span
                            style={{ color: BRAND.neutral60, fontWeight: 500 }}
                          >
                            {r.due || '—'}
                          </span>{' '}
                          · Created:{' '}
                          <span
                            style={{ color: BRAND.neutral60, fontWeight: 500 }}
                          >
                            {new Date(r.created).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          minWidth: 200,
                        }}
                      >
                        <div style={lbl}>Quick Status</div>
                        <div
                          style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                        >
                          {STATUSES.map((s) => {
                            const active = r.status === s;
                            return (
                              <button
                                key={s}
                                className="btn"
                                onClick={() => quickStatus(r.id, s)}
                                style={{
                                  fontSize: 12,
                                  padding: '6px 12px',
                                  background: active ? BRAND.blue : '#fff',
                                  color: active ? '#fff' : BRAND.neutral60,
                                  border: `1.5px solid ${
                                    active ? BRAND.blue : BRAND.neutral10
                                  }`,
                                  fontWeight: active ? 600 : 500,
                                }}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            className="btn"
                            onClick={() => openEdit(r)}
                            style={{
                              fontSize: 12,
                              padding: '7px 14px',
                              background: '#fff',
                              color: BRAND.blue,
                              border: `1.5px solid ${BRAND.blue10}`,
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn"
                            onClick={() => deleteReq(r.id)}
                            style={{
                              fontSize: 12,
                              padding: '7px 12px',
                              background: 'rgba(224,62,62,0.06)',
                              color: '#e03e3e',
                              border: '1.5px solid rgba(224,62,62,0.15)',
                            }}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 32,
            textAlign: 'center',
            fontSize: 12,
            color: BRAND.neutral30,
            fontWeight: 500,
          }}
        >
          {filtered.length} of {requests.length} requests · CS Tracker
        </div>
      </div>
    </div>
  );
}
