# Pandora Dashboard

Internal operations dashboard for **SciGlob Instruments & Services, LLC** — replacing Trello-based instrument lifecycle tracking with a custom, production-grade web application.

Manages Pandora spectrometer instrument production, repair, calibration, and deployment across SciGlob and NASA GSFC workspaces.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — set a strong JWT_SECRET for production

# 3. Initialize database and seed data
npx prisma migrate dev --name init
npm run db:seed

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:

| Field    | Value              |
|----------|--------------------|
| Username | `omar.abuhassan`   |
| Password | `Omar@123`         |
| Role     | `admin`            |

## Architecture

```
pandora-dashboard/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed/seed.ts           # Seed script with Trello data
│   └── migrations/            # SQLite migrations
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/          # Login, logout, session
│   │   │   ├── cards/         # Card CRUD + custom fields
│   │   │   ├── comments/      # Comment creation
│   │   │   ├── notes/         # Note CRUD
│   │   │   └── admin/users/   # Admin user management
│   │   ├── login/             # Login page
│   │   ├── dashboard/         # Workspace selector
│   │   ├── workspace/[slug]/  # Workspace + board views
│   │   └── admin/users/       # Admin user management UI
│   ├── components/
│   │   ├── layout/            # AppHeader, navigation
│   │   └── board/             # BoardView, BoardColumn, CardDetailDrawer
│   ├── config/
│   │   ├── users.ts           # Config-based user credentials
│   │   └── app.ts             # App configuration
│   └── lib/
│       ├── auth.ts            # JWT session management
│       ├── db.ts              # Prisma client singleton
│       └── utils.ts           # Utility functions
└── .env.example               # Environment template
```

## Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | Next.js 16 (App Router) + TypeScript |
| Styling        | Tailwind CSS 4                    |
| Icons          | Lucide React                      |
| Database       | SQLite (via Prisma ORM)           |
| Authentication | JWT (jose) + bcrypt password hashing |
| Validation     | Zod (ready for form schemas)      |

## Features

### Authentication
- JWT-based session with httpOnly cookies
- bcrypt password hashing (cost factor 12)
- Role-based access: `admin`, `editor`, `viewer`
- "Request Access" button directs users to contact admin email
- Proxy-based route protection (Next.js 16 convention)

### Workspaces
- **SciGlob's** — instrument production and repair tracking
- **NASA GSFC** — calibration pipeline and clearance tracking

### Board View (Trello-style)
- Kanban-style columns matching the original Trello board
- Card display with labels, custom fields preview, comment/note counts
- Global search across card titles and descriptions
- Label-based filtering
- Click-to-open card detail drawer

### Card Details
- Full description with inline editing
- 13 custom fields (Model, Spectrometer Type, Fiber Type, etc.)
- Threaded comments with author attribution and timestamps
- Internal notes with titles
- Activity log tracking all changes
- Role-based edit permissions

### Admin
- User management page with creation form
- User listing with role, workspace access, and status
- Config-driven credential system for code-based user additions

## Data Model

Key entities:

- **User** — credentials, role, workspace access
- **Workspace** — top-level grouping (SciGlob, NASA GSFC)
- **Board** — kanban board within a workspace
- **BoardList** — column/list within a board
- **Card** — individual instrument or task
- **Label** — color-coded tags (Repair, Clearing, New Build, etc.)
- **CustomFieldDefinition** — field schema (13 Pandora-specific fields)
- **CardCustomField** — field values per card
- **Comment** — threaded discussion with author
- **Note** — internal notes per card
- **Activity** — audit log of all changes

## Adding Users

### Option 1: Admin UI
Log in as admin, navigate to `/admin/users`, and use the creation form.

### Option 2: Config File
Edit `src/config/users.ts`:

```typescript
export const SEED_USERS: SeedUser[] = [
  {
    username: "new.user",
    fullName: "New User",
    email: "new.user@sciglob.com",
    password: "SecurePassword@123",  // Hashed during seed
    role: "editor",
    active: true,
    workspaceAccess: ["sciglob", "nasa-gsfc"],
  },
  // ... existing users
];
```

Then run:
```bash
npm run db:seed
```

### Option 3: API
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: pandora-session=<admin-token>" \
  -d '{"username":"new.user","fullName":"New User","email":"new@test.com","password":"Pass@123","role":"editor"}'
```

## Adding Workspaces / Boards / Cards

Edit `prisma/seed/seed.ts` to add new workspaces, boards, lists, cards, or custom field values. The seed script is structured with clearly labeled sections for each entity type.

## Replacing Seeded Data

The seed data was reconstructed from Trello screenshots and the PIC Scope HTML file. To replace with real data:

1. **Trello API Import**: Export Trello board as JSON, write an importer script in `prisma/seed/`
2. **CSV Import**: Create a CSV mapping script that reads instrument data
3. **JSON Import**: Direct JSON file import into the seed structure
4. **Database Admin**: Use Prisma Studio (`npm run db:studio`) for manual edits

## Scripts

| Command          | Description                              |
|------------------|------------------------------------------|
| `npm run dev`    | Start development server                 |
| `npm run build`  | Production build                         |
| `npm run start`  | Start production server                  |
| `npm run lint`   | Run ESLint                               |
| `npm run db:migrate` | Run Prisma migrations                |
| `npm run db:seed`    | Seed database with demo data         |
| `npm run db:reset`   | Reset database and re-seed           |
| `npm run db:studio`  | Open Prisma Studio (database GUI)    |

## Assumptions from Screenshots

The following data was inferred from Trello board screenshots:

1. **Board columns**: TO DO - New Production, ON ROOF, Lab, Lab Range, ORDER REQUESTS/INV, Cal/Clear at GSFC, SHIPPED FROM SCIGLOB, GSFC SHIPPED, SCIGLOB REPAIRS
2. **Custom fields**: 13 fields exactly matching the Trello custom fields panel screenshot
3. **Card details for 315s1, 93s1, 85s1**: Full comments and custom field values transcribed from card detail screenshots
4. **Team members**: Omar Abuhassan, William Lo, Brett Padfield, Chris Rader, Jonathan Gallegos, Matthew Nance
5. **NASA GSFC board**: Inferred from instrument log data in the HTML file (45 instruments across repair/new build categories)

### Areas for Manual Verification

- Card titles in Lab, Lab Range columns (some text was partially visible in screenshots)
- Custom field values for cards without detail screenshots
- Exact card ordering within each column
- Complete comment history for cards not shown in screenshots

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT sessions with 24-hour expiry
- httpOnly, sameSite cookies
- Role-based API route protection
- Input validation on all endpoints
- No plain text passwords in production code
- Proxy-based route protection before page rendering

## Production Deployment

1. Switch to PostgreSQL: Change `provider` in `prisma/schema.prisma` and update `DATABASE_URL`
2. Set a strong `JWT_SECRET` (32+ random characters)
3. Run `npx prisma migrate deploy` for production migrations
4. Run `npm run db:seed` for initial data
5. Set `NODE_ENV=production`
