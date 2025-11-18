# Security Guidelines

## Environment Variables

**NEVER commit `.env` files to git!**

### Setup Instructions

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Generate a strong JWT secret:

```bash
openssl rand -base64 32
```

3. Update `.env` with your values:

```env
JWT_SECRET=<your-generated-secret>
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=microservices
```

4. For production, use even stronger passwords:

```bash
# Generate strong password
openssl rand -base64 24
```

## What's Protected

✅ `.env` files are in `.gitignore`  
✅ `docker-compose.yml` uses environment variables  
✅ JWT secrets are not hardcoded  
✅ Database credentials are not hardcoded

## GitHub Security Alert

If you received a security alert, it means secrets were committed in the past. To remove them from git history:

### Option 1: BFG Repo-Cleaner (Recommended)

```bash
# Install BFG
brew install bfg

# Clone a fresh copy
git clone --mirror https://github.com/simonslavik/try.git

# Remove secrets from history
bfg --replace-text passwords.txt try.git

# Force push (WARNING: Rewrites history!)
cd try.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

### Option 2: Rotate All Secrets (Easier)

Since the secrets are exposed, generate new ones:

1. ✅ Generate new JWT_SECRET (already done)
2. Change database passwords in production
3. Revoke any API keys that were exposed
4. Enable 2FA on GitHub

## Production Deployment

For production, use:

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Environment variables in hosting platform** (Vercel, Heroku, Railway)

Never use the same secrets in development and production!
