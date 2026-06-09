export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  LE: { bg: 'rgba(79,142,247,0.15)', text: '#78a9f7' },
  DI: { bg: 'rgba(61,214,140,0.15)', text: '#3dd68c' },
  LA: { bg: 'rgba(245,200,66,0.15)', text: '#f5c842' },
  SE: { bg: 'rgba(124,92,252,0.15)', text: '#a07cf5' },
  IN: { bg: 'rgba(255,159,67,0.15)', text: '#ff9f43' },
  TA: { bg: 'rgba(72,219,251,0.15)', text: '#48dbfb' },
  TU: { bg: 'rgba(255,107,129,0.15)', text: '#ff6b81' },
  CL: { bg: 'rgba(46,213,115,0.15)', text: '#2ed573' },
  ST: { bg: 'rgba(255,165,2,0.15)', text: '#ffa502' },
}

export const TYPE_LABELS: Record<string, string> = {
  LE: 'Lecture',
  DI: 'Discussion',
  LA: 'Lab',
  SE: 'Seminar',
  IN: 'Independent Study',
  TA: 'TA',
  TU: 'Tutorial',
  CL: 'Clinical',
  ST: 'Studio',
}
