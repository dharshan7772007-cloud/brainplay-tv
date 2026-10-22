
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' })
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return res.status(500).json({
      error: 'Gemini API key is not configured on the server.',
    })
  }

  const { world, difficulty } = req.body ?? {}

  const topics: Record<string, string> = {
    cosmic: 'space, planets, astronomy and Mars exploration',
    wild: 'wildlife, ecosystems, nature and biodiversity',
    ocean: 'ocean science, marine animals and pollution prevention',
    inventor: 'science, engineering, inventions and experiments',
  }

  if (!topics[world]) {
    return res.status(400).json({ error: 'Invalid world.' })
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=' +
        encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create exactly one original, educational multiple-choice quiz question about ${topics[world]} for a family-friendly TV learning game. Difficulty: ${difficulty || 'medium'}. Return only valid JSON with these fields: "prompt" (string), "answers" (array of exactly 4 short strings), "correct" (integer 0 to 3), "fact" (one-sentence explanation). Make exactly one answer correct. Avoid ambiguous questions.`
            }]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.8,
          },
        }),
      }
    )

    if (!response.ok) {
      console.error('Gemini API status:', response.status)
      return res.status(502).json({ error: 'AI question generation failed.' })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return res.status(502).json({ error: 'AI returned no question.' })
    }

    const question = JSON.parse(text)

    if (
      typeof question.prompt !== 'string' ||
      !Array.isArray(question.answers) ||
      question.answers.length !== 4 ||
      !question.answers.every((answer: unknown) => typeof answer === 'string') ||
      !Number.isInteger(question.correct) ||
      question.correct < 0 ||
      question.correct > 3 ||
      typeof question.fact !== 'string'
    ) {
      return res.status(502).json({ error: 'AI returned an invalid question.' })
    }

    return res.status(200).json(question)
  } catch (error) {
    console.error('Quiz generation error:', error)
    return res.status(502).json({ error: 'Could not generate an AI question.' })
  }
}
