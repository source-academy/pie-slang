# LLM TODO Solver Setup

This project uses Google's Gemini API for LLM-powered TODO solving in Pie code.

## Setup Instructions

1. **Get a Google Gemini API Key**
   - Visit: https://ai.google.dev/gemini-api/docs/api-key
   - Sign in with your Google account
   - Create a new API key

2. **Configure the API Key**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and replace `your_google_api_key_here` with your actual API key:
     ```
     GOOGLE_API_KEY=your_actual_api_key_here
     ```

3. **Run Tests**
   ```bash
   npm test -- test_llm.ts
   ```

## Important Notes

- **Never commit `.env` file to git** - it's already in `.gitignore`
- The `.env.example` file is safe to commit (it has no real key)
- If you get an error about missing API key, make sure `.env` file exists and contains your key

## Free Tier Limits

Google Gemini free tier has rate limits:
- 10 requests per minute
- If you hit the limit, tests will fail with quota errors
- Wait a minute and try again

## Security

- Keep your API key private
- Don't share it in commits, screenshots, or public channels
- If accidentally exposed, regenerate a new key immediately
