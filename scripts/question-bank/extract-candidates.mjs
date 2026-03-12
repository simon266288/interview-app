function isHeading(line) {
  return /^(#{1,6})\s+/.test(line)
}

function stripHeading(line) {
  return line.replace(/^(#{1,6})\s+/, '').trim()
}

function trimEmpty(lines) {
  let start = 0
  let end = lines.length

  while (start < end && lines[start].trim() === '') start++
  while (end > start && lines[end - 1].trim() === '') end--

  return lines.slice(start, end)
}

function blockToText(lines) {
  return trimEmpty(lines).join('\n').trim()
}

export function extractCandidatesFromMarkdown(md) {
  if (typeof md !== 'string' || !md.trim()) return []

  const lines = md.replace(/\r\n/g, '\n').split('\n')

  const candidates = []
  let currentTitle = null
  let buffer = []

  const flush = () => {
    const text = blockToText(buffer)
    buffer = []

    if (!text) return

    // filter obvious noise
    if (text.length < 4) return

    candidates.push({
      title: currentTitle ?? undefined,
      text,
    })
  }

  for (const line of lines) {
    if (isHeading(line)) {
      flush()
      currentTitle = stripHeading(line) || currentTitle
      continue
    }

    // skip markdown separators
    if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line.trim())) continue

    buffer.push(line)
  }

  flush()

  return candidates
}
