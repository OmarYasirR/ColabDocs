<div align="center">

<img src="client/public/collabedit-wordmark-light.svg" alt="CollabEdit" width="320" />

# CollabDocs

**A real-time collaborative document editor built with the MERN stack.**

Write, comment, and share documents with your team — and watch changes appear live.

![Status](https://img.shields.io/badge/status-active-success)
![Stack](https://img.shields.io/badge/stack-MERN-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Real-Time Events](#real-time-events)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

CollabDocs (CollabEdit) is a full-stack web application that lets multiple users edit the same document at the same time. It combines a React front end with a Node.js/Express API, MongoDB persistence, Redis, and WebSockets to deliver low-latency collaboration, presence awareness, sharing controls, comments, and notifications.

## Features

- **Authentication** — Register, log in, and access protected routes with token-based auth.
- **Real-time editing** — Multiple users edit the same document simultaneously with conflict-free synchronization.
- **Live presence** — See who is online and where their cursors are (cursor overlay and collaboration panel).
- **Rich-text toolbar** — Formatting tools for headings, lists, and text styles.
- **Sharing & permissions** — Invite collaborators to a document through a share modal.
- **Comments** — Discuss content inline with a dedicated comment section.
- **Notifications** — In-app notification dropdown for invites and activity.
- **User profile** — Manage your account details from a profile page.
- **Dashboard** — Browse, create, and manage all of your documents.
- **Responsive UI** — Built with Tailwind CSS.

## Tech Stack

| Layer     | Technologies                                                    |
| --------- | --------------------------------------------------------------- |
| Frontend  | React, Vite, Redux Toolkit, Tailwind CSS, PostCSS, ESLint       |
| Backend   | Node.js, Express.js                                             |
| Database  | MongoDB (Mongoose models)                                       |
| Caching   | Redis                                                           |
| Real-time | Socket.IO, Yjs (CRDT sync provider), Operational Transformation service |
| Shared    | Common constants and utilities shared by client and server      |

## Architecture

```
┌──────────────┐    HTTP / REST     ┌──────────────────┐     ┌──────────┐
│              │ ─────────────────► │                  │ ──► │ MongoDB  │
│ React Client │                    │  Express Server  │     └──────────┘
│ (Vite+Redux) │ ◄───────────────── │                  │     ┌──────────┐
│              │    WebSockets      │   Socket.IO      │ ──► │  Redis   │
└──────────────┘  (live editing,    └──────────────────┘     └──────────┘
                   presence)
```

- **Controllers / Services / Models** separate request handling, business logic, and data access on the server.
- **Redux slices** manage auth, documents, collaboration, notifications, profile, sockets, and UI state on the client.
- **Socket handlers** broadcast document changes and presence events to collaborators in the same document room.

## Project Structure

```
CollabDocs
├── client
│   ├── public/                 # Static assets and brand icons
│   └── src
│       ├── components
│       │   ├── auth/           # LoginForm, RegisterForm, ProtectedRoute
│       │   ├── common/         # Button, Input, Modal, Spinner, Toast
│       │   ├── editor/         # DocumentEditor, Toolbar, ShareModal,
│       │   │                   # CommentSection, CursorOverlay, CollaborationPanel
│       │   └── layout/         # Header, Sidebar, EditorLayout, NotificationDropdown
│       ├── hooks/              # useAuth, useSocket, useCollaboration, useDocument, ...
│       ├── pages/              # Dashboard, DocumentEditor, Login, Register, ProfilePage
│       ├── redux/              # store.js and feature slices
│       ├── services/           # API clients, socketService, yjsProvider
│       └── utils/              # constants, helpers, validators
├── server
│   └── src
│       ├── config/             # database, redis, socket setup
│       ├── controllers/        # auth, document, notification, user
│       ├── middleware/         # auth, errorHandler, validation
│       ├── models/             # User, Document, Collaboration, Notification
│       ├── routes/             # REST route definitions
│       ├── services/           # collaboration, document, notification, OT
│       ├── sockets/            # collaboration and document socket handlers
│       ├── utils/              # constants, helpers, logger
│       ├── app.js              # Express app configuration
│       └── server.js           # HTTP + WebSocket server entry point
└── shared
    ├── constants/              # Constants used by client and server
    └── utils/                  # Shared helper functions
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [MongoDB](https://www.mongodb.com/) (local instance or Atlas)
- [Redis](https://redis.io/) (local instance or hosted)
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/CollabDocs.git
cd CollabDocs

# 2. Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### Configuration

Create the environment files described in [Environment Variables](#environment-variables).

### Run in development

```bash
# Terminal 1 — API and WebSocket server
cd server
npm run dev

# Terminal 2 — React client
cd client
npm run dev
```

The client runs on `http://localhost:5173` and the API on `http://localhost:5000` by default.

## Environment Variables

**`server/.env`**

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/collabdocs
REDIS_URL=redis://localhost:6379

JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> Never commit `.env` files. Add them to `.gitignore`.

## Available Scripts

| Location | Command           | Description                        |
| -------- | ----------------- | ---------------------------------- |
| client   | `npm run dev`     | Start the Vite dev server          |
| client   | `npm run build`   | Create a production build          |
| client   | `npm run preview` | Preview the production build       |
| client   | `npm run lint`    | Lint the code with ESLint          |
| server   | `npm run dev`     | Start the server with auto-reload  |
| server   | `npm start`       | Start the server in production     |

> Adjust script names to match your `package.json` files.

## API Overview

Base URL: `/api`

| Resource      | Route prefix       | Purpose                                  |
| ------------- | ------------------ | ---------------------------------------- |
| Auth          | `/api/auth`        | Register, login, session handling        |
| Users         | `/api/users`       | User lookup and account management       |
| Profile       | `/api/profile`     | Read and update the current user profile |
| Documents     | `/api/documents`   | CRUD, sharing, and collaborator access   |
| Notifications | `/api/notifications` | Fetch and mark notifications as read   |

> Confirm exact paths against the files in `server/src/routes`.

## Real-Time Events

Socket.IO handles live collaboration. Typical events include:

- **Join / leave document** — Enter or exit a document room.
- **Document update** — Broadcast edits to other collaborators.
- **Presence / cursor** — Share online status and cursor positions.
- **Notification** — Push invites and activity to users instantly.

See `server/src/sockets` and `client/src/services/socketService.js` for the exact event names.

## Roadmap

- [ ] Version history and document restore
- [ ] Export to PDF / Markdown
- [ ] Role-based permissions (viewer, commenter, editor)
- [ ] Offline editing with sync on reconnect
- [ ] Automated tests and CI pipeline
- [ ] Docker setup for one-command local development

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

This project is licensed under the [MIT License](LICENSE).
