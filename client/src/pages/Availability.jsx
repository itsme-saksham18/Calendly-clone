import { useState, useEffect } from 'react';
import { getAvailability, updateAvailability } from '../api';
import './Availability.css';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function Availability() {
  const [schedule, setSchedule] = useState(() =>
    Object.fromEntries(DAYS.map(d => [
      d.value,
      { enabled: false, start_time: '09:00', end_time: '17:00' }
    ]))
  );
  const [timezone, setTimezone] = useState('America/New_York');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getAvailability();
        setSchedule(prev => {
          const next = { ...prev };
          data.forEach(row => {
            next[row.day_of_week] = {
              enabled:    true,
              start_time: row.start_time.slice(0, 5),
              end_time:   row.end_time.slice(0, 5),
            };
          });
          return next;
        });
      } finally { setLoading(false); }
    }
    load();
    // Detect user timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONES.includes(tz)) setTimezone(tz);
  }, []);

  function toggleDay(day) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  }

  function updateTime(day, field, value) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2500);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const availability = DAYS
        .filter(d => schedule[d.value].enabled)
        .map(d => ({
          day_of_week: d.value,
          start_time:  schedule[d.value].start_time + ':00',
          end_time:    schedule[d.value].end_time   + ':00',
        }));
      await updateAvailability({ availability });
      showToast('Availability saved!');
    } catch { showToast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="spinner" />;

  return (
    <div className="availability-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Availability</h1>
          <p className="page-subtitle">Set when you're available for meetings each week</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="availability-card card">
        {/* Timezone row */}
        <div className="timezone-row">
          <div className="timezone-left">
            <span className="tz-icon">🌐</span>
            <div>
              <div className="tz-label">Time zone</div>
              <div className="tz-hint">All times shown in this timezone</div>
            </div>
          </div>
          <select
            className="tz-select"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="section-divider" />

        <div className="weekly-label">Weekly hours</div>

        <div className="day-list">
          {DAYS.map(day => {
            const s = schedule[day.value];
            return (
              <div key={day.value} className={`day-row ${s.enabled ? 'day-row--active' : ''}`}>
                <label className="toggle">
                  <input type="checkbox" checked={s.enabled} onChange={() => toggleDay(day.value)} />
                  <span className="toggle-slider" />
                </label>
                <span className={`day-name ${!s.enabled ? 'day-name--off' : ''}`}>{day.label}</span>
                {s.enabled ? (
                  <div className="time-range">
                    <input type="time" value={s.start_time}
                      onChange={e => updateTime(day.value, 'start_time', e.target.value)}
                      className="time-input" />
                    <span className="time-sep">–</span>
                    <input type="time" value={s.end_time}
                      onChange={e => updateTime(day.value, 'end_time', e.target.value)}
                      className="time-input" />
                  </div>
                ) : (
                  <span className="unavailable-label">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}