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
cp .env.example .env
```

3. **Generate a strong JWT secret**
```bash
openssl rand -base64 32
```

4. **Edit `.env` and add your generated JWT secret**
```env
JWT_SECRET=<paste-your-generated-secret-here>
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres  # Change in production!
POSTGRES_DB=microservices
```

5. **Start all services**
```bash
docker-compose up -d
```

6. **Verify services are running**
```bash
docker-compose ps
```

You should see:
- `postgres-db` (PostgreSQL)
- `redis-cache` (Redis)
- `user-service` (Port 3001)
- `api-gateway` (Port 3000)

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
```

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│   API Gateway   │◄────►│    Redis     │
│   (Port 3000)   │      │  (Cache)     │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  User Service   │◄────►│  PostgreSQL  │
│   (Port 3001)   │      │  (Database)  │
└─────────────────┘      └──────────────┘
```

## 📦 Services

### API Gateway (Port 3000)
- Routes requests to microservices
- JWT authentication
- Rate limiting (Redis)
- Request logging

### User Service (Port 3001)
- User registration & authentication
- JWT token management
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
