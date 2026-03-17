# AI Reflection Setup

The AI Reflection feature uses a simple Express proxy server to handle Claude API calls and avoid CORS issues.

## Running the Application

You need to run both the Express server and the Vite dev server:

### 1. Start the AI Proxy Server
```bash
npm run server
```
This starts the Express server on `http://localhost:3001`

### 2. Start the React App (in a separate terminal)
```bash
npm run dev
```
This starts the Vite dev server (usually on `http://localhost:5173` or similar)

## Environment Variables

Make sure your `.env.local` file contains:

```bash
# For the Express server
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# For the React app (keeping for compatibility)
VITE_ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

## API Endpoints

The Express server provides:
- `GET /health` - Health check endpoint
- `POST /api/reflect` - Proxy to Claude API for AI reflections

## How It Works

1. User clicks "Reflect on your moments" in the React app
2. React app sends request to `http://localhost:3001/api/reflect`
3. Express server forwards request to Claude API with proper authentication
4. Response is returned to the React app for display

This setup avoids CORS issues and keeps the API key secure on the server side.