import { useEffect, useState } from 'react'
import './App.css'

const worlds = [
  { emoji: '🚀', name: 'COSMIC FRONTIER', subtitle: 'Explore the Solar System', description: 'Help a Mars rover cross rocky terrain.', color: '#8c6bff', status: 'AVAILABLE' },
  { emoji: '🌿', name: 'WILD EARTH', subtitle: 'Discover Nature', description: 'Protect wildlife and explore ecosystems.', color: '#23a879', status: 'COMING SOON' },
  { emoji: '🌊', name: 'OCEAN SECRETS', subtitle: 'Dive Into Discovery', description: 'Explore the underwater world.', color: '#249bd8', status: 'COMING SOON' },
  { emoji: '⚙️', name: "INVENTOR'S LAB", subtitle: 'Build Something Amazing', description: 'Solve problems with science and engineering.', color: '#ee9840', status: 'COMING SOON' },
]

function App() {
  const [screen, setScreen] = useState<'home' | 'mission' | 'result'>('home')
  const [wheel, setWheel] = useState<'standard' | 'wide'>('standard')
  const [tested, setTested] = useState(false)
  const [answer, setAnswer] = useState('')
  const [badge, setBadge] = useState(
  () => localStorage.getItem('brainplay-mars-badge') === 'earned'
)
  useEffect(() => {
    function handleRemoteKey(event: KeyboardEvent) {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        setScreen((current) =>
          current === 'result' || current === 'mission' ? 'home' : current
        )
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
  }

  function submitAnswer() {
  if (answer === 'wide') {
    try {
      localStorage.setItem('brainplay-mars-badge', 'earned')
    } catch (error) {
      console.error('Could not save badge:', error)
    }

    setBadge(true)
    setScreen('result')
  } else {
    setAnswer('try-again')
  }
}

  return (
    <main className="app">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setScreen('home')}>
          <span className="brand-icon">✦</span>
          <span>BRAINPLAY<span className="brand-light"> TV</span></span>
        </button>
        <span className="top-label">PLAY • DISCOVER • GROW</span>
        <div className="profile">🧑‍🚀 EXPLORER</div>
      </header>

      {screen === 'home' && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span /> YOUR NEXT ADVENTURE STARTS HERE</div>
              <h1>BIG QUESTIONS.<br /><span>BRILLIANT</span><br /> DISCOVERIES.</h1>
              <p>Learn something amazing. Complete a mission. Unlock a new world.</p>
              <button className="primary-button" onClick={startMission}>▶ &nbsp; START MARS MISSION</button>
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
              <div><div className="eyebrow">CHOOSE YOUR PATH</div><h2>Explore the worlds</h2></div>
              <span className="progress">⭐ {badge ? 1 : 0} WORLDS MASTERED</span>
            </div>
            <div className="world-grid">
              {worlds.map((world, index) => (
                <button
                  key={world.name}
                  className={`world-card ${index === 0 ? 'selected' : ''}`}
                  style={{ '--world-color': world.color } as React.CSSProperties}
                  onClick={index === 0 ? startMission : undefined}
                  disabled={index !== 0}
                >
                  <div className="card-top"><span>WORLD 0{index + 1}</span><span className="card-status">{index === 0 && badge ? 'MASTERED ✓' : world.status}</span></div>
                  <div className="world-art">{world.emoji}</div>
                  <h3>{world.name}</h3>
                  <p className="world-subtitle">{world.subtitle}</p>
                  <p className="world-description">{world.description}</p>
                  <div className="card-bottom"><span>{index === 0 ? 'PLAY MISSION' : 'COMING SOON'}</span><span>→</span></div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {screen === 'mission' && (
        <section className="mission">
          <button className="back-button" onClick={() => setScreen('home')}>← BACK TO WORLDS</button>
          <div className="eyebrow"><span /> MISSION 01 • COSMIC FRONTIER</div>
          <h1 className="mission-title">THE MARS ROVER CHALLENGE</h1>
          <p className="mission-intro">Your rover must cross a rocky Martian landscape. Choose the wheels that will help it travel safely.</p>

          <div className="mission-layout">
            <div className="mission-visual">
              <div className="mars-sky"><span>✦</span><span>·</span><span>✧</span></div>
              <div className="mars-surface" />
              <div className={`rover ${wheel === 'wide' ? 'wide-wheels' : ''} ${tested ? 'rover-tested' : ''}`}>
                <div className="rover-antenna" />
                <div className="rover-body"><span>NASA</span></div>
                <div className="rover-wheel wheel-left" />
                <div className="rover-wheel wheel-right" />
              </div>
              {tested && <div className="test-message">{wheel === 'wide' ? '✓ ROVER CROSSED THE ROCKS!' : '⚠ ROVER GOT STUCK!'}</div>}
            </div>

            <div className="mission-controls">
              <h2>01 / Choose your wheels</h2>
              <p>Which wheels might work best on loose sand and rocks?</p>
              <button className={`choice ${wheel === 'standard' ? 'choice-active' : ''}`} onClick={() => { setWheel('standard'); setTested(false) }}>
                <span className="choice-icon">⚫</span><span><strong>Standard wheels</strong><small>Narrow wheels for smooth roads</small></span><span>○</span>
              </button>
              <button className={`choice ${wheel === 'wide' ? 'choice-active' : ''}`} onClick={() => { setWheel('wide'); setTested(false) }}>
                <span className="choice-icon">⚙️</span><span><strong>Wide, grippy wheels</strong><small>More contact with the ground</small></span><span>○</span>
              </button>
              <button className="primary-button full-button" onClick={() => setTested(true)}>▶ TEST MY ROVER</button>
              {tested && (
                <div className={`feedback ${wheel === 'wide' ? 'feedback-good' : 'feedback-warn'}`}>
                  {wheel === 'wide' ? 'Great engineering! Wider wheels can improve grip and help spread the rover’s weight on loose ground.' : 'The narrow wheels struggle on loose terrain. Try wheels with a wider contact area.'}
                </div>
              )}
            </div>
          </div>

          {tested && wheel === 'wide' && (
            <div className="quiz">
              <div className="eyebrow">02 / SCIENCE CHECK</div>
              <h2>Why can wider wheels help a rover on loose ground?</h2>
              <p>Choose the best explanation to earn your explorer badge.</p>
              {[
                { value: 'speed', label: 'They make the rover fly over rocks.' },
                { value: 'wide', label: 'They spread the rover’s weight over a larger area and can improve traction.' },
                { value: 'color', label: 'They change the colour of the Martian soil.' },
              ].map(option => (
                <button key={option.value} className={`quiz-option ${answer === option.value ? 'quiz-selected' : ''}`} onClick={() => setAnswer(option.value)}>{option.label}</button>
              ))}
              {answer === 'try-again' && <p className="quiz-error">Not quite! Think about grip and how weight is spread over the ground.</p>}
              <button className="primary-button" disabled={!answer || answer === 'try-again'} onClick={submitAnswer}>SUBMIT ANSWER →</button>
            </div>
          )}
        </section>
      )}

      {screen === 'result' && (
        <section className="result-screen">
          <div className="badge-medal">🏅</div>
          <div className="eyebrow">MISSION COMPLETE</div>
          <h1>YOU DID IT, EXPLORER!</h1>
          <p>You tested a design, learned about traction, and solved a science challenge.</p>
          <div className="earned-badge">🚀 MARS ROVER ENGINEER</div>
          <p className="result-note">You unlocked your first learning badge by demonstrating what you learned — not by watching longer.</p>
          <button className="primary-button" onClick={() => setScreen('home')}>RETURN TO WORLDS →</button>
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