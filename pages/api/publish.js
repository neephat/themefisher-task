import { Buffer } from 'buffer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  const targetPath = process.env.GITHUB_TARGET_PATH || 'content'

  if (!token || !owner || !repo) {
    return res.status(500).json({ message: 'Server not configured. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO.' })
  }

  const { drafts } = req.body
  if (!Array.isArray(drafts)) return res.status(400).json({ message: 'Invalid payload. `drafts` array required.' })

  const results = []

  for (const d of drafts) {
    try {
      const filename = `${d.title.replace(/[^a-z0-9\- ]+/gi, '').replace(/\s+/g,'-').toLowerCase() || 'untitled'}-${Date.now()}.md`
      const path = `${targetPath}/${filename}`
      const content = `# ${d.title}\n\n${d.body || ''}\n`
      const b64 = Buffer.from(content, 'utf-8').toString('base64')

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
      const payload = {
        message: `Add draft: ${d.title}`,
        content: b64,
        branch,
      }

      // Try to create/update file (PUT). If file exists, GitHub requires the SHA to update.
      // We'll attempt PUT without sha; if 422 occurs, we try to fetch current sha then include it.
      let putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (putRes.status === 422) {
        // Possibly file exists. Try to get sha then update.
        const getRes = await fetch(url + `?ref=${branch}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json'
          }
        })
        if (getRes.ok) {
          const getData = await getRes.json()
          payload.sha = getData.sha
          putRes = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
        }
      }

      const putData = await putRes.json()
      if (!putRes.ok) {
        results.push({ draft: d.title, ok: false, status: putRes.status, error: putData })
      } else {
        results.push({ draft: d.title, ok: true, file: putData.content?.path })
      }
    } catch (err) {
      results.push({ draft: d.title, ok: false, error: String(err) })
    }
  }

  res.status(200).json({ results })
}
