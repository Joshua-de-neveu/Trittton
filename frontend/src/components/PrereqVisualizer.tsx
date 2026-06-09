import { useState, useMemo, useCallback } from 'react'
import { PREREQ_GRAPH, DEPARTMENTS, getUnlocks, getDepth, getCourseStatus, type CourseStatus, type PrereqNode } from '../lib/prereqChains'

interface PrereqVisualizerProps {
  completedCodes: string[]
}

export function PrereqVisualizer({ completedCodes }: PrereqVisualizerProps) {
  const [selectedDept, setSelectedDept] = useState('CSE')
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const completed = useMemo(() => new Set(completedCodes), [completedCodes])

  const dept = DEPARTMENTS.find(d => d.id === selectedDept)
  const deptCourses = useMemo(() => {
    if (!dept) return []
    return dept.courses
      .map(id => PREREQ_GRAPH[id])
      .filter(Boolean)
  }, [dept])

  // Organize courses into layers by depth
  const layers = useMemo(() => {
    const byDepth = new Map<number, PrereqNode[]>()
    for (const node of deptCourses) {
      const d = getDepth(node.id)
      if (!byDepth.has(d)) byDepth.set(d, [])
      byDepth.get(d)!.push(node)
    }
    const sorted = Array.from(byDepth.entries()).sort((a, b) => a[0] - b[0])
    return sorted.map(([depth, nodes]) => ({
      depth,
      nodes: nodes.sort((a, b) => a.id.localeCompare(b.id)),
    }))
  }, [deptCourses])

  // Stats
  const stats = useMemo(() => {
    let done = 0, avail = 0, locked = 0
    for (const n of deptCourses) {
      const s = getCourseStatus(n.id, completed)
      if (s === 'completed') done++
      else if (s === 'available') avail++
      else locked++
    }
    return { done, avail, locked, total: deptCourses.length }
  }, [deptCourses, completed])

  // What's connected to hovered/selected course
  const highlighted = useMemo(() => {
    const target = selectedCourse || hoveredCourse
    if (!target) return new Set<string>()
    const node = PREREQ_GRAPH[target]
    if (!node) return new Set<string>()
    const set = new Set<string>([target])
    // Add direct prereqs
    node.prereqs.forEach(p => set.add(p))
    // Add what it unlocks
    getUnlocks(target).forEach(u => set.add(u))
    return set
  }, [hoveredCourse, selectedCourse])

  const activeNode = selectedCourse ? PREREQ_GRAPH[selectedCourse] : null
  const activeUnlocks = selectedCourse ? getUnlocks(selectedCourse) : []

  const handleNodeClick = useCallback((id: string) => {
    setSelectedCourse(prev => prev === id ? null : id)
  }, [])

  const layerLabels = ['No Prerequisites', 'Requires 1 course', 'Requires 2 courses', 'Requires 3+ courses', 'Advanced']

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* ── Left sidebar: department picker ── */}
      <div className="w-60 shrink-0 border-r border-border bg-surface flex flex-col overflow-hidden">
        <div className="px-4 pt-5 pb-3">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">Prerequisites</h2>
          <p className="text-[11px] text-muted mt-0.5">Visualize course chains</p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {DEPARTMENTS.map(d => {
            const isActive = selectedDept === d.id
            return (
              <button key={d.id} onClick={() => { setSelectedDept(d.id); setSelectedCourse(null) }}
                className={`w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-all
                  ${isActive ? 'bg-accent/10 border border-accent/20' : 'hover:bg-card border border-transparent'}`}
              >
                <div className={`text-[13px] font-semibold ${isActive ? 'text-accent' : 'text-text'}`}>{d.id}</div>
                <div className="text-[11px] text-muted">{d.label}</div>
                <div className="text-[10px] text-dim mt-0.5">{d.courses.length} courses</div>
              </button>
            )
          })}
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
            <span className="text-[11px] text-muted">Available (prereqs met)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-border" />
            <span className="text-[11px] text-muted">Locked (needs prereqs)</span>
          </div>
        </div>
      </div>

      {/* ── Main content: graph ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar with stats */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text">{dept?.label} Prerequisite Chain</h1>
              <p className="text-[13px] text-muted mt-0.5">Click any course to see its connections</p>
            </div>
            <div className="flex items-center gap-4">
              <StatPill label="Completed" value={stats.done} total={stats.total} color="green" />
              <StatPill label="Available" value={stats.avail} total={stats.total} color="accent" />
              <StatPill label="Locked" value={stats.locked} total={stats.total} color="muted" />
            </div>
          </div>
        </div>

        {/* Graph area */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-6 min-w-fit">
            {layers.map(({ depth, nodes }, layerIdx) => (
              <div key={depth} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[11px] font-medium text-dim uppercase tracking-wide">
                    {layerLabels[Math.min(depth, layerLabels.length - 1)]}
                  </div>
                  <div className="flex-1 h-px bg-border/50" />
                  <div className="text-[10px] text-dim">{nodes.length} courses</div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {nodes.map(node => {
                    const status = getCourseStatus(node.id, completed)
                    const isHighlighted = highlighted.has(node.id)
                    const isSelected = selectedCourse === node.id
                    const unlockCount = getUnlocks(node.id).length

                    return (
                      <CourseNode
                        key={node.id}
                        node={node}
                        status={status}
                        isHighlighted={isHighlighted}
                        isSelected={isSelected}
                        unlockCount={unlockCount}
                        dimmed={highlighted.size > 0 && !isHighlighted}
                        onClick={() => handleNodeClick(node.id)}
                        onMouseEnter={() => setHoveredCourse(node.id)}
                        onMouseLeave={() => setHoveredCourse(null)}
                      />
                    )
                  })}
                </div>

                {/* Draw arrows to next layer */}
                {layerIdx < layers.length - 1 && (
                  <div className="flex justify-center my-2">
                    <svg width="20" height="16" viewBox="0 0 20 16" className="text-border">
                      <path d="M10 0 L10 12 M6 8 L10 12 L14 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: course detail ── */}
      {activeNode && (
        <div className="w-80 shrink-0 border-l border-border bg-surface flex flex-col overflow-hidden animate-fade-in">
          <div className="px-5 py-5 border-b border-border">
            <div className="flex items-center justify-between">
              <StatusBadge status={getCourseStatus(activeNode.id, completed)} />
              <button onClick={() => setSelectedCourse(null)}
                className="text-dim hover:text-text cursor-pointer text-lg">&times;</button>
            </div>
            <h2 className="text-lg font-bold text-text mt-2">{activeNode.id}</h2>
            <p className="text-[13px] text-muted mt-1">{activeNode.description}</p>
            {activeNode.units && (
              <span className="inline-block mt-2 text-[11px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded">
                {activeNode.units} units
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Prerequisites */}
            <div>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">
                Prerequisites ({activeNode.prereqs.length})
              </div>
              {activeNode.prereqs.length === 0 ? (
                <div className="text-[12px] text-green font-medium">No prerequisites needed</div>
              ) : (
                <div className="space-y-1.5">
                  {activeNode.prereqs.map(p => {
                    const pNode = PREREQ_GRAPH[p]
                    const pStatus = getCourseStatus(p, completed)
                    return (
                      <button key={p} onClick={() => setSelectedCourse(p)}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card border border-border hover:border-border2 cursor-pointer transition-all"
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          pStatus === 'completed' ? 'bg-green' : pStatus === 'available' ? 'bg-accent' : 'bg-border'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-text">{p}</div>
                          {pNode && <div className="text-[10px] text-muted truncate">{pNode.description}</div>}
                        </div>
                        {pStatus === 'completed' && (
                          <svg width="14" height="14" fill="none" stroke="#3dd68c" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Corequisites */}
            {activeNode.coreq && activeNode.coreq.length > 0 && (
              <div>
                <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">
                  Corequisites (take concurrently)
                </div>
                <div className="space-y-1.5">
                  {activeNode.coreq.map(c => (
                    <button key={c} onClick={() => setSelectedCourse(c)}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gold/5 border border-gold/15 cursor-pointer"
                    >
                      <span className="text-[12px] font-semibold text-gold">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unlocks */}
            <div>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">
                Unlocks ({activeUnlocks.length})
              </div>
              {activeUnlocks.length === 0 ? (
                <div className="text-[12px] text-dim">No courses depend on this</div>
              ) : (
                <div className="space-y-1.5">
                  {activeUnlocks.map(u => {
                    const uNode = PREREQ_GRAPH[u]
                    const uStatus = getCourseStatus(u, completed)
                    return (
                      <button key={u} onClick={() => setSelectedCourse(u)}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card border border-border hover:border-border2 cursor-pointer transition-all"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-accent shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-text">{u}</div>
                          {uNode && <div className="text-[10px] text-muted truncate">{uNode.description}</div>}
                        </div>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          uStatus === 'completed' ? 'bg-green' : uStatus === 'available' ? 'bg-accent' : 'bg-border'
                        }`} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Full chain: what this course eventually leads to */}
            {activeUnlocks.length > 0 && (
              <div>
                <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">
                  Full chain (all downstream)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {getAllDownstream(activeNode.id).map(c => (
                    <button key={c} onClick={() => setSelectedCourse(c)}
                      className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-accent/8 text-accent hover:bg-accent/15 cursor-pointer transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function CourseNode({ node, status, isHighlighted, isSelected, unlockCount, dimmed, onClick, onMouseEnter, onMouseLeave }: {
  node: PrereqNode
  status: CourseStatus
  isHighlighted: boolean
  isSelected: boolean
  unlockCount: number
  dimmed: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const statusStyles: Record<CourseStatus, string> = {
    completed: 'bg-green/10 border-green/30 text-green',
    available: 'bg-accent/10 border-accent/30 text-accent',
    locked: 'bg-card border-border text-muted',
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left min-w-[140px]
        ${statusStyles[status]}
        ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg scale-105' : ''}
        ${isHighlighted && !isSelected ? 'scale-[1.02] shadow-lg' : ''}
        ${dimmed ? 'opacity-25' : 'opacity-100'}
        hover:scale-[1.03] hover:shadow-md
      `}
    >
      {/* Completion checkmark */}
      {status === 'completed' && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green flex items-center justify-center">
          <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}

      <div className="font-mono text-[13px] font-bold">{node.id}</div>
      <div className={`text-[10px] mt-0.5 leading-tight ${status === 'locked' ? 'text-dim' : ''}`}>
        {node.description && node.description.length > 35 ? node.description.slice(0, 35) + '...' : node.description}
      </div>

      {/* Bottom info */}
      <div className="flex items-center gap-2 mt-1.5">
        {node.units && (
          <span className="text-[9px] font-medium opacity-60">{node.units}u</span>
        )}
        {unlockCount > 0 && (
          <span className="text-[9px] font-medium opacity-60">
            unlocks {unlockCount}
          </span>
        )}
        {node.prereqs.length > 0 && status === 'locked' && (
          <span className="text-[9px] font-medium text-red/60">
            needs {node.prereqs.length}
          </span>
        )}
      </div>
    </button>
  )
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const config = {
    completed: { label: 'Completed', bg: 'bg-green/10 text-green border-green/20' },
    available: { label: 'Available to Take', bg: 'bg-accent/10 text-accent border-accent/20' },
    locked:    { label: 'Prerequisites Needed', bg: 'bg-red/10 text-red border-red/20' },
  }
  const c = config[status]
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${c.bg}`}>{c.label}</span>
}

function StatPill({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="text-center">
      <div className={`font-mono text-lg font-bold text-${color}`}>{value}</div>
      <div className="text-[10px] text-muted">{label} ({pct}%)</div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getAllDownstream(courseId: string): string[] {
  const result = new Set<string>()
  const queue = getUnlocks(courseId)
  while (queue.length) {
    const next = queue.pop()!
    if (result.has(next)) continue
    result.add(next)
    queue.push(...getUnlocks(next))
  }
  return Array.from(result).sort()
}
