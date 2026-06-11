import { auth } from './firebase'

// Returns a fresh Firebase ID token for the signed-in user, or null when nobody's signed in.
// The token is short-lived (~1 hour) but Firebase auto-refreshes when called.
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  try {
    return await user.getIdToken(/* forceRefresh */ false)
  } catch {
    return null
  }
}

// Wrap fetch() so callers don't have to plumb the bearer header through every endpoint.
// Headers from the caller take precedence; we just inject Authorization when present.
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await getIdToken()
  const headers = new Headers(init.headers || {})
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}
