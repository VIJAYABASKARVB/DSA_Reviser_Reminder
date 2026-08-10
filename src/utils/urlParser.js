export const PLATFORM_META = {
  leetcode: { id: 'leetcode', label: 'LeetCode' },
  code360: { id: 'code360', label: 'Code360' },
  gfg: { id: 'gfg', label: 'GFG' },
}

export function slugToTitle(slug) {
  return slug
    .split('-')
    .filter((w) => w.length > 0 && !/^\d+$/.test(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function detectPlatform(hostname) {
  const h = hostname.toLowerCase()
  if (h.includes('leetcode.com')) return 'leetcode'
  if (h.includes('codingninjas.com') || h.includes('code360') || h.includes('naukri.com')) return 'code360'
  if (h.includes('geeksforgeeks.org')) return 'gfg'
  return null
}

export function extractTitleAndPlatform(url) {
  try {
    const u = new URL(url.trim())
    const platform = detectPlatform(u.hostname)
    if (!platform) return { ok: false }

    const segments = u.pathname.split('/').filter(Boolean)
    const idx = segments.indexOf('problems')
    let slug = idx >= 0 ? segments.slice(idx + 1) : []

    if (platform === 'gfg') {
      if (slug.length > 0 && /^\d+$/.test(slug[slug.length - 1])) slug = slug.slice(0, -1)
      if (slug.length > 0) slug[0] = slug[0].replace(/\d+$/, '')
    }

    if (slug.length === 0) return { ok: false }
    const title = slugToTitle(slug[0].replace(/_/g, '-'))
    if (!title) return { ok: false }
    return { ok: true, platform, title }
  } catch {
    return { ok: false }
  }
}