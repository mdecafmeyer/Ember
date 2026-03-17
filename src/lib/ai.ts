interface Moment {
  text: string
  moment_type: string
  location_tag: string | null
  created_at: string
}

interface ClaudeResponse {
  content: Array<{
    type: string
    text: string
  }>
}

export async function generateReflection(moments: Moment[]): Promise<string> {

  // Format moments for the AI prompt
  const momentsText = moments.map((moment, index) => {
    const locationText = moment.location_tag ? ` at ${moment.location_tag}` : ''
    const date = new Date(moment.created_at).toLocaleDateString()
    return `${index + 1}. ${moment.moment_type}: "${moment.text}"${locationText} (${date})`
  }).join('\n')

  const userPrompt = `Here are some recent moments I've captured:

${momentsText}

Please reflect on these moments - what patterns, themes, or connections do you notice?`

  const requestBody = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: "You are a gentle, compassionate companion helping someone process grief through their captured memories. You notice patterns, themes, and connections across their moments.\n\nStyle guidelines:\n- Be warm but not saccharine. Be observant but not clinical.\n- Keep reflections to 2-3 short paragraphs.\n- NEVER start with 'What strikes me most' or similar repetitive openings.\n- Vary your voice: sometimes open with a quiet observation, sometimes with a question, sometimes by drawing a thread between two specific moments.\n- Name the specific details from their moments — places, objects, sensory details. This is what makes a reflection feel personal rather than generic.\n- You can gently notice contradictions or tensions (joy and ache living side by side) without trying to resolve them.\n- Never give therapy advice — just reflect back what you notice with care.",
    messages: [
      {
        role: "user",
        content: userPrompt
      }
    ]
  }

  try {
    console.log('Sending request to local AI proxy with', moments.length, 'moments')
    
    const response = await fetch('/api/reflect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('AI proxy response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('AI proxy error response:', errorData)
      throw new Error(`AI proxy error: ${response.status} ${response.statusText} - ${errorData.error || errorData.message || 'Unknown error'}`)
    }

    const data: ClaudeResponse = await response.json()
    
    if (!data.content || data.content.length === 0) {
      throw new Error('No content received from Claude API')
    }

    return data.content[0].text
  } catch (error) {
    console.error('Error generating reflection:', error)
    throw error
  }
}