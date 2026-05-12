import { useState, useCallback } from 'react'
import type { Course, Section, ScrapeProgress } from '../types'

const BATCH_SIZE = 15
const CONCURRENCY = 4 // how many batches in parallel

const defaultProgress: ScrapeProgress = {
  status: 'idle',
  current: 0,
  total: 0,
  currentSubject: '',
  coursesFound: 0,
  errors: [],
}

// ── HTML parsing in the browser ─────────────────────────────────────────────

function clean(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim()
}

const VALID_TYPES = new Set(['LE', 'DI', 'LA', 'SE', 'IN', 'TA', 'TU', 'CL', 'ST'])

function parsePageHTML(html: string): Course[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const courses: Course[] = []
  let current: Course | null = null
  let currentSubject = ''

  for (const tr of doc.querySelectorAll('tr')) {
    const tds = tr.querySelectorAll(':scope > td')
    if (!tds.length) continue

    // Detect subject from <h2> like "Mathematics (MATH )"
    const h2 = tr.querySelector('h2')
    if (h2) {
      const m = clean(h2.textContent || '').match(/\(([A-Z]{2,6})\s*\)/)
      if (m) currentSubject = m[1]
      continue
    }

    const rowClass = tds[0].className || ''

    if (rowClass.includes('crsheader')) {
      const texts = Array.from(tds).map(td => clean(td.textContent || ''))
      if (texts.length < 3) continue
      const courseNum = texts[1]
      if (!/^\d/.test(courseNum)) continue

      const titleRaw = texts[2]
      const unitsMatch = titleRaw.match(/\(\s*(\d+\.?\d*)\s*(?:Units?)?\s*\)/i)
      const units = unitsMatch ? unitsMatch[1] : ''
      const title = titleRaw.replace(/\s*\(\s*\d+\.?\d*\s*(?:Units?)?\s*\)/i, '').trim()
      const courseCode = `${currentSubject} ${courseNum}`
      const restrictions = texts[0]

      if (current && current.course_code === courseCode) {
        if (units && !current.units) current.units = units
        if (restrictions && !current.restrictions) current.restrictions = restrictions
      } else {
        current = {
          subject: currentSubject,
          course_code: courseCode,
          title,
          units,
          restrictions,
          sections: [],
        }
        courses.push(current)
      }
      continue
    }

    if (!current || !rowClass.includes('brdr')) continue

    const texts = Array.from(tds).map(td => clean(td.textContent || ''))
    if (texts.length < 13) continue

    const sectionType = texts[3]
    if (!VALID_TYPES.has(sectionType)) continue

    const availableRaw = texts[10]
    const waitlistMatch = availableRaw.match(/Waitlist\((\d+)\)/)
    let available: string, waitlisted: string
    if (waitlistMatch) {
      available = '0'
      waitlisted = waitlistMatch[1]
    } else if (availableRaw.includes('FULL')) {
      available = '0'
      waitlisted = ''
    } else {
      available = availableRaw
      waitlisted = ''
    }

    const sec: Section = {
      section_id: texts[2],
      type: sectionType,
      section: texts[4],
      days: texts[5],
      time: texts[6],
      building: texts[7],
      room: texts[8],
      instructor: texts[9],
      available,
      limit: texts[11],
      waitlisted,
    }
    current.sections.push(sec)
  }

  return courses
}

// ── Scraping orchestration ──────────────────────────────────────────────────

async function fetchBatch(term: string, subjects: string[]): Promise<Course[]> {
  const res = await fetch('/api/proxy/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term, subjects }),
  })
  if (!res.ok) throw new Error(`Batch failed: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)

  const courses: Course[] = []
  for (const html of data.pages) {
    courses.push(...parsePageHTML(html))
  }
  return courses
}

async function fetchSubjects(term: string): Promise<string[]> {
  const res = await fetch(`/api/proxy/subjects?term=${term}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.map((s: { code: string }) => s.code.trim()).filter(Boolean)
}

export function useClientScraper(onComplete?: (courses: Course[]) => void) {
  const [progress, setProgress] = useState<ScrapeProgress>(defaultProgress)
  const [showPanel, setShowPanel] = useState(false)

  const startScrape = useCallback(async (term: string = 'SP26') => {
    setShowPanel(true)
    setProgress({ ...defaultProgress, status: 'running' })

    try {
      // 1. Get subject list
      const subjects = await fetchSubjects(term)
      if (!subjects.length) {
        setProgress(p => ({ ...p, status: 'error', errors: ['Failed to fetch subjects'] }))
        return
      }

      // 2. Create batches
      const batches: string[][] = []
      for (let i = 0; i < subjects.length; i += BATCH_SIZE) {
        batches.push(subjects.slice(i, i + BATCH_SIZE))
      }

      setProgress(p => ({ ...p, total: subjects.length }))

      // 3. Process batches with limited concurrency
      const allCourses: Course[] = []
      let completedSubjects = 0
      const errors: string[] = []

      // Process in waves of CONCURRENCY batches
      for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const wave = batches.slice(i, i + CONCURRENCY)
        const results = await Promise.allSettled(
          wave.map(batch => fetchBatch(term, batch))
        )

        for (let j = 0; j < results.length; j++) {
          const result = results[j]
          const batch = wave[j]
          completedSubjects += batch.length

          if (result.status === 'fulfilled') {
            allCourses.push(...result.value)
          } else {
            const err = `Batch failed: ${batch.join(', ')}`
            errors.push(err)
          }

          setProgress({
            status: 'running',
            current: completedSubjects,
            total: subjects.length,
            currentSubject: batch[batch.length - 1],
            coursesFound: allCourses.length,
            errors,
          })
        }
      }

      // 4. Save to server
      try {
        await fetch('/api/courses/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courses: allCourses, term }),
        })
      } catch {
        // Save failed, but we still have the data locally
      }

      setProgress({
        status: 'done',
        current: subjects.length,
        total: subjects.length,
        currentSubject: '',
        coursesFound: allCourses.length,
        errors,
      })

      onComplete?.(allCourses)
    } catch (err) {
      setProgress(p => ({
        ...p,
        status: 'error',
        errors: [...p.errors, err instanceof Error ? err.message : 'Unknown error'],
      }))
    }
  }, [onComplete])

  const stopScrape = useCallback(() => {
    setProgress(p => ({ ...p, status: 'idle' }))
  }, [])

  return { progress, showPanel, setShowPanel, startScrape, stopScrape }
}
