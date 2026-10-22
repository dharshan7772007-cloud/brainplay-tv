
const fallbackQuestions: Record<
  string,
  { prompt: string; answers: string[]; correct: number; fact: string }[]
> = {
  cosmic: [
    {
      prompt: "Which planet is known as the Red Planet?",
      answers: ["Earth", "Mars", "Jupiter", "Venus"],
      correct: 1,
      fact: "Mars appears red because its surface contains iron oxide.",
    },
    {
      prompt: "Which planet has the most prominent ring system?",
      answers: ["Mercury", "Saturn", "Mars", "Earth"],
      correct: 1,
      fact: "Saturn's rings are made mainly of ice and rocky material.",
    },
    {
      prompt: "What is the closest star to Earth?",
      answers: ["Sirius", "The Sun", "Polaris", "Proxima Centauri"],
      correct: 1,
      fact: "The Sun is the closest star to Earth.",
    },
  ],
  wild: [
    {
      prompt: "Which is the largest land animal?",
      answers: ["Giraffe", "African elephant", "Rhinoceros", "Hippopotamus"],
      correct: 1,
      fact: "The African elephant is the largest living land animal.",
    },
    {
      prompt: "What can a caterpillar transform into?",
      answers: ["Frog", "Butterfly or moth", "Fish", "Spider"],
      correct: 1,
      fact: "Many caterpillars transform into butterflies or moths.",
    },
    {
      prompt: "Which animal can change its skin colour?",
      answers: ["Camel", "Chameleon", "Panda", "Zebra"],
      correct: 1,
      fact: "Chameleons can change colour for communication and other purposes.",
    },
  ],
  ocean: [
    {
      prompt: "Which is the largest animal on Earth?",
      answers: ["Great white shark", "Blue whale", "Giant squid", "Dolphin"],
      correct: 1,
      fact: "The blue whale is the largest known animal to have ever lived.",
    },
    {
      prompt: "What do most fish use to breathe underwater?",
      answers: ["Lungs", "Gills", "Fins", "Scales"],
      correct: 1,
      fact: "Most fish use gills to extract oxygen dissolved in water.",
    },
    {
      prompt: "Which is the largest ocean?",
      answers: ["Indian", "Atlantic", "Pacific", "Arctic"],
      correct: 2,
      fact: "The Pacific is Earth's largest ocean.",
    },
  ],
  inventor: [
    {
      prompt: "Which simple machine uses a fulcrum?",
      answers: ["Lever", "Pulley", "Screw", "Wedge"],
      correct: 0,
      fact: "A lever rotates around a fixed point called a fulcrum.",
    },
    {
      prompt: "Which material conducts electricity well?",
      answers: ["Rubber", "Copper", "Dry wood", "Plastic"],
      correct: 1,
      fact: "Copper is widely used in electrical wiring because it conducts electricity well.",
    },
    {
      prompt: "What converts electrical energy into motion?",
      answers: ["Electric motor", "Thermometer", "Compass", "Barometer"],
      correct: 0,
      fact: "An electric motor converts electrical energy into mechanical motion.",
    },
  ],
};

function getFallback(world: string) {
  const list = fallbackQuestions[world] || fallbackQuestions.cosmic;
  const q = list[Math.floor(Math.random() * list.length)];
  return { ...q, fallback: true };
}

function isValidQuestion(q: any): boolean {
  return (
    q &&
    typeof q.prompt === "string" &&
    q.prompt.trim().length > 0 &&
    Array.isArray(q.answers) &&
    q.answers.length === 4 &&
    q.answers.every(
      (a: unknown) => typeof a === "string" && a.trim().length > 0
    ) &&
    Number.isInteger(q.correct) &&
    q.correct >= 0 &&
    q.correct < 4 &&
    typeof q.fact === "string" &&
    q.fact.trim().length > 0
  );
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const requestedWorld = String(body.world || "cosmic").toLowerCase();
  const world = fallbackQuestions[requestedWorld] ? requestedWorld : "cosmic";
  const difficulty = String(body.difficulty || "medium");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return res.status(200).json(getFallback(world));
  }

  const topics: Record<string, string> = {
    cosmic: "space, astronomy, planets, stars and the universe",
    wild: "wildlife, animals, ecosystems and nature",
    ocean: "oceans, marine animals and underwater science",
    inventor: "inventions, engineering, science and technology",
  };

  const prompt = `
Create exactly one original multiple-choice quiz question.

Topic: ${topics[world]}
Difficulty: ${difficulty}

Return one valid JSON object with exactly these fields:
{
  "prompt": "Question text",
  "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correct": 0,
  "fact": "One short accurate educational fact"
}

Requirements:
- Exactly four distinct answers.
- "correct" is the zero-based index of the correct answer (0 to 3).
- Exactly one answer is correct.
- Use concise wording.
- No Markdown or text outside the JSON object.
`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
            maxOutputTokens: 1200,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const details = await response.text();
      console.error("Gemini API error:", response.status, details.slice(0, 2000));
      return res.status(200).json(getFallback(world));
    }

    const data: any = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const generatedText = parts
      .map((part: any) => part.text || "")
      .join("")
      .trim();

    if (!generatedText) {
      console.error(
        "Gemini returned no text. Finish reason:",
        data?.candidates?.[0]?.finishReason
      );
      return res.status(200).json(getFallback(world));
    }

    let question: any;

    // Parse JSON, including responses wrapped in Markdown fences.
    const cleaned = generatedText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      question = JSON.parse(cleaned);
    } catch (error) {
      console.error(
        "Gemini returned malformed JSON:",
        cleaned.slice(0, 2000),
        error
      );
      return res.status(200).json(getFallback(world));
    }

    if (!isValidQuestion(question)) {
      console.error("Gemini returned an invalid quiz structure.");
      return res.status(200).json(getFallback(world));
    }

    return res.status(200).json({
      prompt: question.prompt.trim(),
      answers: question.answers.map((a: string) => a.trim()),
      correct: question.correct,
      fact: question.fact.trim(),
      fallback: false,
    });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return res.status(200).json(getFallback(world));
  }
}
