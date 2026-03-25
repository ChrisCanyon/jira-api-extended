#!/usr/bin/env node
import JiraAPI from '../api/main';
import { getJiraConfig, validateTicketKey } from './config';

// Parse command line arguments
const args = process.argv.slice(2);

// Show help if no arguments or --help flag
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
📝 Create Jira Ticket

Usage:
  npm run create-jira -- --project <KEY> --summary "<text>" [options]

Required:
  --project <KEY>        Project key (e.g., OS)
  --summary "<text>"     Issue summary/title

Optional:
  --parent <KEY>         Parent epic/issue key (e.g., OS-14441)
  --type <TYPE>          Issue type (default: Story)
                         Options: Story, Task, Bug, Epic
  --description "<text>" Issue description
  --assignee <email>     Assignee email address
  --priority <PRIORITY>  Priority (e.g., High, Medium, Low)
  --labels "<labels>"    Comma-separated labels

Examples:
  # Create a story in an epic
  npm run create-jira -- --project OS --parent OS-14441 --summary "Implement user login"

  # Create a bug with description
  npm run create-jira -- --project OS --type Bug --summary "Fix login error" --description "Users cannot log in"

  # Create a task with assignee
  npm run create-jira -- --project OS --type Task --summary "Review code" --assignee user@example.com
`);
    process.exit(0);
}

// Parse arguments
function parseArgs() {
    const parsed: any = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.substring(2);
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                parsed[key] = value;
                i++; // Skip next arg since we used it as value
            }
        }
    }
    return parsed;
}

const params = parseArgs();

// Validate required parameters
if (!params.project) {
    console.error('❌ Error: --project is required');
    console.error('Run with --help for usage information');
    process.exit(1);
}

if (!params.summary) {
    console.error('❌ Error: --summary is required');
    console.error('Run with --help for usage information');
    process.exit(1);
}

// Validate parent key format if provided
if (params.parent && !validateTicketKey(params.parent)) {
    console.error(`❌ Error: Invalid parent ticket key format: ${params.parent}`);
    console.error('Expected format: PROJECT-NUMBER (e.g., OS-14441)');
    process.exit(1);
}

async function createJiraTicket() {
    try {
        // Get config from environment variables
        const config = getJiraConfig();

        // Initialize Jira API
        const jira = new JiraAPI(config);

        console.log(`\n📝 Creating Jira ticket...`);
        console.log('━'.repeat(60));

        // Build issue data
        const issueData: any = {
            fields: {
                project: {
                    key: params.project
                },
                summary: params.summary,
                issuetype: {
                    name: params.type || 'Story'
                }
            }
        };

        // Add optional fields
        if (params.description) {
            issueData.fields.description = params.description;
        }

        if (params.parent) {
            issueData.fields.parent = {
                key: params.parent
            };
        }

        if (params.assignee) {
            issueData.fields.assignee = {
                emailAddress: params.assignee
            };
        }

        if (params.priority) {
            issueData.fields.priority = {
                name: params.priority
            };
        }

        if (params.labels) {
            issueData.fields.labels = params.labels.split(',').map((l: string) => l.trim());
        }

        console.log('Request details:');
        console.log(`  Project: ${params.project}`);
        console.log(`  Summary: ${params.summary}`);
        console.log(`  Type: ${params.type || 'Story'}`);
        if (params.parent) console.log(`  Parent: ${params.parent}`);
        if (params.assignee) console.log(`  Assignee: ${params.assignee}`);
        if (params.priority) console.log(`  Priority: ${params.priority}`);
        if (params.labels) console.log(`  Labels: ${params.labels}`);
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

createJiraTicket();
