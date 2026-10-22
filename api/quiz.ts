
type QuizQuestion = {
  prompt: string;
  answers: string[];
  correct: number;
  fact: string;
  fallback?: boolean;
};

const fallbackQuestions: Record<string, QuizQuestion[]> = {
  cosmic: [
    {
      prompt: "Which planet is known as the Red Planet?",
      answers: ["Earth", "Mars", "Jupiter", "Venus"],
      correct: 1,
      fact: "Mars appears red because its surface contains iron oxide."
    },
    {
      prompt: "Which star is closest to Earth?",
      answers: ["Sirius", "Polaris", "The Sun", "Vega"],
      correct: 2,
      fact: "The Sun is our nearest star and provides Earth with light and heat."
    },
    {
      prompt: "Which planet has the most prominent ring system?",
      answers: ["Mercury", "Saturn", "Mars", "Earth"],
      correct: 1,
      fact: "Saturn is famous for its spectacular rings made mainly of ice and rocky material."
    }
  ],
  wild: [
    {
      prompt: "Which is the largest land animal?",
      answers: ["Giraffe", "African elephant", "Rhinoceros", "Hippopotamus"],
      correct: 1,
      fact: "The African elephant is the largest living land animal."
    },
    {
      prompt: "What do caterpillars usually become?",
      answers: ["Frogs", "Butterflies or moths", "Fish", "Lizards"],
      correct: 1,
      fact: "Many caterpillars transform into butterflies or moths through metamorphosis."
    },
    {
      prompt: "Which animal is known for carrying its baby in a pouch?",
      answers: ["Kangaroo", "Tiger", "Horse", "Wolf"],
      correct: 0,
      fact: "Kangaroos are marsupials, and females carry their young in a pouch."
    }
  ],
  ocean: [
    {
      prompt: "Which is the largest animal in the world?",
      answers: ["Great white shark", "Blue whale", "Giant squid", "Dolphin"],
      correct: 1,
      fact: "The blue whale is the largest known animal to have ever lived."
    },
    {
      prompt: "What do fish primarily use to breathe underwater?",
      answers: ["Lungs", "Gills", "Fins", "Scales"],
      correct: 1,
      fact: "Gills extract dissolved oxygen from water."
    },
    {
      prompt: "Which ocean is the largest?",
      answers: ["Atlantic", "Indian", "Arctic", "Pacific"],
      correct: 3,
      fact: "The Pacific Ocean is the largest and deepest ocean on Earth."
    }
  ],
  inventor: [
    {
      prompt: "Which simple machine is used to lift a flag up a flagpole?",
      answers: ["Pulley", "Wedge", "Screw", "Wheel and axle"],
      correct: 0,
      fact: "A pulley helps raise and lower a flag using a rope."
    },
    {
      prompt: "Which component stores electrical energy in a circuit?",
      answers: ["Switch", "Capacitor", "Wire", "Bulb"],
      correct: 1,
      fact: "A capacitor stores energy in an electric field."
    },
    {
      prompt: "What is the main function of a computer's CPU?",
      answers: [
        "Print documents",
        "Process instructions",
        "Display pictures",
        "Store files permanently"
      ],
      correct: 1,
      fact: "The CPU executes instructions and performs calculations."
    }
  ]
};

function getFallback(world: string): QuizQuestion {
  const questions = fallbackQuestions[world] ?? fallbackQuestions.cosmic;
  const question = questions[Math.floor(Math.random() * questions.length)];

  return {
    ...question,
    answers: [...question.answers],
    fallback: true
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const world =
    typeof req.body?.world === "string" ? req.body.world : "cosmic";

  const difficulty =
    typeof req.body?.difficulty === "string"
      ? req.body.difficulty
      : "medium";

  const topics: Record<string, string> = {
    cosmic: "space, planets, astronomy and the universe",
    wild: "wildlife, animals and nature",
    ocean: "oceans, marine life and underwater science",
    inventor: "science, inventions, technology and engineering"
  };

  // Unknown world: return a safe built-in question.
  if (!topics[world]) {
    return res.status(200).json(getFallback("cosmic"));
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Keep the game playable even if the API key is missing.
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return res.status(200).json(getFallback(world));
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    `Create exactly one original, family-friendly educational multiple-choice question about ${topics[world]}. ` +
                    `Difficulty: ${difficulty}. ` +
                    'Return only valid JSON with fields: "prompt" (string), "answers" (exactly 4 short strings), ' +
                    '"correct" (integer 0-3), and "fact" (one-sentence explanation). ' +
                    "Exactly one answer must be correct. Avoid ambiguous questions."
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API status:", response.status, "error:", errorBody);

      // Return a playable question instead of breaking the quiz.
      return res.status(200).json(getFallback(world));
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      console.error("Gemini response did not contain question text.");
      return res.status(200).json(getFallback(world));
    }

    let question: QuizQuestion;

    try {
      question = JSON.parse(text);
    } catch {
      console.error("Gemini returned invalid JSON.");
      return res.status(200).json(getFallback(world));
    }

    const valid =
      typeof question.prompt === "string" &&
      question.prompt.trim().length > 0 &&
      Array.isArray(question.answers) &&
      question.answers.length === 4 &&
      question.answers.every(
        (answer: unknown) =>
          typeof answer === "string" && answer.trim().length > 0
      ) &&
      Number.isInteger(question.correct) &&
      question.correct >= 0 &&
      question.correct <= 3 &&
      typeof question.fact === "string" &&
      question.fact.trim().length > 0;

    if (!valid) {
      console.error("Gemini returned an invalid question structure.");
      return res.status(200).json(getFallback(world));
    }

    return res.status(200).json({
      prompt: question.prompt,
      answers: question.answers,
      correct: question.correct,
      fact: question.fact,
      fallback: false
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return res.status(200).json(getFallback(world));
  }
}
