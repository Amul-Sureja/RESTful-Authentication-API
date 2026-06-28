# RESTful Authentication API

A secure, production-ready full-stack authentication system built with **Node.js + Express + MongoDB** (backend) and **React + Vite** (frontend).

Supports email/password login, phone OTP login, **Google OAuth 2.0**, JWT access/refresh token rotation, multi-device session management, profile picture uploads via ImageKit, and email-based password reset.

---

## Features

- User registration with first name, last name, email, phone, and password
- OTP verification on signup (email OTP + phone OTP)
- **Three login modes:**
  - Email + password
  - Phone number + OTP
  - Google OAuth 2.0 (sign in with Google)
- JWT access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- Automatic token refresh on the frontend via Axios interceptors
- Multi-device session tracking and per-device revocation
- Logout from current device or all devices at once
- Account lockout after 5 failed login attempts (15-min cooldown)
- OTP lockout after 5 failed OTP attempts (15-min cooldown)
- Resend OTP with rate-limited cooldown
- Forgot password / reset password via hashed, expiring tokens
- Password reset rate limiting (max 3 requests/hour per account)
- Profile fetch and update, including profile picture upload (ImageKit)
- Protected and public route guards on the frontend
- Email/phone enumeration protection on the forgot-password endpoint
- Contact verification (email OTP + phone OTP) for existing users

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT (`jsonwebtoken`), Passport.js |
| OAuth | `passport-google-oauth20` |
| Password Hashing | bcrypt (10 rounds) |
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
| Build Tool | Vite 8 |
| Routing | React Router DOM 7 |
| HTTP Client | Axios |
| Google Auth | `@react-oauth/google` |
| Linting | ESLint |

---

## Project Structure

```
.
├── backend/
│   ├── server.js                       # Entry point — starts Express + connects DB
│   ├── package.json
│   ├── .env.example                    # Required environment variables
│   └── src/
│       ├── app.js                      # Express app: CORS, routes, error handler
│       ├── config/
│       │   ├── config.js               # Loads & validates environment variables
│       │   ├── database.js             # MongoDB connection (Mongoose)
│       │   └── passport.js             # Google OAuth 2.0 strategy (Passport)
│       ├── controllers/
│       │   └── auth.controller.js      # All auth logic: register, login, OTP, profile, etc.
│       ├── models/
│       │   ├── user.model.js           # User schema (supports local + Google accounts)
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
│       ├── main.jsx                    # App entry — runs initAuth() before render
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
│           ├── Login.jsx               # Tabbed: Email login / Mobile OTP / Google OAuth
│           ├── verifyOtp.jsx           # Signup OTP verification
│           ├── GoogleAuthSuccess.jsx   # Handles Google OAuth callback redirect
│           ├── Profile.jsx             # View/edit profile, logout, logout-all
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
- A [Google Cloud Console](https://console.cloud.google.com/) project with OAuth 2.0 credentials (for Google login)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd RESTful-Authentication-API
```

### 2. Backend setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
MONGO_URL=mongodb://localhost:27017/auth-api
JWT_SECRET=your_long_random_jwt_secret

IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

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

## Environment Variables

### Backend (required)

| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign access & refresh tokens |
| `IMAGEKIT_PRIVATE_KEY` | Private key for ImageKit profile picture uploads |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret |
| `GOOGLE_CALLBACK_URL` | Must match the redirect URI registered in Google Cloud Console |
| `FRONTEND_URL` | Frontend origin (used for Google OAuth redirect after login) |

---

## API Endpoints

Base path: **`/api/auth`**

### Core Auth

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Register a new user, sends OTP to email & phone | No |
| GET | `/signupVerifyOtp` | Verify signup OTP (email or phone) | No |
| POST | `/login` | Email+password login, or phone login (sends OTP) | No |
| GET | `/loginVerifyOtp` | Verify OTP for phone login | No |
| GET | `/refreshToken` | Issue a new access token using the refresh cookie | No (cookie) |
| GET | `/logout` | Logout current device (revokes current session) | Yes (cookie) |
| GET | `/logout-all` | Logout all devices (revokes all sessions) | Yes (cookie) |

### Profile

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/profile` | Get the current user's profile | Yes |
| PATCH | `/update-profile` | Update name and/or profile picture (multipart) | Yes |

### Password Reset

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/forgot-password` | Request a password reset link via email | No |
| POST | `/reset-password/:token` | Reset password using the emailed token | No |

### OTP

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/resend-otp` | Resend signup or login OTP | No |
| POST | `/send-verify-otp` | Send OTP to verify email or phone (existing user) | Yes |
| POST | `/verify-contact-otp` | Verify the OTP sent to email or phone | Yes |
| POST | `/send-email-otp` | Shorthand: sends email verification OTP | Yes |
| POST | `/verify-email-otp` | Shorthand: verifies email OTP | Yes |
| POST | `/send-phone-otp` | Shorthand: sends phone verification OTP | Yes |
| POST | `/verify-phone-otp` | Shorthand: verifies phone OTP | Yes |

### Google OAuth

| Method | Endpoint | Description |
|---|---|---|
| GET | `/google` | Initiates Google OAuth flow |
| GET | `/google/callback` | Google OAuth callback — issues JWT and redirects to frontend |

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

> In development, OTPs are logged to the backend console instead of being sent via email/SMS.

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
  "user": { "username": "John Doe", "email": "john@example.com" },
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

Then verify the OTP:

```http
GET /api/auth/loginVerifyOtp?phone=9876543210&otp=123456
```

---

### Google OAuth

Redirect the user's browser to:

```
GET /api/auth/google
```

After Google authentication, the user is redirected back to `FRONTEND_URL/google-auth-success?token=<accessToken>`. The frontend (`GoogleAuthSuccess.jsx`) stores the token and redirects to the profile page.

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
    "emailVerified": true,
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

> Email and phone number cannot be changed once registered.

---

### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response** (identical regardless of whether the email exists — prevents enumeration)
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

---

### Logout

```http
GET /api/auth/logout        # revokes only the current session
GET /api/auth/logout-all    # revokes all sessions (logs out everywhere)
```

Both require the `refreshToken` cookie (sent automatically by the browser).

---

## How Authentication Works

### Token Strategy

- **Access Token** — short-lived JWT (15 min), returned in the response body. The frontend attaches it as `Authorization: Bearer <token>` on every request.
- **Refresh Token** — long-lived JWT (7 days), stored as an `httpOnly`, `secure`, `sameSite=strict` cookie. Never accessible to JavaScript.

### Session Management

Every successful login creates a `Session` document in MongoDB that stores:
- A SHA-256 hash of the refresh token
- IP address and user agent
- Login method (`email`, `phone`, or `google`)
- A `revoked` flag

The access token embeds a `sessionId`. On every protected request:
1. The JWT signature is verified
2. The session is fetched by `sessionId`
3. If the session is revoked, the request is rejected with `401`

This powers single-device logout (`/logout`) and global logout (`/logout-all`).

### Frontend Token Handling

`frontend/src/api/api.js` configures an Axios instance that:
- Reads `accessToken` from `localStorage` and attaches it to every outgoing request
- On a `401` response, silently calls `/api/auth/refreshToken` (using the httpOnly cookie) to get a new token, then retries the original request
- On app startup (`initAuth()` called from `main.jsx`), attempts a silent token refresh so returning users don't need to re-login

### Google OAuth Flow

1. User clicks "Sign in with Google" → browser navigates to `GET /api/auth/google`
2. Passport.js redirects to Google's consent screen
3. After consent, Google redirects to `GET /api/auth/google/callback`
4. The controller issues a session + JWT and redirects to `FRONTEND_URL/google-auth-success?token=<accessToken>`
5. `GoogleAuthSuccess.jsx` stores the token and redirects the user to `/profile`

If a Google email already exists as a local account, the accounts are automatically linked.

---

## Security Highlights

- Passwords hashed with **bcrypt** (10 salt rounds)
- OTPs and password reset tokens stored only as **SHA-256 hashes** — never plaintext
- OTP documents use a **MongoDB TTL index** to auto-expire
- **Account lockout**: 5 failed login attempts → 15-minute lockout
- **OTP lockout**: 5 failed OTP verifications → 15-minute lockout
- **Password reset rate limit**: max 3 requests per hour per account
- Refresh tokens stored as **httpOnly, secure, sameSite=strict** cookies
- CORS restricted to an explicit allow-list of frontend origins
- **Enumeration protection** on forgot-password endpoint (same response regardless of email existence)
- Google OAuth tokens are never stored — only the resulting session is

---

## Error Responses

All errors follow a consistent shape:

```json
{
  "message": "Description of the error"
}
```

| Status | Meaning |
|---|---|
| 200 / 201 | Success |
| 400 | Bad request / validation error |
| 401 | Unauthorized — invalid or expired token |
| 403 | Forbidden — locked account or locked OTP |
| 404 | Resource not found |
| 429 | Too many requests (rate limited) |
| 500 | Internal server error |

---

## New Features to Add (Instructions)

The following features are recommended to make this project production-ready. Instructions are provided — no code changes have been made yet.

### 1. Real Email Sending (Nodemailer)

**Current state:** OTPs and reset links are logged to the console via `console.log`.

**What to do:**
- Install `nodemailer`: `npm install nodemailer`
- Add SMTP credentials to `.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Create a `src/services/email.services.js` file with a `sendEmail(to, subject, html)` function using `nodemailer.createTransport()`
- In `auth.controller.js`, replace every `console.log(otp...)` and `console.log(resetLink...)` with a call to your new `sendEmail()` function
- Use the existing `getOtpHtmlEmail(otp)` helper from `utils.js` for the HTML body

---

### 2. SMS Sending (Twilio or Fast2SMS)

**Current state:** Phone OTPs are only logged to the console.

**What to do:**
- Choose a provider: [Twilio](https://www.twilio.com/) or [Fast2SMS](https://www.fast2sms.com/) (cheaper for India)
- Install the SDK: `npm install twilio` (or use Axios for Fast2SMS's REST API)
- Add credentials to `.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Create `src/services/sms.services.js` with a `sendSms(to, message)` function
- In `auth.controller.js`, replace `console.log(phoneOtp...)` with a call to `sendSms()`
- Format the "to" number as `+<countryCode><phone>` (e.g., `+919876543210`)

---

### 3. Input Validation (express-validator or Zod)

**Current state:** No request body validation exists. Malformed input can reach the database.

**What to do:**
- Install: `npm install express-validator`
- Create a `src/middleware/validate.js` middleware that calls `validationResult(req)` and returns a `400` if errors exist
- Create `src/validators/auth.validators.js` with validation chains for each route (e.g., check email format, password length, phone number format)
- In `auth.routes.js`, add the validator array before each controller: `authRouter.post('/register', registerValidator, validate, authController.register)`

---

### 4. Rate Limiting (express-rate-limit)

**Current state:** Only OTP and password-reset have manual rate limiting. Login, register, and other endpoints are unprotected against brute-force.

**What to do:**
- Install: `npm install express-rate-limit`
- Create `src/middleware/rateLimit.js` with different limiters (e.g., `loginLimiter`: 10 requests/15 min per IP, `apiLimiter`: 100 requests/15 min)
- Apply `apiLimiter` globally in `app.js` via `app.use('/api', apiLimiter)`
- Apply stricter `loginLimiter` to `POST /register` and `POST /login` in `auth.routes.js`

---

### 5. Role-Based Access Control (RBAC)

**Current state:** Every user has the role `"user"` but roles are never enforced on any endpoint.

**What to do:**
- Create a `src/middleware/authorize.js` middleware that accepts a list of allowed roles and checks `req.user.role` against them
- Create an `src/middleware/authenticate.js` middleware that verifies the JWT and loads `req.user` (currently this logic is duplicated inside each controller — extract it into a shared middleware)
- Apply both to protected routes: `authRouter.get('/admin/users', authenticate, authorize(['admin']), adminController.listUsers)`
- Add an admin-only endpoint to list/manage users

---

### 6. Refresh Token Rotation

**Current state:** The refresh token is reused until it expires (7 days). If stolen, it remains valid.

**What to do:**
- In `auth.controller.js` inside the `refreshToken` function, after issuing a new access token: also generate a new refresh token, update `session.refreshTokenHash` in the database, and set the new refresh token cookie
- This way, every `/refreshToken` call invalidates the old refresh token — any attempt to reuse a stolen token will fail

---

### 7. Helmet (HTTP Security Headers)

**What to do:**
- Install: `npm install helmet`
- In `app.js`, add `app.use(helmet())` before your routes
- This sets headers like `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` automatically

---

### 8. Structured Logging (Winston or Pino)

**Current state:** Logging is done with `console.log`.

**What to do:**
- Install: `npm install winston`
- Create `src/utils/logger.js` that exports a configured Winston logger
- Replace `console.log` / `console.error` throughout the codebase with `logger.info()` / `logger.error()`
- Add a request-logging middleware using `morgan` (`npm install morgan`) that pipes to Winston

---

## Notes & Caveats

- **Email/SMS is stubbed.** OTPs and password reset links are logged to the backend console — wire up a real provider before deploying.
- **Profile pictures** require a valid `IMAGEKIT_PRIVATE_KEY`; image uploads in `/update-profile` will fail without it.
- The frontend dev server proxies `/api` to `http://localhost:3000` — update `frontend/vite.config.js` if your backend runs on a different port.
- CORS in `backend/src/app.js` only allows `http://localhost:5173` and `http://localhost:4173` — add your production URL before deploying.
- The `package.json` name is currently `smart-parking-system` — rename it to match your project.

---

## License

ISC