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
const START_HOUR = 8
const END_HOUR = 21
const HOUR_HEIGHT = 44
const TOTAL_HOURS = END_HOUR - START_HOUR

export function WeeklyCalendar({ blocks, untimedSections = [] }: WeeklyCalendarProps) {
  const conflicts = detectConflicts(blocks)
  const conflictSet = new Set(conflicts.flatMap(([a, b]) => [`${a.courseCode}-${a.day}-${a.startHour}`, `${b.courseCode}-${b.day}-${b.startHour}`]))

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Day headers */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: '48px repeat(5, 1fr)' }}>
        <div className="bg-surface p-2" />
        {DAYS.map((d) => (
          <div key={d} className="bg-surface px-2 py-2 text-center font-mono text-[11px] font-medium text-muted border-l border-border">
            {d}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative grid" style={{ gridTemplateColumns: '48px repeat(5, 1fr)' }}>
        {/* Hour labels */}
        <div className="relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              className="absolute w-full text-right pr-2 font-mono text-[10px] text-dim"
              style={{ top: i * HOUR_HEIGHT - 6 }}
            >
              {formatHour(START_HOUR + i)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => (
          <div key={day} className="relative border-l border-border" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
            {/* Hour grid lines */}
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-border/50"
                style={{ top: i * HOUR_HEIGHT }}
              />
            ))}

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
                    className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden cursor-default group transition-all hover:z-10 hover:shadow-lg"
                    style={{
                      top,
                      height: Math.max(height, 20),
                      background: isConflict ? 'rgba(242,95,92,0.3)' : block.color.bg,
                      borderLeft: `3px solid ${isConflict ? '#f25f5c' : block.color.border}`,
                    }}
                    title={`${block.courseCode} ${block.type} ${block.section}\n${block.time}\n${block.building} ${block.room}\n${block.instructor}`}
                  >
                    <div className="font-mono text-[10px] font-medium truncate" style={{ color: isConflict ? '#f25f5c' : block.color.text }}>
                      {block.courseCode}
                    </div>
                    {height > 30 && (
                      <div className="font-mono text-[9px] text-muted truncate">
                        {block.type} {block.section}
                      </div>
                    )}
                    {height > 45 && (
                      <div className="font-mono text-[9px] text-dim truncate">
                        {block.building} {block.room}
                      </div>
                    )}
                    {isConflict && height > 30 && (
                      <div className="font-mono text-[8px] text-red font-medium">CONFLICT</div>
                    )}
                  </div>
                )
              })}
          </div>
        ))}
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

function formatHour(h: number): string {
  if (h === 0 || h === 12) return '12p'
  return h < 12 ? `${h}a` : `${h - 12}p`
}
