import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  PREREQ_GRAPH,
  getCourseStatus,
  getUnlocks,
  getDepth,
  getAllDownstream,
  type CourseStatus,
} from '../lib/prereqChains'
import { courseCodeToSubject, catalogUrl, socSearchUrl } from '../lib/links'
import { useIsMobile } from '../hooks/useMediaQuery'

interface PrereqChainsProps {
  completedCodes: string[]
}

interface DeptSummary {
  id: string
  courseCount: number
  withPrereqs: number
}

// Build a sorted list of departments derived from PREREQ_GRAPH keys.
// Done once at module load so it isn't repeated on every render.
const DEPT_SUMMARIES: DeptSummary[] = (() => {
  const byDept = new Map<string, DeptSummary>()
  for (const [code, prereqs] of Object.entries(PREREQ_GRAPH)) {
    const subject = courseCodeToSubject(code)
    let entry = byDept.get(subject)
    if (!entry) {
      entry = { id: subject, courseCount: 0, withPrereqs: 0 }
      byDept.set(subject, entry)
    }
    entry.courseCount += 1
    if (prereqs.length > 0) entry.withPrereqs += 1
  }
  return Array.from(byDept.values()).sort((a, b) => a.id.localeCompare(b.id))
})()

// Sort course codes by their numeric part (then the suffix), so "CSE 8A" comes before "CSE 100".
function compareCourseCodes(a: string, b: string): number {
  const numA = parseInt(a.replace(/^\D+\s*/, ''), 10)
  const numB = parseInt(b.replace(/^\D+\s*/, ''), 10)
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) return numA - numB
  return a.localeCompare(b)
}

const LAYER_LABELS = [
  'No Prerequisites',
  'Requires 1 prereq deep',
  'Requires 2 prereqs deep',
  'Requires 3 prereqs deep',
  'Advanced (4+ deep)',
]

export function PrereqChains({ completedCodes }: PrereqChainsProps) {
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    const stored = localStorage.getItem('prereqs-dept')
    if (stored && DEPT_SUMMARIES.some((d) => d.id === stored)) return stored
    // Default to a department that's likely interesting to a CS student
    return DEPT_SUMMARIES.find((d) => d.id === 'CSE')?.id || DEPT_SUMMARIES[0]?.id || ''
  })
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null)
  const [deptSearch, setDeptSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [globalSearch, setGlobalSearch] = useState('')
  const [mobileDeptOpen, setMobileDeptOpen] = useState(false)
  const isMobile = useIsMobile()

  // Auto-close the dept drawer when grade-school screens resize.
  useEffect(() => { if (!isMobile) setMobileDeptOpen(false) }, [isMobile])

  const completed = useMemo(() => new Set(completedCodes), [completedCodes])

  // Persist department selection
  const handleDeptChange = useCallback((id: string) => {
    setSelectedDept(id)
    setSelectedCourse(null)
    setCourseSearch('')
    setMobileDeptOpen(false)
    try {
      localStorage.setItem('prereqs-dept', id)
    } catch { /* ignore */ }
  }, [])

  // Filter the dept sidebar list by typed search
  const filteredDepts = useMemo(() => {
    const q = deptSearch.trim().toUpperCase()
    if (!q) return DEPT_SUMMARIES
    return DEPT_SUMMARIES.filter((d) => d.id.includes(q))
  }, [deptSearch])

  // Courses in the selected department, organized into layers by prereq depth.
  const layers = useMemo(() => {
    const codes = Object.keys(PREREQ_GRAPH).filter((code) => courseCodeToSubject(code) === selectedDept)
    const byDepth = new Map<number, string[]>()
    for (const code of codes) {
      const d = Math.min(getDepth(code), LAYER_LABELS.length - 1)
      if (!byDepth.has(d)) byDepth.set(d, [])
      byDepth.get(d)!.push(code)
    }
    const sorted = Array.from(byDepth.entries()).sort((a, b) => a[0] - b[0])
    return sorted.map(([depth, items]) => ({
      depth,
      label: LAYER_LABELS[Math.min(depth, LAYER_LABELS.length - 1)],
      nodes: items.sort(compareCourseCodes),
    }))
  }, [selectedDept])

  // Stats for the department
  const deptStats = useMemo(() => {
    const codes = Object.keys(PREREQ_GRAPH).filter((code) => courseCodeToSubject(code) === selectedDept)
    let done = 0, avail = 0, locked = 0
    for (const code of codes) {
      const s = getCourseStatus(code, completed)
      if (s === 'completed') done++
      else if (s === 'available') avail++
      else locked++
    }
    return { done, avail, locked, total: codes.length }
  }, [selectedDept, completed])

  // Within-department search filter
  const filterCode = useCallback(
    (code: string) => {
      const q = courseSearch.trim().toUpperCase()
      if (!q) return true
      return code.includes(q)
    },
    [courseSearch],
  )

  // Global search — find any course across all departments
  const globalResults = useMemo(() => {
    const q = globalSearch.trim().toUpperCase()
    if (!q || q.length < 2) return [] as string[]
    return Object.keys(PREREQ_GRAPH).filter((code) => code.includes(q)).sort(compareCourseCodes).slice(0, 25)
  }, [globalSearch])

  // What's highlighted (connected to hovered/selected)
  const highlighted = useMemo(() => {
    const target = selectedCourse || hoveredCourse
    if (!target) return null
    const set = new Set<string>([target])
    const prereqs = PREREQ_GRAPH[target] || []
    prereqs.forEach((p) => set.add(p))
    getUnlocks(target).forEach((u) => set.add(u))
    return set
  }, [selectedCourse, hoveredCourse])

  const activeCourse = selectedCourse
  const activePrereqs = activeCourse ? PREREQ_GRAPH[activeCourse] || [] : []
  const activeUnlocks = activeCourse ? getUnlocks(activeCourse) : []
  const activeAllDownstream = activeCourse ? getAllDownstream(activeCourse) : []

  // Clicking a course in the detail panel that's from another dept switches dept
  const handleCrossDeptClick = useCallback((code: string) => {
    const subject = courseCodeToSubject(code)
    if (subject !== selectedDept) handleDeptChange(subject)
    setSelectedCourse(code)
  }, [selectedDept, handleDeptChange])

  return (
    <div className="h-[calc(100vh-64px)] flex relative">
      {/* Backdrop for mobile dept drawer */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          mobileDeptOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileDeptOpen(false)}
        aria-hidden
      />
      {/* ── Left sidebar: dept picker ── */}
      <div className={`bg-surface border-r border-border flex flex-col overflow-hidden
          md:static md:w-60 md:shrink-0 md:translate-x-0
          fixed top-14 bottom-0 left-0 w-[260px] max-w-[80vw] z-50 transition-transform duration-200
          ${mobileDeptOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-4 pt-5 pb-3">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">Prerequisites</h2>
          <p className="text-[11px] text-muted mt-0.5">Visualize chains across all departments</p>
        </div>

        {/* Dept search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <input
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              placeholder="Filter departments…"
              className="w-full bg-bg border border-border rounded-lg pl-7 pr-2 py-1.5 text-[12px] text-text outline-none focus:border-accent/50 placeholder:text-muted"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx={11} cy={11} r={8} /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {filteredDepts.length === 0 ? (
            <div className="px-3 py-3 text-[11px] text-muted">No departments match.</div>
          ) : (
            filteredDepts.map((d) => {
              const isActive = selectedDept === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => handleDeptChange(d.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'bg-accent/10 border border-accent/20' : 'hover:bg-card border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-[13px] font-semibold ${isActive ? 'text-accent' : 'text-text'}`}>{d.id}</div>
                    <div className="text-[10px] text-dim">{d.courseCount}</div>
                  </div>
                  {d.withPrereqs > 0 && (
                    <div className="text-[10px] text-muted mt-0.5">{d.withPrereqs} w/ prereqs</div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Legend */}
        <div className="border-t border-border px-4 py-3 space-y-1.5">
          <div className="text-[10px] text-dim font-medium uppercase tracking-wide mb-2">Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green" />
            <span className="text-[11px] text-muted">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-[11px] text-muted">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-border" />
            <span className="text-[11px] text-muted">Locked</span>
          </div>
        </div>
      </div>

      {/* ── Main: graph area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar with stats + within-dept search + global search */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
          {/* Mobile-only: open dept drawer */}
          <button
            onClick={() => setMobileDeptOpen(true)}
            className="md:hidden mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-[12px] text-text hover:border-border2 cursor-pointer"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className="font-semibold text-accent">{selectedDept}</span>
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-text">{selectedDept} Prerequisite Chain</h1>
              <p className="text-[12px] sm:text-[13px] text-muted mt-0.5">
                {deptStats.total} courses · Tap any course to see prerequisites
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <StatPill label="Completed" value={deptStats.done} total={deptStats.total} color="green" />
              <StatPill label="Available" value={deptStats.avail} total={deptStats.total} color="accent" />
              <StatPill label="Locked" value={deptStats.locked} total={deptStats.total} color="muted" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {/* In-department search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <input
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder={`Filter within ${selectedDept}…`}
                className="w-full bg-bg border border-border rounded-lg pl-8 pr-2 py-1.5 text-[12px] text-text outline-none focus:border-accent/50 placeholder:text-muted"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx={11} cy={11} r={8} /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>

            {/* Global search across all departments */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Find any course (e.g. BILD 1, MATH 20C)…"
                className="w-full bg-bg border border-border rounded-lg pl-8 pr-2 py-1.5 text-[12px] text-text outline-none focus:border-accent/50 placeholder:text-muted"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx={11} cy={11} r={8} /><path d="M21 21l-4.35-4.35" />
              </svg>

              {globalResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-72 overflow-y-auto">
                  {globalResults.map((code) => {
                    const status = getCourseStatus(code, completed)
                    return (
                      <button
                        key={code}
                        onClick={() => {
                          handleCrossDeptClick(code)
                          setGlobalSearch('')
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-bg cursor-pointer flex items-center justify-between border-b border-border/50 last:border-b-0"
                      >
                        <span className="font-mono text-[12px] text-text">{code}</span>
                        <StatusDot status={status} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graph area */}
        <div className="flex-1 overflow-auto">
          <div className="px-3 sm:px-6 py-4 sm:py-6 min-w-fit">
            {layers.length === 0 ? (
              <div className="text-[13px] text-muted">No courses in this department.</div>
            ) : (
              layers.map(({ depth, label, nodes }, layerIdx) => {
                const visible = nodes.filter(filterCode)
                if (visible.length === 0) return null
                return (
                  <div key={depth} className="mb-7">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-[11px] font-medium text-dim uppercase tracking-wide">{label}</div>
                      <div className="flex-1 h-px bg-border/50" />
                      <div className="text-[10px] text-dim">{visible.length} courses</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {visible.map((code) => {
                        const status = getCourseStatus(code, completed)
                        const prereqs = PREREQ_GRAPH[code] || []
                        const unlockCount = getUnlocks(code).length
                        const isHighlighted = highlighted?.has(code) ?? false
                        const isSelected = selectedCourse === code
                        const dimmed = highlighted !== null && !isHighlighted

                        return (
                          <CourseNode
                            key={code}
                            code={code}
                            status={status}
                            prereqCount={prereqs.length}
                            unlockCount={unlockCount}
                            isSelected={isSelected}
                            dimmed={dimmed}
                            onClick={() => setSelectedCourse((prev) => (prev === code ? null : code))}
                            onMouseEnter={() => setHoveredCourse(code)}
                            onMouseLeave={() => setHoveredCourse(null)}
                          />
                        )
                      })}
                    </div>

                    {layerIdx < layers.length - 1 && (
                      <div className="flex justify-center my-3">
                        <svg width="18" height="14" viewBox="0 0 18 14" className="text-border">
                          <path d="M9 0 L9 10 M5 6 L9 10 L13 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Right detail panel ── on mobile it slides up from the bottom as a sheet */}
      {activeCourse && (
        <>
        <div className="md:hidden fixed inset-0 bg-black/40 z-40 animate-fade-in" onClick={() => setSelectedCourse(null)} aria-hidden />
        <div className="md:w-80 md:shrink-0 md:border-l md:border-t-0 md:relative md:rounded-none md:translate-y-0
            fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface flex flex-col overflow-hidden animate-fade-in max-h-[80vh] rounded-t-2xl">
          <div className="px-5 py-5 border-b border-border">
            <div className="flex items-center justify-between">
              <StatusBadge status={getCourseStatus(activeCourse, completed)} />
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-dim hover:text-text cursor-pointer text-lg leading-none px-2"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <h2 className="text-lg font-bold text-text mt-2 font-mono">{activeCourse}</h2>
            <div className="flex gap-2 mt-3 flex-wrap">
              <a
                href={catalogUrl(courseCodeToSubject(activeCourse), activeCourse.split(' ')[1] || '')}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] px-2 py-1 rounded-md bg-card border border-border text-muted hover:text-text hover:border-border2"
              >
                Catalog →
              </a>
              <a
                href={socSearchUrl(courseCodeToSubject(activeCourse))}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] px-2 py-1 rounded-md bg-card border border-border text-muted hover:text-text hover:border-border2"
              >
                Schedule of Classes →
              </a>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Prereqs */}
            <section>
              <div className="text-[11px] font-medium text-dim uppercase tracking-wider mb-2">
                Prerequisites ({activePrereqs.length})
              </div>
              {activePrereqs.length === 0 ? (
                <div className="text-[12px] text-green font-medium">None — open to anyone.</div>
              ) : (
                <div className="space-y-1.5">
                  {activePrereqs.map((p) => {
                    const isCompleted = completed.has(p)
                    const exists = p in PREREQ_GRAPH
                    return (
                      <button
                        key={p}
                        onClick={() => exists && handleCrossDeptClick(p)}
                        disabled={!exists}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                          exists ? 'cursor-pointer hover:bg-card border-border' : 'cursor-default border-border/50 opacity-70'
                        } ${isCompleted ? 'bg-green/5' : ''}`}
                      >
                        <span className="font-mono text-[12px] text-text">{p}</span>
                        {isCompleted ? (
                          <span className="text-green text-[10px] font-semibold flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            done
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted">{exists ? 'view →' : 'external'}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Direct unlocks */}
            <section>
              <div className="text-[11px] font-medium text-dim uppercase tracking-wider mb-2">
                Unlocks ({activeUnlocks.length} direct, {activeAllDownstream.length} total downstream)
              </div>
              {activeUnlocks.length === 0 ? (
                <div className="text-[12px] text-muted">No tracked courses list this as a prerequisite.</div>
              ) : (
                <div className="space-y-1.5">
                  {activeUnlocks.slice(0, 30).map((u) => {
                    const status = getCourseStatus(u, completed)
                    return (
                      <button
                        key={u}
                        onClick={() => handleCrossDeptClick(u)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border cursor-pointer hover:bg-card text-left"
                      >
                        <span className="font-mono text-[12px] text-text">{u}</span>
                        <StatusDot status={status} />
                      </button>
                    )
                  })}
                  {activeUnlocks.length > 30 && (
                    <div className="text-[10px] text-dim text-center pt-1">
                      …and {activeUnlocks.length - 30} more
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
        </>
      )}
    </div>
  )
}

// ── Helpers ──

const STATUS_STYLES: Record<CourseStatus, { ring: string; bg: string; text: string; dot: string }> = {
  completed: { ring: 'border-green/40', bg: 'bg-green/10', text: 'text-green', dot: 'bg-green' },
  available: { ring: 'border-accent/40', bg: 'bg-accent/8', text: 'text-accent', dot: 'bg-accent' },
  locked:    { ring: 'border-border', bg: 'bg-card',     text: 'text-muted',  dot: 'bg-border' },
}

interface CourseNodeProps {
  code: string
  status: CourseStatus
  prereqCount: number
  unlockCount: number
  isSelected: boolean
  dimmed: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function CourseNode({ code, status, prereqCount, unlockCount, isSelected, dimmed, onClick, onMouseEnter, onMouseLeave }: CourseNodeProps) {
  const s = STATUS_STYLES[status]
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative px-3 py-2 rounded-lg border cursor-pointer transition-all
        ${s.ring} ${s.bg}
        ${isSelected ? 'ring-2 ring-accent shadow-md scale-[1.02]' : ''}
        ${dimmed ? 'opacity-30' : 'opacity-100'}
        hover:scale-[1.03] hover:shadow-md
      `}
    >
      <div className={`font-mono text-[12px] font-semibold ${s.text}`}>{code}</div>
      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted">
        {prereqCount > 0 && <span>↑ {prereqCount}</span>}
        {unlockCount > 0 && <span>↓ {unlockCount}</span>}
        {prereqCount === 0 && unlockCount === 0 && <span className="text-dim">—</span>}
      </div>
    </button>
  )
}

function StatusDot({ status }: { status: CourseStatus }) {
  return <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[status].dot}`} />
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const s = STATUS_STYLES[status]
  const label = status === 'completed' ? 'Completed' : status === 'available' ? 'Available' : 'Locked'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.ring} ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  )
}

interface StatPillProps {
  label: string
  value: number
  total: number
  color: 'green' | 'accent' | 'muted'
}

function StatPill({ label, value, total, color }: StatPillProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const colorClasses =
    color === 'green' ? 'text-green bg-green/10 border-green/20'
    : color === 'accent' ? 'text-accent bg-accent/10 border-accent/20'
    : 'text-muted bg-card border-border'
  return (
    <div className={`px-3 py-1.5 rounded-lg border ${colorClasses}`}>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[14px] font-bold tabular-nums">{value}</span>
        <span className="text-[10px] opacity-70">/ {total}</span>
        <span className="text-[10px] opacity-60">· {pct}%</span>
      </div>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
    </div>
  )
}
