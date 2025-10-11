# Quick Setup Guide

## Current Status ✅

Your Cowrywise FC Sunday League Manager PWA is now running at **http://localhost:3000**

### Working Pages:
- ✅ Home page - `/`
- ✅ Sign In - `/auth/signin`
- ✅ Register - `/auth/register`
- ✅ League Table - `/league`
- ✅ Admin Dashboard - `/admin` (requires admin role)

### Working API Routes:
- ✅ Authentication (`/api/auth/*`)
- ✅ User Registration (`/api/auth/register`)
- ✅ Seasons (`/api/seasons`)
- ✅ Groups (`/api/groups`)
- ✅ Matches (`/api/matches/*`)
- ✅ Goals & Cards tracking
- ✅ League calculations

## Next Steps

### 1. Create Your First Admin User

Since the app is running, register a new user:

1. Go to http://localhost:3000/auth/register
2. Fill in the registration form
3. After registration, open Prisma Studio:
   ```bash
   npx prisma studio
   ```
4. Navigate to the `User` model
5. Find your user and change `role` from `MEMBER` to `ADMIN`
6. Sign in at http://localhost:3000/auth/signin

### 2. Set Up Initial Data

Once logged in as admin, you can:

1. **Create a Season**:
   - Use the API or create an admin UI page
   - POST to `/api/seasons` with:
     ```json
     {
       "name": "2025 Season",
       "startDate": "2025-01-01T00:00:00Z"
     }
     ```

2. **Create Groups/Teams**:
   - POST to `/api/groups` with:
     ```json
     {
       "name": "Team A",
       "seasonId": "your-season-id"
     }
     ```

3. **Schedule Matches**:
   - POST to `/api/matches`

### 3. Database Location

Your SQLite database is at:
```
/Users/uchennadavidobi/Documents/workspaces/personal/sunday-league/cowrywise-fc/prisma/dev.db
```

## Development Commands

```bash
# Start dev server (already running)
npm run dev

# View database
npx prisma studio

# Create migration
npx prisma migrate dev

# Build for production
npm run build

# Run with Docker
docker-compose up --build
```

## Testing the API

You can test the API using curl or any API client:

### Register a User:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a Season (requires authentication):
```bash
curl -X POST http://localhost:3000/api/seasons \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "2025 Season",
    "startDate": "2025-01-01T00:00:00Z"
  }'
```

## Known Issues to Fix

1. ⚠️ Missing PWA icons (`/icon-192x192.png`, `/icon-512x512.png`) - Need to add these
2. ⚠️ Admin sub-pages (seasons, groups, matches management) - Need to be built
3. ⚠️ Profile page - Not yet created
4. ⚠️ Match detail pages - Not yet created

## Features Ready to Use

✅ User registration and authentication
✅ Role-based access control
✅ Season management (API)
✅ Group/Team management (API)
✅ Match recording (API)
✅ Goals and cards tracking (API)
✅ Automatic league table calculations
✅ Top scorers statistics
✅ Mobile-first responsive design
✅ Docker support

## Architecture

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Separate CSS files (as requested)
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Auth**: NextAuth.js with JWT sessions
- **PWA**: next-pwa with manifest

## File Structure

```
app/
├── api/              # API endpoints
├── auth/             # Authentication pages
├── league/           # League table page
├── admin/            # Admin dashboard
├── page.tsx          # Home page
├── layout.tsx        # Root layout
└── globals.css       # Global styles

lib/
├── prisma.ts         # Database client
├── auth.ts           # Auth config
└── league-utils.ts   # League calculations

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

## Contact

For questions or issues, check the main README.md file.
