// Load environment variables from .env.local first, then .env
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const port = 3001

// Enable CORS for localhost development
app.use(cors({
  origin: true,
  credentials: true
}))

// Parse JSON bodies
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ember AI proxy server is running' })
})

// Reflect endpoint - proxy to Claude API
app.post('/api/reflect', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file.' 
      })
    }

    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(500).json({ 
        error: 'Invalid Anthropic API key format. API key should start with "sk-ant-".' 
      })
    }

    console.log('Proxying request to Claude API...')

    // Forward request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    console.log('Claude API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      return res.status(response.status).json({ 
        error: `Claude API error: ${response.status} ${response.statusText}`,
        details: errorText
      })
    }

    const data = await response.json()
    console.log('Successfully received response from Claude API')
    
    res.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Proxy server error', 
      message: error.message 
    })
  }
})

app.listen(port, () => {
  console.log(`🚀 Ember AI proxy server running on http://localhost:${port}`)
  console.log(`📋 Health check: http://localhost:${port}/health`)
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY not found in environment variables')
  } else {
    console.log('✅ Anthropic API key loaded')
  }
})