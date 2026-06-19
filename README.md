# Authentication Service

A secure, full-stack authentication system built with **Node.js, Express, MongoDB** (backend) and **React + Vite** (frontend). Supports both **email/password login** and **phone-based OTP login**, JWT access/refresh tokens, multi-device session management, profile picture uploads via ImageKit, and email-based password reset.

---

## Features

- User registration with first/last name, email, phone, and password
- OTP verification on signup (email OTP + phone OTP)
- Dual login modes:
  - Email + password
  - Phone number + OTP
- JWT access tokens (short-lived) + refresh tokens (httpOnly cookie, long-lived)
- Multi-device session tracking and revocation
- Logout from current device or all devices
- Account lockout after repeated failed login attempts
- OTP lockout after repeated failed attempts
- Resend OTP with rate-limited cooldown
- Forgot password / reset password flow with hashed, expiring tokens
- Profile fetch and update, including profile picture upload (ImageKit)
- Protected routes on the frontend via route guards
- Auto token refresh on the frontend via Axios interceptors

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT (`jsonwebtoken`) |
| Password Hashing | bcrypt |
| File Uploads | Multer (memory storage) |
| Image Storage | ImageKit (`@imagekit/nodejs`) |
| HTTP Client | Axios |
| Environment Config | dotenv |
| Cookies | cookie-parser |
| CORS | cors |

### Frontend

| Layer | Technology |
|---|---|
| Library | React 19 |
| Build Tool | Vite |
| Routing | React Router DOM 7 |
| HTTP Client | Axios |
| Linting | ESLint |

---

## Project Structure

```
.
├── backend/
│   ├── server.js                       # Entry point — starts Express + connects DB
│   ├── package.json
│   └── src/
│       ├── app.js                      # Express app setup, CORS, routes, error handler
│       ├── config/
│       │   ├── config.js               # Loads & validates environment variables
│       │   └── database.js             # MongoDB connection (Mongoose)
│       ├── controllers/
│       │   └── auth.controller.js      # All auth logic: register, login, OTP, profile, etc.
│       ├── models/
│       │   ├── user.model.js           # User schema
│       │   ├── session.model.js        # Session schema (per-device refresh sessions)
│       │   └── otp.model.js            # OTP schema (email/phone OTP, TTL-indexed)
│       ├── routes/
│       │   └── auth.routes.js          # /api/auth/* route definitions
│       ├── services/
│       │   └── storage.services.js     # ImageKit upload service
│       └── utils/
│           └── utils.js                # OTP generator + HTML email template
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js                  # Dev server + proxy to backend
│   ├── package.json
│   └── src/
│       ├── main.jsx                    # App entry, runs initAuth() before render
│       ├── App.jsx                     # Route definitions
│       ├── index.css                   # Global styles
│       ├── api/
│       │   └── api.js                  # Axios instance, auth interceptors, initAuth()
│       ├── components/
│       │   ├── ProtectedRoute.jsx      # Redirects to /login if not authenticated
│       │   └── PublicRoute.jsx         # Redirects to /profile if already authenticated
│       └── pages/
│           ├── Home.jsx
│           ├── Register.jsx
│           ├── Login.jsx                # Tabbed: Email login / Mobile OTP login
│           ├── verifyOtp.jsx            # Signup OTP verification
│           ├── Profile.jsx              # View/edit profile, logout, logout-all
│           ├── Forgotpassword.jsx
│           └── Resetpassword.jsx
│
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local instance or Atlas)
- An [ImageKit](https://imagekit.io/) account (for profile picture uploads)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
MONGO_URL=mongodb://localhost:27017/smart-parking-system
JWT_SECRET=your_jwt_secret_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

> All three variables are required — the server throws an error on startup if any are missing.

Start the backend:

```bash
# Development (auto-restart with nodemon)
npm run dev

# Production
npm start
```

The backend runs on **`http://localhost:3000`**.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **`http://localhost:5173`** and proxies all `/api/*` requests to the backend (configured in `vite.config.js`).

---

## Environment Variables (Backend)

| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign access & refresh tokens |
| `IMAGEKIT_PRIVATE_KEY` | Private key for ImageKit profile picture uploads |

---

## API Endpoints

Base path: **`/api/auth`**

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Register a new user, sends OTP to email & phone | No |
| GET | `/signupVerifyOtp` | Verify signup OTP (email or phone) | No |
| POST | `/login` | Email+password login, or phone login (sends OTP) | No |
| GET | `/loginVerifyOtp` | Verify OTP for phone login | No |
| GET | `/refreshToken` | Issue a new access token using the refresh cookie | No (cookie) |
| GET | `/profile` | Get the current user's profile | Yes |
| PATCH | `/update-profile` | Update name and/or profile picture | Yes |
| GET | `/logout` | Logout current device (revokes current session) | Yes (cookie) |
| GET | `/logout-all` | Logout all devices (revokes all sessions) | Yes (cookie) |
| POST | `/resend-otp` | Resend signup or login OTP | No |
| POST | `/forgot-password` | Request a password reset link | No |
| POST | `/reset-password/:token` | Reset password using the emailed token | No |

---

## API Usage Examples

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "countryCode": "+91",
  "phone": "9876543210",
  "password": "StrongPass@123"
}
```

**Response**
```json
{
  "message": "User registered successfully, please verify your email using the OTP sent to your email address",
  "user": { "...": "..." },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> ⚠️ In development, OTPs are logged to the backend console instead of being emailed/texted (email/SMS sending is currently stubbed out).

---

### Verify Signup OTP

```http
GET /api/auth/signupVerifyOtp?email=john@example.com&otp=123456
```

**Response**
```json
{
  "message": "Email verified successfully, you can now login to your account"
}
```

---

### Login (Email + Password)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "StrongPass@123"
}
```

**Response**
```json
{
  "message": "Login successful",
  "user": {
    "username": "John Doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

A `refreshToken` httpOnly cookie is also set (7-day expiry).

---

### Login (Phone + OTP)

```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "9876543210",
  "countryCode": "+91"
}
```

Sends an OTP, then verify with:

```http
GET /api/auth/loginVerifyOtp?phone=9876543210&otp=123456
```

---

### Get Profile

```http
GET /api/auth/profile
Authorization: Bearer <accessToken>
```

**Response**
```json
{
  "message": "User profile fetched successfully",
  "user": {
    "username": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "countryCode": "+91",
    "profilePictureURL": "https://ik.imagekit.io/...",
    "role": "user",
    "isVerified": true,
    "status": "active"
  }
}
```

---

### Update Profile

```http
PATCH /api/auth/update-profile
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

firstName: Jonathan
lastName: Doe
image: <file>
```

> Email and phone number **cannot** be changed once registered.

---

### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response** (always the same message, regardless of whether the email exists, to avoid account enumeration)
```json
{
  "message": "If this email exists, a reset link has been sent."
}
```

---

### Reset Password

```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "newPassword": "NewStrongPass@456"
}
```

**Response**
```json
{
  "message": "Password reset successfully"
}
```

---

### Logout / Logout All

```http
GET /api/auth/logout
GET /api/auth/logout-all
```

Both require the `refreshToken` cookie to be present (sent automatically by the browser).

---

## How Authentication Works

### Tokens

- **Access Token** — short-lived JWT (15 min), returned in the response body and sent by the frontend as `Authorization: Bearer <token>`.
- **Refresh Token** — long-lived JWT (7 days), stored as an `httpOnly`, `secure`, `sameSite=strict` cookie. Never exposed to JavaScript.

### Session Management

Each successful login/registration creates a `Session` document in MongoDB containing:
- A hash of the refresh token (`refreshTokenHash`)
- IP address and user agent
- Login method (`email` or `phone`)
- A `revoked` flag

The access token embeds the `sessionId`. On every protected request, the controller:
1. Verifies the JWT signature
2. Looks up the session by ID
3. Rejects the request if the session has been revoked

This enables:
- **`/logout`** — revokes only the session tied to the current refresh token
- **`/logout-all`** — revokes every active session belonging to the user (logs the user out everywhere)
- **`/refreshToken`** — rotates the refresh token and issues a fresh access token, as long as the session hasn't been revoked

### Frontend Token Handling

`frontend/src/api/api.js` configures an Axios instance that:
- Attaches `accessToken` from `localStorage` to every outgoing request
- On a `401` response, automatically calls `/api/auth/refreshToken` (using the cookie) to get a new access token and retries the original request
- On app startup (`initAuth()` in `main.jsx`), silently attempts a token refresh so a returning user doesn't have to log in again as long as their refresh cookie is still valid

---

## Security Highlights

- Passwords hashed with **bcrypt** (10 salt rounds)
- OTPs and password reset tokens are **never stored in plaintext** — only their SHA-256 hash is persisted
- OTP documents use a **MongoDB TTL index** (`expiresAt`) to auto-expire
- **Account lockout**: 5 failed login attempts locks the account for 15 minutes
- **OTP lockout**: 5 failed OTP attempts locks OTP verification for 15 minutes
- **Password reset rate limiting**: max 3 reset requests per hour per account
- Refresh tokens are stored as **httpOnly, secure, sameSite=strict** cookies — inaccessible to client-side JavaScript
- CORS restricted to an explicit allow-list of frontend origins
- Email/phone enumeration protection on the "forgot password" endpoint (same response either way)

---

## Error Responses

Errors generally follow a consistent shape:

```json
{
  "message": "Error description here"
}
```

| Status Code | Meaning |
|---|---|
| 200 / 201 | Success |
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid or expired token |
| 403 | Forbidden (blocked/locked account, locked OTP) |
| 404 | Resource not found |
| 429 | Too many requests (rate limited) |
| 500 | Internal server error |

---

## Notes & Caveats

- **Email/SMS sending is stubbed.** OTPs and password reset links are currently logged to the backend console (`console.log`) rather than actually sent — wire up `nodemailer`/an SMS provider before deploying to production.
- **Profile pictures** are uploaded to ImageKit; make sure `IMAGEKIT_PRIVATE_KEY` is set, or `/update-profile` image uploads will fail.
- The frontend dev server proxies `/api` to `http://localhost:3000` — update `frontend/vite.config.js` if your backend runs elsewhere.
- CORS in `backend/src/app.js` currently allows only `http://localhost:5173` and `http://localhost:4173`; add your production frontend URL before deploying.

---

## License

ISC