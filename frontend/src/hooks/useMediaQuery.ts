import { useEffect, useState } from 'react'

// Subscribes to a CSS media-query and returns whether it currently matches.
// Used for decisions React needs to make in JS — for pure CSS adjustments,
// prefer Tailwind responsive classes instead.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

// Convenience hook — tells you whether the viewport is below Tailwind's md breakpoint (768px).
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
