/**
 * Jira Configuration Setup
 * Copy this file to jira-config.js and update with your credentials
 */

module.exports = {
  // Your Jira instance URL (e.g., https://yourcompany.atlassian.net)
  host: 'https://your-company.atlassian.net',
  
  // API authentication
  auth: {
    // Option 1: API Token (Recommended)
    email: 'your-email@example.com',
    apiToken: 'your-api-token-here', // Generate at https://id.atlassian.com/manage-profile/security/api-tokens
    
    // Option 2: OAuth (Advanced)
    // oauth: {
    //   consumer_key: 'your-consumer-key',
    //   private_key: 'your-private-key',
    //   token: 'your-oauth-token',
    //   token_secret: 'your-oauth-token-secret'
    // }
  },
  
  // Project configuration
  projects: {
    calops: {
      key: 'CAL',              // Your Jira project key
      issueTypes: {
        epic: 'Epic',
        feature: 'Story',       // Or 'Feature' if you have it
        issue: 'Bug',
        task: 'Task'
      },
      // Custom field mappings (get these from your Jira admin)
      customFields: {
        priority: 'customfield_10001',
        severity: 'customfield_10002',
        component: 'customfield_10003'
      }
    }
  },
  
  // Sync settings
  sync: {
    // Mapping between local IFE status and Jira status
    statusMapping: {
      'pending': 'To Do',
      'in_progress': 'In Progress', 
      'completed': 'Done',
      'cancelled': 'Cancelled'
    },
    
    // Priority mapping
    priorityMapping: {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Highest'
    },
    
    // Auto-sync settings
    autoSync: {
      enabled: false,          // Enable automatic sync
      interval: 300000,        // 5 minutes in milliseconds
      onStartup: true,         // Sync on application startup
      direction: 'bidirectional' // 'toJira', 'fromJira', 'bidirectional'
    }
  },
  
  // API settings
  api: {
    version: '3',              // Jira API version
    timeout: 30000,            // Request timeout in milliseconds
    maxRetries: 3,             // Number of retry attempts
    retryDelay: 1000          // Delay between retries in milliseconds
  }
};