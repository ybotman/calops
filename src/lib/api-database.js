import connectToDatabase from './mongodb.js';

/**
 * Get database connection for API routes based on environment header
 * API routes should include 'x-db-environment' header to specify which database to use
 * Defaults to 'test' if no header is provided for safety
 */
export async function getApiDatabase(request) {
  // Check for environment header from client
  const environment = request?.headers?.get?.('x-db-environment') || 'test';
  
  // Validate environment
  if (!['test', 'prod'].includes(environment)) {
    throw new Error('Invalid database environment. Must be "test" or "prod".');
  }
  
  return await connectToDatabase(environment);
}

/**
 * For server-side usage where we want to explicitly specify the environment
 */
export async function getDatabaseConnection(environment = 'test') {
  return await connectToDatabase(environment);
}