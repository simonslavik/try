# 🚀 Quick Start Guide - CodeCollab

## Start All Services (Development)

### Option 1: Individual Terminals (Recommended for Development)

```bash
# Terminal 1 - Start Databases
docker-compose up -d

# Terminal 2 - Gateway
cd gateway && npm run dev

# Terminal 3 - Collaborative Editor
cd collab-editor && npm run dev

# Terminal 4 - User Service
cd user-service && npm run dev

# Terminal 5 - Frontend
cd react-project && npm run dev
```

Access: http://localhost:5173

---

## First Time Setup

```bash
# 1. Install all dependencies
npm run install:all  # (create this script in root package.json)
# OR manually:
cd gateway && npm install && cd ..
cd collab-editor && npm install && cd ..
cd user-service && npm install && cd ..
cd react-project && npm install && cd ..

# 2. Setup databases
docker-compose up -d

# 3. Run migrations
cd collab-editor && npx prisma migrate dev && cd ..
cd user-service && npx prisma migrate dev && cd ..

# 4. Start services (see above)
```

---

## Testing the Application

### 1. Create a Room

1. Open http://localhost:5173
2. Click "Register" (or use existing account)
3. Navigate to `/editor`
4. Enter username: "Alice"
5. Click "Create New Room"
6. **Copy the Room ID** from the header

### 2. Join from Another Browser

1. Open **Incognito/Private** window
2. Go to http://localhost:5173/editor
3. Enter username: "Bob"
4. Paste Room ID
5. Click "Join Room"

### 3. Test Features

✅ **Code Sync**: Type in one browser → See in other  
✅ **Chat**: Send message → Appears for both users  
✅ **File Management**: Create new file → Both see it  
✅ **Code Execution**: Click "Run Code" → Both see output  
✅ **User Presence**: See online users in header

---

## Port Reference

| Service            | Port | URL                   |
| ------------------ | ---- | --------------------- |
| Frontend (Vite)    | 5173 | http://localhost:5173 |
| Gateway            | 3000 | http://localhost:3000 |
| Collab Editor (WS) | 4000 | ws://localhost:4000   |
| User Service       | 4001 | http://localhost:4001 |
| PostgreSQL         | 5432 | -                     |

---

## Common Issues & Solutions

### "Failed to create room"

**Problem**: Gateway can't reach collab-editor service  
**Solution**: Ensure collab-editor is running on port 4000

```bash
cd collab-editor && npm run dev
```

### "Database connection failed"

**Problem**: PostgreSQL not running  
**Solution**: Start Docker containers

```bash
docker-compose up -d
docker-compose ps  # Check status
```

### "WebSocket connection failed"

**Problem**: Collab-editor WebSocket server not running  
**Solution**: Check collab-editor terminal for errors

```bash
# Should see:
# 🚀 Collaborative Editor running on port 4000
# 📡 WebSocket server ready for connections
```

### Monaco Editor not loading

**Problem**: Missing dependencies  
**Solution**: Reinstall react-project dependencies

```bash
cd react-project
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

### Making Changes

#### Frontend Changes

```bash
cd react-project
# Edit files - Vite will hot-reload automatically
```

#### Backend Changes

```bash
cd collab-editor  # or user-service or gateway
# Edit files - Nodemon will restart server automatically
```

#### Database Schema Changes

```bash
cd collab-editor  # or user-service
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_new_feature
# 3. Generates Prisma Client automatically
```

---

## Production Deployment

### Environment Variables

Create `.env.production` files:

**collab-editor/.env.production**

```env
DATABASE_URL="postgresql://user:password@db-host:5432/collab_editor"
PORT=4000
NODE_ENV=production
```

**user-service/.env.production**

```env
DATABASE_URL="postgresql://user:password@db-host:5432/user_service"
PORT=4001
JWT_SECRET=secure-secret-key-here
NODE_ENV=production
```

**react-project/.env.production**

```env
VITE_GATEWAY_URL=https://your-gateway.com
VITE_WS_URL=wss://your-editor.com
```

### Build for Production

```bash
# Frontend
cd react-project
npm run build
# Outputs to: react-project/dist

# Backend services don't need building (TypeScript compiled on-the-fly)
# For production, consider building:
cd collab-editor
npm run build  # (add build script with tsc)
```

### Deploy Options

#### Option 1: Vercel (Frontend) + Railway (Backend)

- **Frontend**: Deploy `react-project` to Vercel
- **Backend**: Deploy each service to Railway
- **Database**: Railway PostgreSQL

#### Option 2: Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 3: Kubernetes

- Create k8s manifests for each service
- Use Helm charts
- Deploy to AWS EKS / GCP GKE / Azure AKS

---

## Useful Commands

### Database

```bash
# View database in browser
cd collab-editor
npx prisma studio  # Opens on http://localhost:5555

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Docker

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Reset everything
docker-compose down -v  # Removes volumes (deletes data!)
```

### Testing

```bash
# Run linter
cd react-project && npm run lint

# Check TypeScript
cd collab-editor && npx tsc --noEmit
```

---

## Feature Testing Checklist

### Before Demo/Interview

- [ ] Can create a room
- [ ] Can join a room with valid ID
- [ ] Code syncs in real-time
- [ ] Chat messages work
- [ ] Can create new files
- [ ] Can switch between files
- [ ] Can delete files (except last one)
- [ ] Code execution works (JavaScript)
- [ ] Code execution works (Python)
- [ ] User list updates on join/leave
- [ ] Can copy Room ID
- [ ] Can disconnect cleanly
- [ ] Multiple users can collaborate simultaneously
- [ ] Monaco Editor loads correctly
- [ ] Syntax highlighting works

---

## Performance Tips

### Development

- Use `npm run dev` (not `npm start`)
- Keep Docker Desktop resources reasonable (4GB RAM minimum)
- Close unused services when not testing full stack

### Production

- Enable gzip compression
- Use CDN for static assets
- Implement rate limiting
- Add caching headers
- Use connection pooling for database
- Implement WebSocket heartbeat/reconnection

---

## Next Steps

1. ✅ Test all features locally
2. ✅ Deploy to production
3. ✅ Create demo video
4. ✅ Add to portfolio website
5. ✅ Share on LinkedIn/GitHub

---

## Support

### Logs

```bash
# Gateway logs
cd gateway && npm run dev

# Collab Editor logs
cd collab-editor && npm run dev

# Check WebSocket messages in browser console
# Open DevTools → Network → WS → Click connection → Messages
```

### Debug Mode

Add to .env:

```env
DEBUG=*
LOG_LEVEL=debug
```

---

**Good luck with your portfolio! 🚀**
