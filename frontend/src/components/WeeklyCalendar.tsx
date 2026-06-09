import { useEffect, useState } from 'react'
import { type CalendarBlock, detectConflicts } from '../lib/schedule'

interface UntimedSection {
  courseCode: string
  title?: string
  type: string
  section: string
  days: string
  time: string
  building?: string
  room?: string
  instructor?: string
}

interface WeeklyCalendarProps {
  blocks: CalendarBlock[]
  untimedSections?: UntimedSection[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const SHORT_DAYS = ['M', 'T', 'W', 'Th', 'F']
const START_HOUR = 8
const END_HOUR = 21
const HOUR_HEIGHT = 44
const TOTAL_HOURS = END_HOUR - START_HOUR

// JS Date.getDay() returns 0=Sun, 1=Mon ... 6=Sat. Our DAYS array is Mon..Fri (indexes 0..4).
function todayIndex(): number | null {
  const d = new Date().getDay()
  if (d >= 1 && d <= 5) return d - 1
  return null
}

function currentHourDecimal(): number {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

export function WeeklyCalendar({ blocks, untimedSections = [] }: WeeklyCalendarProps) {
  const conflicts = detectConflicts(blocks)
  const conflictSet = new Set(
    conflicts.flatMap(([a, b]) => [
      `${a.courseCode}-${a.day}-${a.startHour}`,
      `${b.courseCode}-${b.day}-${b.startHour}`,
    ]),
  )

  // Tick the "now" line every minute so it stays accurate without re-rendering too often.
  const [nowHour, setNowHour] = useState(currentHourDecimal)
  const [todayIdx, setTodayIdx] = useState(todayIndex)
  useEffect(() => {
    const tick = () => {
      setNowHour(currentHourDecimal())
      setTodayIdx(todayIndex())
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  // The grid template uses CSS variables so we can shrink the hour-label column on mobile.
  const gridStyle = { gridTemplateColumns: 'var(--cal-gutter, 48px) repeat(5, 1fr)' } as React.CSSProperties

  const showNowLine = todayIdx !== null && nowHour >= START_HOUR && nowHour < END_HOUR
  const nowTop = (nowHour - START_HOUR) * HOUR_HEIGHT

  // If user has no timed sections, render a thoughtful empty state instead of an empty grid.
  if (blocks.length === 0 && untimedSections.length === 0) {
    return (
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="px-6 py-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-3">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div className="text-[13px] font-medium text-text">No timed sections in this schedule</div>
          <div className="text-[11px] text-muted mt-1">Add courses with scheduled meeting times to see the weekly grid.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card [--cal-gutter:32px] sm:[--cal-gutter:48px]">
      {/* Day headers */}
      <div className="grid border-b border-border" style={gridStyle}>
        <div className="bg-surface px-1 py-2 text-right font-mono text-[9px] uppercase tracking-wider text-dim">PT</div>
        {DAYS.map((d, i) => {
          const isToday = todayIdx === i
          return (
            <div
              key={d}
              className={`px-1 sm:px-2 py-2 text-center font-mono text-[10px] sm:text-[11px] font-semibold border-l border-border transition-colors ${
                isToday ? 'bg-accent/15 text-accent' : 'bg-surface text-muted'
              }`}
            >
              <span className="sm:hidden">{SHORT_DAYS[i]}</span>
              <span className="hidden sm:inline">{d}</span>
              {isToday && <span className="ml-1 inline-block w-1 h-1 rounded-full bg-accent align-middle" aria-label="today" />}
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="relative grid" style={gridStyle}>
        {/* Hour labels */}
        <div className="relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              className="absolute w-full text-right pr-1.5 font-mono text-[10px] text-dim leading-none"
              style={{ top: i * HOUR_HEIGHT - 4 }}
            >
              {formatHour(START_HOUR + i)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day, dayIdx) => {
          const isToday = todayIdx === dayIdx
          return (
            <div
              key={day}
              className={`relative border-l border-border ${isToday ? 'bg-accent/5' : ''}`}
              style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
            >
              {/* Hour grid lines (major) + half-hour (minor) */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i}>
                  <div
                    className="absolute w-full border-t border-border/40"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                  <div
                    className="absolute w-full border-t border-dashed border-border/20"
                    style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                </div>
              ))}

              {/* "Now" indicator — only on today's column */}
              {showNowLine && isToday && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: nowTop }}
                >
                  <div className="relative">
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red ring-2 ring-card" />
                    <div className="border-t-2 border-red/80" />
                  </div>
                </div>
              )}

              {/* Course blocks */}
              {blocks
                .filter((b) => b.day === day)
                .map((block) => {
                  const top = (block.startHour - START_HOUR) * HOUR_HEIGHT
                  const height = (block.endHour - block.startHour) * HOUR_HEIGHT
                  const isConflict = conflictSet.has(`${block.courseCode}-${block.day}-${block.startHour}`)

                  return (
                    <div
                      key={`${block.courseCode}-${block.type}-${block.section}-${block.day}-${block.startHour}`}
                      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden cursor-default group transition-all hover:z-30 hover:shadow-lg hover:scale-[1.02]"
                      style={{
                        top,
                        height: Math.max(height, 20),
                        background: isConflict ? 'rgba(239,68,68,0.18)' : block.color.bg,
                        borderLeft: `3px solid ${isConflict ? '#ef4444' : block.color.border}`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                      }}
                      title={`${block.courseCode} ${block.type} ${block.section}\n${block.time}\n${block.building} ${block.room}\n${block.instructor}`}
                    >
                      <div
                        className="font-mono text-[10px] font-semibold truncate"
                        style={{ color: isConflict ? '#ef4444' : block.color.text }}
                      >
                        {block.courseCode}
                      </div>
                      {height > 28 && (
                        <div className="font-mono text-[9px] text-muted truncate">
                          {block.type} {block.section}
                        </div>
                      )}
                      {height > 44 && (
                        <div className="font-mono text-[9px] text-dim truncate">
                          {block.building} {block.room}
                        </div>
                      )}
                      {height > 60 && block.instructor && block.instructor !== 'TBA' && (
                        <div className="font-mono text-[9px] text-dim truncate italic">
                          {block.instructor.split(',')[0]}
                        </div>
                      )}
                      {isConflict && height > 28 && (
                        <div className="font-mono text-[8px] text-red font-bold uppercase tracking-wider mt-0.5">Conflict</div>
                      )}
                    </div>
                  )
                })}
            </div>
          )
        })}
      </div>

      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="border-t border-border px-3 py-2 bg-red/5">
          <div className="font-mono text-[11px] text-red font-medium mb-1">
            Time Conflicts Detected
          </div>
          {conflicts.map(([a, b], i) => (
            <div key={`${a.courseCode}-${a.section}-${b.courseCode}-${b.section}-${a.day}-${i}`} className="font-mono text-[10px] text-muted">
              {a.courseCode} {a.type} ({a.time}) overlaps with {b.courseCode} {b.type} ({b.time}) on {a.day}
            </div>
          ))}
        </div>
      )}

      {/* Untimed / TBA sections — not visible on calendar so we surface them here */}
      {untimedSections.length > 0 && (
        <div className="border-t border-border px-3 py-2 bg-gold/5">
          <div className="font-mono text-[11px] text-gold font-medium mb-1">
            Untimed Sections (TBA — not shown above, conflict check skipped)
          </div>
          {untimedSections.map((s, i) => (
            <div key={`${s.courseCode}-${s.type}-${s.section}-${i}`} className="font-mono text-[10px] text-muted">
              {s.courseCode} {s.type} {s.section} — {s.days || 'TBA'} {s.time || 'TBA'}
              {s.instructor ? ` · ${s.instructor}` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Display hours as "8 AM", "12 PM", "1 PM", ... — much more readable than "8a" / "12p".
function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}
