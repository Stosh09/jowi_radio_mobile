/**
 * Fetch a short slice of the Shoutcast stream with Icy-MetaData
 * and print any StreamTitle blocks found.
 */
const url = 'https://s23.myradiostream.com:20542/listen.mp3'

async function main() {
  const res = await fetch(url, {
    headers: { 'Icy-MetaData': '1' },
    signal: AbortSignal.timeout(12000),
  })

  const headers = Object.fromEntries(res.headers.entries())
  const metaInt = Number(headers['icy-metaint'] || 0)

  console.log('=== Response headers (icy*) ===')
  for (const [k, v] of Object.entries(headers)) {
    if (k.startsWith('icy') || k === 'content-type') console.log(`${k}: ${v}`)
  }
  console.log('icy-metaint parsed:', metaInt)

  if (!res.body || !metaInt) {
    console.log('No stream body or metaint — cannot parse inline metadata.')
    return
  }

  const reader = res.body.getReader()
  let buffer = new Uint8Array(0)
  let audioNeeded = metaInt
  const titles = new Set()
  const deadline = Date.now() + 10000

  while (Date.now() < deadline && titles.size < 3) {
    const { done, value } = await reader.read()
    if (done || !value) break

    const merged = new Uint8Array(buffer.length + value.length)
    merged.set(buffer)
    merged.set(value, buffer.length)
    buffer = merged

    while (true) {
      if (buffer.length < audioNeeded + 1) break

      // skip audio bytes
      buffer = buffer.slice(audioNeeded)
      const lenByte = buffer[0]
      const metaLen = lenByte * 16
      buffer = buffer.slice(1)

      if (buffer.length < metaLen) {
        // put back and wait for more
        buffer = new Uint8Array([lenByte, ...buffer])
        audioNeeded = 0
        break
      }

      if (metaLen > 0) {
        const meta = new TextDecoder('latin1').decode(buffer.slice(0, metaLen)).replace(/\0+$/, '')
        console.log('=== Metadata block ===')
        console.log(JSON.stringify(meta))
        const match = /StreamTitle='([^']*)'/.exec(meta)
        if (match) titles.add(match[1])
      }

      buffer = buffer.slice(metaLen)
      audioNeeded = metaInt
    }
  }

  try {
    reader.cancel()
  } catch {
    /* ignore */
  }

  console.log('=== Titles found ===')
  console.log([...titles])
  if (titles.size === 0) {
    console.log('RESULT: ICY metadata channel exists, but StreamTitle is empty right now.')
  } else {
    console.log('RESULT: Stream is publishing track/show titles via ICY.')
  }
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
