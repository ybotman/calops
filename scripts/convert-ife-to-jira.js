#!/usr/bin/env node
/**
 * One-time IFE to Jira Cloud Conversion
 * Converts local IFE tracking files to Jira issues
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Configuration - UPDATE THESE VALUES
const JIRA_CONFIG = {
  host: 'https://your-company.atlassian.net',  // UPDATE: Your Jira Cloud URL
  email: 'your-email@example.com',             // UPDATE: Your email
  apiToken: 'your-api-token-here',             // UPDATE: Your API token
  projectKey: 'CAL'                            // UPDATE: Your project key
};

class IFEToJiraConverter {
  constructor() {
    this.jiraAPI = axios.create({
      baseURL: `${JIRA_CONFIG.host}/rest/api/3`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    this.results = [];
  }

  async testConnection() {
    try {
      const response = await this.jiraAPI.get('/myself');
      console.log(`✅ Connected to Jira as: ${response.data.displayName}`);
      return true;
    } catch (error) {
      console.error('❌ Jira connection failed:', error.response?.data || error.message);
      return false;
    }
  }

  // Parse IFE file to extract key information
  parseIFEFile(content, filename) {
    const lines = content.split('\n');
    
    return {
      id: this.extractId(filename),
      type: this.getIssueType(filename),
      title: this.extractTitle(lines),
      description: this.extractDescription(lines),
      status: this.extractStatus(lines),
      priority: this.extractPriority(lines)
    };
  }

  extractId(filename) {
    const match = filename.match(/(FEATURE_\\d+|Issue_\\d+|PMR_[\\w_]+)/);
    return match ? match[1] : filename.replace('.md', '');
  }

  getIssueType(filename) {
    if (filename.startsWith('FEATURE_')) return 'Story';
    if (filename.startsWith('Issue_')) return 'Bug';
    if (filename.startsWith('PMR_')) return 'Epic';
    return 'Task';
  }

  extractTitle(lines) {
    const titleLine = lines.find(line => line.startsWith('# '));
    return titleLine ? titleLine.replace('# ', '').trim() : 'Untitled';
  }

  extractDescription(lines) {
    let description = '';
    let capturing = false;
    
    for (const line of lines) {
      if (line.startsWith('## Overview') || line.startsWith('## Summary')) {
        capturing = true;
        continue;
      }
      if (capturing && line.startsWith('## ')) {
        break;
      }
      if (capturing) {
        description += line + '\\n';
      }
    }
    
    return description.trim() || 'Converted from IFE tracking';
  }

  extractStatus(lines) {
    const content = lines.join(' ').toLowerCase();
    
    if (content.includes('completed') || content.includes('done')) return 'Done';
    if (content.includes('in progress') || content.includes('in_progress')) return 'In Progress';
    if (content.includes('cancelled')) return 'Cancelled';
    
    return 'To Do';
  }

  extractPriority(lines) {
    const content = lines.join(' ').toLowerCase();
    
    if (content.includes('high priority') || content.includes('priority: high')) return 'High';
    if (content.includes('low priority') || content.includes('priority: low')) return 'Low';
    
    return 'Medium';
  }

  // Create Jira issue from IFE data
  async createJiraIssue(ifeData) {
    const issueData = {
      fields: {
        project: { key: JIRA_CONFIG.projectKey },
        summary: `[${ifeData.id}] ${ifeData.title}`,
        description: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: ifeData.description
            }]
          }]
        },
        issuetype: { name: ifeData.type },
        priority: { name: ifeData.priority },
        labels: ['ife-migration', ifeData.id.toLowerCase()]
      }
    };

    try {
      const response = await this.jiraAPI.post('/issue', issueData);
      console.log(`✅ Created: ${response.data.key} - ${ifeData.title}`);
      
      this.results.push({
        localId: ifeData.id,
        jiraKey: response.data.key,
        title: ifeData.title,
        status: 'success'
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to create ${ifeData.id}:`, error.response?.data?.errors || error.message);
      
      this.results.push({
        localId: ifeData.id,
        jiraKey: null,
        title: ifeData.title,
        status: 'failed',
        error: error.response?.data?.errors || error.message
      });
      
      return null;
    }
  }

  // Convert all IFE files
  async convertAll() {
    console.log('🚀 Starting IFE to Jira conversion...');
    
    // Test connection first
    const connected = await this.testConnection();
    if (!connected) {
      throw new Error('Cannot connect to Jira');
    }

    const trackingDir = path.join(__dirname, '../public/IFE-Tracking');
    const directories = [
      'Issues/current',
      'Issues/completed', 
      'Features/current',
      'Features/completed',
      'Epics'
    ];

    for (const dir of directories) {
      const dirPath = path.join(trackingDir, dir);
      
      try {
        const files = await fs.readdir(dirPath);
        const mdFiles = files.filter(file => file.endsWith('.md'));
        
        console.log(`\\n📁 Converting ${mdFiles.length} files from ${dir}...`);
        
        for (const file of mdFiles) {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const ifeData = this.parseIFEFile(content, file);
          
          await this.createJiraIssue(ifeData);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to process directory ${dir}:`, error.message);
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\\n📊 Conversion Summary');
    console.log('=====================');
    
    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    
    console.log(`✅ Successfully created: ${successful} issues`);
    console.log(`❌ Failed: ${failed} issues`);
    
    if (successful > 0) {
      console.log('\\n🔗 Created Issues:');
      this.results
        .filter(r => r.status === 'success')
        .forEach(r => console.log(`  ${r.localId} → ${r.jiraKey}: ${r.title}`));
    }
    
    if (failed > 0) {
      console.log('\\n❌ Failed Issues:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  ${r.localId}: ${r.error}`));
    }
    
    // Save results to file
    const resultsFile = path.join(__dirname, 'ife-jira-conversion-results.json');
    fs.writeFile(resultsFile, JSON.stringify(this.results, null, 2))
      .then(() => console.log(`\\n💾 Results saved to: ${resultsFile}`));
  }
}

// Run conversion if called directly
if (require.main === module) {
  const converter = new IFEToJiraConverter();
  
  // Check if config is updated
  if (JIRA_CONFIG.host.includes('your-company') || JIRA_CONFIG.apiToken === 'your-api-token-here') {
    console.error('❌ Please update JIRA_CONFIG values at the top of this file');
    process.exit(1);
  }
  
  converter.convertAll().catch(error => {
    console.error('Conversion failed:', error);
    process.exit(1);
  });
}

module.exports = IFEToJiraConverter;