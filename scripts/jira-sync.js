/**
 * Jira Sync Utilities
 * Syncs local IFE tracking with Jira issues
 */

const fs = require('fs').promises;
const path = require('path');
const JiraClient = require('./jira-client');

class JiraSyncManager {
  constructor(configPath = './jira-config.js') {
    this.jiraClient = new JiraClient(configPath);
    this.config = this.jiraClient.config;
    this.trackingDir = path.join(__dirname, '../public/IFE-Tracking');
    this.syncLog = [];
  }

  // Parse local IFE file to extract metadata
  parseIFEFile(content, filename) {
    const lines = content.split('\n');
    const metadata = {
      id: this.extractIdFromFilename(filename),
      type: this.detectFileType(filename),
      title: this.extractTitle(lines),
      status: this.extractStatus(lines),
      priority: this.extractPriority(lines),
      assignee: this.extractAssignee(lines),
      description: this.extractDescription(lines),
      tasks: this.extractTasks(lines),
      lastUpdated: this.extractLastUpdated(lines),
      jiraKey: this.extractJiraKey(lines)
    };
    return metadata;
  }

  extractIdFromFilename(filename) {
    const match = filename.match(/(FEATURE_\\d+|Issue_\\d+|PMR_[\\w_]+)/);
    return match ? match[1] : filename.replace('.md', '');
  }

  detectFileType(filename) {
    if (filename.startsWith('FEATURE_')) return 'feature';
    if (filename.startsWith('Issue_')) return 'issue';
    if (filename.startsWith('PMR_')) return 'epic';
    return 'task';
  }

  extractTitle(lines) {
    const titleLine = lines.find(line => line.startsWith('# '));
    return titleLine ? titleLine.replace('# ', '').trim() : 'Untitled';
  }

  extractStatus(lines) {
    // Look for status in various formats
    const statusPatterns = [
      /Status[:\\s]*([\\w\\s]+)/i,
      /\\*\\*Status[:\\s]*([\\w\\s]+)\\*\\*/i,
      /- \\[([x\\s])\\]/g // Checkbox status
    ];
    
    for (const line of lines) {
      for (const pattern of statusPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (pattern === statusPatterns[2]) {
            // Checkbox logic
            const completed = (line.match(/- \\[x\\]/g) || []).length;
            const total = (line.match(/- \\[[ x]\\]/g) || []).length;
            return completed === total && total > 0 ? 'completed' : 'in_progress';
          }
          return this.normalizeStatus(match[1]);
        }
      }
    }
    return 'pending';
  }

  extractPriority(lines) {
    const priorityLine = lines.find(line => 
      line.toLowerCase().includes('priority') && 
      (line.includes('high') || line.includes('medium') || line.includes('low'))
    );
    
    if (priorityLine) {
      if (priorityLine.includes('high')) return 'high';
      if (priorityLine.includes('medium')) return 'medium';
      if (priorityLine.includes('low')) return 'low';
    }
    return 'medium';
  }

  extractAssignee(lines) {
    const assigneeLine = lines.find(line => 
      line.toLowerCase().includes('assignee') || 
      line.toLowerCase().includes('owner')
    );
    return assigneeLine ? assigneeLine.split(':')[1]?.trim() : 'AI Guild (Claude)';
  }

  extractDescription(lines) {
    let description = '';
    let inDescription = false;
    
    for (const line of lines) {
      if (line.startsWith('## Overview') || line.startsWith('## Summary')) {
        inDescription = true;
        continue;
      }
      if (inDescription && line.startsWith('## ')) {
        break;
      }
      if (inDescription && line.trim()) {
        description += line + '\\n';
      }
    }
    
    return description.trim() || 'No description available';
  }

  extractTasks(lines) {
    const tasks = [];
    for (const line of lines) {
      const taskMatch = line.match(/- \\[([ x])\\] (.+)/);
      if (taskMatch) {
        tasks.push({
          completed: taskMatch[1] === 'x',
          text: taskMatch[2].trim()
        });
      }
    }
    return tasks;
  }

  extractLastUpdated(lines) {
    const updateLine = lines.find(line => 
      line.toLowerCase().includes('last updated') || 
      line.toLowerCase().includes('updated:')
    );
    return updateLine ? updateLine.split(':')[1]?.trim() : new Date().toISOString().split('T')[0];
  }

  extractJiraKey(lines) {
    const jiraLine = lines.find(line => 
      line.includes('jira:') || 
      line.includes('JIRA:') ||
      line.match(/[A-Z]+-\\d+/)
    );
    const match = jiraLine?.match(/([A-Z]+-\\d+)/);
    return match ? match[1] : null;
  }

  normalizeStatus(status) {
    const statusMap = {
      'pending': 'pending',
      'in progress': 'in_progress',
      'in_progress': 'in_progress',
      'done': 'completed',
      'completed': 'completed',
      'complete': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled'
    };
    return statusMap[status.toLowerCase()] || 'pending';
  }

  // Convert local IFE data to Jira format
  convertToJiraIssue(metadata, projectKey) {
    const project = this.config.projects.calops;
    
    return {
      project: { key: projectKey },
      summary: metadata.title,
      description: metadata.description,
      issuetype: { name: project.issueTypes[metadata.type] || 'Task' },
      priority: { name: this.config.sync.priorityMapping[metadata.priority] || 'Medium' },
      labels: [`ife-${metadata.type}`, `local-sync`, metadata.id],
      // Add custom fields if needed
      ...(project.customFields.component && {
        [project.customFields.component]: { value: 'CalOps' }
      })
    };
  }

  // Sync single file to Jira
  async syncFileToJira(filePath, projectKey) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const filename = path.basename(filePath);
      const metadata = this.parseIFEFile(content, filename);
      
      if (metadata.jiraKey) {
        // Update existing issue
        const updateData = this.convertToJiraIssue(metadata, projectKey);
        delete updateData.project; // Can't update project
        await this.jiraClient.updateIssue(metadata.jiraKey, updateData);
        
        this.syncLog.push({
          type: 'update',
          file: filename,
          jiraKey: metadata.jiraKey,
          status: 'success'
        });
      } else {
        // Create new issue
        const issueData = this.convertToJiraIssue(metadata, projectKey);
        const result = await this.jiraClient.createIssue(issueData);
        
        // Update local file with Jira key
        await this.addJiraKeyToFile(filePath, result.key);
        
        this.syncLog.push({
          type: 'create',
          file: filename,
          jiraKey: result.key,
          status: 'success'
        });
      }
    } catch (error) {
      this.syncLog.push({
        type: 'error',
        file: path.basename(filePath),
        error: error.message,
        status: 'failed'
      });
    }
  }

  // Add Jira key to local file
  async addJiraKeyToFile(filePath, jiraKey) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\\n');
      
      // Add Jira key after the title or at the end of frontmatter
      const insertIndex = lines.findIndex(line => line.startsWith('## ')) || 2;
      lines.splice(insertIndex, 0, `**Jira:** ${jiraKey}`);
      
      await fs.writeFile(filePath, lines.join('\\n'));
    } catch (error) {
      console.error(`Failed to add Jira key to ${filePath}:`, error.message);
    }
  }

  // Sync all IFE files to Jira
  async syncAllToJira(projectKey = 'CAL') {
    console.log('🔄 Starting Jira sync...');
    
    // Test connection first
    const connected = await this.jiraClient.testConnection();
    if (!connected) {
      throw new Error('Cannot connect to Jira');
    }

    const directories = ['Issues/current', 'Features/current', 'Epics'];
    
    for (const dir of directories) {
      const dirPath = path.join(this.trackingDir, dir);
      try {
        const files = await fs.readdir(dirPath);
        const mdFiles = files.filter(file => file.endsWith('.md'));
        
        console.log(`📁 Syncing ${mdFiles.length} files from ${dir}...`);
        
        for (const file of mdFiles) {
          const filePath = path.join(dirPath, file);
          await this.syncFileToJira(filePath, projectKey);
        }
      } catch (error) {
        console.error(`Failed to sync directory ${dir}:`, error.message);
      }
    }

    // Print sync summary
    this.printSyncSummary();
  }

  // Sync from Jira to local files
  async syncFromJira(projectKey = 'CAL') {
    console.log('🔄 Syncing from Jira to local files...');
    
    // Search for issues with local-sync label
    const jql = `project = ${projectKey} AND labels = "local-sync"`;
    const issues = await this.jiraClient.searchIssues(jql, [
      'key', 'summary', 'status', 'priority', 'description', 'labels', 'updated'
    ]);

    for (const issue of issues) {
      await this.updateLocalFileFromJira(issue);
    }

    console.log(`✅ Synced ${issues.length} issues from Jira`);
  }

  async updateLocalFileFromJira(issue) {
    // Extract local ID from labels
    const localId = issue.fields.labels.find(label => 
      label.startsWith('FEATURE_') || 
      label.startsWith('Issue_') || 
      label.startsWith('PMR_')
    );
    
    if (!localId) return;

    // Find corresponding local file
    const filePath = await this.findLocalFile(localId);
    if (!filePath) return;

    try {
      const content = await fs.readFile(filePath, 'utf8');
      let updatedContent = content;

      // Update status if different
      const jiraStatus = this.mapJiraStatusToLocal(issue.fields.status.name);
      updatedContent = this.updateStatusInContent(updatedContent, jiraStatus);

      // Add sync timestamp
      const syncNote = `\\n<!-- Synced from Jira ${issue.key} at ${new Date().toISOString()} -->`;
      if (!content.includes('Synced from Jira')) {
        updatedContent += syncNote;
      }

      await fs.writeFile(filePath, updatedContent);
      console.log(`✅ Updated ${localId} from Jira ${issue.key}`);
    } catch (error) {
      console.error(`Failed to update ${localId}:`, error.message);
    }
  }

  async findLocalFile(localId) {
    const directories = ['Issues/current', 'Features/current', 'Epics'];
    
    for (const dir of directories) {
      const dirPath = path.join(this.trackingDir, dir);
      try {
        const files = await fs.readdir(dirPath);
        const matchingFile = files.find(file => file.includes(localId));
        if (matchingFile) {
          return path.join(dirPath, matchingFile);
        }
      } catch (error) {
        // Directory doesn't exist, continue
      }
    }
    return null;
  }

  mapJiraStatusToLocal(jiraStatus) {
    const reverseMapping = {};
    Object.entries(this.config.sync.statusMapping).forEach(([local, jira]) => {
      reverseMapping[jira] = local;
    });
    return reverseMapping[jiraStatus] || 'pending';
  }

  updateStatusInContent(content, newStatus) {
    // Update various status formats
    const patterns = [
      { regex: /Status[:\\s]*[\\w\\s]+/i, replacement: `Status: ${newStatus}` },
      { regex: /\\*\\*Status[:\\s]*[\\w\\s]+\\*\\*/i, replacement: `**Status: ${newStatus}**` }
    ];

    let updatedContent = content;
    for (const pattern of patterns) {
      if (pattern.regex.test(updatedContent)) {
        updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
        break;
      }
    }

    return updatedContent;
  }

  printSyncSummary() {
    console.log('\\n📊 Sync Summary:');
    console.log('================');
    
    const created = this.syncLog.filter(log => log.type === 'create' && log.status === 'success').length;
    const updated = this.syncLog.filter(log => log.type === 'update' && log.status === 'success').length;
    const errors = this.syncLog.filter(log => log.status === 'failed').length;
    
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    
    if (errors > 0) {
      console.log('\\n❌ Failed files:');
      this.syncLog
        .filter(log => log.status === 'failed')
        .forEach(log => console.log(`  - ${log.file}: ${log.error}`));
    }
    
    console.log('\\n🔗 Jira links:');
    this.syncLog
      .filter(log => log.status === 'success')
      .forEach(log => console.log(`  - ${log.file} → ${log.jiraKey}`));
  }
}

module.exports = JiraSyncManager;