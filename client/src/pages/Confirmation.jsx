import { useLocation, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import './Confirmation.css';

export default function Confirmation() {
  const { state }  = useLocation();
  const navigate   = useNavigate();

  if (!state?.booking) {
    return (
      <div className="confirm-page">
        <div className="confirm-box">
          <p>No booking found.</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const { booking, eventType } = state;
  const start = new Date(booking.start_time);
  const end   = new Date(booking.end_time);

  return (
    <div className="confirm-page">
      <div className="confirm-box card">

        {/* Success icon */}
        <div className="confirm-icon">✓</div>

        <h1 className="confirm-title">You're scheduled!</h1>
        <p className="confirm-subtitle">
          A calendar invitation has been sent to your email.
        </p>

        {/* Details card */}
        <div className="confirm-details">
          <div className="confirm-detail-row">
            <span className="detail-icon">📋</span>
            <div>
              <div className="detail-label">Event</div>
              <div className="detail-value">{booking.event_name || eventType?.name}</div>
            </div>
          </div>

          <div className="confirm-detail-row">
            <span className="detail-icon">📅</span>
            <div>
              <div className="detail-label">Date</div>
              <div className="detail-value">{format(start, 'EEEE, MMMM d, yyyy')}</div>
            </div>
          </div>

          <div className="confirm-detail-row">
            <span className="detail-icon">🕐</span>
            <div>
              <div className="detail-label">Time</div>
              <div className="detail-value">
                {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
              </div>
            </div>
          </div>

          <div className="confirm-detail-row">
            <span className="detail-icon">👤</span>
            <div>
              <div className="detail-label">Name</div>
              <div className="detail-value">{booking.invitee_name}</div>
            </div>
          </div>

          <div className="confirm-detail-row">
            <span className="detail-icon">✉️</span>
            <div>
              <div className="detail-label">Email</div>
              <div className="detail-value">{booking.invitee_email}</div>
            </div>
          </div>
        </div>

        <div className="confirm-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate(`/book/${eventType?.slug || ''}`)}
          >
            Book Another
          </button>
          <Link to="/meetings" className="btn-primary">
            View Meetings
          </Link>
        </div>
      </div>
    </div>
  );
}