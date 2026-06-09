import { useState, useMemo } from 'react'
import type { CompletedCourse } from '../hooks/useCompletedCourses'
import type { Course } from '../types'
import { GradProgress } from './GradProgress'

interface CompletedCoursesProps {
  completed: CompletedCourse[]
  allCourses: Course[]
  onAdd: (course: CompletedCourse) => void
  onRemove: (courseCode: string) => void
  onClear: () => void
  completedCodes?: string[]
}

function isValidCourseCode(input: string): boolean {
  return /^[A-Z]{2,5}\s+\d{1,3}[A-Z]{0,3}$/i.test(input.trim())
}

function normalizeCourseCode(input: string): string {
  const parts = input.trim().split(/\s+/)
  if (parts.length < 2) return input.trim().toUpperCase()
  return parts[0].toUpperCase() + ' ' + parts.slice(1).join('').toUpperCase()
}

export function CompletedCourses({ completed, allCourses, onAdd, onRemove, onClear, completedCodes }: CompletedCoursesProps) {
  const [tab, setTab] = useState<'history' | 'progress'>('history')
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

  const completedSet = useMemo(() => new Set(completed.map(c => c.course_code)), [completed])

  const searchResults = useMemo(() => {
    if (search.length < 2) return []
    const q = search.toLowerCase()
    return allCourses
      .filter(c => c.course_code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
      .filter(c => !completedSet.has(c.course_code))
      .slice(0, 12)
  }, [search, allCourses, completedSet])

  const manualCode = useMemo(() => {
    if (search.length < 3) return null
    const normalized = normalizeCourseCode(search)
    if (!isValidCourseCode(normalized)) return null
    if (completedSet.has(normalized)) return null
    if (searchResults.some(c => c.course_code === normalized)) return null
    return normalized
  }, [search, searchResults, completedSet])

  const handleAddFromSearch = (course: Course) => {
    onAdd({ course_code: course.course_code, title: course.title })
    setSearch('')
    setShowDropdown(false)
  }

  const handleAddManual = (code: string) => {
    onAdd({ course_code: code, title: '' })
    setSearch('')
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) handleAddFromSearch(searchResults[0])
      else if (manualCode) handleAddManual(manualCode)
    }
    if (e.key === 'Escape') setShowDropdown(false)
  }

  // Group by department
  const bySubject = useMemo(() => {
    const map = new Map<string, CompletedCourse[]>()
    for (const c of completed) {
      const subj = c.course_code.split(' ')[0]
      if (!map.has(subj)) map.set(subj, [])
      map.get(subj)!.push(c)
    }
    // Sort courses within each dept
    for (const courses of map.values()) {
      courses.sort((a, b) => a.course_code.localeCompare(b.course_code))
    }
    return map
  }, [completed])

  const departments = useMemo(() =>
    Array.from(bySubject.entries()).sort(([a], [b]) => a.localeCompare(b)),
  [bySubject])

  const toggleDept = (dept: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
      return next
    })
  }

  // ── Progress tab ──
  if (tab === 'progress') {
    return (
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 pt-6 pb-2">
          <TabBar tab={tab} onTabChange={setTab} completedCount={completed.length} />
        </div>
        <GradProgress completedCodes={completedCodes || completed.map(c => c.course_code)} />
      </div>
    )
  }

  // ── History tab ──
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-6 space-y-5">
        <TabBar tab={tab} onTabChange={setTab} completedCount={completed.length} />

        {/* Search bar */}
        <div className="relative">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="Add a course — search or type code (e.g. CSE 12, MATH 20A)..."
              className="w-full bg-card border border-border rounded-2xl text-text text-[14px]
                px-5 py-3.5 pl-11 outline-none transition-all
                focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,142,247,0.1)]
                placeholder:text-dim"
            />
            {search && (
              <button onClick={() => { setSearch(''); setShowDropdown(false) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dim hover:text-muted cursor-pointer">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (searchResults.length > 0 || manualCode) && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border2 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto">
              {manualCode && (
                <button onClick={() => handleAddManual(manualCode)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface transition-colors cursor-pointer border-b border-border/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" fill="none" stroke="#f5c842" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-mono text-[13px] font-bold text-gold">{manualCode}</span>
                    <span className="text-[12px] text-muted ml-2">Add manually</span>
                  </div>
                  <kbd className="text-[10px] text-dim border border-border rounded px-1.5 py-0.5">Enter</kbd>
                </button>
              )}
              {searchResults.map(c => (
                <button key={c.course_code} onClick={() => handleAddFromSearch(c)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-surface transition-colors cursor-pointer border-b border-border/30 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" fill="none" stroke="#4f8ef7" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[13px] font-semibold text-text">{c.course_code}</span>
                    <span className="text-[12px] text-muted ml-2 truncate">{c.title}</span>
                  </div>
                  <span className="text-[11px] text-gold font-mono shrink-0">{c.units}u</span>
                </button>
              ))}
            </div>
          )}

          {showDropdown && search.length >= 2 && searchResults.length === 0 && !manualCode && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border2 rounded-2xl shadow-2xl z-50 px-5 py-4">
              <p className="text-[12px] text-muted">
                No match. Type a full code like <span className="font-mono text-accent">MATH 20A</span> and press Enter to add manually.
              </p>
            </div>
          )}
        </div>

        {/* Stats row */}
        {completed.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-green/10 flex items-center justify-center">
                  <svg width="16" height="16" fill="none" stroke="#3dd68c" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <div className="text-[18px] font-bold text-text">{completed.length}</div>
                  <div className="text-[10px] text-muted">Courses</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-accent2/10 flex items-center justify-center">
                  <svg width="16" height="16" fill="none" stroke="#7c5cfc" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v0a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 6z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[18px] font-bold text-text">{bySubject.size}</div>
                  <div className="text-[10px] text-muted">Departments</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => { if (confirm(`Clear all ${completed.length} completed courses?`)) onClear() }}
              className="text-[11px] px-3 py-1.5 rounded-lg text-red/50 hover:text-red hover:bg-red/8 border border-transparent hover:border-red/15 transition-all cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Empty state */}
        {completed.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/10 to-accent2/10 flex items-center justify-center mx-auto mb-5">
              <svg width="36" height="36" fill="none" stroke="url(#grad)" strokeWidth="1.5" viewBox="0 0 24 24">
                <defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4f8ef7"/><stop offset="100%" stopColor="#7c5cfc"/></linearGradient></defs>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">Track Your Academic Journey</h3>
            <p className="text-[14px] text-muted max-w-md mx-auto leading-relaxed mb-4">
              Add courses you've completed to track graduation progress, check prerequisites, and get smarter AI recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['CSE 11', 'MATH 20A', 'PHYS 2A', 'CHEM 6A'].map(code => (
                <button key={code} onClick={() => handleAddManual(code)}
                  className="font-mono text-[12px] px-3 py-1.5 rounded-lg bg-card border border-border text-muted hover:text-accent hover:border-accent/30 cursor-pointer transition-all"
                >
                  + {code}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Course list grouped by department */
          <div className="space-y-2">
            {departments.map(([dept, courses]) => {
              const isExpanded = expandedDepts.has(dept) || departments.length <= 4
              return (
                <div key={dept} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button onClick={() => toggleDept(dept)}
                    className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
                  >
                    <div className="w-10 h-6 rounded-md bg-accent/10 flex items-center justify-center">
                      <span className="font-mono text-[11px] font-bold text-accent">{dept}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-[13px] font-medium text-text">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
                    </div>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      className={`text-dim transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                      {courses.map(c => (
                        <div key={c.course_code}
                          className="group flex items-center gap-2 bg-surface rounded-lg px-3 py-1.5 border border-border/50"
                        >
                          <svg width="12" height="12" fill="none" stroke="#3dd68c" strokeWidth="2.5" viewBox="0 0 24 24" className="shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          <span className="font-mono text-[12px] font-semibold text-text">{c.course_code}</span>
                          {c.title && (
                            <span className="text-[11px] text-muted truncate max-w-[180px] hidden sm:inline">{c.title}</span>
                          )}
                          <button onClick={() => onRemove(c.course_code)}
                            className="ml-auto text-dim hover:text-red transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function TabBar({ tab, onTabChange, completedCount }: {
  tab: 'history' | 'progress'
  onTabChange: (t: 'history' | 'progress') => void
  completedCount: number
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1 bg-surface rounded-xl p-1">
        <button onClick={() => onTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
            tab === 'history' ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'
          }`}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Completed Courses
          {completedCount > 0 && (
            <span className={`min-w-[20px] h-5 text-[11px] font-semibold rounded-full flex items-center justify-center px-1.5 ${
              tab === 'history' ? 'bg-green/15 text-green' : 'bg-surface text-muted'
            }`}>{completedCount}</span>
          )}
        </button>
        <button onClick={() => onTabChange('progress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
            tab === 'progress' ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'
          }`}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
          </svg>
          Graduation Progress
        </button>
      </div>
    </div>
  )
}
