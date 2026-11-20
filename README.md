# Coy Discover 💗

**A swipe-based profile discovery and mutual matching platform built with Next.js.**

Coy Discover is a full-stack web application where users can create profiles, discover people, express interest through swipe interactions, and connect through mutual matches.

The project focuses on combining a modern discovery experience with authentication, profile management, and persistent backend functionality.

## ✨ Features

### Authentication & Account Management
- Email and password registration.
- Email OTP verification.
- Google OAuth authentication.
- Secure password hashing with bcrypt.
- Session management using Auth.js.

### Profile Management
- Create and update personal profiles.
- Add profile photos, bios, age, city, and college.
- Select interests to personalize your profile.

### Discover & Swipe
- Browse profiles through a swipe-based interface.
- Like or pass on profiles.
- Smooth interactions and animations.
- Discoverable profile feed.

### Mutual Matching
- Detect mutual likes.
- Create matches when two users express interest in each other.
- View your matches in a dedicated section.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Authentication | Auth.js, Google OAuth |
| Database | SQLite |
| ORM | Prisma 6 |
| Validation | Zod |
| Email | Resend |
| Password Security | bcryptjs |

## 🏗️ Application Architecture

```text
Coy Discover
│
├── Frontend
│   ├── Discover Interface
│   ├── Swipe Interactions
│   ├── Login & Registration
│   ├── Email Verification
│   └── Profile Onboarding
│
├── API Layer
│   ├── Authentication
│   ├── Profile Management
│   ├── Discovery Feed
│   ├── Swipe Processing
│   └── Match Management
│
├── Authentication
│   ├── Credentials
│   └── Google OAuth
│
└── Database
    ├── User
    ├── Profile
    ├── Swipe
    ├── Match
    └── OTP Challenge
```

## 📁 Project Structure

```text
coy-discover/
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── feed/
│   │   │   ├── matches/
│   │   │   ├── profile/
│   │   │   └── swipe/
│   │   ├── login/
│   │   ├── onboarding/
│   │   ├── register/
│   │   ├── verify-email/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   ├── types/
│   │   └── next-auth.d.ts
│   │
│   └── auth.ts
│
├── .env
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22 or later
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/agam-pathak/coy-discover.git
cd coy-discover
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"

AUTH_SECRET="your-generated-auth-secret"

AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="your-verified-sender-email"
```

Generate an authentication secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Configure Google OAuth credentials in Google Cloud Console and add the appropriate callback URL:

```text
http://localhost:3000/api/auth/callback/google
```

Configure a valid sender address in Resend for email OTP delivery. Resend's testing mode may restrict recipients to the account owner's email until a domain is verified.

**Important:** Never commit your `.env` file or expose API keys and OAuth secrets.

### 4. Set up the database

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate the Prisma client if required:

```bash
npx prisma generate
```

### 5. Seed sample profiles

```bash
npm run db:seed
```

The seed script creates sample discoverable profiles and demo interaction data for local development.

### 6. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/feed` | Retrieve discoverable profiles |
| GET | `/api/matches` | Retrieve mutual matches |
| GET | `/api/profile` | Retrieve the current user's profile |
| POST | `/api/profile` | Create or update a profile |
| POST | `/api/swipe` | Like or pass on a profile |
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/verify-email` | Verify email using OTP |
| GET/POST | `/api/auth/[...nextauth]` | Auth.js authentication handlers |

## 🧪 Development Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed sample database records |
| `npm run db:studio` | Open Prisma Studio |

## 🔐 Security Considerations

- Passwords are hashed before storage.
- Registration and profile inputs are validated using Zod.
- Email verification uses time-limited OTP challenges.
- OTP attempts are limited.
- Protected API operations require authentication.
- Sensitive environment variables are kept outside source control.

Production deployment requires additional configuration, including a persistent managed database, production OAuth callback URLs, verified email sending, and appropriate rate limiting.

## 🗺️ Future Improvements

- Production-ready PostgreSQL database integration.
- Real-time match notifications.
- Advanced profile discovery and filtering.
- Improved feed pagination.
- Image upload and storage integration.
- Enhanced abuse prevention and API rate limiting.

## 👨‍💻 Developer

**Agam Pathak**

B.Tech Computer Science & Engineering

- GitHub: [@agam-pathak](https://github.com/agam-pathak)
- Project Repository: [coy-discover](https://github.com/agam-pathak/coy-discover)

---

*Built as a full-stack software engineering project, with a focus on authentication, database design, API development, and interactive user experiences.*
