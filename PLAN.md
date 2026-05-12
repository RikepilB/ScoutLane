# Auth Finalization Plan

## Current State

| Component | Status |
|---|---|
| Auth config (`src/lib/auth/auth.config.ts`) | ✅ Done — NextAuth v5, Google, Prisma adapter, DB sessions |
| API route (`src/app/api/auth/[...nextauth]/route.ts`) | ✅ Done |
| Middleware (`src/middleware.ts`) | ✅ Done — protects admin routes |
| Prisma schema (`User`, `Account`, `Session`, `VerificationToken`) | ✅ Done |
| `AUTH_SECRET` in `.env` | ❌ Placeholder |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env` | ❌ Empty |
| `SessionProvider` for client components | ❌ Not added |
| Sign-in UI on home page | ❌ Not added |

## Steps

### 1. Generate real `AUTH_SECRET`

```bash
openssl rand -base64 32
```

Replace placeholder in `.env`.

### 2. Set up Google OAuth

- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Create OAuth 2.0 Client ID (Web application)
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Fill `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env`

### 3. Add `SessionProvider` for client components

Create `src/components/providers/auth-provider.tsx` wrapping `SessionProvider` from `next-auth/react`.

Add to `src/app/layout.tsx` inside `<body>`.

Required if any admin dashboard client components need `useSession()`.

### 4. Add sign-in button to home page

Place `<SignInButton>` on the home page so the user can log in immediately after setup.

### 5. Test

```bash
pnpm dev
```

- Sign in with Google
- Verify session persists
- Verify middleware redirects unauthenticated users from `/admin/*`
- Verify `/careers/*` is accessible without auth
