# DevSpace — Team Collaboration Platform

> One place for dev teams to manage tasks, communicate, track decisions, and stay in sync — without switching between five different tools.

![Stack](https://img.shields.io/badge/Stack-MERN-green) ![Auth](https://img.shields.io/badge/Auth-JWT-orange) ![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-purple) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## What is DevSpace?

DevSpace is a full-stack SaaS collaboration platform built for developer teams. It solves a real problem: context is scattered across too many tools. A task lives in Trello, the discussion about it lives in Slack, the decision made about it lives in a Notion doc, and the standup update about it gets lost in a Slack thread.

DevSpace puts all of that in one place:

- **Kanban task management** — visual boards, task cards, priorities, due dates, file attachments
- **Task dependencies** — tasks can block each other; blocked tasks are locked until resolved
- **Team messaging** — workspace channels, direct messages, real-time with Socket.IO
- **PR link cards** — paste a GitHub PR URL on any task; DevSpace fetches its status automatically
- **Meeting notes** — rich text notes per project with @task mentions that link back to the board
- **Async daily standup** — structured check-ins linked to real tasks; blockers auto-flag the task on the board
- **Analytics** — MongoDB-powered burndown, velocity, contributor leaderboards, standup participation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router v6, Axios, Tailwind CSS |
| Backend | Node.js, Express.js, REST API |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (access + refresh tokens) in httpOnly cookies + bcrypt |
| Real-time | Socket.IO |
| Rich text | Tiptap (meeting notes editor) |
| Markdown | marked + highlight.js (code blocks in comments) |
| File storage | Cloudinary + Multer |
| Email | Nodemailer (Gmail SMTP) |
| Cron jobs | node-cron (weekly standup digest) |
| Security | Helmet, express-rate-limit, express-mongo-sanitize, xss-clean, hpp |

---

## Features

### Authentication and Security
- Signup and login with JWT access + refresh token pair
- Tokens stored in httpOnly cookies — XSS resistant
- bcrypt password hashing
- Rate-limited auth routes: 10 requests per 15 minutes per IP
- Input sanitization: NoSQL injection blocked, XSS cleaned, HTTP parameter pollution prevented
- Secure HTTP headers via Helmet.js
- Server startup env validator — exits on missing required vars

### Workspace and Project Management
- Create named workspaces — each is an isolated team environment
- Multiple projects inside a workspace
- Role-based access control: **Owner > Admin > Member**
  - Owner: full control including workspace deletion
  - Admin: manage members, invite users, create/delete projects and boards
  - Member: create and update tasks, comment, attend meetings, submit standups

### Email Invite System with Pre-assigned Roles
- Owner/Admin enters email + selects role before sending
- Signed JWT invite token: `{ workspaceId, email, role }` — role encoded in token, never sent by client
- Invite email sent via Nodemailer: workspace name, inviter, role badge, Accept button
- Token expires in 7 days
- On join: backend validates token, checks email match, sets role server-side

### Kanban Board System
- Boards: **Todo → In Progress → Review → Done**
- Task cards: title, description, due date, priority, assigned member, attachment count
- Real-time card sync via Socket.IO — moves visible to all team members instantly
- Per-board completion percentage

### Task Dependencies
The feature Trello is missing. Tasks can block and depend on other tasks.

- `blockedBy[]` and `blocking[]` arrays on the Task model
- Blocked tasks show a lock icon on the kanban card
- Blocked tasks cannot be moved to In Progress — a toast explains why
- When a blocking task is marked Done, dependent tasks auto-unblock
- Auto-unblock emits `task:unblocked` via Socket.IO — all team members see it live
- Circular dependency detection — cannot add A blocks B if B already blocks A
- TaskDetailModal: Dependencies section with add/remove chips and a searchable task dropdown

### Task Detail
Tabbed modal: **Details / Dependencies / PR Links / Attachments / Meetings / Comments**

- Assignee dropdown (workspace members only)
- Status stepper with visual progress
- Priority badge (low / medium / high / urgent)
- Due date with overdue indicator
- Blocker flags section — raised from standup, resolvable by Admin or flag author
- Full comment thread with markdown and syntax-highlighted code blocks

### Comments with Code Blocks
- All task comments support markdown
- Fenced code blocks (` ``` python `) rendered with syntax highlighting via highlight.js
- Language badge shown on each block
- Copy button top-right of every code block
- CommentInput has Write / Preview tabs with a minimal toolbar

### PR Link Card (no OAuth required)
- Paste any public GitHub PR URL into a task
- DevSpace calls the GitHub public API to fetch: title, status (open/merged/closed), author
- Displayed as a card: PR title, status badge, author avatar, Open on GitHub link
- Background cron job refreshes non-merged PRs every 30 minutes
- Private repos return a clear "not found or private" error state

### File Attachments
- Drag-and-drop upload on any task (images and PDFs, max 10MB)
- Stored on Cloudinary with per-workspace folder structure
- Image thumbnails inline, click to open full size
- PDF download link
- Delete by uploader or Admin/Owner

### Team Chat — Channels and Direct Messages
- Workspace channels (public/private)
- Direct messages between any two workspace members
- Typing indicators: "X is typing..." via Socket.IO with 2-second debounce
- Online presence: green dot next to active members
- Real-time message delivery with no refresh

### Meeting Notes
The decision layer that chat and tasks both lack.

- Create meeting notes scoped to a workspace or project
- Rich text editor powered by Tiptap: bold, italic, headings, lists
- **@task mentions**: type `@` to search and insert any workspace task as a linked chip
- Chips are colored by task status: blue (todo), amber (in progress), green (done)
- Auto-save: 3-second debounce after last keystroke
- Linked tasks panel: right sidebar shows all @mentioned tasks as cards
- TaskDetailModal "Meetings" tab: shows every meeting where the task was mentioned
- This closes the loop — from any task you can trace back every meeting where it was discussed

### Async Daily Standup
The feature Slack standups fail at — structured, linked to real tasks, and actionable.

Each member answers three questions per day:
1. What did you work on yesterday? (task picker — multi-select from assigned tasks)
2. What are you working on today? (same task picker)
3. Any blockers? (yes/no toggle — if yes: describe it and select the blocked tasks)

**Blocker auto-flagging**: when a member reports a blocker and selects tasks, those tasks get a flag added automatically. The flag appears as a red icon on the kanban card, visible to the whole team. Flags can be resolved by the Admin or the person who raised them.

**Standup feed on dashboard**: two tabs — Submitted and Missing. Submitted shows each member's entry with task chips and blocker badges. Missing shows who hasn't checked in with an optional email reminder (Admin only).

**Weekly digest email**: every Monday (configurable), Owners and Admins receive an email summary: participation rate per member, all blockers raised that week, blockers resolved. Powered by node-cron + Nodemailer.

**Standup history**: calendar heatmap per member — green for submitted, red for missed, amber for submitted with blocker. Click any day to expand that entry.

**Standup settings** (Admin only): enable/disable, set reminder time and timezone, customize questions (up to 5), toggle weekly digest.

### Activity Log
Every state-changing action writes to `ActivityLog`: task created, assigned, status changed, dependency added, unblocked, PR linked, meeting created, standup submitted, blocker flagged, blocker resolved. Shown as a live feed on the dashboard.

### Dashboard
- Task summary stat cards: Todo / In Progress / Review / Done
- Blocked tasks count
- Today's standup feed (Submitted / Missing tabs)
- Recent activity feed (last 10 workspace events)
- Member roster with role badges and online presence

### Global Search
- `Cmd+K` / `Ctrl+K` opens the search bar anywhere in the app
- 300ms debounce → parallel search across Tasks, Messages, and Members
- MongoDB text indexes on Task (title + description), Message (content), User (name + email)
- Results grouped by category, matched keywords highlighted
- Click result → navigate directly to task / channel / member

### Analytics (Admin and Owner only)
All computation via MongoDB aggregation pipelines — no JavaScript-side math.

- Tasks by status (todo / in progress / review / done)
- Completed tasks over time (line chart, 7d / 30d / 90d range)
- Velocity per member (bar chart: tasks completed + average days to complete)
- Burndown chart: remaining tasks per day
- Top contributors leaderboard (score = tasks done ×3 + comments ×1)
- Overdue tasks list with assignee and days overdue
- Blocked tasks list
- Standup participation rate (members who submitted at least once in range / total)

---

## Database Models

| Model | Key Fields |
|---|---|
| `User` | name, email, passwordHash |
| `Workspace` | name, members `[{ userId, role, joinedAt }]` |
| `Project` | name, workspaceId |
| `Board` | name, projectId, listType (todo / inprogress / review / done) |
| `Task` | title, description, boardId, assignedTo, status, priority, dueDate, attachments[], prLinks[], blockedBy[], blocking[], isBlocked, flags[] |
| `Comment` | taskId, userId, content (markdown) |
| `Channel` | name, workspaceId, isPrivate, members[] |
| `Message` | channelId, senderId, content, type (text / file) |
| `DirectMessage` | participants[2], messages[] |
| `Meeting` | workspaceId, projectId, title, date, attendees[], contentJson, linkedTasks[] |
| `StandupConfig` | workspaceId, isEnabled, reminderTime, timezone, questions[] |
| `StandupEntry` | workspaceId, userId, date, answers[], hasBlocker, blockerTasks[], blockerText |
| `ActivityLog` | workspaceId, userId, action, entityType, entityId, meta |
| `Notification` | userId, type, message, read, link |

---

## API Routes

```
/api/auth               POST /register, /login, /logout, /refresh
/api/workspaces         CRUD + /invite + /join/:token + /dashboard + /analytics
/api/projects           CRUD (scoped to workspace)
/api/boards             CRUD (scoped to project)
/api/tasks              CRUD + /assign + /status + /attachments + /dependencies + /pr-links + /flags
/api/channels           CRUD + /:id/messages
/api/dm                 GET + POST /:userId
/api/meetings           CRUD + /task/:taskId
/api/standup/config     GET + PATCH /:workspaceId
/api/standup/entries    POST + GET + GET /me + GET /history
/api/search             GET ?q=&workspaceId=&type=
/api/notifications      GET + PATCH /:id/read
```

---

## Real-time Socket.IO Events

| Event | Payload | Scope |
|---|---|---|
| `task:statusChanged` | `{ taskId, status, updatedBy }` | workspace room |
| `task:assigned` | `{ taskId, assignedTo }` | workspace room |
| `task:dependencyAdded` | `{ taskId, blockedBy }` | workspace room |
| `task:dependencyRemoved` | `{ taskId, depId }` | workspace room |
| `task:unblocked` | `{ taskId }` | workspace room |
| `task:blockerFlagged` | `{ taskId, flag }` | workspace room |
| `task:flagResolved` | `{ taskId, flagId }` | workspace room |
| `channel:newMessage` | `{ channelId, message }` | workspace room |
| `user:typing` | `{ channelId, userId, isTyping }` | workspace room |
| `user:online` | `{ userId, workspaceId }` | workspace room |
| `user:offline` | `{ userId, workspaceId }` | workspace room |
| `standup:newEntry` | `{ userId, date, hasBlocker }` | workspace room |
| `dm:newMessage` | `{ conversationId, message }` | recipient socket only |

---

## Development Phases

### Phase 1 — Make it Work
JWT auth · Workspace + Project CRUD · Kanban boards · Task CRUD · Comments · Activity log

### Phase 2 — Make it Smart
Email invite with pre-assigned roles · RBAC (Owner/Admin/Member) · Channels + DMs · Task assignment + status stepper · Dashboard · Notifications

### Phase 3 — Make it Useful
Security hardening (Helmet, rate limiting, sanitization) · Task dependencies with auto-unblock · PR link cards (GitHub public API, no OAuth) · Markdown + code blocks in comments · File uploads via Cloudinary · Socket.IO real-time across tasks, channels, DMs · Global search · Analytics with MongoDB aggregation · Production polish (error boundary, skeleton loaders, toast notifications)

### Phase 4 — Make it Unique
Meeting notes with Tiptap rich text + @task mentions · Task-to-meeting backlinks · Async daily standup with task picker · Blocker auto-flagging from standup → kanban card flags · Standup feed on dashboard · Weekly digest email via node-cron + Nodemailer · Standup history heatmap · Standup participation in analytics

---

## Frontend Pages and Components

| Page / Component | Route |
|---|---|
| Login | `/login` |
| Register | `/register` |
| Accept Invite | `/join/:token` |
| Dashboard | `/workspace/:id` |
| Kanban Board | `/workspace/:id/project/:pid/board` |
| Channel Chat | `/workspace/:id/channel/:cid` |
| Direct Messages | `/workspace/:id/dm/:uid` |
| Meeting Notes | `/workspace/:id/meetings/:meetingId` |
| Meeting List | `/workspace/:id/meetings` |
| Analytics | `/workspace/:id/analytics` |
| Workspace Settings | `/workspace/:id/settings` |

---

## Project Structure

```
devspace/
├── client/
│   └── src/
│       ├── components/
│       │   ├── kanban/        KanbanBoard, TaskCard, TaskDetailModal
│       │   ├── chat/          ChannelView, DMView, MessageInput
│       │   ├── meetings/      MeetingPage, MeetingList, TiptapEditor
│       │   ├── standup/       StandupModal, StandupFeed, StandupHistory, StandupSettings
│       │   ├── layout/        AppShell, Sidebar, SearchBar, TopNav
│       │   └── common/        ErrorBoundary, Skeletons, PRLinkCard, AttachmentUploader
│       ├── pages/
│       ├── context/           WorkspaceContext, SocketContext, AuthContext
│       ├── hooks/             useSocket, useWorkspace, useAuth
│       └── api/               Axios instance + all API calls
│
└── server/
    ├── models/
    ├── controllers/
    ├── routes/
    ├── middleware/            auth, roles, rateLimiter, upload, envValidator
    └── jobs/                  standupDigest.js (node-cron)
```

---

## Environment Variables

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
INVITE_SECRET=your_invite_secret

EMAIL_USER=yourname@gmail.com
EMAIL_PASS=your_gmail_app_password

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Getting Started

```bash
git clone https://github.com/yourusername/devspace.git
cd devspace

# Backend
cd server
npm install
cp .env.example .env
npm run dev

# Frontend
cd ../client
npm install
npm run dev
```

Backend: `http://localhost:5000`
Frontend: `http://localhost:5173`

---

## What Makes DevSpace Different

Most portfolio projects are either a todo app with auth or a basic chat app. DevSpace solves a real product problem — context loss — by connecting the three layers every dev team uses but keeps separate:

- A task has a comment thread (with code blocks), file attachments, a PR status card, dependency relationships, blocker flags, and a list of every meeting where it was discussed — all in one place
- Meeting notes @mention tasks directly — decisions are permanently linked to the work they affect
- Standup check-ins are structured and linked to real tasks — blockers automatically surface on the kanban board instead of getting buried in a Slack thread
- The weekly digest email means managers and leads get a summary without having to chase people

---

## License

MIT
