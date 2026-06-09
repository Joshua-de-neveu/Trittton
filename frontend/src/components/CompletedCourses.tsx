import { useState, useMemo, useCallback } from 'react'
import type { CompletedCourse } from '../hooks/useCompletedCourses'
import type { Course } from '../types'
import { GradProgress } from './GradProgress'
import { PREREQ_GRAPH, getCourseStatus, getUnlocks, getDepth, getAllDownstream, type CourseStatus } from '../lib/prereqChains'

interface CompletedCoursesProps {
  completed: CompletedCourse[]
  allCourses: Course[]
  onAdd: (course: CompletedCourse) => void
  onRemove: (courseCode: string) => void
  onClear: () => void
  completedCodes?: string[]
}

type Tab = 'courses' | 'progress' | 'prereqs'

export function CompletedCourses({ completed, allCourses, onAdd, onRemove, onClear, completedCodes }: CompletedCoursesProps) {
  const [tab, setTab] = useState<Tab>('courses')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const completedSet = useMemo(() => new Set(completed.map(c => c.course_code)), [completed])
  const codes = completedCodes || completed.map(c => c.course_code)

  // Group ALL scraped courses by department
  const deptMap = useMemo(() => {
    const map = new Map<string, Course[]>()
    for (const c of allCourses) {
      if (!map.has(c.subject)) map.set(c.subject, [])
      map.get(c.subject)!.push(c)
    }
    for (const courses of map.values()) {
      courses.sort((a, b) => a.course_code.localeCompare(b.course_code))
    }
    return map
  }, [allCourses])

  const departments = useMemo(() =>
    Array.from(deptMap.keys()).sort(),
  [deptMap])

  // Auto-select first dept
  const activeDept = selectedDept || departments[0] || ''
  const deptCourses = deptMap.get(activeDept) || []

  // Filter courses in current dept
  const filteredCourses = useMemo(() => {
    if (!search) return deptCourses
    const q = search.toLowerCase()
    return deptCourses.filter(c =>
      c.course_code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    )
  }, [deptCourses, search])

  // Count completed per dept
  const deptCompletedCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of completed) {
      const subj = c.course_code.split(' ')[0]
      counts.set(subj, (counts.get(subj) || 0) + 1)
    }
    return counts
  }, [completed])

  const toggleCourse = useCallback((course: Course) => {
    if (completedSet.has(course.course_code)) {
      onRemove(course.course_code)
    } else {
      onAdd({ course_code: course.course_code, title: course.title })
    }
  }, [completedSet, onAdd, onRemove])

  // Prereq chain data for current department
  const prereqNodes = useMemo(() => {
    return deptCourses
      .filter(c => PREREQ_GRAPH[c.course_code])
      .map(c => ({ course: c, node: PREREQ_GRAPH[c.course_code] }))
  }, [deptCourses])

  const prereqLayers = useMemo(() => {
    const byDepth = new Map<number, typeof prereqNodes>()
    for (const item of prereqNodes) {
      const d = getDepth(item.course.course_code)
      if (!byDepth.has(d)) byDepth.set(d, [])
      byDepth.get(d)!.push(item)
    }
    return Array.from(byDepth.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([depth, nodes]) => ({ depth, nodes }))
  }, [prereqNodes])

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* ── LEFT: Department Browser ── */}
      <div className="w-56 shrink-0 border-r border-border bg-surface flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="text-[11px] font-medium text-dim uppercase tracking-wider">Departments</div>
          <div className="text-[10px] text-muted mt-0.5">
            {completed.length} courses completed
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {departments.map(dept => {
            const isActive = activeDept === dept
            const count = deptMap.get(dept)?.length || 0
            const doneCount = deptCompletedCounts.get(dept) || 0
            return (
              <button key={dept}
                onClick={() => { setSelectedDept(dept); setSearch(''); setSelectedCourse(null) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-left mb-0.5 ${
                  isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-card hover:text-text'
                }`}
              >
                <span className={`font-mono text-[12px] font-bold w-12 ${isActive ? 'text-accent' : 'text-text'}`}>{dept}</span>
                <span className="flex-1 text-[11px] tabular-nums">{count}</span>
                {doneCount > 0 && (
                  <span className="text-[10px] font-semibold text-green bg-green/10 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{doneCount}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar: tabs + stats */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-surface rounded-xl p-1">
              {([
                { id: 'courses' as Tab, label: 'Courses', icon: 'grid' },
                { id: 'prereqs' as Tab, label: 'Prereq Chains', icon: 'tree' },
                { id: 'progress' as Tab, label: 'Degree Progress', icon: 'chart' },
              ]).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all ${
                    tab === t.id ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'
                  }`}
                >{t.label}</button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Stats */}
            <div className="flex items-center gap-4 text-[12px]">
              <span className="text-muted"><b className="text-green font-mono">{completed.length}</b> completed</span>
              <span className="text-muted"><b className="text-text font-mono">{departments.length}</b> depts</span>
            </div>

            {completed.length > 0 && (
              <button onClick={() => { if (confirm(`Clear all ${completed.length} completed courses?`)) onClear() }}
                className="text-[11px] px-2.5 py-1 rounded-lg text-dim hover:text-red hover:bg-red/8 cursor-pointer transition-all"
              >Clear All</button>
            )}
          </div>
        </div>

        {/* Tab content */}
        {tab === 'progress' ? (
          <div className="flex-1 overflow-y-auto">
            <GradProgress completedCodes={codes} />
          </div>
        ) : tab === 'prereqs' ? (
          <div className="flex-1 overflow-y-auto">
            <PrereqChainView
              deptCourses={deptCourses}
              prereqLayers={prereqLayers}
              completedSet={completedSet}
              selectedCourse={selectedCourse}
              onSelectCourse={setSelectedCourse}
              onToggleCourse={toggleCourse}
              dept={activeDept}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <CourseGridView
              courses={filteredCourses}
              completedSet={completedSet}
              search={search}
              onSearchChange={setSearch}
              onToggleCourse={toggleCourse}
              selectedCourse={selectedCourse}
              onSelectCourse={setSelectedCourse}
              dept={activeDept}
            />
          </div>
        )}
      </div>

      {/* ── RIGHT: Course Detail Panel ── */}
      {selectedCourse && (
        <CourseDetailPanel
          courseCode={selectedCourse}
          allCourses={allCourses}
          completedSet={completedSet}
          onClose={() => setSelectedCourse(null)}
          onSelectCourse={setSelectedCourse}
          onToggleCourse={(code) => {
            const course = allCourses.find(c => c.course_code === code)
            if (course) toggleCourse(course)
            else if (completedSet.has(code)) onRemove(code)
            else onAdd({ course_code: code, title: '' })
          }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Course Grid View — click-to-toggle courses
// ═══════════════════════════════════════════════════════════════════════════

function CourseGridView({ courses, completedSet, search, onSearchChange, onToggleCourse, selectedCourse, onSelectCourse, dept }: {
  courses: Course[]
  completedSet: Set<string>
  search: string
  onSearchChange: (s: string) => void
  onToggleCourse: (c: Course) => void
  selectedCourse: string | null
  onSelectCourse: (id: string | null) => void
  dept: string
}) {
  const doneCount = courses.filter(c => completedSet.has(c.course_code)).length

  return (
    <div className="px-6 py-5">
      {/* Header + search */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-text">{dept}</h2>
          <div className="text-[12px] text-muted">{courses.length} courses &middot; <span className="text-green">{doneCount} completed</span></div>
        </div>
        <div className="flex-1" />
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => onSearchChange(e.target.value)}
            placeholder="Filter courses..."
            className="w-full bg-surface border border-border rounded-xl text-text text-[13px] px-3 py-2 pl-9 outline-none focus:border-accent placeholder:text-dim"
          />
        </div>
      </div>

      {/* Course grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16 text-muted text-[13px]">No courses match your search</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {courses.map(c => {
            const done = completedSet.has(c.course_code)
            const isSelected = selectedCourse === c.course_code
            const status = getCourseStatus(c.course_code, completedSet)
            return (
              <div key={c.course_code}
                className={`rounded-xl border-2 transition-all duration-150 overflow-hidden ${
                  done ? 'bg-green/5 border-green/25' :
                  status === 'available' ? 'bg-accent/5 border-accent/15' :
                  'bg-card border-border'
                } ${isSelected ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg' : ''}`}
              >
                <div className="flex items-stretch">
                  {/* Toggle button */}
                  <button onClick={() => onToggleCourse(c)}
                    className={`w-11 shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                      done ? 'bg-green/10 hover:bg-green/20' : 'bg-surface/50 hover:bg-accent/10'
                    }`}
                    title={done ? 'Mark as not completed' : 'Mark as completed'}
                  >
                    {done ? (
                      <svg width="16" height="16" fill="none" stroke="#3dd68c" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 ${status === 'available' ? 'border-accent/40' : 'border-border'}`} />
                    )}
                  </button>

                  {/* Course info — click to see details */}
                  <button onClick={() => onSelectCourse(c.course_code === selectedCourse ? null : c.course_code)}
                    className="flex-1 text-left px-3 py-2.5 cursor-pointer hover:bg-surface/30 transition-colors min-w-0"
                  >
                    <div className={`font-mono text-[12px] font-bold ${done ? 'text-green' : 'text-text'}`}>
                      {c.course_code}
                    </div>
                    <div className="text-[11px] text-muted truncate mt-0.5">{c.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-dim">{c.units}u</span>
                      {PREREQ_GRAPH[c.course_code] && PREREQ_GRAPH[c.course_code].prereqs.length > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          status === 'locked' ? 'bg-red/8 text-red/60' : 'bg-surface text-dim'
                        }`}>
                          {PREREQ_GRAPH[c.course_code].prereqs.length} prereq{PREREQ_GRAPH[c.course_code].prereqs.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {getUnlocks(c.course_code).length > 0 && (
                        <span className="text-[9px] text-dim">unlocks {getUnlocks(c.course_code).length}</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Prereq Chain View — visual prerequisite graph
// ═══════════════════════════════════════════════════════════════════════════

function PrereqChainView({ prereqLayers, completedSet, selectedCourse, onSelectCourse, dept }: {
  deptCourses: Course[]
  prereqLayers: { depth: number; nodes: { course: Course; node: { id: string; prereqs: string[] } }[] }[]
  completedSet: Set<string>
  selectedCourse: string | null
  onSelectCourse: (id: string | null) => void
  onToggleCourse: (c: Course) => void
  dept: string
}) {
  const labels = ['No Prerequisites', 'Requires 1 prerequisite', 'Requires 2+ prerequisites', 'Advanced chain', 'Deep chain']

  if (prereqLayers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v0a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 6z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-text mb-1">No prerequisite data for {dept}</h3>
          <p className="text-[13px] text-muted">Prereq chains are available for CSE, MATH, PHYS, ECE, DSC, CHEM, BIO, ECON, COGS, MAE, POLI, and PSYC. Switch to the Courses tab to browse and mark courses.</p>
        </div>
      </div>
    )
  }

  // Stats
  const total = prereqLayers.reduce((s, l) => s + l.nodes.length, 0)
  const done = prereqLayers.reduce((s, l) => s + l.nodes.filter(n => completedSet.has(n.course.course_code)).length, 0)

  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-lg font-bold text-text">{dept} Prerequisite Chain</h2>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green" /> Completed</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-border" /> Locked</span>
        </div>
        <div className="flex-1" />
        <span className="text-[12px] text-muted"><b className="text-green">{done}</b>/{total} completed</span>
      </div>

      {prereqLayers.map(({ depth, nodes }, li) => (
        <div key={depth} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-medium text-dim uppercase tracking-wide">
              {labels[Math.min(depth, labels.length - 1)]}
            </span>
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] text-dim">{nodes.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {nodes.map(({ course }) => {
              const status = getCourseStatus(course.course_code, completedSet)
              const isSelected = selectedCourse === course.course_code
              const unlockCount = getUnlocks(course.course_code).length
              return (
                <button key={course.course_code}
                  onClick={() => onSelectCourse(course.course_code === selectedCourse ? null : course.course_code)}
                  className={`relative px-3 py-2 rounded-xl border-2 cursor-pointer transition-all text-left min-w-[130px] ${
                    status === 'completed' ? 'bg-green/8 border-green/30' :
                    status === 'available' ? 'bg-accent/8 border-accent/25' :
                    'bg-card border-border'
                  } ${isSelected ? 'ring-2 ring-accent scale-[1.03]' : 'hover:scale-[1.02] hover:shadow-sm'}`}
                >
                  {status === 'completed' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green flex items-center justify-center">
                      <svg width="8" height="8" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                  <div className={`font-mono text-[12px] font-bold ${
                    status === 'completed' ? 'text-green' : status === 'available' ? 'text-accent' : 'text-muted'
                  }`}>{course.course_code}</div>
                  <div className="text-[10px] text-muted truncate mt-0.5 max-w-[140px]">{course.title}</div>
                  {unlockCount > 0 && (
                    <div className="text-[9px] text-dim mt-1">unlocks {unlockCount}</div>
                  )}
                </button>
              )
            })}
          </div>

          {li < prereqLayers.length - 1 && (
            <div className="flex justify-center my-2">
              <svg width="16" height="12" viewBox="0 0 16 12" className="text-border/60">
                <path d="M8 0 L8 8 M5 6 L8 9 L11 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Course Detail Panel — shows prereqs, unlocks, description
// ═══════════════════════════════════════════════════════════════════════════

function CourseDetailPanel({ courseCode, allCourses, completedSet, onClose, onSelectCourse, onToggleCourse }: {
  courseCode: string
  allCourses: Course[]
  completedSet: Set<string>
  onClose: () => void
  onSelectCourse: (id: string) => void
  onToggleCourse: (code: string) => void
}) {
  const course = allCourses.find(c => c.course_code === courseCode)
  const node = PREREQ_GRAPH[courseCode]
  const status = getCourseStatus(courseCode, completedSet)
  const unlocks = getUnlocks(courseCode)
  const downstream = getAllDownstream(courseCode)
  const isDone = completedSet.has(courseCode)

  return (
    <div className="w-72 shrink-0 border-l border-border bg-surface flex flex-col overflow-hidden animate-fade-in">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <StatusBadge status={status} />
          <button onClick={onClose} className="text-dim hover:text-text cursor-pointer">&times;</button>
        </div>
        <h3 className="text-[16px] font-bold text-text">{courseCode}</h3>
        {course && <p className="text-[12px] text-muted mt-1">{course.title}</p>}
        {course && <span className="inline-block mt-1.5 text-[10px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded">{course.units} units</span>}

        {/* Toggle button */}
        <button onClick={() => onToggleCourse(courseCode)}
          className={`w-full mt-3 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-all ${
            isDone
              ? 'bg-red/10 text-red border border-red/20 hover:bg-red/20'
              : 'bg-green/10 text-green border border-green/20 hover:bg-green/20'
          }`}
        >{isDone ? 'Remove from Completed' : 'Mark as Completed'}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Prerequisites */}
        {node && (
          <div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5">
              Prerequisites ({node.prereqs.length})
            </div>
            {node.prereqs.length === 0 ? (
              <div className="text-[11px] text-green">No prerequisites</div>
            ) : (
              <div className="space-y-1">
                {node.prereqs.map(p => (
                  <button key={p} onClick={() => onSelectCourse(p)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-border hover:border-border2 cursor-pointer transition-all text-left"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      completedSet.has(p) ? 'bg-green' : canTake(p) ? 'bg-accent' : 'bg-border'
                    }`} />
                    <span className="font-mono text-[11px] font-semibold text-text">{p}</span>
                    {completedSet.has(p) && (
                      <svg width="10" height="10" fill="none" stroke="#3dd68c" strokeWidth="3" viewBox="0 0 24 24" className="ml-auto">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unlocks */}
        {unlocks.length > 0 && (
          <div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5">
              Unlocks ({unlocks.length})
            </div>
            <div className="space-y-1">
              {unlocks.map(u => (
                <button key={u} onClick={() => onSelectCourse(u)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-border hover:border-border2 cursor-pointer transition-all text-left"
                >
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent shrink-0">
                    <path strokeLinecap="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <span className="font-mono text-[11px] font-semibold text-text">{u}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full downstream */}
        {downstream.length > 0 && (
          <div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5">
              Full chain ({downstream.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {downstream.map(c => (
                <button key={c} onClick={() => onSelectCourse(c)}
                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-accent/8 text-accent hover:bg-accent/15 cursor-pointer"
                >{c}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function canTake(courseId: string): boolean {
  const node = PREREQ_GRAPH[courseId]
  if (!node) return true
  return node.prereqs.length === 0
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const config = {
    completed: { label: 'Completed', cls: 'bg-green/10 text-green border-green/20' },
    available: { label: 'Available', cls: 'bg-accent/10 text-accent border-accent/20' },
    locked: { label: 'Prereqs Needed', cls: 'bg-red/10 text-red border-red/20' },
  }
  const c = config[status]
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.cls}`}>{c.label}</span>
}
