async function fetchWithTimeout(url, init = {}, timeoutMs = 30000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    })
    return res
  } finally {
    clearTimeout(timeout)
  }
}

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetries(url, init, { attempts = 3, timeoutMs = 30000 } = {}) {
  let lastErr = null

  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchWithTimeout(url, init, timeoutMs)
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) {
        await sleep(250 * (i + 1))
      }
    }
  }

  throw lastErr
}

function getGithubToken() {
  const t = process.env.GITHUB_TOKEN
  return typeof t === 'string' && t.trim() ? t.trim() : null
}

function getApiHeaders({ accept }) {
  const token = getGithubToken()
  return {
    Accept: accept ?? 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : null),
    // GitHub API requires a User-Agent in some environments and helps avoid 403s.
    'User-Agent': 'interview-app-question-bank-generator',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function githubApiFetchJson(url) {
  // If unauthenticated, we can easily hit rate limits.
  // Keep retries low; prefer failing fast with actionable error.
  const token = getGithubToken()

  const res = await fetchWithRetries(
    url,
    {
      headers: getApiHeaders({ accept: 'application/vnd.github+json' }),
    },
    { attempts: token ? 3 : 1, timeoutMs: 30000 },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${text}`)
  }

  return await res.json()
}

async function getDefaultBranch({ owner, repo }) {
  const data = await githubApiFetchJson(`https://api.github.com/repos/${owner}/${repo}`)
  return typeof data.default_branch === 'string' ? data.default_branch : 'main'
}

async function getBranchHeadSha({ owner, repo, branch }) {
  const data = await githubApiFetchJson(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`)
  return data?.commit?.sha
}

function encodeGitHubPath(p) {
  return String(p)
    .split('/')
    .map(seg => encodeURIComponent(seg))
    .join('/')
}

export async function listRepoMarkdownFiles({ owner, repo, ref }) {
  const resolvedRef = ref ?? (await getDefaultBranch({ owner, repo }))
  const sha = await getBranchHeadSha({ owner, repo, branch: resolvedRef })

  if (typeof sha !== 'string' || !sha) {
    throw new Error(`Failed to resolve ref to sha: ${owner}/${repo}@${resolvedRef}`)
  }

  const tree = await githubApiFetchJson(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
  )

  const items = Array.isArray(tree.tree) ? tree.tree : []

  return items
    .filter(it => it && it.type === 'blob' && typeof it.path === 'string')
    .filter(it => it.path.toLowerCase().endsWith('.md'))
    .map(it => ({
      path: it.path,
      sha: it.sha,
    }))
}

async function fetchRawViaContentsApi({ owner, repo, path, ref }) {
  const resolvedRef = ref ?? (await getDefaultBranch({ owner, repo }))
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGitHubPath(
    path,
  )}?ref=${encodeURIComponent(resolvedRef)}`

  const res = await fetchWithRetries(
    url,
    {
      headers: getApiHeaders({ accept: 'application/vnd.github.raw' }),
    },
    { attempts: 3, timeoutMs: 30000 },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub contents ${res.status} ${res.statusText}: ${text}`)
  }

  return await res.text()
}

async function fetchRawViaRawHost({ owner, repo, path, ref }) {
  const resolvedRef = ref ?? (await getDefaultBranch({ owner, repo }))
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(
    resolvedRef,
  )}/${encodeGitHubPath(path)}`

  const res = await fetchWithRetries(rawUrl, {}, { attempts: 2, timeoutMs: 30000 })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub raw ${res.status} ${res.statusText}: ${text}`)
  }

  return await res.text()
}

export async function fetchRawFile({ owner, repo, path, ref }) {
  // raw.githubusercontent.com can be flaky/blocked in some networks;
  // but using GitHub API without token will very quickly hit rate limits.
  // So we try raw host first, then fall back to contents API.
  try {
    return await fetchRawViaRawHost({ owner, repo, path, ref })
  } catch {
    return await fetchRawViaContentsApi({ owner, repo, path, ref })
  }
}
