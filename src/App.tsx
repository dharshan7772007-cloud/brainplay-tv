
import { useEffect, useState } from 'react'
import './App.css'

const worlds = [
  {
    emoji: '🚀',
    name: 'COSMIC FRONTIER',
    subtitle: 'Explore the Solar System',
    description: 'Help a Mars rover cross rocky terrain.',
    color: '#8c6bff',
    status: 'AVAILABLE',
  },
  {
    emoji: '🌿',
    name: 'WILD EARTH',
    subtitle: 'Discover Nature',
    description: 'Protect wildlife and explore ecosystems.',
    color: '#23a879',
    status: 'COMING SOON',
  },
  {
    emoji: '🌊',
    name: 'OCEAN SECRETS',
    subtitle: 'Dive Into Discovery',
    description: 'Explore the underwater world.',
    color: '#249bd8',
    status: 'COMING SOON',
  },
  {
    emoji: '⚙️',
    name: "INVENTOR'S LAB",
    subtitle: 'Build Something Amazing',
    description: 'Solve problems with science and engineering.',
    color: '#ee9840',
    status: 'COMING SOON',
  },
]

function readSavedValue(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function App() {
  const [screen, setScreen] = useState<'home' | 'mission' | 'result'>('home')
  const [wheel, setWheel] = useState<'standard' | 'wide'>('standard')
  const [tested, setTested] = useState(false)
  const [answer, setAnswer] = useState('')
  const [badge, setBadge] = useState(
    () => readSavedValue('brainplay-mars-badge') === 'earned'
  )
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(
    () => Number(readSavedValue('brainplay-best-score')) || 0
  )

  useEffect(() => {
    function handleRemoteKey(event: KeyboardEvent) {
      const key = event.key

      if (key === 'Escape' || key === 'Backspace') {
        event.preventDefault()
        setScreen((current) =>
          current === 'result' || current === 'mission'
            ? 'home'
            : current
        )
        return
      }

      const directions: Record<string, string> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }

      const direction = directions[key]
      if (!direction) return

      const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled)'
        )
      ).filter((button) => button.getClientRects().length > 0)

      if (buttons.length === 0) return

      const active = document.activeElement
      const current =
        active instanceof HTMLButtonElement && buttons.includes(active)
          ? active
          : null

      if (!current) {
        event.preventDefault()
        buttons[0].focus()
        return
      }

      const currentRect = current.getBoundingClientRect()
      const currentX = currentRect.left + currentRect.width / 2
      const currentY = currentRect.top + currentRect.height / 2

      let bestButton: HTMLButtonElement | null = null
      let bestDistance = Infinity

      for (const button of buttons) {
        if (button === current) continue

        const rect = button.getBoundingClientRect()
        const dx = rect.left + rect.width / 2 - currentX
        const dy = rect.top + rect.height / 2 - currentY

        let primary: number
        let secondary: number

        if (direction === 'right' && dx > 1) {
          primary = dx
          secondary = Math.abs(dy)
        } else if (direction === 'left' && dx < -1) {
          primary = -dx
          secondary = Math.abs(dy)
        } else if (direction === 'down' && dy > 1) {
          primary = dy
          secondary = Math.abs(dx)
        } else if (direction === 'up' && dy < -1) {
          primary = -dy
          secondary = Math.abs(dx)
        } else {
          continue
        }

        const distance = primary + secondary * 2

        if (distance < bestDistance) {
          bestDistance = distance
          bestButton = button
        }
      }

      if (bestButton) {
        event.preventDefault()
        bestButton.focus()
      }
    }

    window.addEventListener('keydown', handleRemoteKey)

    return () => {
      window.removeEventListener('keydown', handleRemoteKey)
    }
  }, [])

  function startMission() {
    setScreen('mission')
    setWheel('standard')
    setTested(false)
    setAnswer('')
    setScore(0)
  }

  function submitAnswer() {
    if (answer !== 'wide') {
      setAnswer('try-again')
      return
    }

    const earnedScore = 100
    const newBestScore = Math.max(bestScore, earnedScore)

    setScore(earnedScore)
    setBestScore(newBestScore)
    setBadge(true)

    try {
      localStorage.setItem('brainplay-mars-badge', 'earned')
      localStorage.setItem(
        'brainplay-best-score',
        String(newBestScore)
      )
    } catch (error) {
      console.error('Could not save progress:', error)
    }

    setScreen('result')
  }

  return (
    <main className="app">
      <header className="topbar">
        <button
          className="brand brand-button"
          onClick={() => setScreen('home')}
        >
          <span className="brand-icon">✦</span>
          <span>
            BRAINPLAY<span className="brand-light"> TV</span>
          </span>
        </button>

        <span className="top-label">PLAY • DISCOVER • GROW</span>
        <div className="profile">🧑‍🚀 EXPLORER</div>
      </header>

      {screen === 'home' && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span /> YOUR NEXT ADVENTURE STARTS HERE
              </div>

              <h1>
                BIG QUESTIONS.<br />
                <span>BRILLIANT</span><br />
                DISCOVERIES.
              </h1>

              <p>
                Learn something amazing. Complete a mission.
                Unlock a new world.
              </p>

              <button
                className="primary-button"
                onClick={startMission}
              >
                ▶ &nbsp; START MARS MISSION
              </button>
            </div>

            <div className="planet-scene">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="planet planet-large" />
              <div className="planet planet-small" />
              <div className="star star-one">✦</div>
              <div className="star star-two">✧</div>
              <div className="star star-three">✦</div>
              <div className="astronaut">👨‍🚀</div>
            </div>
          </section>

          <section className="world-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">CHOOSE YOUR PATH</div>
                <h2>Explore the worlds</h2>
              </div>

              <span className="progress">
                ⭐ {badge ? 1 : 0} WORLDS MASTERED
              </span>
            </div>

            <div className="world-grid">
              {worlds.map((world, index) => (
                <button
                  key={world.name}
                  className={`world-card ${index === 0 ? 'selected' : ''}`}
                  style={
                    { '--world-color': world.color } as React.CSSProperties
                  }
                  onClick={index === 0 ? startMission : undefined}
                  disabled={index !== 0}
                >
                  <div className="card-top">
                    <span>WORLD 0{index + 1}</span>
                    <span className="card-status">
                      {index === 0 && badge
                        ? 'MASTERED ✓'
                        : world.status}
                    </span>
                  </div>

                  <div className="world-art">{world.emoji}</div>
                  <h3>{world.name}</h3>
                  <p className="world-subtitle">{world.subtitle}</p>
                  <p className="world-description">{world.description}</p>

                  <div className="card-bottom">
                    <span>
                      {index === 0 ? 'PLAY MISSION' : 'COMING SOON'}
                    </span>
                    <span>→</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {screen === 'mission' && (
        <section className="mission">
          <button
            className="back-button"
            onClick={() => setScreen('home')}
          >
            ← BACK TO WORLDS
          </button>

          <div className="eyebrow">
            <span /> MISSION 01 • COSMIC FRONTIER
          </div>

          <h1 className="mission-title">THE MARS ROVER CHALLENGE</h1>

          <p className="mission-intro">
            Your rover must cross a rocky Martian landscape.
            Choose the wheels that will help it travel safely.
          </p>

          <div className="mission-layout">
            <div className="mission-visual">
              <div className="mars-sky">
                <span>✦</span>
                <span>·</span>
                <span>✧</span>
              </div>

              <div className="mars-surface" />

              <div
                className={`rover ${
                  wheel === 'wide' ? 'wide-wheels' : ''
                } ${tested ? 'rover-tested' : ''}`}
              >
                <div className="rover-antenna" />
                <div className="rover-body">
                  <span>NASA</span>
                </div>
                <div className="rover-wheel wheel-left" />
                <div className="rover-wheel wheel-right" />
              </div>

              {tested && (
                <div className="test-message">
                  {wheel === 'wide'
                    ? '✓ ROVER CROSSED THE ROCKS!'
                    : '⚠ ROVER GOT STUCK!'}
                </div>
              )}
            </div>

            <div className="mission-controls">
              <h2>01 / Choose your wheels</h2>
              <p>Which wheels might work best on loose sand and rocks?</p>

              <button
                className={`choice ${
                  wheel === 'standard' ? 'choice-active' : ''
                }`}
                onClick={() => {
                  setWheel('standard')
                  setTested(false)
                  setAnswer('')
                }}
              >
                <span className="choice-icon">⚫</span>
                <span>
                  <strong>Standard wheels</strong>
                  <small>Narrow wheels for smooth roads</small>
                </span>
                <span>{wheel === 'standard' ? '●' : '○'}</span>
              </button>

              <button
                className={`choice ${
                  wheel === 'wide' ? 'choice-active' : ''
                }`}
                onClick={() => {
                  setWheel('wide')
                  setTested(false)
                  setAnswer('')
                }}
              >
                <span className="choice-icon">⚙️</span>
                <span>
                  <strong>Wide, grippy wheels</strong>
                  <small>More contact with the ground</small>
                </span>
                <span>{wheel === 'wide' ? '●' : '○'}</span>
              </button>

              <button
                className="primary-button full-button"
                onClick={() => {
                  setTested(true)
                  setAnswer('')
                }}
              >
                ▶ TEST MY ROVER
              </button>

              {tested && (
                <div
                  className={`feedback ${
                    wheel === 'wide'
                      ? 'feedback-good'
                      : 'feedback-warn'
                  }`}
                >
                  {wheel === 'wide'
                    ? 'Great engineering! Wider wheels can improve grip and help spread the rover’s weight on loose ground.'
                    : 'The narrow wheels struggle on loose terrain. Try wheels with a wider contact area.'}
                </div>
              )}
            </div>
          </div>

          {tested && wheel === 'wide' && (
            <div className="quiz">
              <div className="eyebrow">02 / SCIENCE CHECK</div>
              <h2>
                Why can wider wheels help a rover on loose ground?
              </h2>
              <p>
                Choose the best explanation to earn your explorer badge.
              </p>

              {[
                {
                  value: 'speed',
                  label: 'They make the rover fly over rocks.',
                },
                {
                  value: 'wide',
                  label:
                    'They spread the rover’s weight over a larger area and can improve traction.',
                },
                {
                  value: 'color',
                  label: 'They change the colour of the Martian soil.',
                },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`quiz-option ${
                    answer === option.value ? 'quiz-selected' : ''
                  }`}
                  onClick={() => setAnswer(option.value)}
                >
                  {option.label}
                </button>
              ))}

              {answer === 'try-again' && (
                <p className="quiz-error">
                  Not quite! Think about grip and how weight is spread
                  over the ground.
                </p>
              )}

              <button
                className="primary-button"
                disabled={!answer || answer === 'try-again'}
                onClick={submitAnswer}
              >
                SUBMIT ANSWER →
              </button>
            </div>
          )}
        </section>
      )}

      {screen === 'result' && (
        <section className="result-screen">
          <div className="badge-medal">🏅</div>
          <div className="eyebrow">MISSION COMPLETE</div>
          <h1>YOU DID IT, EXPLORER!</h1>

          <div className="earned-badge">
            ⭐ SCORE: {score} POINTS
          </div>

          <p className="result-note">
            🏆 PERSONAL BEST: {bestScore} POINTS
          </p>

          <p>
            You tested a design, learned about traction, and solved
            a science challenge.
          </p>

          <div className="earned-badge">
            🚀 MARS ROVER ENGINEER
          </div>

          <p className="result-note">
            You unlocked your learning badge by demonstrating what
            you learned — not by watching longer.
          </p>

          <button className="primary-button" onClick={startMission}>
            ↻ PLAY AGAIN
          </button>

          <button
            className="back-button"
            onClick={() => setScreen('home')}
          >
            RETURN TO WORLDS →
          </button>
        </section>
      )}

      <footer className="footer">
        <span>✦ BRAINPLAY TV</span>
        <span>LEARN IT. PROVE IT. UNLOCK IT.</span>
      </footer>
    </main>
  )
}

export default App
