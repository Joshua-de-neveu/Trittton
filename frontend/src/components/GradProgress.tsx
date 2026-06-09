import { useState, useMemo } from 'react'
import { MAJOR_NAMES, COLLEGE_NAMES, COLLEGES, calculateProgress, type ReqProgress } from '../lib/requirements'
import { socSearchUrl, courseCodeToSubject } from '../lib/links'

interface GradProgressProps {
  completedCodes: string[]
}

export function GradProgress({ completedCodes }: GradProgressProps) {
  const [selectedCollege, setSelectedCollege] = useState(() =>
    localStorage.getItem('ucsd-selected-college') || ''
  )
  const [selectedMajor, setSelectedMajor] = useState(() =>
    localStorage.getItem('ucsd-selected-major') || ''
  )
  const [majorSearch, setMajorSearch] = useState('')

  const handleCollegeChange = (college: string) => {
    setSelectedCollege(college)
    localStorage.setItem('ucsd-selected-college', college)
  }

  const handleMajorChange = (major: string) => {
    setSelectedMajor(major)
    localStorage.setItem('ucsd-selected-major', major)
  }

  const handleReset = () => {
    setSelectedCollege('')
    setSelectedMajor('')
    setMajorSearch('')
    localStorage.removeItem('ucsd-selected-college')
    localStorage.removeItem('ucsd-selected-major')
  }

  const completedSet = useMemo(() => new Set(completedCodes), [completedCodes])
  const progress = useMemo(
    () => (selectedMajor && selectedCollege) ? calculateProgress(selectedMajor, selectedCollege, completedSet) : null,
    [selectedMajor, selectedCollege, completedSet],
  )

  const filteredMajors = useMemo(() => {
    if (!majorSearch.trim()) return MAJOR_NAMES
    const q = majorSearch.toLowerCase()
    return MAJOR_NAMES.filter((name) => name.toLowerCase().includes(q))
  }, [majorSearch])

  // Step 1: Select college
  if (!selectedCollege) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <h2 className="text-lg font-semibold text-text mb-2">Graduation Progress</h2>
        <p className="text-[13px] text-muted mb-6">
          Select your college to track your degree requirements.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {COLLEGE_NAMES.map((name) => {
            const college = COLLEGES[name]
            return (
              <button
                key={name}
                onClick={() => handleCollegeChange(name)}
                className="text-left px-5 py-4 rounded-xl bg-card border border-border
                  hover:border-accent/30 hover:bg-accent/5
                  transition-all duration-150 cursor-pointer group"
              >
                <div className="text-[14px] font-medium text-text group-hover:text-accent transition-colors">{college.name}</div>
                <div className="text-[11px] text-muted mt-1">{college.ge.length} GE requirement areas</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Step 2: Select major
  if (!selectedMajor) {
    const college = COLLEGES[selectedCollege]
    return (
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text mb-1">Select Your Major</h2>
            <p className="text-[13px] text-muted">
              <span className="text-accent2">{college.name}</span> &middot; {MAJOR_NAMES.length} majors available
            </p>
          </div>
          <button
            onClick={() => handleCollegeChange('')}
            className="text-[11px] px-3 py-1.5 rounded-lg text-muted hover:text-text
              bg-surface border border-border hover:border-border2 transition-all cursor-pointer"
          >
            Change College
          </button>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={majorSearch}
            onChange={(e) => setMajorSearch(e.target.value)}
            placeholder="Search majors..."
            className="w-full bg-surface border border-border rounded-lg text-text text-[13px]
              px-3 py-2 pl-9 outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredMajors.map((name) => (
            <button
              key={name}
              onClick={() => handleMajorChange(name)}
              className="text-left px-5 py-4 rounded-xl bg-card border border-border
                hover:border-accent/30 hover:bg-accent/5
                transition-all duration-150 cursor-pointer"
            >
              <div className="text-[14px] font-medium text-text">{name}</div>
              <div className="text-[11px] text-muted mt-1">{college.name}</div>
            </button>
          ))}
          {filteredMajors.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted text-[13px]">
              No majors match your search.
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!progress) return null

  const college = COLLEGES[selectedCollege]

  // Count completed/total for summary ring
  const majorDone = progress.lowerDiv.completed + progress.upperDiv.completed + (progress.electives?.completed || 0)
  const majorTotal = progress.lowerDiv.required + progress.upperDiv.required + (progress.electives?.required || 0)
  const geDone = progress.ge.reduce((s, g) => s + g.completed, 0)
  const geTotal = progress.ge.reduce((s, g) => s + g.required, 0)

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-text">{selectedMajor}</h2>
            <span className="text-[11px] text-accent2 bg-accent2/10 px-2 py-0.5 rounded">
              {college.name}
            </span>
            {progress.isEngineering && (
              <span className="text-[11px] text-gold bg-gold/10 px-2 py-0.5 rounded">
                Engineering
              </span>
            )}
          </div>
          <div className="text-[13px] text-muted mt-1">
            {completedCodes.length} courses completed &middot; Switch to "Completed Courses" tab to add more
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-[11px] px-3 py-1.5 rounded-lg text-muted hover:text-text
            bg-surface border border-border hover:border-border2 transition-all cursor-pointer"
        >
          Change
        </button>
      </div>

      {/* Summary cards with progress rings */}
      <div className="grid grid-cols-3 gap-4">
        <ProgressRingCard label="Overall" completed={progress.totalCompleted} total={progress.totalRequired} pct={progress.overallPct} color="accent" />
        <ProgressRingCard label="Major" completed={majorDone} total={majorTotal} pct={majorTotal > 0 ? Math.round(majorDone / majorTotal * 100) : 0} color="accent" />
        <ProgressRingCard label="College GE" completed={geDone} total={geTotal} pct={geTotal > 0 ? Math.round(geDone / geTotal * 100) : 0} color="accent2" />
      </div>

      {/* Major Requirements */}
      <div className="space-y-3">
        <h3 className="text-[12px] text-accent font-medium uppercase tracking-wide">
          Major Requirements — {selectedMajor}
        </h3>
        <ReqCard req={progress.lowerDiv} />
        <ReqCard req={progress.upperDiv} />
        {progress.electives && <ReqCard req={progress.electives} />}
      </div>

      {/* College GE */}
      <div className="space-y-3">
        <h3 className="text-[12px] text-accent2 font-medium uppercase tracking-wide">
          {college.name} General Education
        </h3>
        {progress.ge.map((g) => (
          <ReqCard key={g.id} req={g} />
        ))}
      </div>
    </div>
  )
}

function ProgressRingCard({ label, completed, total, pct, color }: {
  label: string; completed: number; total: number; pct: number; color: string
}) {
  const radius = 36
  const stroke = 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="relative w-20 h-20 shrink-0">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
            className="text-surface" />
          <circle cx="40" cy="40" r={radius} fill="none" strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${color === 'accent2' ? 'text-accent2' : pct >= 75 ? 'text-green' : pct >= 40 ? 'text-gold' : 'text-accent'}`}
            stroke="currentColor"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-[18px] font-bold ${pct >= 75 ? 'text-green' : pct >= 40 ? 'text-gold' : 'text-text'}`}>
            {pct}%
          </span>
        </div>
      </div>
      <div>
        <div className="text-[14px] font-medium text-text">{label}</div>
        <div className="text-[12px] text-muted mt-0.5">
          {completed} / {total} done
        </div>
        <div className="text-[11px] text-dim mt-0.5">
          {total - completed} remaining
        </div>
      </div>
    </div>
  )
}

function ReqCard({ req }: { req: ReqProgress }) {
  const [expanded, setExpanded] = useState(false)
  const pct = req.required > 0 ? Math.round((req.completed / req.required) * 100) : 0
  const isDone = req.completed >= req.required

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${isDone ? 'bg-green/5 border-green/20' : 'bg-card border-border hover:border-border2'}`}
    >
      {/* Header — always visible, clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-center gap-3 cursor-pointer"
      >
        {/* Status indicator */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isDone ? 'bg-green/15' : 'bg-surface'
        }`}>
          {isDone ? (
            <svg width="16" height="16" fill="none" stroke="#3dd68c" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <span className="font-mono text-[11px] font-bold text-muted">{req.completed}/{req.required}</span>
          )}
        </div>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-text">{req.name}</div>
          <div className="text-[11px] text-muted truncate">{req.description}</div>
        </div>

        {/* Progress bar + percentage */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 h-2 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-green' : 'bg-accent'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`font-mono text-[12px] font-medium w-8 text-right ${isDone ? 'text-green' : 'text-muted'}`}>
            {pct}%
          </span>
          <svg
            width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            className={`text-dim transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 animate-fade-in">
          {/* Completed courses */}
          {req.completedCourses.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-medium text-green uppercase tracking-wide mb-2">Completed</div>
              <div className="flex flex-wrap gap-1.5">
                {req.completedCourses.map((c) => (
                  <span key={c} className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-green/10 text-green border border-green/20 font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing courses */}
          {req.missingOptions.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-medium text-red/70 uppercase tracking-wide mb-2">
                Still Needed {req.missingOptions.length > 1 ? `(${req.required - req.completed} more)` : ''}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {req.missingOptions.map((alts, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {alts.slice(0, 5).map((c) => (
                      <a
                        key={c}
                        href={socSearchUrl(courseCodeToSubject(c))}
                        target="_blank"
                        rel="noopener"
                        className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-red/8 text-red/80 border border-red/15
                          hover:bg-red/15 hover:text-red transition-colors font-medium"
                      >
                        {c}
                      </a>
                    ))}
                    {alts.length > 5 && (
                      <span className="font-mono text-[11px] text-dim">+{alts.length - 5} more</span>
                    )}
                    {alts.length > 1 && i < req.missingOptions.length - 1 && (
                      <span className="text-[10px] text-dim mx-0.5">or</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
