# Gemini API Setup Guide

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key

## Step 2: Add API Key to Environment

Open `client/.env` and replace `your_gemini_api_key_here` with your actual API key:

```
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

## Step 3: Restart Your Development Server

```bash
cd client
npm run dev
```

## How to Use

### AI Generate Jobs
1. Click "Bulk Import" button in dashboard
2. In the purple AI section, type a prompt like:
   - "10 software engineering jobs at FAANG companies"
   - "5 remote frontend developer positions"
   - "Tech jobs in San Francisco with high salaries"
3. Click "Generate" and wait
4. Review the generated JSON
5. Click "Import Jobs" to add them

### Manual JSON Import
- Paste JSON directly in the textarea
- Click "Import Jobs"

## Example Prompts

- "10 software engineering jobs at top tech companies"
- "5 remote React developer positions with good salaries"
- "Backend engineer jobs at startups in Silicon Valley"
- "Data science roles at FAANG companies"
- "Full-stack developer positions in New York"

## Troubleshooting

**Error: "Failed to generate jobs"**
- Check if your API key is correct in `.env`
- Make sure you restarted the dev server after adding the key
- Verify your Gemini API quota hasn't been exceeded

**Error: "Invalid JSON format"**
- The AI sometimes adds markdown formatting
- The code automatically cleans this, but if it fails, manually remove ``` markers

## API Limits

Gemini Pro Free Tier:
- 60 requests per minute
- Plenty for personal use!
