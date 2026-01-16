# E-Commerce Microservices

Microservices architecture with API Gateway, JWT authentication, and PostgreSQL.

## 🚀 Quick Start for Team Members

### Prerequisites

- Docker & Docker Compose
- Git

### Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/simonslavik/try.git
cd try
```

2. **Copy environment variables**

```bash
# Backend (user-service)
cp user-service/.env.example user-service/.env

# Frontend (react-project)
cp react-project/.env.example react-project/.env
```

3. **Configure Google OAuth (Required)**

Follow the [Google OAuth Setup Guide](GOOGLE_OAUTH_SETUP.md) to:

- Create Google OAuth credentials
- Add your Client ID and Secret to the `.env` files

4. **Validate your configuration**

```bash
./check-env.sh
```

This will verify all environment variables are set correctly before starting.

5. **Start all services**

Option A - Automated (validates environment first):

```bash
./start.sh
```

Option B - Manual:

```bash
docker-compose up --build
```

6. **Verify services are running**

```bash
docker-compose ps
```

You should see:

- `postgres-db` (PostgreSQL)
- `redis-cache` (Redis)
- `user-service` (Port 3001)
- `collab-editor` (Port 4000)
- `api-gateway` (Port 3000)
- `react-project` (Port 5173 - if running)

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "CUSTOMER"
  }'

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Create a collaborative editor room
curl -X POST http://localhost:3000/v1/editor/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Coding Room",
    "language": "javascript"
  }'

# Get room info (replace {roomId} with actual ID)
curl http://localhost:3000/v1/editor/rooms/{roomId}
```

### Access the Frontend

1. **Navigate to the react-project directory**

```bash
cd react-project
npm install
npm run dev
```

2. **Open browser** at `http://localhost:5173`

3. **Register/Login** and navigate to the Collaborative Editor from the home page

4. **Share the Room ID** with teammates to code together!

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│   API Gateway   │◄────►│    Redis     │
│   (Port 3000)   │      │  (Cache)     │
└────┬───────┬────┘      └──────────────┘
     │       │
     │       └──────────────┐
     ▼                      ▼
┌─────────────────┐   ┌─────────────────┐      ┌──────────────┐
│  User Service   │   │ Collab Editor   │◄────►│  PostgreSQL  │
│   (Port 3001)   │   │   (Port 4000)   │      │  (Database)  │
└─────────────────┘   └─────────────────┘      └──────────────┘
         │                     │
         └─────────┬───────────┘
                   ▼
              PostgreSQL
```

## 📦 Services

- Proxies to User Service & Collab Editor

### User Service (Port 3001)

- User registration & authentication
- JWT token management
- Profile management
- Prisma ORM + PostgreSQL

### Collaborative Editor (Port 4000)

- Real-time collaborative code editing
- WebSocket-based communication
- Room management
- Multi-user presence tracking
- Code persistence with PostgreSQL
- See [collab-editor/README.md](./collab-editor/README.md) for details

### Frontend (React + Vite)

- User authentication UI
- Collaborative editor interface
- Protected routes
- Real-time updates

### Infrastructure

- **PostgreSQL 15**: User data & collaborative sessions
- Profile management
- Prisma ORM + PostgreSQL

### Infrastructure

- **PostgreSQL 15**: User data storage
- **Redis**: Rate limiting & caching

## 🔐 Authentication Flow

1. User registers → Gets JWT access token (15min) + refresh token
2. User makes requests → Gateway verifies JWT
3. Gateway forwards request → Service verifies JWT again (defense-in-depth)
4. Token expires → Use refresh token to get new access token

## 📝 Development

### View logs

```bash
docker-compose logs -f gateway
docker-compose logs -f user-service
```

### Restart a service

```bash
docker-compose restart gateway
```

### Stop all services

```bash
docker-compose down
```

### Reset database (removes all data!)

```bash
docker-compose down -v
docker-compose up -d
```

### Run Prisma migrations

```bash
docker exec -it user-service npx prisma migrate dev
```

## 🔧 Tech Stack

- **Node.js 20** + TypeScript
- **Express** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL 15** - Database
- **Redis** - Caching
- **JWT** - Authentication
- **Docker** - Containerization

## 📚 Documentation

- [Authentication Flow](./AUTH_FLOW.md)
- [Security Guidelines](./SECURITY.md)

## ⚠️ Important Notes

- **Never commit `.env` files!** They contain secrets.
- `.env.example` is committed to show required variables.
- Each developer should have their own `.env` file.
- Generate different secrets for development and production.

## 🤝 Team Workflow

1. Pull latest changes: `git pull`
2. Check if `.env.example` changed: Update your `.env` accordingly
3. Rebuild if Dockerfile changed: `docker-compose up -d --build`
4. Run migrations if schema changed: `docker exec -it user-service npx prisma migrate dev`
