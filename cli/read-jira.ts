#!/usr/bin/env node
import JiraAPI from '../api/main';
import { getJiraConfig, validateTicketKey } from './config';

// Get ticket key from command line arguments
const ticketKey = process.argv[2];

if (!ticketKey) {
    console.error('❌ Error: Please provide a ticket key');
    console.error('Usage: npm run read-jira <TICKET-KEY>');
    console.error('Example: npm run read-jira OS-14448');
    process.exit(1);
}

if (!validateTicketKey(ticketKey)) {
    console.error(`❌ Error: Invalid ticket key format: ${ticketKey}`);
    console.error('Expected format: PROJECT-NUMBER (e.g., OS-14448)');
    process.exit(1);
}

async function readJiraTicket() {
    try {
        // Get config from environment variables
        const config = getJiraConfig();

        // Initialize Jira API
        const jira = new JiraAPI(config);

        console.log(`\n📖 Reading Jira ticket: ${ticketKey}`);
        console.log('━'.repeat(60));

        // Fetch the issue
        const issue = await jira.issues.get(ticketKey);

        if (issue.error) {
            console.error(`\n❌ Error: ${issue.error}`);
            process.exit(1);
        }

        // Display issue details
        console.log(`\n🎫 Key: ${issue.key}`);
        console.log(`📝 Summary: ${issue.fields?.summary}`);
        console.log(`📊 Status: ${issue.fields?.status?.name}`);
        console.log(`🏷️  Type: ${issue.fields?.issuetype?.name}`);
        console.log(`📌 Priority: ${issue.fields?.priority?.name || 'None'}`);

        if (issue.fields?.assignee) {
            console.log(`👤 Assignee: ${issue.fields.assignee.displayName} (${issue.fields.assignee.emailAddress})`);
        } else {
            console.log(`👤 Assignee: Unassigned`);
        }

        if (issue.fields?.reporter) {
            console.log(`📢 Reporter: ${issue.fields.reporter.displayName}`);
        }

        // Parent/Epic information
        if (issue.fields?.parent) {
            console.log(`📂 Parent: ${issue.fields.parent.key} - ${issue.fields.parent.fields?.summary}`);
        }

        // Fix versions
        if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
            const versions = issue.fields.fixVersions.map((v: any) => v.name).join(', ');
            console.log(`🏁 Fix Versions: ${versions}`);
        }

        // Labels
        if (issue.fields?.labels && issue.fields.labels.length > 0) {
            console.log(`🏷️  Labels: ${issue.fields.labels.join(', ')}`);
        }

        // Description
        if (issue.fields?.description) {
            console.log(`\n📄 Description:`);
            console.log('─'.repeat(60));
            // Handle both string and ADF (Atlassian Document Format) descriptions
            if (typeof issue.fields.description === 'string') {
                console.log(issue.fields.description);
            } else {
                console.log(JSON.stringify(issue.fields.description, null, 2));
            }
        }

        // Links
        console.log(`\n🔗 View in browser: ${config.url}/browse/${issue.key}`);
        console.log('━'.repeat(60));

    } catch (error) {
        console.error('\n❌ Failed to read ticket!');
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('Error:', error);
        }
        process.exit(1);
    }
}

readJiraTicket();
