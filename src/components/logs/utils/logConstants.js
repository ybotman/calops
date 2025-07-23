/**
 * Constants for log viewer
 */

export const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
  CONSOLE: 'console'
};

export const LOG_LEVEL_COLORS = {
  [LOG_LEVELS.INFO]: 'info',
  [LOG_LEVELS.WARN]: 'warning',
  [LOG_LEVELS.ERROR]: 'error',
  [LOG_LEVELS.DEBUG]: 'default',
  [LOG_LEVELS.CONSOLE]: 'success'
};

export const LOG_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'AUTH',
  'LOGOUT',
  'REGISTER',
  'VIEW',
  'OPEN_MODAL',
  'CLOSE_MODAL',
  'SAVE_REQUEST',
  'CONSOLE_LOG'
];

export const LOG_RESOURCES = [
  'userLogin',
  'event',
  'venue',
  'organizer',
  'system',
  'frontend'
];

export const LOG_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error'
};

export const QUICK_FILTERS = [
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Errors Only', value: 'errors' },
  { label: 'All Levels', value: 'all' }
];

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export const REFRESH_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 }
];