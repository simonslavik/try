#!/usr/bin/env node

/**
 * Environment validation script for React frontend
 * Checks that all required environment variables are set before starting
 */

const requiredVars = {
  'VITE_GOOGLE_CLIENT_ID': process.env.VITE_GOOGLE_CLIENT_ID
};

const missing = [];
const warnings = [];

console.log('🔍 Validating React environment variables...\n');

// Check for missing required variables
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value || value.trim() === '') {
    missing.push(key);
  }
}

// Check for placeholder values
if (process.env.VITE_GOOGLE_CLIENT_ID?.includes('your-google-client-id')) {
  warnings.push('VITE_GOOGLE_CLIENT_ID is using placeholder - update with real Google OAuth Client ID');
}

// Log warnings
if (warnings.length > 0) {
  console.log('⚠️  Environment Configuration Warnings:');
  warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log('');
}

// Exit with error if critical variables are missing
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(v => console.error(`   - ${v}`));
  console.error('\n💡 Please check your .env file and ensure all required variables are set.');
  console.error('   See .env.example for reference.\n');
  process.exit(1);
}

// Success message
console.log('✅ All required environment variables are set');
console.log('📋 Configuration Summary:');
console.log(`   - Google OAuth: ${process.env.VITE_GOOGLE_CLIENT_ID ? 'Enabled ✓' : 'Not configured'}`);
console.log('');
