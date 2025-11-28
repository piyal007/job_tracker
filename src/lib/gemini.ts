import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Model Configuration - Change this to use different models
// Options: 'gemini-2.5-pro' (most advanced available), 'gemini-2.5-flash' (fast)
// Note: Gemini 3 is not yet available in the API
const MODEL_NAME = 'gemini-2.5-pro';

export const generateJobsFromPrompt = async (prompt: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const fullPrompt = `${prompt}

Please respond with ONLY a valid JSON array of job objects. Each job should have these fields:
- company (string)
- title (string)
- location (string)
- salary (string, optional)
- jobType (string: "Remote", "Hybrid", or "Onsite")
- jobNature (string: "Full time", "Part time", "Contract", etc.)
- status (string: "applied")

Example format:
[
  {
    "company": "Google",
    "title": "Software Engineer",
    "location": "Mountain View, CA",
    "salary": "$150k-$200k",
    "jobType": "Remote",
    "jobNature": "Full time",
    "status": "applied"
  }
]

Return ONLY the JSON array, no additional text or markdown formatting.`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response - remove markdown code blocks if present
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```\n?/g, '');
        }

        // Parse and return the JSON
        const jobs = JSON.parse(cleanedText);
        return { success: true, data: jobs };
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        const errorMsg = error.message || 'Failed to generate jobs';

        // Provide helpful error messages
        if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key')) {
            return {
                success: false,
                error: 'Invalid API key. Get a new one from https://aistudio.google.com/app/apikey'
            };
        }
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
            return {
                success: false,
                error: 'Model not available. Your API key might not have access to Gemini 1.5. Try creating a new API key at https://aistudio.google.com/app/apikey'
            };
        }
        if (errorMsg.includes('PERMISSION_DENIED')) {
            return {
                success: false,
                error: 'Permission denied. Make sure Gemini API is enabled for your API key.'
            };
        }

        return { success: false, error: `Error: ${errorMsg}` };
    }
};

export const generateJobsWithContext = async (prompt: string, existingJobs: any[], existingPortals: any[]) => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const contextPrompt = `You are a job tracking assistant. Here is the user's current data:

EXISTING JOBS (${existingJobs.length} total):
${JSON.stringify(existingJobs.slice(0, 10), null, 2)}

EXISTING JOB PORTALS (${existingPortals.length} total):
${JSON.stringify(existingPortals, null, 2)}

TABLE STRUCTURE:
Jobs table has these fields: id, title, company, location, salary, status (applied/screening/interview/offer/rejected), date, jobNature (Full time/Part time/Contract/etc), jobType (Remote/Hybrid/Onsite), jobLink, email, comments

User's request: ${prompt}

Based on the user's existing data and request, generate appropriate job entries in JSON format. 
- Avoid duplicating companies already in the list unless specifically requested
- Match the style and format of existing entries
- Consider the user's job search patterns

Return ONLY a valid JSON array of job objects with these fields:
[
  {
    "company": "string",
    "title": "string",
    "location": "string",
    "salary": "string",
    "jobType": "Remote/Hybrid/Onsite",
    "jobNature": "Full time/Part time/Contract",
    "status": "applied"
  }
]`;

        const result = await model.generateContent(contextPrompt);
        const response = await result.response;
        const text = response.text();

        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```\n?/g, '');
        }

        const jobs = JSON.parse(cleanedText);
        return { success: true, data: jobs };
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return { success: false, error: error.message || 'Failed to generate jobs with context' };
    }
};

export const chatWithData = async (userMessage: string, jobs: any[], portals: any[], chatHistory: Array<{ role: string, content: string }>) => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const contextPrompt = `You are a helpful job tracking assistant with the ability to add jobs to the tracker.

CURRENT JOBS DATA (${jobs.length} total):
${JSON.stringify(jobs, null, 2)}

JOB PORTALS DATA (${portals.length} total):
${JSON.stringify(portals, null, 2)}

CONVERSATION HISTORY:
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User: ${userMessage}

IMPORTANT: You have the following powers (all require user approval):

1. ADD JOBS - Format:
[ACTION:ADD_JOBS]
\`\`\`json
[{"company": "Name", "title": "Title", "location": "Location", "salary": "$X", "jobType": "Remote", "jobNature": "Full time", "status": "applied"}]
\`\`\`
[/ACTION:ADD_JOBS]

2. UPDATE JOB - Format:
[ACTION:UPDATE_JOB]
\`\`\`json
{"id": "job_id", "updates": {"status": "interview", "salary": "$150k"}}
\`\`\`
[/ACTION:UPDATE_JOB]

3. DELETE JOBS - Format:
[ACTION:DELETE_JOBS]
\`\`\`json
{"ids": ["job_id_1", "job_id_2"], "reason": "Rejected/Duplicate/etc"}
\`\`\`
[/ACTION:DELETE_JOBS]

4. BULK UPDATE - Format:
[ACTION:BULK_UPDATE]
\`\`\`json
{"filter": {"company": "Google"}, "updates": {"status": "rejected"}}
\`\`\`
[/ACTION:BULK_UPDATE]

Always explain what you're doing and why. The user will approve/reject each action.

You can help with:
- Adding jobs directly to the tracker (with user approval)
- Analyzing job application patterns
- Suggesting which companies to follow up with
- Identifying gaps in applications
- Providing statistics about applications
- Suggesting next steps

Respond in a helpful, conversational way.`;

        const result = await model.generateContent(contextPrompt);
        const response = result.response;
        const text = response.text();

        // Check for different action types
        const actions = [
            { type: 'add_jobs', pattern: /\[ACTION:ADD_JOBS\]([\s\S]*?)\[\/ACTION:ADD_JOBS\]/, key: 'jobsToAdd' },
            { type: 'update_job', pattern: /\[ACTION:UPDATE_JOB\]([\s\S]*?)\[\/ACTION:UPDATE_JOB\]/, key: 'updateData' },
            { type: 'delete_jobs', pattern: /\[ACTION:DELETE_JOBS\]([\s\S]*?)\[\/ACTION:DELETE_JOBS\]/, key: 'deleteData' },
            { type: 'bulk_update', pattern: /\[ACTION:BULK_UPDATE\]([\s\S]*?)\[\/ACTION:BULK_UPDATE\]/, key: 'bulkData' }
        ];

        for (const action of actions) {
            const match = text.match(action.pattern);
            if (match) {
                const jsonMatch = match[1].match(/```json\n?([\s\S]*?)```/);
                if (jsonMatch) {
                    try {
                        const actionData = JSON.parse(jsonMatch[1].trim());
                        return {
                            success: true,
                            data: text,
                            action: action.type,
                            [action.key]: actionData
                        };
                    } catch (e) {
                        console.error('Failed to parse action data:', e);
                    }
                }
            }
        }

        return { success: true, data: text };
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return { success: false, error: error.message || 'Failed to chat' };
    }
};

export const analyzeJobDescription = async (jobDescription: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `Analyze this job description and extract key information in JSON format:

${jobDescription}

Return ONLY a JSON object with these fields:
{
  "company": "company name",
  "title": "job title",
  "location": "location",
  "salary": "salary range if mentioned",
  "jobType": "Remote/Hybrid/Onsite",
  "jobNature": "Full time/Part time/Contract",
  "skills": ["skill1", "skill2"],
  "requirements": ["req1", "req2"]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```\n?/g, '');
        }

        const analysis = JSON.parse(cleanedText);
        return { success: true, data: analysis };
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return { success: false, error: error.message || 'Failed to analyze job' };
    }
};
