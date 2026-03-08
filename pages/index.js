import { useState } from 'react'
import Head from 'next/head'

const STEPS = [
  {
    id: 'intro',
    type: 'intro',
  },
  {
    id: 'fullName',
    label: 'What\'s your full name?',
    placeholder: 'Marcus Thompson',
    type: 'text',
    hint: 'First and last name',
  },
  {
    id: 'email',
    label: 'Your business email?',
    placeholder: 'marcus@yourcompany.com',
    type: 'email',
    hint: 'We\'ll send your weekly drop here',
  },
  {
    id: 'phone',
    label: 'Your phone number?',
    placeholder: '(555) 123-4567',
    type: 'text',
    hint: 'For text updates and account access',
  },
  {
    id: 'businessName',
    label: 'Business name?',
    placeholder: 'ProFix Plumbing',
    type: 'text',
    hint: 'As it appears on your marketing',
  },
  {
    id: 'serviceType',
    label: 'What service do you offer?',
    type: 'multi-select',
    options: [
      'HVAC / Air Conditioning',
      'Plumbing',
      'Electrical',
      'Roofing',
      'Lawn Care / Landscaping',
      'Pest Control',
      'House Cleaning',
      'Painting (Interior/Exterior)',
      'Flooring',
      'Gutters',
      'Windows & Doors',
      'General Contracting',
      'Other Home Service',
    ],
  },
  {
    id: 'cityRadius',
    label: 'City & service radius?',
    placeholder: 'Dallas, TX — 30 mile radius',
    type: 'text',
    hint: 'Where your customers are located',
  },
  {
    id: 'currentOffer',
    label: 'Do you have a current offer or promotion?',
    placeholder: 'Free estimate · $49 first lawn cut · 10% off first service',
    type: 'text',
    hint: 'Leave blank if none — we\'ll suggest one',
  },
  {
    id: 'mainGoal',
    label: 'What\'s your main goal with ads?',
    type: 'radio',
    options: [
      { value: 'more_calls', label: 'More phone calls', icon: '📞' },
      { value: 'more_leads', label: 'More form leads', icon: '📋' },
      { value: 'brand_awareness', label: 'Brand awareness', icon: '📣' },
      { value: 'recurring_clients', label: 'Recurring clients', icon: '🔄' },
    ],
  },
  {
    id: 'adBudget',
    label: 'Monthly Meta ad budget?',
    type: 'radio',
    options: [
      { value: 'under_300', label: 'Under $300/mo', icon: '🌱' },
      { value: '300_600', label: '$300–$600/mo', icon: '🌿' },
      { value: '600_1500', label: '$600–$1,500/mo', icon: '🌳' },
      { value: 'over_1500', label: '$1,500+/mo', icon: '🚀' },
    ],
  },
  {
    id: 'facebookPage',
    label: 'Facebook or Instagram page link?',
    placeholder: 'facebook.com/yourpage or instagram.com/yourhandle',
    type: 'text',
    hint: 'So we can match your brand voice',
  },
  {
    id: 'plan',
    label: 'Which plan did you subscribe to?',
    type: 'radio',
    options: [
      { value: 'normal', label: 'Normal — $1,100/mo', icon: '⚡' },
      { value: 'pro', label: 'Pro — $2,300/mo', icon: '⭐' },
    ],
  },
  {
    id: 'extras',
    label: 'Anything else we should know?',
    placeholder: 'e.g. We only serve residential clients, we specialize in emergency calls, avoid competitor names...',
    type: 'textarea',
    hint: 'Optional — but the more context, the better your ads',
  },
  {
    id: 'success',
    type: 'success',
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})
  const [inputVal, setInputVal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentStep = STEPS[step]
  const totalSteps = STEPS.length - 2 // exclude intro & success
  const progress = step === 0 ? 0 : Math.min(((step - 1) / totalSteps) * 100, 100)

  const isIntro = currentStep.type === 'intro'
  const isSuccess = currentStep.type === 'success'
  const isRadio = currentStep.type === 'radio'
  const isSelect = currentStep.type === 'select'
  const isMultiSelect = currentStep.type === 'multi-select'
  const isTextarea = currentStep.type === 'textarea'

  const getValue = () => data[currentStep.id] || ''

  const handleNext = async () => {
    if (!isIntro && !isSuccess) {
      const val = isRadio || isSelect ? data[currentStep.id] : isMultiSelect ? (data[currentStep.id] || []) : inputVal.trim()
      if (!val && currentStep.id !== 'extras' && currentStep.id !== 'facebookPage' && currentStep.id !== 'currentOffer') {
        setError('Please fill this in to continue.')
        return
      }
      setData(prev => ({ ...prev, [currentStep.id]: val }))
    }
    setError('')
    setInputVal('')

    // If this is the last real step, submit
    if (step === STEPS.length - 2) {
      setSubmitting(true)
      try {
        const payload = {
          ...data,
          extras: isTextarea ? inputVal.trim() : data.extras,
        }
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch (e) {
        // Still advance even if save fails
      }
      setSubmitting(false)
    }

    setStep(s => s + 1)
  }

  const handleBack = () => {
    setError('')
    setInputVal(data[STEPS[step - 1]?.id] || '')
    setStep(s => s - 1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isTextarea) handleNext()
  }

  const handleRadio = (val) => {
    setData(prev => ({ ...prev, [currentStep.id]: val }))
    setError('')

    // Auto-advance for radio buttons (avoiding setTimeout and double clicks)
    setTimeout(() => {
      // If this is the last real step before success, submit
      if (step === STEPS.length - 2) {
        setSubmitting(true)
        const payload = {
          ...data,
          [currentStep.id]: val, // use the fresh value
          extras: isTextarea ? inputVal.trim() : data.extras,
        }
        fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).finally(() => {
          setSubmitting(false)
        })
      }
      setStep(s => s + 1)
    }, 150)
  }

  const handleSelect = (e) => {
    setData(prev => ({ ...prev, [currentStep.id]: e.target.value }))
    setError('')
  }

  const handleMultiSelect = (val) => {
    setData(prev => {
      const current = prev[currentStep.id] || []
      const isSelected = current.includes(val)
      return {
        ...prev,
        [currentStep.id]: isSelected ? current.filter(i => i !== val) : [...current, val]
      }
    })
    setError('')
  }

  return (
    <>
      <Head>
        <title>AdDrop™ — Client Onboarding</title>
        <meta name="description" content="Get started with AdDrop" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>" />
      </Head>

      <div style={styles.root}>
        {/* Progress bar */}
        {!isIntro && !isSuccess && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          </div>
        )}

        {/* Top nav */}
        <div style={styles.nav}>
          <div style={styles.logo}>Ad<span style={{ color: 'var(--accent)' }}>Drop</span><span style={styles.logoDot}></span></div>
          {!isIntro && !isSuccess && (
            <div style={styles.stepCount}>
              {step} / {totalSteps}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={styles.content}>

          {/* INTRO */}
          {isIntro && (
            <div style={styles.introWrap}>
              <div style={styles.introBadge}>✦ Welcome</div>
              <h1 style={styles.introH1}>
                Let's set up<br />your AdDrop™.
              </h1>
              <p style={styles.introSub}>
                9 quick questions. Takes about 3 minutes.<br />
                Your first drop arrives within 48 hours.
              </p>
              <div style={styles.introMeta}>
                <span style={styles.metaItem}>📩 9 questions</span>
                <span style={styles.metaDot}>·</span>
                <span style={styles.metaItem}>⏱ 3 minutes</span>
                <span style={styles.metaDot}>·</span>
                <span style={styles.metaItem}>🔒 Private & secure</span>
              </div>
              <button style={styles.primaryBtn} onClick={handleNext}>
                Start onboarding →
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {isSuccess && (
            <div style={styles.successWrap}>
              <div style={styles.successIcon}>🎉</div>
              <h2 style={styles.successH2}>You're all set.</h2>
              <p style={styles.successSub}>
                Your onboarding is complete. Check your inbox — we'll confirm receipt and your first AdDrop™ will be in your inbox within 48 hours.
              </p>
              <div style={styles.successCard}>
                <div style={styles.successRow}><span style={styles.successLabel}>Business</span><span style={styles.successVal}>{data.businessName}</span></div>
                <div style={styles.successRow}><span style={styles.successLabel}>Service</span><span style={styles.successVal}>{data.serviceType}</span></div>
                <div style={styles.successRow}><span style={styles.successLabel}>Plan</span><span style={styles.successVal}>{data.plan}</span></div>
                <div style={styles.successRow}><span style={styles.successLabel}>Delivery</span><span style={styles.successVal}>{data.email}</span></div>
              </div>
            </div>
          )}

          {/* QUESTIONS */}
          {!isIntro && !isSuccess && (
            <div style={styles.questionWrap}>
              <div style={styles.questionLabel}>
                {String(step).padStart(2, '0')} —
              </div>
              <h2 style={styles.questionText}>{currentStep.label}</h2>

              {/* Text / Email */}
              {(currentStep.type === 'text' || currentStep.type === 'email') && (
                <div style={styles.inputWrap}>
                  <input
                    key={currentStep.id}
                    autoFocus
                    type={currentStep.type}
                    placeholder={currentStep.placeholder}
                    value={inputVal || getValue()}
                    onChange={e => { setInputVal(e.target.value); setError('') }}
                    onKeyDown={handleKeyDown}
                    style={styles.input}
                  />
                  {currentStep.hint && <div style={styles.hint}>{currentStep.hint}</div>}
                </div>
              )}

              {/* Textarea */}
              {isTextarea && (
                <div style={styles.inputWrap}>
                  <textarea
                    key={currentStep.id}
                    autoFocus
                    placeholder={currentStep.placeholder}
                    value={inputVal || getValue()}
                    onChange={e => { setInputVal(e.target.value); setError('') }}
                    style={styles.textarea}
                    rows={4}
                  />
                  {currentStep.hint && <div style={styles.hint}>{currentStep.hint}</div>}
                </div>
              )}

              {/* Select */}
              {isSelect && (
                <div style={styles.inputWrap}>
                  <select
                    key={currentStep.id}
                    autoFocus
                    value={data[currentStep.id] || ''}
                    onChange={handleSelect}
                    style={styles.select}
                  >
                    <option value="">Choose your service...</option>
                    {currentStep.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Multi-Select */}
              {isMultiSelect && (
                <div style={styles.radioGrid}>
                  {currentStep.options.map(opt => {
                    const selected = (data[currentStep.id] || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        style={{
                          ...styles.radioBtn,
                          padding: '16px 20px',
                          ...(selected ? styles.radioBtnActive : {}),
                        }}
                        onClick={() => handleMultiSelect(opt)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                          <div style={{
                            minWidth: '20px', height: '20px', borderRadius: '4px',
                            border: selected ? '2px solid var(--accent)' : '2px solid rgba(228, 224, 216, 0.8)',
                            background: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}>
                            {selected && <svg width='12' height='12' viewBox='0 0 14 10' fill='none'><path d='M1 5L5 9L13 1' stroke='var(--accent)' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></svg>}
                          </div>
                          <span style={{
                            ...styles.radioLabel,
                            fontSize: '15px',
                            fontWeight: selected ? 700 : 500
                          }}>{opt}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Radio */}
              {isRadio && (
                <div style={styles.radioGrid}>
                  {currentStep.options.map(opt => (
                    <button
                      key={opt.value}
                      style={{
                        ...styles.radioBtn,
                        ...(data[currentStep.id] === opt.value ? styles.radioBtnActive : {}),
                      }}
                      onClick={() => handleRadio(opt.value)}
                    >
                      <span style={styles.radioIcon}>{opt.icon}</span>
                      <span style={styles.radioLabel}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {error && <div style={styles.error}>{error}</div>}

              {/* Nav buttons */}
              <div style={styles.navBtns}>
                {step > 1 && (
                  <button style={styles.backBtn} onClick={handleBack}>← Back</button>
                )}
                {!isRadio && (
                  <button
                    style={styles.nextBtn}
                    onClick={handleNext}
                    disabled={submitting}
                  >
                    {submitting ? 'Sending...' : step === STEPS.length - 2 ? 'Submit →' : 'Continue →'}
                  </button>
                )}
              </div>

              {!isRadio && (
                <div style={styles.pressEnter}>
                  Press <kbd style={styles.kbd}>Enter ↵</kbd> to continue
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div style={styles.footer}>
            <span style={styles.footerText}>AdDrop™ <span style={{ ...styles.metaDot, margin: '0 8px' }}>·</span> Secure onboarding</span>
            <span style={styles.footerText}>🔒 Your data is private</span>
          </div>
        )}
      </div>
    </>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
  },
  progressWrap: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: '4px',
    background: 'rgba(228, 224, 216, 0.5)',
    zIndex: 100,
  },
  progressBar: {
    height: '100%',
    background: 'var(--accent)',
    transition: 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
    position: 'relative',
    overflow: 'hidden',
  },
  // Pseudo-element logic for shimmer can't easily be done inline, handled via keyframes in css
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 48px',
    borderBottom: '1px solid rgba(228, 224, 216, 0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    position: 'relative',
    zIndex: 10,
  },
  logo: {
    fontFamily: 'var(--sans)',
    fontSize: '20px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  logoDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--accent)',
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: '0 0 8px rgba(255, 77, 28, 0.6)',
  },
  stepCount: {
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    color: 'var(--muted)',
    letterSpacing: '2px',
    fontWeight: 500,
    background: 'rgba(255,255,255,0.6)',
    padding: '6px 14px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(228, 224, 216, 0.6)',
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    position: 'relative',
    zIndex: 2,
  },

  // INTRO
  introWrap: {
    maxWidth: '560px',
    width: '100%',
    animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    position: 'relative',
  },
  introBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    letterSpacing: '2px',
    color: 'var(--accent)',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: '24px',
    background: 'var(--accent-glow)',
    padding: '6px 16px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255, 77, 28, 0.2)',
  },
  introH1: {
    fontFamily: 'var(--sans)',
    fontSize: 'clamp(48px, 7vw, 76px)',
    fontWeight: 800,
    letterSpacing: '-2.5px',
    lineHeight: 0.95,
    color: 'var(--ink)',
    marginBottom: '28px',
  },
  introSub: {
    fontSize: '18px',
    color: '#6B665A',
    lineHeight: 1.6,
    marginBottom: '40px',
    fontWeight: 400,
    maxWidth: '480px',
  },
  introMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '48px',
    flexWrap: 'wrap',
    background: 'var(--surface)',
    padding: '16px 24px',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(228, 224, 216, 0.4)',
  },
  metaItem: {
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    color: 'var(--ink)',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 500,
  },
  metaDot: { color: 'var(--border)', fontSize: '14px' },
  primaryBtn: {
    background: 'var(--ink)',
    color: 'var(--surface)',
    fontFamily: 'var(--sans)',
    fontSize: '16px',
    fontWeight: 700,
    padding: '18px 40px',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '-0.2px',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  // QUESTION
  questionWrap: {
    maxWidth: '600px',
    width: '100%',
    animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    background: 'var(--surface)',
    padding: '48px',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid rgba(228, 224, 216, 0.8)',
    position: 'relative',
  },
  questionLabel: {
    fontFamily: 'var(--mono)',
    fontSize: '14px',
    letterSpacing: '2px',
    color: 'var(--accent)',
    fontWeight: 600,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  questionText: {
    fontFamily: 'var(--sans)',
    fontSize: 'clamp(28px, 4.5vw, 40px)',
    fontWeight: 800,
    letterSpacing: '-1.5px',
    color: 'var(--ink)',
    lineHeight: 1.15,
    marginBottom: '40px',
  },
  inputWrap: {
    marginBottom: '32px',
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '20px 0',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: '2px solid rgba(13, 13, 10, 0.15)',
    background: 'transparent',
    fontFamily: 'var(--sans)',
    fontSize: '24px',
    fontWeight: 500,
    color: 'var(--ink)',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  textarea: {
    width: '100%',
    padding: '24px',
    border: '2px solid rgba(228, 224, 216, 0.8)',
    borderRadius: 'var(--radius-md)',
    background: '#FAFAFA',
    fontFamily: 'var(--sans)',
    fontSize: '16px',
    fontWeight: 400,
    color: 'var(--ink)',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.6,
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
  },
  select: {
    width: '100%',
    padding: '20px 0',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: '2px solid rgba(13, 13, 10, 0.15)',
    background: 'transparent',
    fontFamily: 'var(--sans)',
    fontSize: '20px',
    fontWeight: 500,
    color: 'var(--ink)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8' viewBox='0 0 14 8'%3E%3Cpath d='M1 1l6 6 6-6' stroke='%230D0D0A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0 center',
    transition: 'border-color 0.3s ease',
  },
  hint: {
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    color: 'var(--muted)',
    marginTop: '12px',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  // RADIO
  radioGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '32px',
  },
  radioBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '24px',
    border: '2px solid rgba(228, 224, 216, 0.8)',
    borderRadius: 'var(--radius-md)',
    background: '#FAFAFA',
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--ink)',
    textAlign: 'left',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    overflow: 'hidden',
  },
  radioBtnActive: {
    border: '2px solid var(--accent)',
    background: 'var(--accent-glow)',
    color: 'var(--ink)',
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-md)',
  },
  radioIcon: {
    fontSize: '24px',
    background: 'var(--surface)',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-sm)',
  },
  radioLabel: {
    flex: 1,
    lineHeight: 1.4,
  },

  error: {
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    color: 'var(--accent)',
    marginBottom: '20px',
    letterSpacing: '0.5px',
    background: 'var(--accent-glow)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  navBtns: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginTop: '16px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--sans)',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--muted)',
    padding: '16px 0',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  nextBtn: {
    background: 'var(--accent)',
    color: 'var(--surface)',
    border: 'none',
    fontFamily: 'var(--sans)',
    fontSize: '16px',
    fontWeight: 700,
    padding: '16px 36px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
  },
  pressEnter: {
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    color: 'var(--muted)',
    marginTop: '20px',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  kbd: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    color: 'var(--ink)',
    boxShadow: '0 2px 0 var(--border)',
    fontWeight: 600,
  },

  // SUCCESS
  successWrap: {
    maxWidth: '520px',
    width: '100%',
    textAlign: 'center',
    animation: 'scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    background: 'var(--surface)',
    padding: '56px 48px',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid rgba(228, 224, 216, 0.8)',
    position: 'relative',
    overflow: 'hidden',
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    animation: 'float 4s ease-in-out infinite',
  },
  successH2: {
    fontFamily: 'var(--sans)',
    fontSize: '48px',
    fontWeight: 800,
    letterSpacing: '-1.5px',
    color: 'var(--ink)',
    marginBottom: '16px',
  },
  successSub: {
    fontSize: '16px',
    color: '#6B665A',
    lineHeight: 1.6,
    marginBottom: '40px',
  },
  successCard: {
    background: '#FAFAFA',
    border: '1px solid var(--border)',
    padding: '8px 24px',
    textAlign: 'left',
    borderRadius: 'var(--radius-md)',
  },
  successRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px dashed rgba(228, 224, 216, 0.8)',
    gap: '16px',
  },
  successLabel: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    letterSpacing: '1px',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    fontWeight: 500,
    flexShrink: 0,
  },
  successVal: {
    fontFamily: 'var(--sans)',
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--ink)',
    textAlign: 'right',
  },

  // FOOTER
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 48px',
    borderTop: '1px solid rgba(228, 224, 216, 0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    position: 'relative',
    zIndex: 10,
  },
  footerText: {
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    letterSpacing: '1px',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
}
