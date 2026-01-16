# Environment Validation System

This project includes comprehensive environment validation to ensure all required configurations are set before starting the services.

## 🛠️ Tools Available

### 1. `check-env.sh` - Comprehensive Environment Checker

**Usage:**

```bash
./check-env.sh
```

**What it checks:**

- ✅ Existence of `.env` files in both `user-service` and `react-project`
- ✅ All required environment variables are set
- ✅ Google OAuth Client IDs match between frontend and backend
- ✅ Dependencies are installed
- ⚠️ Warns about placeholder values that should be changed in production

**Output:**

- 🟢 Green checkmarks for configured items
- 🟡 Yellow warnings for optional or placeholder values
- 🔴 Red errors for missing required configuration

### 2. `start.sh` - Validated Startup Script

**Usage:**

```bash
./start.sh
```

**What it does:**

1. Runs `check-env.sh` to validate configuration
2. Exits with error if validation fails
3. Starts Docker Compose services if validation passes

This ensures you can't accidentally start the app with missing configuration.

### 3. Automatic Validation on Service Startup

Both services now validate their environment variables automatically when starting:

#### User Service (Backend)

- Uses `src/utils/envValidator.ts`
- Validates on `npm run dev` or Docker container start
- Exits immediately if required variables are missing
- Logs configuration summary on successful validation

**Required variables:**

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

#### React Project (Frontend)

- Uses `validate-env.js` script
- Runs before `vite` starts (see `package.json` scripts)
- Validates `VITE_GOOGLE_CLIENT_ID` is set

## 📋 Quick Reference

### Check if everything is configured correctly

```bash
./check-env.sh
```

### Start services (with validation)

```bash
./start.sh
```

### Start services manually (still validates)

```bash
# Backend validates on startup
cd user-service && npm run dev

# Frontend validates before starting
cd react-project && npm run dev
```

## 🔧 Troubleshooting

### "Missing required environment variables"

1. Check if `.env` files exist
2. Copy from examples: `cp user-service/.env.example user-service/.env`
3. Fill in the required values

### "Google Client IDs DO NOT match"

Make sure `GOOGLE_CLIENT_ID` in `user-service/.env` matches `VITE_GOOGLE_CLIENT_ID` in `react-project/.env`

### "Placeholder values detected"

For production, replace values containing:

- `your-google-client-id`
- `change-this-in-production`
- Default secrets

## 🎯 Benefits

1. **Fail Fast** - Catches configuration errors before services start
2. **Clear Messages** - Shows exactly what's missing or misconfigured
3. **Consistency** - Ensures frontend and backend use matching OAuth credentials
4. **Developer Experience** - No more debugging "undefined" errors from missing env vars
5. **Production Safety** - Warns about placeholder values that need updating

## 📝 Environment Files Structure

```
try/
├── user-service/
│   ├── .env              # Your actual config (gitignored)
│   ├── .env.example      # Template with placeholder values
│   └── src/utils/envValidator.ts  # Validation logic
│
├── react-project/
│   ├── .env              # Your actual config (gitignored)
│   ├── .env.example      # Template with placeholder values
│   └── validate-env.js   # Validation script
│
├── check-env.sh          # Manual validation script
└── start.sh              # Startup with validation
```

## 🔒 Security Note

- `.env` files are in `.gitignore` - never commit them!
- Only `.env.example` files should be committed
- Google Client Secret should ONLY be in backend `.env`
- Frontend only needs the Client ID (public information)
