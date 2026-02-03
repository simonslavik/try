// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

// Authentication
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Reading Status
export const READING_STATUS = {
  WANT_TO_READ: 'WANT_TO_READ',
  CURRENTLY_READING: 'CURRENTLY_READING',
  FINISHED: 'FINISHED',
  DNF: 'DNF', // Did Not Finish
};

// Bookclub Roles
export const BOOKCLUB_ROLES = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MEMBER: 'MEMBER',
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
};

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  TYPING: 'typing',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ERROR: 'error',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  BOOKCLUB: '/bookclub/:id',
  BOOKCLUB_DETAILS: '/bookclubPage/:id',
  SEARCH: '/search',
  MY_BOOKS: '/my-books',
};

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Debounce Delays
export const SEARCH_DEBOUNCE_MS = 300;
export const AUTO_SAVE_DEBOUNCE_MS = 1000;

// UI Constants
export const TOAST_DURATION = 3000;
export const MODAL_ANIMATION_DURATION = 200;
