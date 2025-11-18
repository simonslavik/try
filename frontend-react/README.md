# React Frontend

A modern React frontend for the collaborative code editor microservices platform.

## Features

- 🔐 **Authentication**: Login/Register with JWT tokens
- 📊 **Dashboard**: Create and join coding rooms
- 💻 **Collaborative Editor**: Real-time code editing with Monaco Editor
- 👥 **User Presence**: See who's online and their cursor positions
- 🎨 **Modern UI**: Tailwind CSS with dark theme

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **React Router** for navigation
- **Zustand** for state management
- **Monaco Editor** for code editing
- **Axios** for HTTP requests
- **WebSocket** for real-time collaboration
- **Tailwind CSS** for styling

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

### Docker Development

```bash
# Build and run
docker-compose up -d frontend-react

# View logs
docker-compose logs -f frontend-react
```

## Environment Variables

Create `.env` file for local development:

```env
VITE_GATEWAY_URL=http://localhost:3000
VITE_EDITOR_WS_URL=ws://localhost:4000
VITE_EDITOR_API_URL=http://localhost:4000
```

For Docker, `.env.production` is used automatically.

## Project Structure

```
src/
├── pages/
│   ├── Login.tsx           # Login page
│   ├── Register.tsx        # Registration page
│   ├── Dashboard.tsx       # Main dashboard
│   └── CollabEditor.tsx    # Collaborative editor
├── services/
│   ├── apiClient.ts        # Axios instance with auth
│   ├── authService.ts      # Authentication API
│   └── editorService.ts    # Editor WebSocket + API
├── store/
│   └── authStore.ts        # Zustand auth state
├── App.tsx                 # Main app with routing
└── main.tsx                # Entry point
```

## API Integration

### Authentication

Connects to `user-service` via gateway:

- `POST /users/register` - Create account
- `POST /users/login` - Login
- `GET /users/profile` - Get user info

### Collaborative Editor

Connects directly to `collab-editor`:

- `POST /rooms` - Create room
- `GET /rooms/:id` - Get room info
- `ws://` - WebSocket for real-time collaboration

## Features

### Dashboard

- Create new coding rooms
- Join existing rooms by ID
- Select programming language
- Copy room ID to clipboard

### Collaborative Editor

- Real-time code synchronization
- Monaco Editor with syntax highlighting
- See connected users
- View cursor positions
- Auto-save to database

## Build for Production

```bash
# Build static files
npm run build

# Preview production build
npm run preview
```

The build output will be in `dist/` directory.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
