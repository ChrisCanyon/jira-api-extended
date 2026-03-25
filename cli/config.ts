// Environment variable configuration and validation
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env file if it exists
function loadEnv() {
    try {
        const envPath = resolve(process.cwd(), '.env');
        const envFile = readFileSync(envPath, 'utf-8');
        envFile.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    process.env[key.trim()] = value;
                }
            }
        });
    } catch (error) {
        // .env file doesn't exist, that's okay
    }
}

// Load environment variables on import
loadEnv();

export interface JiraConfig {
    email: string;
    token: string;
    url: string;
}

export function getJiraConfig(): JiraConfig {
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_TOKEN;
    const url = process.env.JIRA_URL;

    const missing: string[] = [];

    if (!email) missing.push('JIRA_EMAIL');
    if (!token) missing.push('JIRA_TOKEN');
    if (!url) missing.push('JIRA_URL');

    if (missing.length > 0) {
        console.error('❌ Error: Missing required environment variables:');
        missing.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\nPlease set these environment variables:');
        console.error('   export JIRA_EMAIL="your.email@example.com"');
        console.error('   export JIRA_TOKEN="your-jira-api-token"');
        console.error('   export JIRA_URL="https://your-domain.atlassian.net"');
        console.error('\nOr create a .env file in the project root with these values.');
        process.exit(1);
    }

    return {
        email: email!,
        token: token!,
        url: url!
    };
}

export function validateTicketKey(key: string): boolean {
    // Jira ticket format: PROJECT-NUMBER (e.g., OS-14448)
    const ticketPattern = /^[A-Z]+-\d+$/;
    return ticketPattern.test(key);
}
