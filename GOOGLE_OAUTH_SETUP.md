# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your application.

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if you haven't already:

   - Select **External** user type
   - Fill in the required app information
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed

6. Create OAuth 2.0 Client ID:

   - Application type: **Web application**
   - Name: Your app name (e.g., "Portfolio Microservices")
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs (if needed):
     - `http://localhost:5173/auth/google/callback`
     - Your production callback URL

7. Click **Create** and copy your **Client ID** and **Client Secret**

## 2. Configure Backend Environment Variables

Add these to your `user-service/.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## 3. Configure Frontend Environment Variables

Create or update `react-project/.env` file:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

**Note:** The frontend only needs the Client ID, NOT the secret.

## 4. Validate Your Configuration

Before starting the application, validate that all environment variables are correctly set:

```bash
./check-env.sh
```

This script will:

- ✅ Check if all required .env files exist
- ✅ Verify all required environment variables are set
- ✅ Ensure Google Client IDs match between frontend and backend
- ✅ Check if dependencies are installed
- ⚠️ Warn about placeholder values that should be changed

If everything is configured correctly, you'll see:

```
✓ All checks passed! You're ready to start the application.
```

## 5. Run Database Migration

The database schema has been updated to support OAuth. Run the migration:

```bash
cd user-service
npm run migrate
```

This will add the following fields to the User model:

- `googleId` - Unique identifier from Google
- `authProvider` - Either 'local' or 'google'
- `password` - Now optional (null for OAuth users)

## 6. Restart Services

**Important:** The services now include automatic environment validation on startup.

After setting up the environment variables:

```bash
# Stop existing services
docker-compose down

# Rebuild and start services
docker-compose up --build
```

Or if running locally:

```bash
# Terminal 1 - User Service (validates env on startup)
cd user-service
npm run dev

# Terminal 2 - React Frontend (validates env before starting)
cd react-project
npm run dev
```

The services will automatically validate environment variables and exit with an error message if anything is missing or misconfigured.

## 7. Test Google OAuth

1. Navigate to your app
2. Click the login button
3. You should see a "Sign in with Google" button
4. Click it and authenticate with your Google account
5. You'll be automatically logged in!

## Security Notes

- **Never commit your `.env` files** to version control
- The Client Secret should ONLY be in the backend `.env` file
- The Client ID is safe to expose in the frontend
- For production, make sure to:
  - Update authorized origins to your production domain
  - Use HTTPS
  - Enable additional security features in Google Console
  - Set up proper CORS policies

## Troubleshooting

### "Invalid Client ID" Error

- Verify the Client ID in both backend and frontend `.env` files
- Make sure you're using the correct Client ID (it should end with `.apps.googleusercontent.com`)

### "Redirect URI Mismatch" Error

- Check that your JavaScript origins in Google Console match your app's URL
- For development: `http://localhost:5173`
- Make sure there are no trailing slashes

### Google Button Not Showing

- Check browser console for errors
- Verify the `VITE_GOOGLE_CLIENT_ID` is set correctly
- Restart the React dev server after adding environment variables

### Database Migration Issues

```bash
# Reset the database if needed (development only!)
cd user-service
npx prisma migrate reset
npm run migrate
```

## Features

With Google OAuth integrated, users can:

- ✅ Sign in with their existing Google account (no password needed)
- ✅ Link their Google account to an existing email-based account
- ✅ Automatically get their Google profile picture
- ✅ Seamlessly switch between devices
- ✅ Avoid creating yet another password

## Next Steps

Consider adding:

- More OAuth providers (GitHub, Facebook, Microsoft)
- Two-factor authentication
- Email verification for local accounts
- Account linking UI for managing connected accounts
