import { useState, useCallback } from 'react'
import type { Course, Section, ScrapeProgress } from '../types'

const BATCH_SIZE = 30

// Hardcoded fallback so scraping starts instantly without waiting for the server
const FALLBACK_SUBJECTS = [
  'AIP','AAS','AWP','ANES','ANBI','ANAR','ANTH','ANSC','ASTR','AUD',
  'BENG','BNFO','BIEB','BICD','BIPN','BIBC','BGGN','BGJC','BGRD','BGSE','BILD','BIMM','BISP','BIOM',
  'CMM','CENG','CHEM','CLX','CHIN','CLAS','CCS','CLIN','CLRE','COGS','COMM','COGR','CSS','CSE','COSE','CCE','CGS','CAT',
  'TDDM','TDHD','TDMV','TDPF','TDTR','DSC','DSE','DERM','DSGN','DOC','DDPM',
  'ECON','EAP','EDS','ERC','ECE','EMED','ENG','ENVR','ESYS','ETIM','ETHN','EXPR',
  'FPM','FILM',
  'GPCO','GPEC','GPGN','GPIM','GPLA','GPPA','GPPS','GLBH','GSS',
  'HITO','HIAF','HIEA','HIEU','HILA','HISC','HISA','HINE','HIUS','HIGL','HIGR','HILD','HDS','HUM',
  'INTL','JAPN','JWSP',
  'LATI','LISL','LIAB','LIDS','LIFR','LIGN','LIGM','LIHL','LIIT','LIPO','LISP',
  'LTAM','LTCO','LTCS','LTEU','LTFR','LTGM','LTGK','LTIT','LTKO','LTLA','LTRU','LTSP','LTTH','LTWR','LTEN','LTWL','LTEA',
  'MMW','MBC','MATS','MATH','MSED','MAE','MED','MUIR','MCWP','MUS',
  'NANO','NEU','NEUG','OBG','OPTH','ORTH',
  'PATH','PEDS','PHAR','SPPS','PHIL','PAE','PHYS','POLI','PSY','PSYC','PH','PHB',
  'RMAS','RAD','MGTF','MGT','MGTA','MGTP','RELI','RMED','REV',
  'SPPH','SOMI','SOMC','SIOC','SIOG','SIOB','SIO','SEV','SOCG','SOCE','SOCI','SE','SURG','SYN',
  'TDAC','TDDE','TDDR','TDGE','TDGR','TDHT','TDPW','TDPR','TMC',
  'USP','UROL','VIS','WARR','WCWP','WES',
]

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
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5s max
    const res = await fetch(`/api/proxy/subjects?term=${term}`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return FALLBACK_SUBJECTS
    const data = await res.json()
    const codes = data.map((s: { code: string }) => s.code.trim()).filter(Boolean)
    return codes.length > 0 ? codes : FALLBACK_SUBJECTS
  } catch {
    return FALLBACK_SUBJECTS
  }
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

      // 3. Fire ALL batches at once — each updates progress as it completes
      const allCourses: Course[] = []
      let completedSubjects = 0
      const errors: string[] = []

      const batchPromises = batches.map((batch, idx) =>
        fetchBatch(term, batch).then(
          (courses) => {
            allCourses.push(...courses)
            completedSubjects += batch.length
            setProgress({
              status: 'running',
              current: completedSubjects,
              total: subjects.length,
              currentSubject: batch[batch.length - 1],
              coursesFound: allCourses.length,
              errors,
            })
          },
          (err) => {
            const msg = `Batch ${idx + 1} failed: ${err instanceof Error ? err.message : 'unknown'}`
            errors.push(msg)
            completedSubjects += batch.length
            setProgress({
              status: 'running',
              current: completedSubjects,
              total: subjects.length,
              currentSubject: batch[batch.length - 1],
              coursesFound: allCourses.length,
              errors,
            })
          }
        )
      )

      await Promise.all(batchPromises)

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
