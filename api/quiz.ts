
const fallbackQuestions: Record<string, Array<{
  prompt: string;
  answers: string[];
  correct: number;
  fact: string;
}>> = {
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
      fact: "Saturn's spectacular rings are made mainly of ice and rocky material.",
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
      prompt: "What do caterpillars turn into?",
      answers: ["Frogs", "Butterflies or moths", "Fish", "Spiders"],
      correct: 1,
      fact: "Many caterpillars transform into butterflies or moths.",
    },
    {
      prompt: "Which animal is known for changing its skin colour?",
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
      prompt: "What do fish primarily use to breathe underwater?",
      answers: ["Lungs", "Gills", "Skin only", "Fins"],
      correct: 1,
      fact: "Most fish use gills to extract dissolved oxygen from water.",
    },
    {
      prompt: "Which ocean is the largest?",
      answers: ["Indian", "Atlantic", "Pacific", "Arctic"],
      correct: 2,
      fact: "The Pacific Ocean is the largest ocean on Earth.",
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
      prompt: "Which material is a good electrical conductor?",
      answers: ["Rubber", "Copper", "Dry wood", "Plastic"],
      correct: 1,
      fact: "Copper is widely used in electrical wiring because it conducts electricity well.",
    },
    {
      prompt: "What converts electrical energy into motion in a motor?",
      answers: ["Electric motor", "Thermometer", "Compass", "Barometer"],
      correct: 0,
      fact: "An electric motor converts electrical energy into mechanical motion.",
    },
  ],
};

function getFallback(world: string) {
  const questions = fallbackQuestions[world] || fallbackQuestions.cosmic;
  const question = questions[Math.floor(Math.random() * questions.length)];

  return { ...question, fallback: true };
}

function validQuestion(value: any): boolean {
  return (
    value &&
    typeof value.prompt === "string" &&
    value.prompt.trim().length > 0 &&
    Array.isArray(value.answers) &&
    value.answers.length === 4 &&
    value.answers.every(
      (answer: unknown) =>
        typeof answer === "string" && answer.trim().length > 0
    ) &&
    Number.isInteger(value.correct) &&
    value.correct >= 0 &&
    value.correct < 4 &&
    typeof value.fact === "string" &&
    value.fact.trim().length > 0
  );
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return res.status(200).json(
      getFallback(String(req.body?.world || "cosmic"))
    );
  }

  const requestedWorld = String(req.body?.world || "cosmic").toLowerCase();
  const world = fallbackQuestions[requestedWorld] ? requestedWorld : "cosmic";
  const difficulty = String(req.body?.difficulty || "medium");

  const topics: Record<string, string> = {
    cosmic: "space, astronomy, planets, stars and the universe",
    wild: "wildlife, animals, ecosystems and nature",
    ocean: "oceans, marine animals, underwater science and sea life",
    inventor: "inventions, engineering, science and technology",
  };

  const prompt = `
Create exactly ONE original multiple-choice quiz question.

World: ${world}
Topic: ${topics[world]}
Difficulty: ${difficulty}

Return ONLY a valid JSON object with these fields:
{
  "prompt": "The question",
  "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correct": 0,
  "fact": "One short, accurate educational fact"
}

Rules:
- Exactly four distinct answer options.
- "correct" is a zero-based integer from 0 to 3.
- Exactly one option must be correct.
- The fact must be accurate and relevant.
- Do not include Markdown or additional text.
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
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8,
            maxOutputTokens: 500,
          },
        }),
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Gemini API status:",
        response.status,
        errorText.slice(0, 1500)
      );

      return res.status(200).json(getFallback(world));
    }

    const data: any = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("")
      .trim();

    if (!generatedText) {
      console.error("Gemini returned no generated text.");
      return res.status(200).json(getFallback(world));
    }

    let question: any;

    try {
      question = JSON.parse(generatedText);
    } catch {
      const cleaned = generatedText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      question = JSON.parse(cleaned);
    }

    if (!validQuestion(question)) {
      console.error("Gemini returned an invalid quiz structure.");
      return res.status(200).json(getFallback(world));
    }

    return res.status(200).json({
      prompt: question.prompt.trim(),
      answers: question.answers.map((answer: string) => answer.trim()),
      correct: question.correct,
      fact: question.fact.trim(),
      fallback: false,
    });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return res.status(200).json(getFallback(world));
  }
}
