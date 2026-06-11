import { useState, useEffect, useCallback } from 'react'

const LS_KEY = 'ucsd-enroll-date'
const LS_ANSWERS_KEY = 'ucsd-enroll-answers'

// UCSD enrollment order: seniors → juniors → sophomores → freshmen
// First pass opens on staggered days, second pass ~7 days after first pass start.
// Times are typically 8:00 AM Pacific.
const YEAR_OFFSETS: Record<string, { first: number; second: number }> = {
  'Senior':    { first: 0, second: 7 },
  'Junior':    { first: 1, second: 8 },
  'Sophomore': { first: 2, second: 9 },
  'Freshman':  { first: 3, second: 10 },
}

// 8 AM Pacific time, expressed as the absolute UTC epoch millis for the given
// YYYY-MM-DD calendar date. UCSD enrollment is always at 8am America/Los_Angeles,
// which we resolve correctly across DST without depending on the user's locale.
function pacific8amEpoch(yyyymmdd: string): number {
  // Strategy: ask the JS engine to format an Intl date for the LA timezone, then
  // back-compute the offset. This handles PST (-08:00) vs PDT (-07:00) correctly.
  const [y, m, d] = yyyymmdd.split('-').map(Number)
  if (!y || !m || !d) return NaN
  // Build a "wall clock" UTC date at 8 AM, then shift by the LA UTC offset on that day.
  const wallUtc = Date.UTC(y, m - 1, d, 8, 0, 0)
  // Use Intl to discover what offset LA was on for that wall time.
  const laParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(wallUtc))
  const get = (t: string) => Number(laParts.find((p) => p.type === t)?.value)
  const ly = get('year'); const lm = get('month'); const ld = get('day')
  const lh = get('hour') === 24 ? 0 : get('hour')
  const lmin = get('minute'); const ls = get('second')
  const laAsUtc = Date.UTC(ly, lm - 1, ld, lh, lmin, ls)
  // Offset in ms between "what LA's wall clock would show" and "what the input UTC moment is".
  const offsetMs = wallUtc - laAsUtc
  // Add it back so the input "8 AM LA wall time" becomes the corresponding absolute UTC moment.
  return wallUtc + offsetMs
}

interface Answers {
  year: string
  pass: string
}

function getStored(): { date: string | null; answers: Answers | null } {
  const date = localStorage.getItem(LS_KEY)
  try {
    const answers = JSON.parse(localStorage.getItem(LS_ANSWERS_KEY) || 'null')
    return { date, answers }
  } catch {
    return { date, answers: null }
  }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return ''
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

interface EnrollEvent {
  summary: string
  start: string
}

async function fetchEnrollmentDates(): Promise<EnrollEvent[]> {
  try {
    const res = await fetch('/api/calendar')
    const data = await res.json()
    const events: EnrollEvent[] = data.dates || data.events || []
    return events
      .filter((e) => e.summary?.toLowerCase().includes('enrollment begins'))
      .sort((a, b) => a.start.localeCompare(b.start))
  } catch {
    return []
  }
}

function findRelevantEnrollDate(events: EnrollEvent[]): string | null {
  const now = new Date().toISOString().split('T')[0]

  // First try: find the next future enrollment date
  const future = events.find(e => e.start >= now)
  if (future) return future.start

  // If all dates are past, find the most recent one (current enrollment period)
  const past = events.filter(e => e.start < now)
  if (past.length > 0) return past[past.length - 1].start

  return null
}

// Returns the absolute UTC epoch millis (as a string for localStorage) for the user's
// enrollment moment. The previous version did toISOString().slice(0,16) on a
// local-time Date which silently dropped the timezone — every Pacific user saw the
// countdown 7-8 hours off depending on whether DST was active.
function computeEnrollEpoch(baseDate: string, year: string, pass: string): number {
  const offsets = YEAR_OFFSETS[year]
  const dayOffset = offsets ? (pass === 'First Pass' ? offsets.first : offsets.second) : 0
  // Add dayOffset whole days to baseDate (still in YYYY-MM-DD form) then resolve to LA 8am.
  const [y, m, d] = baseDate.split('-').map(Number)
  if (!y || !m || !d) return NaN
  const shifted = new Date(Date.UTC(y, m - 1, d))
  shifted.setUTCDate(shifted.getUTCDate() + dayOffset)
  const yyyymmdd = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`
  return pacific8amEpoch(yyyymmdd)
}

export function EnrollCountdown() {
  const [stored] = useState(getStored)
  const [enrollDate, setEnrollDate] = useState<string | null>(stored.date)
  const [answers, setAnswers] = useState<Answers | null>(stored.answers)
  const [now, setNow] = useState(Date.now())
  const [step, setStep] = useState<'idle' | 'ask-year' | 'ask-pass' | 'done'>('idle')
  const [selectedYear, setSelectedYear] = useState('')
  const [enrollEvents, setEnrollEvents] = useState<EnrollEvent[]>([])

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Pre-fetch enrollment dates when user starts setup
  const startSetup = useCallback(async () => {
    setStep('ask-year')
    const events = await fetchEnrollmentDates()
    setEnrollEvents(events)
  }, [])

  const handleYearSelect = (year: string) => {
    setSelectedYear(year)
    setStep('ask-pass')
  }

  const handlePassSelect = (pass: string) => {
    const newAnswers: Answers = { year: selectedYear, pass }

    const baseDate = findRelevantEnrollDate(enrollEvents)
    let epoch: number
    if (baseDate) {
      epoch = computeEnrollEpoch(baseDate, selectedYear, pass)
    } else {
      // No calendar data at all — shouldn't happen but handle gracefully.
      // Use 2 weeks from today + the year/pass offset as a guess.
      const now = new Date()
      const offsets = YEAR_OFFSETS[selectedYear]
      const extraDays = 14 + (offsets ? (pass === 'First Pass' ? offsets.first : offsets.second) : 0)
      now.setDate(now.getDate() + extraDays)
      const yyyymmdd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      epoch = pacific8amEpoch(yyyymmdd)
    }

    if (Number.isNaN(epoch)) return
    const epochStr = String(epoch)
    localStorage.setItem(LS_KEY, epochStr)
    localStorage.setItem(LS_ANSWERS_KEY, JSON.stringify(newAnswers))
    setEnrollDate(epochStr)
    setAnswers(newAnswers)
    setStep('done')
  }

  const handleClear = useCallback(() => {
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem(LS_ANSWERS_KEY)
    setEnrollDate(null)
    setAnswers(null)
    setStep('idle')
    setSelectedYear('')
  }, [])

  const years = Object.keys(YEAR_OFFSETS)
  const passes = ['First Pass', 'Second Pass']

  // Step 1: Ask year
  if (step === 'ask-year') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] text-muted mr-1">What year?</span>
        {years.map(y => (
          <button key={y} onClick={() => handleYearSelect(y)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-card border border-border text-text
              hover:border-accent hover:bg-accent/10 cursor-pointer transition-all whitespace-nowrap">
            {y}
          </button>
        ))}
        <button onClick={() => setStep('idle')} className="p-1 text-dim hover:text-muted cursor-pointer">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  // Step 2: Ask pass
  if (step === 'ask-pass') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] text-muted mr-1">{selectedYear} —</span>
        {passes.map(p => (
          <button key={p} onClick={() => handlePassSelect(p)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-card border border-border text-text
              hover:border-accent2 hover:bg-accent2/10 cursor-pointer transition-all whitespace-nowrap">
            {p}
          </button>
        ))}
        <button onClick={() => setStep('ask-year')} className="p-1 text-dim hover:text-muted cursor-pointer" title="Back">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
      </div>
    )
  }

  // No date set — show setup button
  if (!enrollDate) {
    return (
      <button
        onClick={startSetup}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
          text-muted hover:text-text bg-card border border-border hover:border-accent/40
          cursor-pointer transition-all"
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        When do I enroll?
      </button>
    )
  }

  // Date is set — show countdown or "OPEN".
  // enrollDate is now stored as epoch millis (string). Old installs may still have
  // the broken "YYYY-MM-DDTHH:MM" string — fall back to Date parsing for those, then
  // re-save as epoch on the next setup. The countdown for legacy installs will still
  // be off, but the moment the user re-runs setup it's correct.
  const asNumber = Number(enrollDate)
  const target = Number.isFinite(asNumber) && asNumber > 1e12
    ? asNumber
    : new Date(enrollDate).getTime()
  const diff = target - now

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold
          text-green bg-green/10 border border-green/20">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ENROLLMENT OPEN
        </span>
        <button onClick={handleClear} className="text-[11px] text-muted hover:text-red cursor-pointer" title="Reset">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  // Active countdown
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={startSetup}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-mono font-medium
          text-gold bg-gold/8 border border-gold/20
          hover:border-gold/40 cursor-pointer transition-all"
        title={`${answers?.year}, ${answers?.pass} — click to change`}
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Enroll in {formatCountdown(diff)}
      </button>
      <button onClick={handleClear} className="text-[11px] text-muted hover:text-red cursor-pointer" title="Reset">
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
