// Isolated public "Start a Pantry" guide (start.cupboard.cc).
//
// A standalone lead-gen tool, not the pantry app. Guide mode branches
// before every gate (device password, tenant auth, sync) — St. Mark and
// every real tenant are provably unaffected because the check is an exact
// hostname match. See docs/startup-guide-handoff.md.

const GUIDE_HOST = 'start.cupboard.cc'

export function isGuideMode(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname.toLowerCase()
  if (h === GUIDE_HOST) return true
  // Dev affordance: ?guide=1 (sticky for the session) on localhost/preview only.
  const isLocalish = h === 'localhost' || h === '127.0.0.1' || h.endsWith('.vercel.app')
  if (!isLocalish) return false
  if (new URLSearchParams(window.location.search).get('guide') === '1') {
    sessionStorage.setItem('pantry-guide', '1')
  }
  return sessionStorage.getItem('pantry-guide') === '1'
}
