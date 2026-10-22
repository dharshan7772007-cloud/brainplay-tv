
const fallbackQuestions: Record<
  string,
  { prompt: string; answers: string[]; correct: number; fact: string }[]
> = {
  cosmic: [
    { prompt: "Which planet is known as the Red Planet?", answers: ["Earth", "Mars", "Jupiter", "Venus"], correct: 1, fact: "Mars appears red because its surface contains iron oxide." },
    { prompt: "Which planet has the most prominent ring system?", answers: ["Mercury", "Saturn", "Mars", "Earth"], correct: 1, fact: "Saturn's rings are made mainly of ice and rocky material." },
    { prompt: "What is the closest star to Earth?", answers: ["Sirius", "The Sun", "Polaris", "Proxima Centauri"], correct: 1, fact: "The Sun is the closest star to Earth." },
  ],
  wild: [
    { prompt: "Which is the largest land animal?", answers: ["Giraffe", "African elephant", "Rhinoceros", "Hippopotamus"], correct: 1, fact: "The African elephant is the largest living land animal." },
    { prompt: "What can a caterpillar transform into?", answers: ["Frog", "Butterfly or moth", "Fish", "Spider"], correct: 1, fact: "Many caterpillars transform into butterflies or moths." },
    { prompt: "Which animal can change its skin colour?", answers: ["Camel", "Chameleon", "Panda", "Zebra"], correct: 1, fact: "Chameleons can change colour for communication and other purposes." },
  ],
  ocean: [
    { prompt: "Which is the largest animal on Earth?", answers: ["Great white shark", "Blue whale", "Giant squid", "Dolphin"], correct: 1, fact: "The blue whale is the largest known animal to have ever lived." },
    { prompt: "What do most fish use to breathe underwater?", answers: ["Lungs", "Gills", "Fins", "Scales"], correct: 1, fact: "Most fish use gills to extract oxygen dissolved in water." },
    { prompt: "Which is the largest ocean?", answers: ["Indian", "Atlantic", "Pacific", "Arctic"], correct: 2, fact: "The Pacific is Earth's largest ocean." },
  ],
  inventor: [
    { prompt: "Which simple machine uses a fulcrum?", answers: ["Lever", "Pulley", "Screw", "Wedge"], correct: 0, fact: "A lever rotates around a fixed point called a fulcrum." },
    { prompt: "Which material conducts electricity well?", answers: ["Rubber", "Copper", "Dry wood", "Plastic"], correct: 1, fact: "Copper is widely used in electrical wiring because it conducts electricity well." },
    { prompt: "What converts electrical energy into motion?", answers: ["Electric motor", "Thermometer", "Compass", "Barometer"], correct: 0, fact: "An electric motor converts electrical energy into mechanical motion." },
  ],
};

function getFallback(world: string, errorCode: string) {
  const list = fallbackQuestions[world] || fallbackQuestions.cosmic;
  const q = list[Math.floor(Math.random() * list.length)];
  return { ...q, fallback: true, errorCode };
}

function isValidQuestion(q: any): boolean {
  return !!q &&
    typeof q.prompt === "string" && q.prompt.trim().length > 0 &&
    Array.isArray(q.answers) && q.answers.length === 4 &&
    q.answers.every((a: unknown) => typeof a === "string" && a.trim().length > 0) &&
    new Set(q.answers.map((a: string) => a.trim().toLowerCase())).size === 4 &&
    Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4 &&
    typeof q.fact === "string" && q.fact.trim().length > 0;
}

function classifyApiError(status: number): string {
  if (status === 400) return "GEMINI_BAD_REQUEST";
  if (status === 401 || status === 403) return "GEMINI_AUTH_ERROR";
  if (status === 404) return "GEMINI_MODEL_NOT_FOUND";
  if (status === 429) return "GEMINI_QUOTA_OR_RATE_LIMIT";
  if (status >= 500) return "GEMINI_SERVER_ERROR";
  return "GEMINI_HTTP_ERROR";
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
  const difficulty = ["easy", "medium", "hard"].includes(
    String(body.difficulty || "medium").toLowerCase()
  ) ? String(body.difficulty || "medium").toLowerCase() : "medium";

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[quiz] GEMINI_API_KEY is missing in the deployment environment.");
    return res.status(200).json(getFallback(world, "MISSING_API_KEY"));
  }

  const topics: Record<string, string> = {
    cosmic: "space, astronomy, planets, stars and the universe",
    wild: "wildlife, animals, ecosystems and nature",
    ocean: "oceans, marine animals and underwater science",
    inventor: "inventions, engineering, science and technology",
  };

  const prompt = `Create exactly one original ${difficulty} multiple-choice quiz question about ${topics[world]}.

Return only a JSON object with these fields:
{
  "prompt": "Question text",
  "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correct": 0,
  "fact": "One short accurate educational fact"
}

Rules:
- Exactly four distinct answers.
- correct is the zero-based index of the one correct answer.
- Keep the question suitable for a general audience.
- No Markdown or text outside the JSON object.`;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const response = await fetch(url, {
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
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const details = (await response.text()).slice(0, 1200);
      const errorCode = classifyApiError(response.status);

      // Never log the API key.
      console.error(`[quiz] ${errorCode}; HTTP ${response.status}; model=${model}; details=${details}`);
      return res.status(200).json(getFallback(world, errorCode));
    }

    const data: any = await response.json();
    const candidate = data?.candidates?.[0];
    const generatedText = (candidate?.content?.parts || [])
      .map((part: any) => typeof part.text === "string" ? part.text : "")
      .join("")
      .trim();

    if (!generatedText) {
      const reason = candidate?.finishReason || "NO_TEXT";
      console.error(`[quiz] GEMINI_EMPTY_RESPONSE; finishReason=${reason}`);
      return res.status(200).json(getFallback(world, "GEMINI_EMPTY_RESPONSE"));
    }

    let question: any;

    try {
      const cleaned = generatedText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      question = JSON.parse(cleaned);
    } catch {
      console.error("[quiz] GEMINI_INVALID_JSON; response could not be parsed.");
      return res.status(200).json(getFallback(world, "GEMINI_INVALID_JSON"));
    }

    if (!isValidQuestion(question)) {
      console.error("[quiz] GEMINI_INVALID_QUESTION; response did not match the required schema.");
      return res.status(200).json(getFallback(world, "GEMINI_INVALID_QUESTION"));
    }

    return res.status(200).json({
      prompt: question.prompt.trim(),
      answers: question.answers.map((a: string) => a.trim()),
      correct: question.correct,
      fact: question.fact.trim(),
      fallback: false,
    });
  } catch (error: any) {
    const errorCode =
      error?.name === "TimeoutError" || error?.name === "AbortError"
        ? "GEMINI_TIMEOUT"
        : "GEMINI_NETWORK_ERROR";

    console.error(`[quiz] ${errorCode}; ${error?.message || "Unknown request error"}`);
    return res.status(200).json(getFallback(world, errorCode));
  }
}
