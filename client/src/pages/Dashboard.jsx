import { useState, useEffect } from 'react';
import {
  getEventTypes, createEventType, updateEventType, deleteEventType,
  getQuestions, updateQuestions
} from '../api';
import './Dashboard.css';

const DURATIONS = [15, 30, 45, 60, 90];
const BUFFERS   = [0, 5, 10, 15, 30];
const COLORS    = ['#0069ff','#f59e0b','#10b981','#8b5cf6','#ef4444','#ec4899'];

function slugify(t) {
  return t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function EventModal({ event, onClose, onSave }) {
  const [tab,     setTab]     = useState('details'); // details | questions
  const [form,    setForm]    = useState({
    name:             event?.name             || '',
    slug:             event?.slug             || '',
    duration_minutes: event?.duration_minutes || 30,
    description:      event?.description      || '',
    buffer_before:    event?.buffer_before    || 0,
    buffer_after:     event?.buffer_after     || 0,
  });
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (event?.id) {
      getQuestions(event.id).then(r => setQuestions(r.data)).catch(() => {});
    }
  }, [event]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev, [name]: value,
      ...(name === 'name' && !event ? { slug: slugify(value) } : {}),
    }));
  }

  function addQuestion() {
    setQuestions(prev => [...prev, { question: '', is_required: false }]);
  }

  function updateQuestion(i, field, value) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  function removeQuestion(i) {
    setQuestions(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let savedEvent;
      if (event) {
        const { data } = await updateEventType(event.id, form);
        savedEvent = data;
      } else {
        const { data } = await createEventType(form);
        savedEvent = data;
      }
      // Save questions
      const validQs = questions.filter(q => q.question.trim());
      await updateQuestions(savedEvent.id, { questions: validQs });
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? 'Edit Event Type' : 'New Event Type'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'details' ? 'modal-tab--active' : ''}`}
            onClick={() => setTab('details')} type="button">
            Details
          </button>
          <button
            className={`modal-tab ${tab === 'questions' ? 'modal-tab--active' : ''}`}
            onClick={() => setTab('questions')} type="button">
            Questions {questions.filter(q=>q.question).length > 0 && `(${questions.filter(q=>q.question).length})`}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'details' && (
            <div className="modal-body">
              <div className="form-group">
                <label>Event Name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. 30 Minute Meeting" required />
              </div>

              <div className="form-group">
                <label>URL Slug *</label>
                <div className="slug-input-wrap">
                  <span className="slug-prefix">/book/</span>
                  <input name="slug" value={form.slug} onChange={handleChange}
                    placeholder="30min-meeting" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration *</label>
                  <select name="duration_minutes" value={form.duration_minutes} onChange={handleChange}>
                    {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Buffer before</label>
                  <select name="buffer_before" value={form.buffer_before} onChange={handleChange}>
                    {BUFFERS.map(b => <option key={b} value={b}>{b === 0 ? 'None' : `${b} min`}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Buffer after</label>
                  <select name="buffer_after" value={form.buffer_after} onChange={handleChange}>
                    {BUFFERS.map(b => <option key={b} value={b}>{b === 0 ? 'None' : `${b} min`}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={3} placeholder="Add a short description..." />
              </div>
            </div>
          )}

          {tab === 'questions' && (
            <div className="modal-body">
              <p className="questions-hint">
                Add questions that invitees must answer when booking.
              </p>
              {questions.map((q, i) => (
                <div key={i} className="question-row">
                  <div className="question-input-wrap">
                    <input
                      value={q.question}
                      onChange={e => updateQuestion(i, 'question', e.target.value)}
                      placeholder={`Question ${i + 1}`}
                    />
                    <label className="required-toggle">
                      <input
                        type="checkbox"
                        checked={q.is_required}
                        onChange={e => updateQuestion(i, 'is_required', e.target.checked)}
                      />
                      <span>Required</span>
                    </label>
                  </div>
                  <button type="button" className="remove-question-btn"
                    onClick={() => removeQuestion(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="add-question-btn" onClick={addQuestion}>
                + Add Question
              </button>
            </div>
          )}

          {error && <p className="form-error" style={{ padding: '0 0 0 24px' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : event ? 'Save Changes' : 'Create Event Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventCard({ et, index, onEdit, onDelete, bookingBase }) {
  const [copied,   setCopied]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const color = COLORS[index % COLORS.length];

  function copy() {
    navigator.clipboard.writeText(`${bookingBase}/${et.slug}`);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="event-card card">
      <div className="event-card-accent" style={{ background: color }} />
      <div className="event-card-body">
        <div className="event-card-top">
          <div className="event-color-dot" style={{ background: color }} />
          <div className="event-menu-wrap">
            <button className="event-menu-btn" onClick={() => setMenuOpen(o => !o)}>•••</button>
            {menuOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="event-menu-dropdown">
                  <button onClick={() => { setMenuOpen(false); onEdit(et); }}>
                    <EditIcon /> Edit
                  </button>
                  <button onClick={() => { setMenuOpen(false); onDelete(et.id); }}
                    className="menu-delete">
                    <TrashIcon /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <h3 className="event-name">{et.name}</h3>
        <p className="event-duration">
          {et.duration_minutes} min
          {(et.buffer_before > 0 || et.buffer_after > 0) && (
            <span className="buffer-tag">
              {et.buffer_before > 0 && ` · ${et.buffer_before}m before`}
              {et.buffer_after  > 0 && ` · ${et.buffer_after}m after`}
            </span>
          )}
        </p>
        {et.description && <p className="event-desc">{et.description}</p>}
      </div>
      <div className="event-card-footer">
        <a href={`/book/${et.slug}`} className="view-link" target="_blank" rel="noreferrer">
          View booking page ↗
        </a>
        <button className="copy-link-btn" onClick={copy}>
          {copied ? '✓ Copied!' : '🔗 Copy link'}
        </button>
      </div>
    </div>
  );
}

// Inline SVG icons
const EditIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;

export default function Dashboard() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [toast,      setToast]      = useState(null);

  async function load() {
    try { const { data } = await getEventTypes(); setEventTypes(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2500);
  }

  async function handleSave() {
    setShowModal(false); await load();
    showToast(editing ? 'Event type updated!' : 'Event type created!');
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event type?')) return;
    try { await deleteEventType(id); await load(); showToast('Deleted.'); }
    catch { showToast('Failed to delete.', 'error'); }
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Types</h1>
          <p className="page-subtitle">Create events to share for people to book on your calendar</p>
        </div>
        <button className="btn-primary"
          onClick={() => { setEditing(null); setShowModal(true); }}>
          + New Event Type
        </button>
      </div>

      {loading ? <div className="spinner" /> :
        eventTypes.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📅</div>
            <h3>Create your first event type</h3>
            <p>Event types let you share a link for people to book time with you.</p>
            <button className="btn-primary"
              onClick={() => { setEditing(null); setShowModal(true); }}>
              + New Event Type
            </button>
          </div>
        ) : (
          <div className="event-grid">
            {eventTypes.map((et, i) => (
              <EventCard key={et.id} et={et} index={i}
                onEdit={e => { setEditing(e); setShowModal(true); }}
                onDelete={handleDelete}
                bookingBase={window.location.origin + '/book'} />
            ))}
            <div className="add-event-card"
              onClick={() => { setEditing(null); setShowModal(true); }}>
              <div className="add-event-inner">
                <div className="add-icon">+</div>
                <span>New Event Type</span>
              </div>
            </div>
          </div>
        )
      }

      {showModal && (
        <EventModal event={editing}
          onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}