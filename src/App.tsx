import { useEffect, useState } from 'react'
import './App.css'

type WorldId = 'cosmic' | 'wild' | 'ocean' | 'inventor'
type Screen = 'home' | 'mission' | 'result'
type Question = { prompt: string; answers: string[]; correct: number; fact: string }
type World = {
  id: WorldId; number: string; name: string; subtitle: string; category: string
  emoji: string; accent: string; planet: string; atmosphere: string; description: string
  questions: Question[]
}

const worlds: World[] = [
  {
    id: 'cosmic', number: '01', name: 'COSMIC FRONTIER', subtitle: 'Beyond the red horizon',
    category: 'SPACE EXPLORATION', emoji: 'ðŸš€', accent: '#ff8a5b', planet: 'mars',
    atmosphere: 'A new world is waiting.', description: 'Engineer a rover that can survive the rocky surface of Mars.',
    questions: [
      { prompt: 'Which wheel design helps a rover travel over loose sand?', answers: ['Narrow, smooth wheels', 'Wide wheels with good grip', 'Tiny glass wheels'], correct: 1, fact: 'Wider wheels spread the load and can improve flotation and traction on loose ground.' },
      { prompt: 'Why do Mars rovers use solar panels or batteries?', answers: ['To power their instruments', 'To change the planetâ€™s orbit', 'To make oxygen instantly'], correct: 0, fact: 'Rovers need electrical power for computers, cameras, heaters and scientific instruments.' },
      { prompt: 'What should a rover do before driving over an unknown rock field?', answers: ['Drive at full speed', 'Inspect the route and plan carefully', 'Turn off its cameras'], correct: 1, fact: 'Rovers use images and careful route planning to reduce risk in unfamiliar terrain.' },
    ],
  },
  {
    id: 'wild', number: '02', name: 'WILD EARTH', subtitle: 'The living planet',
    category: 'NATURE & ECOSYSTEMS', emoji: 'ðŸŒ¿', accent: '#69e6a6', planet: 'earth',
    atmosphere: 'Every species has a role.', description: 'Restore a fragile habitat by making smart ecosystem choices.',
    questions: [
      { prompt: 'What is a food chain mainly showing?', answers: ['How energy moves between organisms', 'How rocks form', 'How clouds are named'], correct: 0, fact: 'Food chains show how energy passes from producers to consumers.' },
      { prompt: 'Which action best protects a local habitat?', answers: ['Dumping waste in a stream', 'Planting native species', 'Removing every insect'], correct: 1, fact: 'Native plants support local wildlife and are adapted to local conditions.' },
      { prompt: 'Why are bees important to many ecosystems?', answers: ['They pollinate many plants', 'They create sunlight', 'They stop all rainfall'], correct: 0, fact: 'Pollinators help many flowering plants reproduce, supporting food webs and biodiversity.' },
    ],
  },
  {
    id: 'ocean', number: '03', name: 'OCEAN SECRETS', subtitle: 'Into the blue unknown',
    category: 'OCEAN SCIENCE', emoji: 'ðŸŒŠ', accent: '#68caff', planet: 'ocean',
    atmosphere: 'Dive deeper. Discover more.', description: 'Guide a research submersible and help keep the ocean healthy.',
    questions: [
      { prompt: 'Why is the deep ocean very dark?', answers: ['Sunlight does not reach most deep areas', 'The water absorbs every sound', 'There are no stars'], correct: 0, fact: 'Sunlight fades with depth; below the sunlit zone, photosynthesis is generally not possible.' },
      { prompt: 'Which choice reduces plastic pollution?', answers: ['Use single-use plastic more often', 'Reuse items and dispose of waste properly', 'Leave rubbish on beaches'], correct: 1, fact: 'Reducing, reusing and correctly disposing of plastics helps keep waste out of waterways.' },
      { prompt: 'What is coral?', answers: ['A living animal colony', 'A type of metal', 'A floating rock'], correct: 0, fact: 'Corals are animals that often build reefs, creating habitat for many marine species.' },
    ],
  },
  {
    id: 'inventor', number: '04', name: "INVENTOR'S LAB", subtitle: 'Ideas become reality',
    category: 'SCIENCE & ENGINEERING', emoji: 'âš™ï¸', accent: '#ffd166', planet: 'lab',
    atmosphere: 'Think. Test. Improve.', description: 'Solve engineering puzzles using evidence, design and iteration.',
    questions: [
      { prompt: 'What is the best first step when solving a design problem?', answers: ['Understand the problem and constraints', 'Build anything without a plan', 'Ignore the user'], correct: 0, fact: 'Good engineering starts by understanding the need, constraints and success criteria.' },
      { prompt: 'What does a fair test try to do?', answers: ['Change every variable at once', 'Change one factor while controlling others', 'Hide the results'], correct: 1, fact: 'Controlling variables helps us identify what caused a result.' },
      { prompt: 'What should you do when a prototype fails?', answers: ['Learn from the result and improve it', 'Never test again', 'Pretend it worked'], correct: 0, fact: 'Iteration turns test results into better designs.' },
    ],
  },
]

type SavedProgress = { xp: number; completed: WorldId[]; best: Record<string, number> }
const STORAGE_KEY = 'brainplay-cinematic-progress-v1'
const initialProgress: SavedProgress = { xp: 0, completed: [], best: {} }

function readProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialProgress
    const parsed = JSON.parse(raw) as SavedProgress
    return { xp: Number(parsed.xp) || 0, completed: Array.isArray(parsed.completed) ? parsed.completed : [], best: parsed.best || {} }
  } catch { return initialProgress }
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [activeWorldId, setActiveWorldId] = useState<WorldId>('cosmic')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answersCorrect, setAnswersCorrect] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | ''>('')
  const [progress, setProgress] = useState<SavedProgress>(readProgress)
  const [showCodex, setShowCodex] = useState(false)
  const [aiQuestion, setAiQuestion] = useState<Question | null>(null)
  const [isAiQuiz, setIsAiQuiz] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const activeWorld = worlds.find((world) => world.id === activeWorldId) ?? worlds[0]
  const question = isAiQuiz && aiQuestion ? aiQuestion : activeWorld.questions[questionIndex]
  const currentQuestionCount = isAiQuiz ? 1 : activeWorld.questions.length
  const level = Math.floor(progress.xp / 250) + 1
  const xpInLevel = progress.xp % 250
  const completedCount = progress.completed.length

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)) } catch { /* TV storage may be unavailable */ }
  }, [progress])

  useEffect(() => {
    function handleRemoteKey(event: KeyboardEvent) {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault()
        if (showCodex) { setShowCodex(false); return }
        if (screen !== 'home') { setScreen('home'); setFeedback(''); return }
      }
      const directions: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
      const direction = directions[event.key]
      if (!direction || screen === 'mission' && feedback !== '') return
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
        .filter((button) => button.getClientRects().length > 0)
      if (!buttons.length) return
      const active = document.activeElement
      const current = active instanceof HTMLButtonElement && buttons.includes(active) ? active : null
      if (!current) { event.preventDefault(); buttons[0].focus(); return }
      const a = current.getBoundingClientRect()
      const ax = a.left + a.width / 2, ay = a.top + a.height / 2
      let candidate: HTMLButtonElement | null = null, score = Infinity
      for (const button of buttons) {
        if (button === current) continue
        const r = button.getBoundingClientRect()
        const dx = r.left + r.width / 2 - ax, dy = r.top + r.height / 2 - ay
        const primary = direction === 'right' ? dx : direction === 'left' ? -dx : direction === 'down' ? dy : -dy
        const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx)
        if (primary <= 1) continue
        const distance = primary + secondary * 2.4
        if (distance < score) { score = distance; candidate = button }
      }
      if (candidate) { event.preventDefault(); candidate.focus() }
    }
    window.addEventListener('keydown', handleRemoteKey)
    return () => window.removeEventListener('keydown', handleRemoteKey)
  }, [screen, showCodex, feedback])

  async function startAiQuiz() {
    if (aiLoading) return
    setAiLoading(true)
    setAiError('')
    setIsAiQuiz(true)
    setAiQuestion(null)
    setQuestionIndex(0)
    setSelectedAnswer(null)
    setAnswersCorrect(0)
    setFeedback('')
    setShowCodex(false)

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ world: activeWorldId, difficulty: 'medium' }),
      })
      if (!response.ok) {
        const details = await response.text()
        throw new Error(details || `Quiz service returned ${response.status}`)
      }
      const data = await response.json()
      if (
        typeof data.prompt !== 'string' ||
        !Array.isArray(data.answers) ||
        data.answers.length !== 4 ||
        !Number.isInteger(data.correct) ||
        data.correct < 0 ||
        data.correct > 3 ||
        typeof data.fact !== 'string'
      ) {
        throw new Error('The quiz service returned an invalid question.')
      }
      setAiQuestion({
        prompt: data.prompt,
        answers: data.answers,
        correct: data.correct,
        fact: data.fact,
      })
      setScreen('mission')
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Could not load an AI question.')
    } finally {
      setAiLoading(false)
    }
  }

  function startWorld(id: WorldId) {
    setIsAiQuiz(false); setAiQuestion(null); setAiError('')
    setActiveWorldId(id); setQuestionIndex(0); setSelectedAnswer(null); setAnswersCorrect(0); setFeedback('')
    setShowCodex(false); setScreen('mission')
  }

  function chooseAnswer(index: number) {
    if (feedback) return
    setSelectedAnswer(index)
    if (index === question.correct) { setFeedback('correct'); setAnswersCorrect((n) => n + 1) }
    else setFeedback('wrong')
  }

  function continueMission() {
    if (feedback === 'wrong') { setSelectedAnswer(null); setFeedback(''); return }
    if (questionIndex < currentQuestionCount - 1) {
      setQuestionIndex((n) => n + 1); setSelectedAnswer(null); setFeedback('')
      return
    }
    const correctTotal = answersCorrect
    if (isAiQuiz) {
      setProgress((previous) => ({ ...previous, xp: previous.xp + (correctTotal > 0 ? 100 : 50) }))
      setScreen('result')
      return
    }
    const earned = 50 + correctTotal * 50
    setProgress((previous) => ({
      xp: previous.xp + earned,
      completed: previous.completed.includes(activeWorldId) ? previous.completed : [...previous.completed, activeWorldId],
      best: { ...previous.best, [activeWorldId]: Math.max(previous.best[activeWorldId] || 0, correctTotal) },
    }))
    setScreen('result')
  }

  function resetProgress() {
    setProgress(initialProgress)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

 
  return (
    <main className={`app-shell theme-${activeWorld.planet}`}>
      <div className="space-backdrop" aria-hidden="true"><span className="nebula nebula-a" /><span className="nebula nebula-b" /><span className="starfield" /><span className="horizon-glow" /></div>
      <header className="topbar">
        <button className="brand" onClick={() => { setScreen('home'); setShowCodex(false) }} aria-label="BrainPlay TV home">
          <span className="brand-mark">B<span>âœ¦</span></span><span className="brand-name">BRAINPLAY <i>TV</i></span>
        </button>
        <div className="top-nav"><span className="live-dot" /> LEARN â€¢ EXPLORE â€¢ LEVEL UP</div>
        <button className="player-chip" onClick={() => setShowCodex(true)}><span className="avatar">âœ¦</span><span>EXPLORER <b>LVL {level}</b></span></button>
      </header>

      {screen === 'home' && (
        <div className="home-content">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> INTERACTIVE LEARNING UNIVERSE <span className="eyebrow-dot">â—</span></div>
              <h1>THE UNIVERSE<br />IS YOUR <span>PLAYGROUND.</span></h1>
              <p className="hero-description">Big questions. Brave experiments. Real discoveries.<br />Your next adventure starts beyond the screen.</p>
              <div className="hero-actions">
                <button className="secondary-button" onClick={startAiQuiz} disabled={aiLoading}>
                  {aiLoading ? 'GENERATING QUESTION...' : 'AI QUIZ'}
                </button>
                <button className="primary-button" onClick={() => startWorld('cosmic')}><span>â–¶</span> RESUME EXPEDITION <b>â†—</b></button>
                <button className="secondary-button" onClick={() => setShowCodex(true)}>âŒ˜ EXPLORER CODEX</button>
              </div>
              {aiError && <p role="alert" className="answer-feedback wrong">{aiError}</p>}
              <div className="hero-stats">
                <div><strong>{progress.xp.toLocaleString()}</strong><span>TOTAL XP</span></div><div className="stat-divider" />
                <div><strong>{completedCount}<small>/4</small></strong><span>WORLDS CLEARED</span></div><div className="stat-divider" />
                <div><strong>{level.toString().padStart(2, '0')}</strong><span>EXPLORER LEVEL</span></div>
              </div>
            </div>
            <div className="hero-art" aria-label="Cinematic Mars planet and rover illustration">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="planet-glow" /><div className="hero-planet"><div className="planet-crater crater-one" /><div className="planet-crater crater-two" /><div className="planet-crater crater-three" /><div className="planet-rim" /></div>
              <div className="planet-ring" />
              <div className="moon moon-one" /><div className="moon moon-two" />
              <div className="rover-art"><div className="rover-antenna" /><div className="rover-camera" /><div className="rover-mast" /><div className="rover-top" /><div className="rover-cabin"><span>BP / 01</span></div><div className="rover-axle" /><div className="rover-wheel wheel-a" /><div className="rover-wheel wheel-b" /><div className="rover-wheel wheel-c" /><div className="rover-shadow" /></div>
              <div className="floating-tag tag-coordinates"><span>â—‰</span><div><b>MISSION SITE</b><small>ARSIA MONS Â· 18.2Â°N</small></div></div>
              <div className="floating-tag tag-signal"><span className="signal-bars">â–‚â–…â–‡</span><div><b>LINK STABLE</b><small>DEEP SPACE RELAY</small></div></div>
              <div className="art-caption"><span>FIG. 01</span><span>THE RED PLANET / SOL 001</span></div>
            </div>
            <div className="hero-bottomline"><span>01 / 04 WORLDS ONLINE</span><span>DESIGNED FOR THE CURIOUS</span><span>SCROLL TO EXPLORE â†“</span></div>
          </section>

          <section className="world-section">
            <div className="section-head"><div><div className="eyebrow">SELECT YOUR DESTINATION</div><h2>Choose your <span>next world.</span></h2></div><div className="section-note"><span className="live-dot" /> FOUR WORLDS. INFINITE CURIOSITY.</div></div>
            <div className="world-grid">
              {worlds.map((world) => {
                const done = progress.completed.includes(world.id)
                return <button key={world.id} className={`world-card world-${world.id} ${done ? 'is-cleared' : ''}`} style={{ '--accent': world.accent } as React.CSSProperties} onClick={() => startWorld(world.id)}>
                  <div className="world-card-art"><div className={`card-planet card-planet-${world.planet}`} /><div className="card-orbit" /><span className="world-emoji">{world.emoji}</span><span className="world-number">WORLD / {world.number}</span><span className="world-status">{done ? 'âœ“ CLEARED' : 'â— READY TO EXPLORE'}</span></div>
                  <div className="world-card-copy"><span className="world-category">{world.category}</span><h3>{world.name}</h3><p>{world.subtitle}</p><div className="world-card-bottom"><span>{done ? `BEST ${progress.best[world.id] ?? 0}/3` : '3 CHALLENGES'} <i>Â·</i> +XP</span><span className="launch-icon">â†—</span></div></div>
                </button>
              })}
            </div>
          </section>
          <section className="progress-panel"><div className="progress-icon">âœ§</div><div className="progress-main"><span className="world-category">EXPLORER PROGRESSION</span><h3>Every discovery moves you forward.</h3><p>Complete missions, collect XP and build your explorer record.</p><div className="xp-track"><span style={{ width: `${(xpInLevel / 250) * 100}%` }} /></div></div><div className="progress-level"><b>{xpInLevel}<small> / 250 XP</small></b><span>LEVEL {level} â†’ {level + 1}</span></div></section>
        </div>
      )}

      {screen === 'mission' && (
        <section className="mission-screen">
          <button className="back-link" onClick={() => setScreen('home')}>â† BACK TO UNIVERSE</button>
          <div className="mission-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> {isAiQuiz ? 'AI GENERATED CHALLENGE' : `WORLD ${activeWorld.number} / ${activeWorld.category}` }</div><h1>{isAiQuiz ? 'AI DISCOVERY QUIZ' : activeWorld.name}</h1><p>{isAiQuiz ? 'A fresh question generated for your exploration.' : activeWorld.description}</p></div><div className="mission-progress"><span>MISSION PROGRESS</span><b>{String(questionIndex + 1).padStart(2, '0')} <i>/</i> {String(currentQuestionCount).padStart(2, '0')}</b><div className="mini-track"><span style={{ width: `${((questionIndex + (feedback ? 1 : 0)) / currentQuestionCount) * 100}%` }} /></div></div></div>
          <div className={`mission-scene scene-${activeWorld.planet}`}>
            <div className="scene-stars" /><div className="scene-planet" /><div className="scene-ridge ridge-back" /><div className="scene-ridge ridge-front" />
            {activeWorld.id === 'cosmic' ? <div className={`scene-rover ${feedback === 'correct' ? 'rover-success' : ''}`}><div className="scene-rover-mast" /><div className="scene-rover-body"><span>BPTV</span></div><div className="scene-rover-wheel one" /><div className="scene-rover-wheel two" /><div className="scene-rover-wheel three" /></div> : <div className="scene-object">{activeWorld.emoji}</div>}
            <div className="scene-coordinate">FIELD LOG // {activeWorld.number}-{String(questionIndex + 1).padStart(2, '0')}</div><div className="scene-message">{feedback === 'correct' ? 'âœ“ DATA CONFIRMED' : 'AWAITING YOUR DECISION'}</div>
          </div>
          <div className="challenge-layout"><div className="challenge-intro"><span className="world-category">CHALLENGE {String(questionIndex + 1).padStart(2, '0')}</span><h2>{question.prompt}</h2><p>Think it through, explorer. Choose your answer using the remote.</p><div className="challenge-tip"><span>âœ¦</span><p><b>FIELD NOTE</b><br />Curiosity is your most powerful tool. Every answer reveals something new.</p></div></div>
            <div className="answer-panel"><div className="answer-panel-head"><span>SELECT ONE ANSWER</span><span>{selectedAnswer === null ? 'â— READY' : feedback === 'correct' ? 'âœ“ CORRECT' : 'â†» TRY AGAIN'}</span></div>
              <div className="answer-list">{question.answers.map((answer, index) => <button key={answer} className={`answer-option ${selectedAnswer === index ? (feedback === 'correct' ? 'answer-correct' : 'answer-wrong') : ''}`} disabled={!!feedback} onClick={() => chooseAnswer(index)}><span className="answer-letter">{String.fromCharCode(65 + index)}</span><span>{answer}</span><span className="answer-indicator">{selectedAnswer === index ? (feedback === 'correct' ? 'âœ“' : 'Ã—') : 'â†—'}</span></button>)}</div>
              {feedback && <div className={`answer-feedback ${feedback}`}><b>{feedback === 'correct' ? 'NICE WORK, EXPLORER.' : 'NOT QUITE â€” TRY AGAIN.'}</b><p>{feedback === 'correct' ? question.fact : 'Reconsider the choices and select a different answer.'}</p><button className="primary-button" onClick={continueMission}>{feedback === 'wrong' ? 'TRY AGAIN' : questionIndex === currentQuestionCount - 1 ? (isAiQuiz ? 'FINISH AI QUIZ' : 'COMPLETE MISSION') : 'NEXT CHALLENGE'} <b>â†’</b></button></div>}
            </div>
          </div>
        </section>
      )}

      {screen === 'result' && (
        <section className="result-screen"><div className="result-visual"><div className="result-halo" /><div className="result-medal">âœ¦</div><span className="result-spark spark-a">âœ§</span><span className="result-spark spark-b">âœ¦</span></div><div className="eyebrow"><span className="eyebrow-line" /> EXPEDITION REPORT / FILED</div><h1>MISSION <span>ACCOMPLISHED.</span></h1><p className="result-copy">You explored {activeWorld.name.toLowerCase()}, tested your thinking and unlocked a new discovery.</p><div className="result-stats"><div><span>XP EARNED</span><b>+{isAiQuiz ? (answersCorrect > 0 ? 100 : 50) : 50 + (progress.best[activeWorldId] ?? answersCorrect) * 50}</b></div><div><span>QUESTIONS MASTERED</span><b>{isAiQuiz ? answersCorrect : (progress.best[activeWorldId] ?? answersCorrect)}<small> / {currentQuestionCount}</small></b></div><div><span>EXPLORER LEVEL</span><b>{level.toString().padStart(2, '0')}</b></div></div><div className="result-actions"><button className="primary-button" onClick={() => isAiQuiz ? startAiQuiz() : startWorld(activeWorldId)}>{isAiQuiz ? 'NEW AI QUESTION' : 'REPLAY WORLD'} <b>â†»</b></button><button className="secondary-button" onClick={() => setScreen('home')}>RETURN TO UNIVERSE <b>â†’</b></button></div></section>
      )}

      {showCodex && <div className="modal-backdrop" role="presentation" onClick={() => setShowCodex(false)}><section className="codex-modal" role="dialog" aria-modal="true" aria-label="Explorer codex" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowCodex(false)}>âœ•</button><div className="eyebrow">PERSONAL EXPLORER RECORD</div><h2>Explorer <span>Codex.</span></h2><div className="codex-level"><div className="codex-avatar">âœ¦</div><div><b>LEVEL {level} EXPLORER</b><span>{progress.xp.toLocaleString()} TOTAL EXPERIENCE POINTS</span></div></div><div className="codex-xp"><div><span>LEVEL PROGRESS</span><b>{xpInLevel} / 250 XP</b></div><div className="xp-track"><span style={{ width: `${(xpInLevel / 250) * 100}%` }} /></div></div><div className="codex-worlds">{worlds.map((world) => <div key={world.id}><span>{world.emoji}</span><b>{world.name}</b><small>{progress.completed.includes(world.id) ? `CLEARED Â· BEST ${progress.best[world.id] ?? 0}/3` : 'NOT YET CLEARED'}</small></div>)}</div><button className="reset-button" onClick={resetProgress}>RESET LOCAL PROGRESS</button></section></div>}

      <footer className="footer"><span><b>BRAINPLAY</b> TV <i>EXPLORATION SYSTEMS / 01.0</i></span><span>BUILT FOR THE CURIOUS <b>âœ¦</b></span></footer>
    </main>
  )
}

export default App

