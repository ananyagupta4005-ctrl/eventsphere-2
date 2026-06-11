# 🌐 EventSphere — Full-Stack College Event Platform

A production-ready full-stack platform for college events — hackathons, workshops, fests, and more.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | Google OAuth 2.0, Email/Password, Phone OTP |
| File Storage | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| SMS/OTP | Twilio |
| PDF | PDFKit |
| QR Codes | qrcode |

---

## 📁 Folder Structure

```
eventsphere/
├── backend/
│   ├── config/
│   │   ├── db.js            # MongoDB connection
│   │   ├── cloudinary.js    # Cloudinary + Multer
│   │   └── passport.js      # Google OAuth strategy
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   ├── registrationController.js
│   │   ├── certificateController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT protect + authorize
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Registration.js
│   │   ├── Certificate.js
│   │   ├── Attendance.js
│   │   └── OTP.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── registrationRoutes.js
│   │   ├── certificateRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   └── email.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── index.js          # All Axios API calls
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── AuthModal.jsx # Login/Signup/OTP/Google
    │   │   ├── events/
    │   │   │   ├── EventFormModal.jsx
    │   │   │   └── RegistrationModal.jsx
    │   │   └── layout/
    │   │       ├── Navbar.jsx
    │   │       └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── EventsPage.jsx
    │   │   ├── CategoryPage.jsx
    │   │   ├── ParticipantDashboard.jsx
    │   │   ├── OrganizerDashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── VerifyCertPage.jsx
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── tailwind.config.js
    └── package.json
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
```

Required environment variables:
- `MONGODB_URI` — Your MongoDB Atlas connection string
- `JWT_SECRET` — Random string (min 32 chars)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `EMAIL_USER` + `EMAIL_PASS` — Gmail + App Password
- `CLOUDINARY_*` — From Cloudinary dashboard
- `TWILIO_*` — From Twilio console (optional for OTP)

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
npm run dev:backend

# Terminal 2 — Frontend (port 3000)
npm run dev:frontend
```

---

## 👥 User Roles & Access

| Feature | Participant | Organizer | Admin |
|---------|------------|-----------|-------|
| Browse Events | ✅ | ✅ | ✅ |
| Register for Events | ✅ | ✅ | ✅ |
| Create Events | ❌ | ✅ | ✅ |
| Edit/Delete Events | ❌ | Own only | ✅ |
| Mark Attendance | ❌ | ✅ | ✅ |
| Generate Certificates | ❌ | ✅ | ✅ |
| Download Certificates | Own only | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ✅ |
| Revoke Certificates | ❌ | ❌ | ✅ |

---

## 🔐 Authentication Methods

1. **Email + Password** — Standard JWT-based auth with email verification
2. **Google OAuth** — Redirect-based OAuth 2.0
3. **Phone OTP** — 6-digit OTP via Twilio SMS (or dev console in development mode)

---

## 🎓 Certificate Workflow

```
Participant registers → Event happens → Organizer marks attendance
→ Organizer generates certificate (with type: Participation/Winner/etc.)
→ Certificate stored in MongoDB with unique ID
→ Participant sees cert in dashboard → Downloads PDF
→ Anyone can verify via /verify/:certId
```

---

## 🌍 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Email registration |
| POST | `/api/auth/login` | Email login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/send-otp` | Send phone OTP |
| POST | `/api/auth/verify-otp` | Verify OTP + login |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (public) |
| POST | `/api/events` | Create event (organizer) |
| GET | `/api/events/:id` | Get event (public) |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| PUT | `/api/events/:id/publish` | Toggle publish |
| GET | `/api/events/category/:category` | Filter by category |
| GET | `/api/events/organizer/my-events` | My events |

### Registrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/registrations` | Register for event |
| GET | `/api/registrations/my` | My registrations |
| GET | `/api/registrations/event/:id` | Event registrations (organizer) |
| PUT | `/api/registrations/:id/cancel` | Cancel registration |
| PUT | `/api/registrations/:id/attendance` | Mark attendance |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/certificates/generate` | Generate cert (organizer/admin) |
| GET | `/api/certificates/my` | My certificates |
| GET | `/api/certificates/:id/download` | Download PDF |
| GET | `/api/certificates/verify/:certId` | Public verification |
| PUT | `/api/certificates/:id/revoke` | Revoke (admin) |

---

## 🏁 Default Admin Account

On first server start, an admin is auto-seeded from your `.env`:
```
Email:    ADMIN_EMAIL (from .env)
Password: ADMIN_PASSWORD (from .env)
```

---

## 📦 Production Deployment

- **Backend**: Deploy to Railway, Render, or EC2. Set all env vars.
- **Frontend**: Build with `npm run build` → Deploy to Vercel or Netlify.
- **MongoDB**: Use MongoDB Atlas free tier.
- **Files**: Cloudinary handles all uploads.

```bash
# Build frontend for production
cd frontend && npm run build
```

---

## 🔒 Security Features

- JWT with 7-day expiry
- bcrypt password hashing (cost factor 12)
- Rate limiting on auth + OTP routes
- Helmet.js HTTP security headers
- CORS restricted to frontend URL
- Role-based route protection
- Input validation via express-validator
- Sensitive fields excluded from API responses
