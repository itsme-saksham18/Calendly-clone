import { useState, useEffect } from 'react';
import { getUpcomingMeetings, getPastMeetings, cancelMeeting } from '../api';
import { format } from 'date-fns';
import './Meetings.css';

function MeetingCard({ meeting, onCancel, isPast }) {
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!confirm('Cancel this meeting?')) return;
    setCancelling(true);
    await onCancel(meeting.id);
    setCancelling(false);
  }

  const start = new Date(meeting.start_time);
  const end = new Date(meeting.end_time);

  const dateStr = format(start, 'EEEE, MMMM d, yyyy');
  const timeStr = `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;

  return (
    <div className="meeting-card card">
      <div className="meeting-card-left">
        <div className="meeting-date-block">
          <span className="meeting-month">{format(start, 'MMM')}</span>
          <span className="meeting-day">{format(start, 'd')}</span>
        </div>
      </div>

      <div className="meeting-card-body">
        <div className="meeting-top">
          <h3 className="meeting-title">{meeting.event_name}</h3>
          <span className={`badge ${
            meeting.status === 'cancelled' ? 'badge-red' :
            isPast ? 'badge-gray' : 'badge-green'
          }`}>
            {meeting.status === 'cancelled'
              ? 'Cancelled'
              : isPast
              ? 'Completed'
              : 'Confirmed'}
          </span>
        </div>

        <p className="meeting-time">🕐 {dateStr} · {timeStr}</p>

        <p className="meeting-invitee">
          👤 {meeting.invitee_name}
          <span className="invitee-email"> · {meeting.invitee_email}</span>
        </p>

        <p className="meeting-duration">
          <span className="badge badge-blue">{meeting.duration_minutes} min</span>
        </p>
      </div>

      {!isPast && meeting.status !== 'cancelled' && (
        <div className="meeting-card-actions">
          
          {/* ✅ FIXED LINK */}
          <a
            href={`/book/${meeting.slug}?reschedule=${meeting.id}`}
            className="btn-ghost"
            style={{
              fontSize: 13,
              padding: '6px 14px',
              borderRadius: 6,
              display: 'inline-block'
            }}
          >
            Reschedule
          </a>

          <button
            className="btn-danger"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>

        </div>
      )}
    </div>
  );
}

export default function Meetings() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([
        getUpcomingMeetings(),
        getPastMeetings()
      ]);
      setUpcoming(u.data);
      setPast(p.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleCancel(id) {
    try {
      await cancelMeeting(id);
      await load();
      showToast('Meeting cancelled.');
    } catch {
      showToast('Failed to cancel.', 'error');
    }
  }

  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="meetings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meetings</h1>
          <p className="page-subtitle">
            View and manage your scheduled meetings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'upcoming' ? 'tab--active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming
          {upcoming.length > 0 && (
            <span className="tab-count">{upcoming.length}</span>
          )}
        </button>

        <button
          className={`tab ${tab === 'past' ? 'tab--active' : ''}`}
          onClick={() => setTab('past')}
        >
          Past
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="spinner" />
      ) : shown.length === 0 ? (
        <div className="empty-state card">
          <h3>
            {tab === 'upcoming'
              ? 'No upcoming meetings'
              : 'No past meetings'}
          </h3>
          <p>
            {tab === 'upcoming'
              ? 'Share your booking link to start receiving meetings.'
              : 'Completed meetings will appear here.'}
          </p>
        </div>
      ) : (
        <div className="meeting-list">
          {shown.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onCancel={handleCancel}
              isPast={tab === 'past'}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}