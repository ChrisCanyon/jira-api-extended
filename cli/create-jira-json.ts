#!/usr/bin/env node
import JiraAPI from '../api/main';
import { getJiraConfig, validateTicketKey } from './config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Get JSON file path from command line arguments
const jsonFilePath = process.argv[2];

if (!jsonFilePath || jsonFilePath === '--help' || jsonFilePath === '-h') {
    console.log(`
📝 Create Jira Ticket from JSON

Usage:
  npm run create-jira-json <path-to-json-file>

JSON File Format:
  {
    "project": "OS",                    // Required: Project key
    "summary": "Issue title",           // Required: Issue summary
    "type": "Story",                    // Optional: Story, Task, Bug, Epic (default: Story)
    "parent": "OS-14441",              // Optional: Parent epic/issue key
    "description": "Issue details...",  // Optional: Description (string or ADF object)
    "assignee": "user@example.com",    // Optional: Assignee email
    "priority": "High",                 // Optional: High, Medium, Low, etc.
    "labels": ["frontend", "urgent"],   // Optional: Array of labels
    "customFields": {                   // Optional: Custom fields
      "customfield_10001": "value",
      "customfield_10002": { "value": "option" }
    }
  }

Examples:
  npm run create-jira-json ticket.json
  npm run create-jira-json templates/story.json
  npm run create-jira-json ../my-tickets/bug-fix.json

See the 'templates/' directory for example JSON files.
`);
    process.exit(0);
}

interface JiraTicketJSON {
    project: string;
    summary: string;
    type?: string;
    parent?: string;
    description?: string | object;
    assignee?: string;
    priority?: string;
    labels?: string[];
    customFields?: { [key: string]: any };
    [key: string]: any; // Allow additional fields
}

function validateJSON(data: any): JiraTicketJSON {
    if (!data.project) {
        console.error('❌ Error: "project" field is required in JSON');
        process.exit(1);
    }

    if (!data.summary) {
        console.error('❌ Error: "summary" field is required in JSON');
        process.exit(1);
    }

    if (data.parent && !validateTicketKey(data.parent)) {
        console.error(`❌ Error: Invalid parent ticket key format: ${data.parent}`);
        console.error('Expected format: PROJECT-NUMBER (e.g., OS-14441)');
        process.exit(1);
    }

    return data as JiraTicketJSON;
}

async function createJiraTicketFromJSON() {
    try {
        // Get config from environment variables
        const config = getJiraConfig();

        // Read and parse JSON file
        console.log(`\n📖 Reading JSON file: ${jsonFilePath}`);
        const absolutePath = resolve(jsonFilePath);

        let fileContent: string;
        try {
            fileContent = readFileSync(absolutePath, 'utf-8');
        } catch (error) {
            console.error(`❌ Error: Could not read file: ${absolutePath}`);
            if (error instanceof Error) {
                console.error(`   ${error.message}`);
            }
            process.exit(1);
        }

        let ticketData: JiraTicketJSON;
        try {
            ticketData = JSON.parse(fileContent);
        } catch (error) {
            console.error(`❌ Error: Invalid JSON format in file`);
            if (error instanceof Error) {
                console.error(`   ${error.message}`);
            }
            process.exit(1);
        }

        // Validate JSON structure
        ticketData = validateJSON(ticketData);

        console.log('✓ JSON file loaded and validated');

        // Initialize Jira API
        const jira = new JiraAPI(config);

        console.log(`\n📝 Creating Jira ticket...`);
        console.log('━'.repeat(60));

        // Build issue data for Jira API
        const issueData: any = {
            fields: {
                project: {
                    key: ticketData.project
                },
                summary: ticketData.summary,
                issuetype: {
                    name: ticketData.type || 'Story'
                }
            }
        };

        // Add optional fields
        if (ticketData.description) {
            issueData.fields.description = ticketData.description;
        }

        if (ticketData.parent) {
            issueData.fields.parent = {
                key: ticketData.parent
            };
        }

        if (ticketData.assignee) {
            issueData.fields.assignee = {
                emailAddress: ticketData.assignee
            };
        }

        if (ticketData.priority) {
            issueData.fields.priority = {
                name: ticketData.priority
            };
        }

        if (ticketData.labels && Array.isArray(ticketData.labels)) {
            issueData.fields.labels = ticketData.labels;
        }

        // Add custom fields if provided
        if (ticketData.customFields) {
            Object.assign(issueData.fields, ticketData.customFields);
        }

        console.log('Request details:');
        console.log(`  Project: ${ticketData.project}`);
        console.log(`  Summary: ${ticketData.summary}`);
        console.log(`  Type: ${ticketData.type || 'Story'}`);
        if (ticketData.parent) console.log(`  Parent: ${ticketData.parent}`);
        if (ticketData.assignee) console.log(`  Assignee: ${ticketData.assignee}`);
        if (ticketData.priority) console.log(`  Priority: ${ticketData.priority}`);
        if (ticketData.labels) console.log(`  Labels: ${ticketData.labels.join(', ')}`);
        if (ticketData.customFields) {
            console.log(`  Custom fields: ${Object.keys(ticketData.customFields).length} field(s)`);
        }
        console.log('');

        // Create the issue
        const url = new URL(`${config.url}/rest/api/2/issue`);
        const result = await jira.httpclient.post(url, issueData);

        if (result.error) {
            console.error(`\n❌ Error: ${result.error}`);
            console.error('Full response:', JSON.stringify(result, null, 2));
            process.exit(1);
        }

        console.log('✅ Issue created successfully!');
        console.log('━'.repeat(60));
        console.log(`🎫 Key: ${result.key}`);
        console.log(`🆔 ID: ${result.id}`);
        console.log(`🔗 View in browser: ${config.url}/browse/${result.key}`);
        console.log('━'.repeat(60));

    } catch (error) {
        console.error('\n❌ Failed to create ticket!');
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('Error:', error);
        }
        process.exit(1);
    }
}

createJiraTicketFromJSON();
