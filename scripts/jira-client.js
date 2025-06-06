/**
 * Jira API Client
 * Handles communication with Jira REST API
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class JiraClient {
  constructor(configPath = './jira-config.js') {
    try {
      this.config = require(configPath);
    } catch (error) {
      console.error('Jira config not found. Copy jira-config.example.js to jira-config.js and configure it.');
      throw error;
    }
    
    this.baseURL = `${this.config.host}/rest/api/${this.config.api.version}`;
    this.axiosInstance = this.createAxiosInstance();
  }

  createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.baseURL,
      timeout: this.config.api.timeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Add authentication
    if (this.config.auth.apiToken) {
      const auth = Buffer.from(`${this.config.auth.email}:${this.config.auth.apiToken}`).toString('base64');
      instance.defaults.headers.common['Authorization'] = `Basic ${auth}`;
    }

    // Add retry logic
    instance.interceptors.response.use(
      response => response,
      async error => {
        if (error.config && !error.config.__isRetryRequest && error.response?.status >= 500) {
          error.config.__isRetryRequest = true;
          error.config.__retryCount = (error.config.__retryCount || 0) + 1;
          
          if (error.config.__retryCount <= this.config.api.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, this.config.api.retryDelay));
            return instance(error.config);
          }
        }
        throw error;
      }
    );

    return instance;
  }

  // Test connection to Jira
  async testConnection() {
    try {
      const response = await this.axiosInstance.get('/myself');
      console.log('✅ Jira connection successful:', response.data.displayName);
      return true;
    } catch (error) {
      console.error('❌ Jira connection failed:', error.response?.data || error.message);
      return false;
    }
  }

  // Get project information
  async getProject(projectKey) {
    try {
      const response = await this.axiosInstance.get(`/project/${projectKey}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get project ${projectKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Create an issue
  async createIssue(issueData) {
    try {
      const response = await this.axiosInstance.post('/issue', {
        fields: issueData
      });
      console.log(`✅ Created issue: ${response.data.key}`);
      return response.data;
    } catch (error) {
      console.error('Failed to create issue:', error.response?.data || error.message);
      throw error;
    }
  }

  // Update an issue
  async updateIssue(issueKey, updateData) {
    try {
      await this.axiosInstance.put(`/issue/${issueKey}`, {
        fields: updateData
      });
      console.log(`✅ Updated issue: ${issueKey}`);
      return true;
    } catch (error) {
      console.error(`Failed to update issue ${issueKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Search for issues
  async searchIssues(jql, fields = ['key', 'summary', 'status', 'assignee']) {
    try {
      const response = await this.axiosInstance.post('/search', {
        jql,
        fields,
        maxResults: 1000
      });
      return response.data.issues;
    } catch (error) {
      console.error('Failed to search issues:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get issue details
  async getIssue(issueKey) {
    try {
      const response = await this.axiosInstance.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get issue ${issueKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Add comment to issue
  async addComment(issueKey, comment) {
    try {
      await this.axiosInstance.post(`/issue/${issueKey}/comment`, {
        body: comment
      });
      console.log(`✅ Added comment to ${issueKey}`);
      return true;
    } catch (error) {
      console.error(`Failed to add comment to ${issueKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Transition issue (change status)
  async transitionIssue(issueKey, transitionId, comment = null) {
    try {
      const body = {
        transition: { id: transitionId }
      };
      
      if (comment) {
        body.update = {
          comment: [{ add: { body: comment } }]
        };
      }

      await this.axiosInstance.post(`/issue/${issueKey}/transitions`, body);
      console.log(`✅ Transitioned issue ${issueKey}`);
      return true;
    } catch (error) {
      console.error(`Failed to transition issue ${issueKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Get available transitions for an issue
  async getTransitions(issueKey) {
    try {
      const response = await this.axiosInstance.get(`/issue/${issueKey}/transitions`);
      return response.data.transitions;
    } catch (error) {
      console.error(`Failed to get transitions for ${issueKey}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = JiraClient;