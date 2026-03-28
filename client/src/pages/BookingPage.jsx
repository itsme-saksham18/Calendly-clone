import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getEventTypeBySlug, getSlots, createBooking,
  getQuestions, rescheduleBooking
} from '../api';
import {
  format, isSameDay, addMonths, subMonths,
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek
} from 'date-fns';
import './BookingPage.css';

export default function BookingPage() {
  const { slug }             = useParams();
  const navigate             = useNavigate();
  const [searchParams]       = useSearchParams();
  const rescheduleId         = searchParams.get('reschedule'); // booking id if rescheduling

  const [eventType,    setEventType]    = useState(null);
  const [questions,    setQuestions]    = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots,        setSlots]        = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [step,         setStep]         = useState('calendar');
  const [form,         setForm]         = useState({ name: '', email: '' });
  const [answers,      setAnswers]      = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [pageError,    setPageError]    = useState('');

  // Load event type + questions
  useEffect(() => {
    async function load() {
      try {
        const { data: et } = await getEventTypeBySlug(slug);
        setEventType(et);
        const { data: qs } = await getQuestions(et.id);
        setQuestions(qs);
        setAnswers(qs.map(q => ({ question_id: q.id, answer: '' })));
      } catch {
        setPageError('Event type not found.');
      }
    }
    load();
  }, [slug]);

  // Load slots when date changes
  useEffect(() => {
    if (!selectedDate || !eventType) return;
    async function load() {
      setLoadingSlots(true); setSlots([]); setSelectedSlot(null);
      try {
        const { data } = await getSlots(format(selectedDate, 'yyyy-MM-dd'), eventType.id);
        setSlots(data);
      } finally { setLoadingSlots(false); }
    }
    load();
  }, [selectedDate, eventType]);

  // Calendar grid
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end:   endOfWeek(endOfMonth(currentMonth)),
  });

  const today = new Date();

  function isDayDisabled(day) {
    const d = new Date(day); d.setHours(0,0,0,0);
    const t = new Date(today); t.setHours(0,0,0,0);
    return d < t;
  }

  function updateAnswer(i, value) {
    setAnswers(prev => prev.map((a, idx) => idx === i ? { ...a, answer: value } : a));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlot) return;

    // Validate required questions
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].is_required && !answers[i]?.answer?.trim()) {
        setError(`Please answer: "${questions[i].question}"`);
        return;
      }
    }

    setSubmitting(true); setError('');
    try {
      let data;
      if (rescheduleId) {
        // Rescheduling existing booking
        const res = await rescheduleBooking(rescheduleId, {
          start_time: selectedSlot.start,
          end_time:   selectedSlot.end,
        });
        data = { ...res.data, event_name: eventType.name, duration_minutes: eventType.duration_minutes };
      } else {
        // New booking
        const res = await createBooking({
          event_type_id: eventType.id,
          invitee_name:  form.name,
          invitee_email: form.email,
          start_time:    selectedSlot.start,
          end_time:      selectedSlot.end,
          answers:       answers.filter(a => a.answer.trim()),
        });
        data = res.data;
      }
      navigate(`/book/${slug}/confirm`, { state: { booking: data, eventType } });
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
      setSubmitting(false);
    }
  }

  if (pageError) return (
    <div className="booking-error">
      <h2>404</h2><p>{pageError}</p>
    </div>
  );

  if (!eventType) return <div className="spinner" style={{ marginTop: 80 }} />;

  const isRescheduling = !!rescheduleId;

  return (
    <div className="booking-page">
      <div className="booking-container">

        {/* Left panel */}
        <div className="booking-info">
          <div className="booking-host">
            <div className="host-avatar">AJ</div>
            <span className="host-name">Alex Johnson</span>
          </div>
          <h1 className="booking-event-name">{eventType.name}</h1>
          <div className="booking-meta">
            <div className="meta-item">
              <ClockIcon /> {eventType.duration_minutes} minutes
            </div>
            {(eventType.buffer_before > 0 || eventType.buffer_after > 0) && (
              <div className="meta-item">
                <BufferIcon />
                Buffer:
                {eventType.buffer_before > 0 && ` ${eventType.buffer_before}m before`}
                {eventType.buffer_after  > 0 && ` ${eventType.buffer_after}m after`}
              </div>
            )}
            <div className="meta-item"><VideoIcon /> Video call</div>
          </div>
          {eventType.description && <p className="booking-desc">{eventType.description}</p>}

          {isRescheduling && (
            <div className="reschedule-banner">
              📅 Rescheduling your meeting — pick a new time
            </div>
          )}

          {selectedSlot && (
            <div className="selected-summary">
              <div className="summary-item">
                📅 {format(new Date(selectedSlot.start), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="summary-item">
                🕐 {format(new Date(selectedSlot.start), 'h:mm a')} –{' '}
                    {format(new Date(selectedSlot.end),   'h:mm a')}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="booking-main">

          {step === 'calendar' && (
            <div className="booking-calendar-section">
              <h2 className="section-title">Select a Date & Time</h2>

              <div className="calendar">
                <div className="cal-header">
                  <button className="cal-nav"
                    onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                    disabled={
                      currentMonth.getMonth()    === today.getMonth() &&
                      currentMonth.getFullYear() === today.getFullYear()
                    }>‹</button>
                  <span className="cal-month-label">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button className="cal-nav"
                    onClick={() => setCurrentMonth(m => addMonths(m, 1))}>›</button>
                </div>

                <div className="cal-grid">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="cal-day-header">{d}</div>
                  ))}
                  {calendarDays.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isDisabled     = isDayDisabled(day);
                    const isSelected     = selectedDate && isSameDay(day, selectedDate);
                    const isToday        = isSameDay(day, today);
                    return (
                      <button key={i}
                        className={[
                          'cal-day',
                          !isCurrentMonth ? 'cal-day--other'    : '',
                          isDisabled      ? 'cal-day--disabled' : '',
                          isSelected      ? 'cal-day--selected' : '',
                          isToday         ? 'cal-day--today'    : '',
                        ].join(' ')}
                        disabled={isDisabled || !isCurrentMonth}
                        onClick={() => setSelectedDate(day)}>
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="slots-section">
                  <h3 className="slots-title">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </h3>
                  {loadingSlots ? <div className="spinner" /> :
                    slots.length === 0 ? (
                      <p className="no-slots">No available times on this day.</p>
                    ) : (
                      <div className="slots-grid">
                        {slots.map((slot, i) => (
                          <button key={i}
                            className={`slot-btn ${selectedSlot === slot ? 'slot-btn--selected' : ''}`}
                            onClick={() => setSelectedSlot(slot)}>
                            {format(new Date(slot.start), 'h:mm a')}
                          </button>
                        ))}
                      </div>
                    )
                  }
                  {selectedSlot && (
                    <button className="btn-primary confirm-btn"
                      onClick={() => isRescheduling ? handleSubmit({ preventDefault: ()=>{} }) : setStep('form')}>
                      {isRescheduling ? 'Confirm Reschedule' : 'Confirm Time →'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'form' && (
            <div className="booking-form-section">
              <button className="back-btn" onClick={() => setStep('calendar')}>← Back</button>
              <h2 className="section-title">Enter Your Details</h2>

              <div className="selected-time-display">
                <div>📅 {format(new Date(selectedSlot.start), 'EEEE, MMMM d, yyyy')}</div>
                <div>🕐 {format(new Date(selectedSlot.start), 'h:mm a')} – {format(new Date(selectedSlot.end), 'h:mm a')}</div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Your Name *</label>
                  <input type="text" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="john@example.com" required />
                </div>

                {/* Custom questions */}
                {questions.map((q, i) => (
                  <div key={q.id} className="form-group">
                    <label>
                      {q.question}
                      {q.is_required && <span className="required-star"> *</span>}
                    </label>
                    <input
                      value={answers[i]?.answer || ''}
                      onChange={e => updateAnswer(i, e.target.value)}
                      placeholder="Your answer..."
                      required={q.is_required}
                    />
                  </div>
                ))}

                {error && <p className="form-error">{error}</p>}

                <button type="submit" className="btn-primary confirm-btn" disabled={submitting}>
                  {submitting ? 'Booking...' : 'Schedule Event'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Small inline SVG icons
const ClockIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const VideoIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const BufferIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;