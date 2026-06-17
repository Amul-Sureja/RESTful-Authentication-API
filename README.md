# RESTful Authentication API

A secure, production-ready authentication REST API built with Node.js, Express, and MongoDB. Features JWT-based authentication, multi-device session management, bcrypt password hashing, and email-based password reset.

---

## Features

- User registration with input validation
- Secure login with JWT access tokens
- bcrypt password hashing
- Multi-device session management
- Logout from current device
- Logout from all devices
- Email-based password reset with expiring tokens
- Protected routes via middleware
- Profile fetch and update

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcrypt |
| Email Service | Nodemailer |
| Environment Config | dotenv |

---

## Project Structure

```
├── config/
│   └── config.js               # Environment variables
├── controllers/
│   └── auth.controller.js      # Auth logic (register, login, reset, etc.)
├── middleware/
│   └── auth.middleware.js      # JWT verification middleware
├── models/
│   ├── user.model.js           # User schema
│   └── session.model.js        # Session schema
├── routes/
│   └── auth.routes.js          # API route definitions
├── utils/
│   └── sendEmail.js            # Email utility
├── .env.example                # Environment variable template
├── server.js                   # Entry point
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- SMTP credentials (Gmail or any mail provider)

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/restful-auth-api.git
cd restful-auth-api
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file

```bash
cp .env.example .env
```

4. Fill in your environment variables (see below)

5. Start the server

```bash
# Development
npm run dev

# Production
npm start
```

---

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/auth-api
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com

CLIENT_URL=http://localhost:3000
```

---

## API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Register a new user | No |
| POST | `/login` | Login and get access token | No |
| POST | `/logout` | Logout current device | Yes |
| POST | `/logout-all` | Logout all devices | Yes |
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| POST | `/forgot-password` | Send password reset email | No |
| POST | `/reset-password/:token` | Reset password with token | No |

---

## API Usage

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "StrongPass@123"
}
```

**Response**
```json
{
  "message": "User registered successfully"
}
```

---

### Login

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
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
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
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "user",
    "isVerified": true
  }
}
```

---

### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response**
```json
{
  "message": "Password reset link sent to your email"
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

### Logout All Devices

```http
POST /api/auth/logout-all
Authorization: Bearer <accessToken>
```

**Response**
```json
{
  "message": "Logged out from all devices successfully"
}
```

---

## How Session Management Works

Each login creates a new session document in MongoDB with a unique session ID embedded inside the JWT. On every protected request, the middleware:

1. Verifies the JWT signature
2. Looks up the session ID in the database
3. Rejects the request if the session is revoked

This means:
- `logout` — revokes only the current session
- `logout-all` — revokes all sessions for that user
- After password reset — all existing sessions are revoked automatically

---

## Security Highlights

- Passwords hashed with **bcrypt** (salt rounds: 10)
- Password reset tokens hashed with **SHA-256** before storing in DB
- Reset tokens expire after **15 minutes**
- JWT contains `sessionId` for per-device revocation
- Protected routes validated via middleware on every request

---

## Error Responses

All errors follow a consistent format:

```json
{
  "message": "Error description here"
}
```

| Status Code | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid token |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already exists) |
| 500 | Internal server error |
