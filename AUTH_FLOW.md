# Authentication Flow Documentation

## Overview

This project implements a **hybrid authentication approach** with defense-in-depth security:

- **Gateway**: Performs initial JWT verification and adds user context to headers
- **Services**: Can trust gateway headers OR verify JWT again for direct access

## Architecture

```
Client → API Gateway (Port 3000) → Microservices
         ↓                          ↓
    Verify JWT              Trust headers OR
    Add user headers        Re-verify JWT
```

## How It Works

### 1. Public Routes (No Auth Required)

**Example**: Register, Login

```
POST http://localhost:3000/v1/auth/register
POST http://localhost:3000/v1/auth/login
```

**Flow**:

```
Client → Gateway (no auth check) → User Service → Response
```

### 2. Protected Routes (Auth Required)

**Example**: Get Profile, Update Profile

```
GET http://localhost:3000/v1/users/profile
Authorization: Bearer <access_token>
```

**Flow**:

```
Client with JWT
    ↓
API Gateway (authHandler middleware)
    ├─ Extract JWT from Authorization header
    ├─ Verify JWT signature
    ├─ Extract user info (userId, email, role)
    ├─ Add headers:
    │   - X-User-Id: <userId>
    │   - X-User-Email: <email>
    │   - X-User-Role: <role>
    │   - X-Gateway-Source: api-gateway
    └─ Forward to service
        ↓
User Service (trustGatewayAuth middleware)
    ├─ Check X-Gateway-Source header
    ├─ If from gateway: Trust X-User-* headers ✅
    ├─ If direct call: Verify JWT again 🔐
    └─ Attach req.user
        ↓
Controller uses req.user.userId
```

### 3. Admin Routes (Auth + Role Check)

**Example**: List all users (ADMIN only)

```
GET http://localhost:3000/v1/users/users
Authorization: Bearer <admin_access_token>
```

**Flow**: Same as protected routes + `requireRole(['ADMIN'])` middleware checks `req.user.role`

## Gateway Configuration

### Protected Routes (`proxyRoutes.ts`)

```typescript
const services = [
  { route: "/v1/users", requireAuth: true }, // Protected
  { route: "/v1/auth", requireAuth: false }, // Public
];
```

### Auth Middleware (`authHandler.ts`)

**What it does**:

1. ✅ Extracts JWT from `Authorization: Bearer <token>`
2. ✅ Verifies JWT signature with `JWT_SECRET`
3. ✅ Decodes user info (userId, email, role)
4. ✅ Adds headers for downstream services:
   - `X-User-Id`
   - `X-User-Email`
   - `X-User-Role`
5. ✅ Forwards request to service

**Returns**:

- `401` if no token provided
- `403` if token invalid/expired
- `next()` if valid

## Service Configuration

### Auth Middleware Options

#### Option 1: `trustGatewayAuth` (Recommended when behind gateway)

```typescript
router.get("/profile", trustGatewayAuth, getProfile);
```

**What it does**:

1. Checks if request has `X-Gateway-Source: api-gateway` header
2. If YES: Trusts `X-User-*` headers (gateway already verified)
3. If NO: Falls back to full JWT verification (direct call)

**Use case**: Default for all routes when using gateway

#### Option 2: `authMiddleware` (Direct JWT verification)

```typescript
router.get("/profile", authMiddleware, getProfile);
```

**What it does**:

1. Always extracts and verifies JWT from `Authorization` header
2. Ignores gateway headers completely

**Use case**: Service-to-service calls, testing without gateway

#### Option 3: `requireRole` (Role-based access)

```typescript
router.get("/admin/users", trustGatewayAuth, requireRole(["ADMIN"]), listUsers);
```

**What it does**:

1. Checks `req.user.role` matches allowed roles
2. Returns `403` if insufficient permissions
3. Must be used AFTER `authMiddleware` or `trustGatewayAuth`

## Security Benefits

### Defense in Depth

1. **Gateway validates JWT** → Prevents invalid requests from reaching services
2. **Services can verify again** → Protection if gateway is bypassed
3. **Role-based checks** → Fine-grained authorization at service level

### Why Both Layers?

**Scenario: Attacker bypasses gateway**

```
Attacker → Directly to user-service:3001 (bypass gateway)
         → Sends fake header: X-User-Id: admin-id
```

**Without service auth**: Attacker gets admin access ❌  
**With trustGatewayAuth**: Falls back to JWT verification, attacker blocked ✅

## Testing

### Test public route (no auth)

```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"SecurePass123!"}'
```

### Test protected route (with auth)

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Response: { "accessToken": "eyJhbGc...", ... }

# 2. Use token to access protected route
curl -X GET http://localhost:3000/v1/users/profile \
  -H "Authorization: Bearer <your_access_token>"
```

### Test admin route (requires ADMIN role)

```bash
# Use admin account token
curl -X GET http://localhost:3000/v1/users/users \
  -H "Authorization: Bearer <admin_access_token>"
```

## Environment Variables

### Gateway (`.env`)

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://localhost:6379
USER_SERVICE_URL=http://localhost:3001
```

### User Service (`.env`)

```env
PORT=3001
JWT_SECRET=your_jwt_secret_key  # Must match gateway!
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

**IMPORTANT**: `JWT_SECRET` must be identical in gateway and all services!

## API Endpoints

### Public (No Auth)

- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login and get tokens
- `POST /v1/auth/refresh` - Refresh access token

### Protected (Auth Required)

- `POST /v1/auth/logout` - Logout current session
- `POST /v1/auth/logout-all` - Logout all devices
- `GET /v1/users/profile` - Get my profile
- `PUT /v1/users/profile` - Update my profile

### Admin Only (Auth + ADMIN role)

- `GET /v1/users/users` - List all users
- `GET /v1/users/users/:id` - Get user by ID

## Common Errors

### 401 Unauthorized

```json
{ "message": "No authorization token provided" }
```

**Fix**: Add `Authorization: Bearer <token>` header

### 403 Forbidden

```json
{ "message": "Invalid token" }
```

**Fix**: Token expired or invalid, login again

### 403 Insufficient Permissions

```json
{
  "message": "Insufficient permissions",
  "required": ["ADMIN"],
  "current": "USER"
}
```

**Fix**: Route requires ADMIN role, your account is USER

## Best Practices

1. ✅ **Use trustGatewayAuth** for routes behind gateway
2. ✅ **Always use HTTPS** in production
3. ✅ **Keep JWT_SECRET identical** across all services
4. ✅ **Use short-lived access tokens** (15 min)
5. ✅ **Log authentication attempts** for security monitoring
6. ✅ **Rate limit** auth endpoints to prevent brute force
7. ✅ **Never log tokens** or passwords

## Next Steps

- [ ] Add refresh token rotation
- [ ] Implement API key authentication for service-to-service
- [ ] Add OAuth2 support (Google, GitHub)
- [ ] Implement 2FA (Two-Factor Authentication)
- [ ] Add audit logging for admin actions
