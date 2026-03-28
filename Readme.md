# 📅 Calendly Clone — Scheduling Platform
 
> A full-stack scheduling and booking web application that replicates Calendly's design, user experience, and core functionality. Built as part of the Scaler SDE Intern Fullstack Assignment.
 
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.x-61DAFB.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-15.x-336791.svg)
 
---
 
## 🌐 Live Demo
 
| Service | URL |
|---|---|
| **Frontend** | `https://calendly-clone-beta-lyart.vercel.app/` |
| **Backend API** | `https://calendly-clone-coex.onrender.com/` |
| **Public Booking** | `https://calendly-clone-beta-lyart.vercel.app/book/30min-meeting` |
 
---
 
## ✨ Features
 
### Core Features
- **Event Types Management** — Create, edit, and delete bookable event types with a name, duration, URL slug, and description
- **Unique Public Booking Links** — Each event type gets a shareable link (e.g. `/book/30min-meeting`)
- **Availability Settings** — Set available days of the week with custom time ranges and timezone
- **Public Booking Page** — Month calendar view, available time slot display, and booking form
- **Double Booking Prevention** — Conflict detection with database-level transaction safety
- **Booking Confirmation Page** — Full meeting details shown after booking
- **Meetings Dashboard** — View upcoming and past meetings, with the ability to cancel
 
### Bonus Features
- **Email Notifications** — Confirmation email sent to invitee on booking; cancellation email on cancel
- **Custom Invitee Questions** — Add custom required/optional questions per event type
- **Buffer Time** — Set buffer minutes before and after meetings to prevent back-to-back bookings
- **Rescheduling Flow** — Invitees can reschedule an existing meeting to a new available slot
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Timezone Support** — Availability displayed in the host's selected timezone
 
---
 
## 🛠 Tech Stack
 
| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6 |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **ORM / Query** | `pg` (node-postgres) with raw SQL |
| **Email** | Nodemailer (Gmail SMTP) |
| **Date Handling** | date-fns |
| **Deployment** | Render (frontend + backend + DB) |
 
---
 
## 🗄 Database Schema
 
```
┌──────────────┐       ┌─────────────────┐       ┌──────────────────┐
│    users     │       │   event_types   │       │   availability   │
│──────────────│       │─────────────────│       │──────────────────│
│ id (PK)      │──┐    │ id (PK)         │──┐    │ id (PK)          │
│ name         │  └───▶│ user_id (FK)    │  │    │ user_id (FK)     │
│ timezone     │       │ name            │  │    │ day_of_week      │
│ created_at   │       │ slug (UNIQUE)   │  │    │ start_time       │
└──────────────┘       │ duration_minutes│  │    │ end_time         │
                       │ description     │  │    └──────────────────┘
                       │ is_active       │  │
                       │ buffer_before   │  │    ┌──────────────────┐
                       │ buffer_after    │  │    │     bookings     │
                       └─────────────────┘  │    │──────────────────│
                                            └───▶│ event_type_id(FK)│
┌──────────────────┐                            │ invitee_name     │
│ event_questions  │                            │ invitee_email    │
│──────────────────│                            │ start_time       │
│ id (PK)          │   ┌──────────────────┐     │ end_time         │
│ event_type_id(FK)│   │ booking_answers  │     │ status           │
│ question         │◀──│ question_id (FK) │     └──────────────────┘
│ is_required      │   │ booking_id (FK)  │
│ sort_order       │   │ answer           │
└──────────────────┘   └──────────────────┘
```
 
### Design Decisions
- **Soft delete** on event types (`is_active = false`) — preserves booking history
- **Transactions** on booking creation — prevents race conditions and double bookings
- **Buffer time stored on event type** — slot generator accounts for buffers when computing availability
- **Answers stored separately** — `booking_answers` table links questions to bookings, supports any number of custom questions
- **Default user (id=1)** — no auth required per assignment spec; all admin actions assume logged-in user
 
---
 
## 🚀 Local Setup
 
### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14 running locally
- Gmail account (for email notifications — optional)
 
---
 
### 1. Clone the repository
 
```bash
git clone https://github.com/yourusername/calendly-clone.git
cd calendly-clone
```
 
---
 
### 2. Backend setup
 
```bash
cd server
npm install
```
 
Create `server/.env`:
 
```env
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/calendly_clone
 
# Optional — email notifications
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Alex Johnson <youremail@gmail.com>
```
 
> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → generate one for "Mail"
 
Run migrations and seed:
 
```bash
npm run migrate   # creates all tables
npm run seed      # inserts sample data
```
 
Start the backend:
 
```bash
npm run dev       # runs on http://localhost:5000
```
 
---
 
### 3. Frontend setup
 
```bash
cd ../client
npm install
```
 
Create `client/.env`:
 
```env
VITE_API_URL=http://localhost:5000/api
```
 
Start the frontend:
 
```bash
npm run dev       # runs on http://localhost:5173
```
 
---
 
### 4. Verify setup
 
Open these URLs to confirm everything works:
 
| URL | Expected |
|---|---|
| `http://localhost:5173` | Dashboard with 3 event types |
| `http://localhost:5173/availability` | Mon–Fri 9am–5pm set |
| `http://localhost:5173/meetings` | Sample meetings visible |
| `http://localhost:5173/book/30min-meeting` | Public booking page |
| `http://localhost:5000/api/health` | `{ "status": "ok" }` |
 
---
 
## 📡 API Reference
 
### Event Types
 
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/event-types` | List all event types |
| `GET` | `/api/event-types/slug/:slug` | Get event type by slug |
| `GET` | `/api/event-types/:id` | Get event type by ID |
| `POST` | `/api/event-types` | Create event type |
| `PUT` | `/api/event-types/:id` | Update event type |
| `DELETE` | `/api/event-types/:id` | Soft delete event type |
 
### Availability
 
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/availability` | Get weekly availability |
| `PUT` | `/api/availability` | Replace full availability schedule |
 
### Bookings
 
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bookings/slots?date=YYYY-MM-DD&eventTypeId=1` | Get available time slots |
| `POST` | `/api/bookings` | Create a booking |
| `POST` | `/api/bookings/:id/reschedule` | Reschedule a booking |
 
### Meetings
 
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/meetings` | All meetings |
| `GET` | `/api/meetings/upcoming` | Upcoming confirmed meetings |
| `GET` | `/api/meetings/past` | Past meetings |
| `PATCH` | `/api/meetings/:id/cancel` | Cancel a meeting |
 
### Questions
 
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/questions/:eventTypeId` | Get questions for event type |
| `PUT` | `/api/questions/:eventTypeId` | Replace questions for event type |
 
---
 
 
## 📁 Project Structure
 
```
calendly-clone/
├── server/                    # Express backend
│   ├── db/
│   │   ├── migrate.js         # Table creation
│   │   └── seed.js            # Sample data
│   ├── lib/
│   │   ├── db.js              # PostgreSQL connection pool
│   │   └── mailer.js          # Email templates + sending
│   ├── routes/
│   │   ├── eventTypes.js      # CRUD for event types
│   │   ├── availability.js    # Weekly availability
│   │   ├── bookings.js        # Slots + booking + reschedule
│   │   ├── meetings.js        # Meeting list + cancel
│   │   └── questions.js       # Custom invitee questions
│   ├── index.js               # Express app entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
└── client/                    # React frontend
    ├── src/
    │   ├── api/
    │   │   └── index.js       # All API calls (axios)
    │   ├── components/
    │   │   ├── Layout.jsx     # Sidebar + mobile nav
    │   │   └── Layout.css
    │   ├── pages/
    │   │   ├── Dashboard.jsx        # Event types management
    │   │   ├── Availability.jsx     # Weekly hours + timezone
    │   │   ├── Meetings.jsx         # Upcoming + past + cancel
    │   │   ├── BookingPage.jsx      # Public calendar + booking form
    │   │   └── Confirmation.jsx     # Booking success page
    │   ├── App.jsx            # Routes
    │   ├── main.jsx           # Entry point
    │   └── index.css          # Global styles + CSS variables
    ├── .env
    └── package.json
```
 
---
 
## 🔑 Key Implementation Notes
 
### Slot Generation Algorithm
Available time slots are computed by:
1. Fetching the availability window for the requested day of week
2. Dividing it into chunks of `duration_minutes + buffer_before + buffer_after`
3. Filtering out slots that overlap with existing confirmed bookings
4. Removing past slots
 
### Double Booking Prevention
The booking API uses a PostgreSQL transaction with an overlap query:
```sql
SELECT id FROM bookings
WHERE event_type_id = $1
  AND status = 'confirmed'
  AND start_time < $3    -- requested end
  AND end_time   > $2    -- requested start
```
This is the standard interval overlap check — two intervals overlap if one starts before the other ends.
 
### Buffer Time Logic
Buffer time is stored per event type. The slot generator adds buffer padding around each slot duration so no two bookings can be placed too close together. Buffer time is invisible to the invitee — they only see the clean meeting time.
 
---
 
## 🧪 Assumptions
 
- A single default user (id=1) is assumed to be logged in for all admin pages — no authentication is implemented per the assignment spec
- Timezones are stored as IANA timezone strings (e.g. `America/New_York`) but slot generation uses the server's local time — a production app would convert all times to UTC
- Email sending is optional — if `EMAIL_USER` is not set, emails are silently skipped
- The public booking page is accessible to anyone without login
 
---
 
## 👤 Author
 
**Your Name**
- GitHub: [@itsme-saksham18](https://github.com/itsme-saksham18)
- Email: sakshammaheshwari18@gmail.com
 
---
 
*Built for Scaler SDE Intern Fullstack Assignment — 2025*
