import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, Link } from 'react-router-dom'
import { TAGS, DIFFICULTIES } from '../constants.js'
import { extractTitleAndPlatform } from '../utils/urlParser.js'
import { addProblem, createCustomTag } from '../firebase/firestore.js'
import { PlatformBadge } from './Badges.jsx'

export default function AddProblemForm({ uid, meta }) {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState([])
  const [customTag, setCustomTag] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [busy, setBusy] = useState(false)
  const [urlError, setUrlError] = useState('')

  const parsed = useMemo(() => (url.trim() ? extractTitleAndPlatform(url) : null), [url])

  const allTags = useMemo(() => {
    const custom = (meta && meta.customTags) || []
    return [...new Set([...TAGS, ...custom])]
  }, [meta])

  function toggleTag(t) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function addCustomTag() {
    const name = customTag.trim()
    if (!name) return
    if (!allTags.includes(name)) {
      createCustomTag(uid, name).catch((err) => {
        console.error(err)
        toast.error('Could not save custom tag')
      })
    }
    setTags((prev) => (prev.includes(name) ? prev : [...prev, name]))
    setCustomTag('')
  }

  function validateUrl() {
    if (!url.trim()) return 'Paste a problem URL first'
    if (!parsed || !parsed.ok) return 'Unsupported URL — only LeetCode, Code360 and GeeksForGeeks are supported'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const v = validateUrl()
    setUrlError(v)
    if (v) return
    if (tags.length === 0) {
      toast.error('Select at least one tag/pattern')
      return
    }
    if (!difficulty) {
      toast.error('Pick a difficulty')
      return
    }
    setBusy(true)
    try {
      await addProblem(uid, {
        title: parsed.title,
        url: url.trim(),
        platform: parsed.platform,
        tags,
        difficulty,
      }, meta)
      toast.success('Problem added! First revision due tomorrow.')
      navigate('/')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save problem. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Add a problem</h1>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Problem URL</label>
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setUrlError('') }}
          placeholder="https://leetcode.com/problems/two-sum/"
          className="w-full rounded-xl border border-gray-700 bg-surface-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-indigo-500"
        />
        {parsed?.ok && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <PlatformBadge platform={parsed.platform} />
            <span className="text-gray-300">{parsed.title}</span>
          </div>
        )}
        {urlError && <p className="mt-2 text-sm text-red-400">{urlError}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Pattern / Tags</label>
        <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-gray-700 bg-surface-800 p-3">
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                tags.includes(t)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Custom tag (e.g. Kadane, Grid, XOR)"
            className="flex-1 rounded-xl border border-gray-700 bg-surface-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-xl border border-indigo-500/40 px-3 py-2 text-sm text-indigo-300 transition hover:bg-indigo-500/10"
          >
            Add tag
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Difficulty</label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${
                difficulty === d
                  ? d === 'easy'
                    ? 'border-green-500 bg-green-500/15 text-green-400'
                    : d === 'medium'
                      ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400'
                      : 'border-red-500 bg-red-500/15 text-red-400'
                  : 'border-gray-700 bg-surface-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save problem'}
        </button>
        <Link to="/" className="text-sm text-gray-400 transition hover:text-gray-200">Cancel</Link>
      </div>
    </form>
  )
}