# Talko - Real-time Chat Application

## Overview
Talko is a modern real-time chat application built with React, Express, PostgreSQL, and WebSockets. Users can sign up, log in, and chat with others in real-time in a beautiful Discord-inspired interface.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Wouter for routing
- TanStack Query for data fetching
- React Hook Form with Zod validation
- Tailwind CSS with shadcn/ui components
- WebSocket client for real-time messaging

### Backend
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- WebSocket server (ws package)
- bcrypt for password hashing
- JWT for authentication

## Architecture

### Database Schema
- **users**: id (serial), username (unique), password (hashed), createdAt
- **messages**: id (serial), senderId (FK to users), text, timestamp

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/messages` - Fetch all messages
- `POST /api/messages` - Send new message
- WebSocket `/ws` - Real-time message delivery and online status

### Features
1. **Authentication**: Sign up and login with JWT tokens
2. **Real-time Chat**: WebSocket-based instant messaging
3. **Online Status**: Live user presence indicators
4. **Message History**: Persistent message storage
5. **Dark/Light Mode**: Theme toggle support
6. **Responsive Design**: Mobile and desktop optimized

## Design System
Following Discord-inspired patterns with:
- Primary color: Blue (235 85% 65%)
- Dark mode as default theme
- Inter font family for UI
- Fira Code for timestamps
- Smooth animations and transitions
- Message bubbles with sender distinction
- Avatar gradients based on username

## Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/    # Reusable components (Avatar)
│   │   ├── pages/         # Route pages (auth, chat)
│   │   ├── lib/           # Auth context, API client
│   │   └── App.tsx        # Main app with routing
├── server/
│   ├── routes.ts          # API endpoints & WebSocket server
│   ├── storage.ts         # Database interface
│   └── db.ts              # Database connection
├── shared/
│   └── schema.ts          # Shared types and validation schemas
```

## Recent Changes
- **2025-10-23**: Complete MVP implementation
  - Defined users and messages tables with Drizzle ORM
  - Built authentication pages with beautiful card design
  - Created chat interface with message bubbles and online users sidebar
  - Implemented dark mode toggle
  - Added auth context for user session management
  - Implemented full authentication backend with bcrypt and JWT
  - Created WebSocket server for real-time messaging
  - Built all API endpoints (register, login, messages)
  - Pushed database schema to PostgreSQL
  - Connected frontend to backend with real-time updates

## User Preferences
- Clean, minimal, functional design
- Discord-inspired chat patterns
- Real-time features are essential
- PostgreSQL for data persistence
