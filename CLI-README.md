# Jira CLI Tools

Command-line interface for interacting with Jira via the API.

## Setup

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
JIRA_EMAIL=your.email@example.com
JIRA_TOKEN=your-jira-api-token
JIRA_URL=https://your-domain.atlassian.net
```

**Getting your Jira API token:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "CLI Access")
4. Copy the token to your `.env` file

### 2. Environment Variables Check

The CLI will automatically check if required environment variables are set and provide helpful error messages if they're missing:

```
❌ Error: Missing required environment variables:
   - JIRA_EMAIL
   - JIRA_TOKEN
   - JIRA_URL

Please set these environment variables:
   export JIRA_EMAIL="your.email@example.com"
   export JIRA_TOKEN="your-jira-api-token"
   export JIRA_URL="https://your-domain.atlassian.net"
```

## Commands

### Read Jira Ticket

Read and display details of a Jira ticket:

```bash
npm run read-jira <TICKET-KEY>
```

**Examples:**
```bash
npm run read-jira OS-14448
npm run read-jira PROJ-123
```

**Output includes:**
- Ticket key and summary
- Status and type
- Priority
- Assignee and reporter
- Parent epic (if applicable)
- Fix versions and labels
- Full description
- Browser link

### Create Jira Ticket

Create a new Jira ticket:

```bash
npm run create-jira -- --project <KEY> --summary "<text>" [options]
```

**Required Options:**
- `--project <KEY>` - Project key (e.g., OS)
- `--summary "<text>"` - Issue summary/title

**Optional Options:**
- `--parent <KEY>` - Parent epic/issue key (e.g., OS-14441)
- `--type <TYPE>` - Issue type (default: Story)
  - Options: Story, Task, Bug, Epic
- `--description "<text>"` - Issue description
- `--assignee <email>` - Assignee email address
- `--priority <PRIORITY>` - Priority (e.g., High, Medium, Low)
- `--labels "<labels>"` - Comma-separated labels

**Examples:**

Create a story in an epic:
```bash
npm run create-jira -- --project OS --parent OS-14441 --summary "Implement user login"
```

Create a bug with description:
```bash
npm run create-jira -- --project OS --type Bug --summary "Fix login error" --description "Users cannot log in"
```

Create a task with assignee:
```bash
npm run create-jira -- --project OS --type Task --summary "Review code" --assignee user@example.com
```

Create with all options:
```bash
npm run create-jira -- --project OS --parent OS-14441 --type Story --summary "Add feature" --description "Feature details here" --assignee user@example.com --priority High --labels "frontend,urgent"
```

**Help:**
```bash
npm run create-jira -- --help
```

### Create Jira Ticket from JSON (Recommended for Complex Tickets)

For complex tickets with detailed descriptions, custom fields, or when you want to reuse templates, use JSON files:

```bash
npm run create-jira-json <path-to-json-file>
```

**JSON File Format:**
```json
{
  "project": "OS",
  "summary": "Issue title",
  "type": "Story",
  "parent": "OS-14441",
  "description": "Issue details...",
  "assignee": "user@example.com",
  "priority": "High",
  "labels": ["frontend", "urgent"],
  "customFields": {
    "customfield_10001": "value",
    "customfield_10002": { "value": "option" }
  }
}
```

**Required Fields:**
- `project` - Project key (e.g., "OS")
- `summary` - Issue summary/title

**Optional Fields:**
- `type` - Issue type (Story, Task, Bug, Epic) - default: Story
- `parent` - Parent epic/issue key
- `description` - Issue description (string or Atlassian Document Format object)
- `assignee` - Assignee email address
- `priority` - Priority name (High, Medium, Low, etc.)
- `labels` - Array of label strings
- `customFields` - Object with custom field IDs and values

**Examples:**

Using a template from the templates directory:
```bash
npm run create-jira-json templates/story-with-epic.json
npm run create-jira-json templates/bug-report.json
npm run create-jira-json templates/feature-full.json
```

Using a custom JSON file:
```bash
npm run create-jira-json my-ticket.json
npm run create-jira-json ../tickets/feature-request.json
```

**Available Templates:**
- `templates/simple-story.json` - Basic story template
- `templates/story-with-epic.json` - Story linked to an epic
- `templates/bug-report.json` - Bug report with detailed info
- `templates/feature-full.json` - Full-featured story with all fields
- `templates/task-simple.json` - Simple task template

**Help:**
```bash
npm run create-jira-json --help
```

**Why use JSON?**
- ✅ Better for complex descriptions with formatting
- ✅ Reusable templates for common ticket types
- ✅ Support for custom fields
- ✅ Easier for Claude to generate and modify
- ✅ Version control friendly
- ✅ Can include multiline descriptions without escaping

## Usage with Claude

These CLI commands are designed to be easy for Claude to use. Claude can:

1. **Read tickets** to understand context:
   ```bash
   npm run read-jira OS-14448
   ```

2. **Create simple tickets** with command-line args:
   ```bash
   npm run create-jira -- --project OS --parent OS-14441 --summary "New feature" --description "Details"
   ```

3. **Create complex tickets** from JSON (recommended):
   ```bash
   npm run create-jira-json templates/feature-full.json
   ```

4. **Generate JSON files** for tickets on the fly, then create them:
   ```bash
   # Claude can write a JSON file with ticket details
   # Then run: npm run create-jira-json ticket.json
   ```

5. The commands provide clear output and error messages
6. Environment variables keep credentials secure and out of code

## Validation

The CLI includes built-in validation:

- ✅ Checks for required environment variables
- ✅ Validates ticket key format (e.g., PROJECT-123)
- ✅ Provides helpful error messages
- ✅ Confirms successful operations with ticket links

## Security Notes

- Never commit `.env` file to version control
- The `.env` file is already in `.gitignore`
- API tokens should be kept secure
- Use `.env.example` as a template for team members
