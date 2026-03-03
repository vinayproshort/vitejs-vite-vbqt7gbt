// @ts-nocheck
import { useState, useEffect, useRef } from 'react';

const TEAM = ['Vinay Raghavendran', 'Rahul Aggarwal', 'Lokesh Sharma', 'Tech Team'];
const STATUSES = ['New', 'In Progress', 'Pending - Release', 'Pending - Roadmap', 'Waiting', 'Resolved'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const B = {
  blue: '#2668F6',
  blue40: 'rgba(38,104,246,0.4)',
  blue20: 'rgba(38,104,246,0.2)',
  blue10: 'rgba(38,104,246,0.1)',
  blue05: 'rgba(38,104,246,0.06)',
  orange: '#FF9280',
  orange40: 'rgba(255,146,128,0.4)',
  orange15: 'rgba(255,146,128,0.15)',
  bg: '#0e0f14',
  surface: '#16181f',
  surface2: '#1c1f29',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  text: '#f0f2f8',
  text2: 'rgba(240,242,248,0.6)',
  text3: 'rgba(240,242,248,0.3)',
};

const STATUS_STYLES = {
  'New':                { bg: 'rgba(38,104,246,0.12)',  border: 'rgba(38,104,246,0.4)',  text: '#6b9fff', dot: '#2668F6' },
  'In Progress':        { bg: 'rgba(94,184,162,0.12)',  border: 'rgba(94,184,162,0.4)',  text: '#5EB8A2', dot: '#5EB8A2' },
  'Pending - Release':  { bg: 'rgba(99,103,199,0.12)',  border: 'rgba(99,103,199,0.4)',  text: '#8b8fdc', dot: '#6367C7' },
  'Pending - Roadmap':  { bg: 'rgba(99,103,199,0.08)',  border: 'rgba(99,103,199,0.3)',  text: '#7a7ecc', dot: '#6367C7' },
  'Waiting':            { bg: 'rgba(255,146,128,0.12)', border: 'rgba(255,146,128,0.4)', text: '#ff9280', dot: '#FF9280' },
  'Resolved':           { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: 'rgba(240,242,248,0.3)', dot: 'rgba(240,242,248,0.2)' },
};

const PRIORITY_COLORS = {
  Critical: '#f87171',
  High: '#FF9280',
  Medium: '#6b9fff',
  Low: 'rgba(240,242,248,0.3)',
};

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultRequests = [
  { id: generateId(), title: 'Login button broken on mobile', customer: 'Acme Corp', slackChannel: '#support-acme', assignee: 'Vinay Raghavendran', status: 'In Progress', priority: 'Critical', due: new Date(Date.now() + 86400000).toISOString().split('T')[0], created: new Date(Date.now() - 3600000 * 5).toISOString(), notes: 'Reproducible on iOS Safari. Dev team notified.', source: 'manual' },
  { id: generateId(), title: 'Need bulk export feature for invoices', customer: 'Globex Inc', slackChannel: '#support-globex', assignee: 'Rahul Aggarwal', status: 'New', priority: 'Medium', due: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], created: new Date(Date.now() - 3600000 * 2).toISOString(), notes: '', source: 'slack' },
  { id: generateId(), title: 'Billing cycle showing wrong dates', customer: 'Pied Piper', slackChannel: '#support-general', assignee: 'Lokesh Sharma', status: 'Pending - Roadmap', priority: 'High', due: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], created: new Date(Date.now() - 3600000 * 18).toISOString(), notes: 'Waiting on engineering to scope this.', source: 'slack' },
];

const STORAGE_KEY = 'cs-tracker-v4';
function loadRequests() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : defaultRequests; } catch { return defaultRequests; } }
function saveRequests(r) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch {} }

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
  const days = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: '#f87171', bg: 'rgba(248,113,113,0.12)' };
  if (days === 0) return { label: 'Due today', color: B.orange, bg: B.orange15 };
  if (days === 1) return { label: 'Due tomorrow', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  return { label: `${days}d left`, color: B.text3, bg: 'rgba(255,255,255,0.05)' };
}

const EMPTY_FORM = { title: '', customer: '', slackChannel: '', assignee: TEAM[0], status: 'New', priority: 'Medium', due: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], notes: '', source: 'manual' };

const STAT_STATUSES = ['All', ...STATUSES];

export default function App() {
  const [requests, setRequests] = useState(loadRequests);
  const [activeStatus, setActiveStatus] = useState('All');
  const [filter, setFilter] = useState({ assignee: 'All', priority: 'All', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);
  const [showWebhook, setShowWebhook] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const formRef = useRef(null);

  useEffect(() => { saveRequests(requests); }, [requests]);
  useEffect(() => { if (showForm && formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [showForm]);

  const filtered = requests
    .filter((r) => {
      if (activeStatus !== 'All' && r.status !== activeStatus) return false;
      if (filter.assignee !== 'All' && r.assignee !== filter.assignee) return false;
      if (filter.priority !== 'All' && r.priority !== filter.priority) return false;
      if (filter.search) { const q = filter.search.toLowerCase(); if (!r.title.toLowerCase().includes(q) && !r.customer.toLowerCase().includes(q)) return false; }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === 'due') return new Date(a.due || '9999').getTime() - new Date(b.due || '9999').getTime();
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });

  const countFor = (s) => s === 'All' ? requests.length : requests.filter(r => r.status === s).length;

  const statCards = [
    { label: 'Open', value: requests.filter(r => r.status !== 'Resolved').length, color: B.blue, bg: B.blue05 },
    { label: 'New', value: requests.filter(r => r.status === 'New').length, color: '#5EB8A2', bg: 'rgba(94,184,162,0.08)' },
    { label: 'Critical', value: requests.filter(r => r.priority === 'Critical' && r.status !== 'Resolved').length, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
    { label: 'Overdue', value: requests.filter(r => r.due && new Date(r.due) < new Date() && r.status !== 'Resolved').length, color: B.orange, bg: B.orange15 },
  ];

  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }
  function openEdit(r) { setForm({ ...r }); setEditId(r.id); setShowForm(true); }
  function submitForm() {
    if (!form.title.trim() || !form.customer.trim()) return;
    if (editId) { setRequests(prev => prev.map(r => r.id === editId ? { ...form, id: editId } : r)); }
    else { setRequests(prev => [{ ...form, id: generateId(), created: new Date().toISOString() }, ...prev]); }
    setShowForm(false); setEditId(null);
  }
  function deleteReq(id) { setRequests(prev => prev.filter(r => r.id !== id)); if (expandedId === id) setExpandedId(null); }
  function quickStatus(id, status) { setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r)); }

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${B.border}`, fontFamily: "'Poppins', sans-serif", fontSize: 13, color: B.text, background: B.surface2, outline: 'none' };
  const lbl = { fontSize: 11, fontWeight: 600, color: B.text3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' };

  return (
    <div style={{ minHeight: '100vh', background: B.bg, fontFamily: "'Poppins', sans-serif", color: B.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${B.bg}; } ::-webkit-scrollbar-thumb { background: ${B.border2}; border-radius: 2px; }
        .inp:focus { border-color: ${B.blue} !important; box-shadow: 0 0 0 3px ${B.blue05}; }
        .btn { border: none; cursor: pointer; border-radius: 8px; font-family: 'Poppins', sans-serif; font-weight: 600; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
        .btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .btn:active { transform: scale(0.97) translateY(0); }
        .card { background: ${B.surface}; border-radius: 12px; border: 1.5px solid ${B.border}; transition: box-shadow 0.2s, border-color 0.2s; }
        .card:hover { border-color: ${B.border2}; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
        .tag { border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .row-in { animation: sIn 0.2s ease; }
        @keyframes sIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fIn 0.25s ease; }
        @keyframes fIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .status-pill { cursor: pointer; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; border: 1.5px solid transparent; transition: all 0.15s; white-space: nowrap; font-family: 'Poppins', sans-serif; }
        .status-pill:hover { filter: brightness(1.2); }
        select option { background: ${B.surface2}; color: ${B.text}; }
        input::placeholder { color: ${B.text3}; }
        textarea::placeholder { color: ${B.text3}; }
      `}</style>

      {/* Header */}
      <div style={{ background: B.surface, borderBottom: `1.5px solid ${B.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: B.blue, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, boxShadow: `0 4px 14px ${B.blue40}` }}>⚡</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: B.text, lineHeight: 1.1 }}>CS Tracker</div>
            <div style={{ fontSize: 11, color: B.text3, fontWeight: 400 }}>Slack Request Management</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => setShowWebhook(v => !v)} style={{ background: B.blue05, color: B.blue, padding: '9px 16px', fontSize: 13, border: `1.5px solid ${B.blue20}` }}>
            🔗 Webhook Setup
          </button>
          <button className="btn" onClick={openAdd} style={{ background: B.blue, color: '#fff', padding: '9px 20px', fontSize: 13, boxShadow: `0 4px 14px ${B.blue40}` }}>
            + New Request
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1180, margin: '0 auto' }}>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '18px 22px', border: `1.5px solid ${s.color}25` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 4 }}>
          {STAT_STATUSES.map(s => {
            const active = activeStatus === s;
            const sc = STATUS_STYLES[s];
            return (
              <button key={s} className="status-pill" onClick={() => setActiveStatus(s)}
                style={{
                  background: active ? (sc ? sc.bg : B.blue05) : 'transparent',
                  color: active ? (sc ? sc.text : B.blue) : B.text3,
                  borderColor: active ? (sc ? sc.border : B.blue40) : B.border,
                }}>
                {s}
                <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '1px 6px' }}>
                  {countFor(s)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Webhook Panel */}
        {showWebhook && (
          <div className="card fade" style={{ marginBottom: 22, padding: 24, borderColor: B.blue40, background: B.blue05 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: B.blue, marginBottom: 14 }}>🔗 Slack Webhook Auto-Import Setup</div>
            <div style={{ fontSize: 13, color: B.text2, lineHeight: 1.9 }}>
              <p style={{ marginBottom: 10 }}>Connect a Slack channel so requests auto-populate here:</p>
              <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>In Slack → <strong style={{ color: B.text }}>Tools → Workflow Builder</strong> → Create Workflow</li>
                <li>Trigger: <strong style={{ color: B.text }}>When a message is posted in #your-support-channel</strong></li>
                <li>Add step: <strong style={{ color: B.text }}>Send a webhook</strong> → paste your tracker ingest URL</li>
                <li>Map: <code style={{ background: B.blue10, padding: '1px 6px', borderRadius: 4, fontSize: 12, color: B.blue }}>message.text</code> → title, <code style={{ background: B.blue10, padding: '1px 6px', borderRadius: 4, fontSize: 12, color: B.blue }}>user.name</code> → customer</li>
                <li>Or use <strong style={{ color: B.text }}>Zapier / Make</strong>: Slack new message → POST to this app</li>
              </ol>
              <div style={{ marginTop: 14, background: B.surface2, borderRadius: 8, padding: '12px 16px', border: `1.5px solid ${B.border}` }}>
                <div style={{ fontSize: 11, color: B.text3, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Example Payload</div>
                <pre style={{ color: B.blue, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7 }}>{`{
  "title": "User can't reset password",
  "customer": "Acme Corp",
  "slackChannel": "#support-acme",
  "priority": "High",
  "assignee": "Vinay Raghavendran"
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: B.text3 }}>🔍</span>
            <input className="inp" placeholder="Search requests or customers..." value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              style={{ ...inp, paddingLeft: 36 }} />
          </div>
          {[
            { key: 'priority', opts: ['All', ...PRIORITIES], label: 'Priorities' },
            { key: 'assignee', opts: ['All', ...TEAM], label: 'Assignees' },
          ].map(({ key, opts, label }) => (
            <select key={key} className="inp" value={filter[key]}
              onChange={e => setFilter(f => ({ ...f, [key]: e.target.value }))}
              style={{ ...inp, width: 'auto', cursor: 'pointer' }}>
              {opts.map(o => <option key={o}>{o === 'All' ? `All ${label}` : o}</option>)}
            </select>
          ))}
          <select className="inp" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>
            <option value="priority">Sort: Priority</option>
            <option value="due">Sort: Due Date</option>
            <option value="created">Sort: Newest</option>
          </select>
        </div>

        {/* Form */}
        {showForm && (
          <div ref={formRef} className="card fade" style={{ marginBottom: 20, padding: 28, borderColor: B.blue40 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: B.blue, marginBottom: 20 }}>
              {editId ? '✏️  Edit Request' : '➕  Log New Request'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Request Title *</label>
                <input className="inp" style={inp} placeholder="e.g. Can't export data as CSV" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Customer *</label>
                <input className="inp" style={inp} placeholder="Company or person" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Slack Channel</label>
                <input className="inp" style={inp} placeholder="#support-channel" value={form.slackChannel} onChange={e => setForm(f => ({ ...f, slackChannel: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Assignee</label>
                <select className="inp" style={{ ...inp, cursor: 'pointer' }} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                  {TEAM.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <select className="inp" style={{ ...inp, cursor: 'pointer' }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select className="inp" style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Due Date</label>
                <input type="date" className="inp" style={inp} value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Source</label>
                <select className="inp" style={{ ...inp, cursor: 'pointer' }} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="manual">Manual (pasted from Slack)</option>
                  <option value="slack">Slack webhook</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Notes / Context</label>
                <textarea className="inp" style={{ ...inp, minHeight: 90, resize: 'vertical' }} placeholder="Paste the Slack message or add context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn" onClick={submitForm} style={{ background: B.blue, color: '#fff', padding: '10px 22px', fontSize: 14, boxShadow: `0 4px 14px ${B.blue40}` }}>
                {editId ? 'Save Changes' : 'Add Request'}
              </button>
              <button className="btn" onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: B.surface2, color: B.text2, padding: '10px 18px', fontSize: 14, border: `1.5px solid ${B.border}` }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Request List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: B.text3 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No requests match your filters</div>
            </div>
          )}
          {filtered.map(r => {
            const sc = STATUS_STYLES[r.status] || STATUS_STYLES['New'];
            const pc = PRIORITY_COLORS[r.priority] || B.text3;
            const due = dueBadge(r.due, r.status);
            const isExp = expandedId === r.id;
            return (
              <div key={r.id} className="card row-in" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setExpandedId(isExp ? null : r.id)}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: pc, flexShrink: 0, boxShadow: `0 0 0 3px ${pc}30` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: r.status === 'Resolved' ? B.text3 : B.text, textDecoration: r.status === 'Resolved' ? 'line-through' : 'none' }}>
                        {r.title}
                      </span>
                      {r.source === 'slack' && (
                        <span style={{ fontSize: 10, background: B.blue05, color: B.blue, padding: '2px 8px', borderRadius: 20, fontWeight: 600, border: `1px solid ${B.blue20}` }}>⚡ slack</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: B.text2, fontWeight: 500 }}>{r.customer}</span>
                      {r.slackChannel && <span style={{ fontSize: 11, color: B.text3 }}>{r.slackChannel}</span>}
                      <span style={{ fontSize: 11, color: B.text3 }}>· {timeAgo(r.created)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="tag" style={{ background: sc.bg, color: sc.text, border: `1.5px solid ${sc.border}` }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: sc.dot, marginRight: 5 }} />
                      {r.status}
                    </span>
                    <span className="tag" style={{ background: `${pc}18`, color: pc, border: `1.5px solid ${pc}35` }}>{r.priority}</span>
                    <span style={{ fontSize: 12, color: B.text2, fontWeight: 500, minWidth: 64, textAlign: 'right' }}>👤 {r.assignee}</span>
                    {due && <span className="tag" style={{ background: due.bg, color: due.color, border: `1.5px solid ${due.color}35` }}>{due.label}</span>}
                    <span style={{ color: B.text3, fontSize: 11, marginLeft: 4 }}>{isExp ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExp && (
                  <div className="fade" style={{ borderTop: `1.5px solid ${B.border}`, padding: '18px 20px 20px', background: B.surface2 }}>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        {r.notes && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={lbl}>Notes / Context</div>
                            <div style={{ fontSize: 13, color: B.text2, background: B.surface, padding: '12px 16px', borderRadius: 8, border: `1.5px solid ${B.border}`, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.notes}</div>
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: B.text3 }}>
                          Due: <span style={{ color: B.text2, fontWeight: 500 }}>{r.due || '—'}</span>
                          {' · '}Created: <span style={{ color: B.text2, fontWeight: 500 }}>{new Date(r.created).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
                        <div style={lbl}>Quick Status</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {STATUSES.map(s => {
                            const active = r.status === s;
                            return (
                              <button key={s} className="btn" onClick={() => quickStatus(r.id, s)}
                                style={{ fontSize: 12, padding: '6px 12px', background: active ? B.blue : B.surface, color: active ? '#fff' : B.text2, border: `1.5px solid ${active ? B.blue : B.border}`, fontWeight: active ? 600 : 500 }}>
                                {s}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button className="btn" onClick={() => openEdit(r)} style={{ fontSize: 12, padding: '7px 14px', background: B.blue05, color: B.blue, border: `1.5px solid ${B.blue20}` }}>✏️ Edit</button>
                          <button className="btn" onClick={() => deleteReq(r.id)} style={{ fontSize: 12, padding: '7px 12px', background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1.5px solid rgba(248,113,113,0.2)' }}>🗑 Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: B.text3, fontWeight: 500 }}>
          {filtered.length} of {requests.length} requests · CS Tracker
        </div>
      </div>
    </div>
  );
}
