import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Annotation, Selected } from '../types'

const annotations = atom({ plugin: 'annotate', key: 'annotations' } as const, [])
const selection = atom({ plugin: 'annotate', key: 'selection' } as const, null)
const pending = atom({ plugin: 'annotate', key: 'pending' } as const, null)
// The selection last annotated: the terminal keeps it after the prompt is sent.
const used = atom({ plugin: 'annotate', key: 'used' } as const, null)
const nextId = atom({ plugin: 'annotate', key: 'nextId' } as const, 1)

const POLL_MS = 400

const quoteLines = (text: string) =>
  text
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n')

export const toMarkdown = (list: Annotation[]) =>
  [
    'Feedback on your previous response:',
    ...list.map((one, i) => `${i + 1}.\n${quoteLines(one.quote)}\n\n${one.comment}`),
  ].join('\n\n')

const preview = (text: string, width: number) => {
  const flat = text.replace(/\s+/g, ' ').trim()

  return flat.length > width ? `${flat.slice(0, Math.max(1, width - 1))}…` : flat
}

// Selected text is what the terminal drew, the message text is markdown:
// compare both without markup, bullets or spacing.
const normalize = (text: string) =>
  text
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const anchorOf = (quote: string) => {
  const first = quote.split('\n').find(line => line.trim()) ?? ''

  return normalize(first.replace(/^\s*([•·●⏺*-]|\d+\.)\s+/, '')).slice(0, 60)
}

/**
 * Inserts each annotation's comment after the paragraph (or code block) its
 * quote starts in. Annotations whose quote isn't found are left out.
 */
export const withAnnotations = (text: string, list: Annotation[]) => {
  const lines = text.split('\n')
  const inFence: boolean[] = []
  let isOpen = false
  for (const line of lines) {
    const isFence = /^\s*(```|~~~)/.test(line)
    inFence.push(isOpen || isFence)
    if (isFence) isOpen = !isOpen
  }

  const after = new Map<number, string[]>()
  for (const one of list) {
    const anchor = anchorOf(one.quote)
    if (!anchor) continue
    const start = lines.findIndex(line => normalize(line).includes(anchor))
    if (start < 0) continue
    let end = start
    while (end + 1 < lines.length && (lines[end + 1]?.trim() !== '' || inFence[end + 1])) end++
    after.set(end, [...(after.get(end) ?? []), `> 💬 **${one.comment}**`])
  }
  if (after.size === 0) return text

  return lines
    .flatMap((line, i) => {
      const comments = after.get(i)
      return comments ? [line, '', ...comments.flatMap(c => [c, ''])] : [line]
    })
    .join('\n')
    .trimEnd()
}

// Replies drawn through next(e) aren't redrawn by the state write alone.
const setAnnotations = async (
  $: EngineInterface,
  fn: (all: Annotation[]) => Annotation[],
) => {
  await update($, annotations, fn)
  $.ui.invalidate('ui.render')
}

const isSame = (a: Selected | null, b: Selected | null) =>
  a?.quote === b?.quote && a?.rowId === b?.rowId

const PANE = 'annotate'
const TITLE = 'Annotations'
// Docked width in columns; a width the person drags to wins.
const COLUMNS = 40
const FOCUS_DELAY_MS = 50

// The current selection, unless it is the one last annotated (or cancelled).
const freshSelection = async ($: EngineInterface): Promise<Selected | null> => {
  const selected = await $.ui.selection()
  const quote = selected?.text.trim()
  const found: Selected | null = quote
    ? { quote, ...(selected?.requestId ? { rowId: selected.requestId } : {}) }
    : null
  const last = await read($, used)
  if (last && !isSame(found, last)) await update($, used, () => null)

  return last && isSame(found, last) ? null : found
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'annotate-mod',
      description: 'Toggle the Annotations pane',
    })

    $.clock.every(POLL_MS, async () => {
      const value = await freshSelection($)
      if (!isSame(value, await read($, selection))) {
        await update($, selection, () => value)
      }
    })

    return next(e)
  })

  on('command.run', { command: 'annotate-mod' }, async $ => {
    const isShown = (await $.ui.panes()).some(pane => pane.id === PANE && pane.isShown)
    if (isShown) {
      await $.ui.close({ id: PANE })
      return { text: 'Annotations pane closed.' }
    }
    await $.ui.open({ id: PANE, title: TITLE, columns: COLUMNS, focus: true })

    return { text: 'Annotations pane opened.' }
  })

  // A bare `a` typed into an empty prompt while text is selected starts an
  // annotation instead of typing.
  on('prompt.edit', async ($, e, next) => {
    const key = e.key
    const isBareA = e.text === '' && key?.key === 'a' && !key.ctrl && !key.meta && !key.shift
    const current = isBareA ? await freshSelection($) : null
    if (!current) return next(e)

    await update($, selection, () => current)
    await update($, pending, () => current)
    // The prompt keeps the keys while its edit is open: ask for them after.
    $.clock.after(FOCUS_DELAY_MS, async () => {
      await $.ui.open({ id: PANE, title: TITLE, columns: COLUMNS, focus: true })
      await $.ui.focus({ requestId: PANE, key: 'comment' }).catch(() => undefined)
    })

    return { text: e.text, cursor: e.cursor }
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const list = (await read($, annotations)).filter(a => !a.rowId || a.rowId === e.requestId)
    const text = list.length > 0 ? withAnnotations(e.props.text, list) : e.props.text

    return text === e.props.text ? next(e) : next({ ...e, props: { ...e.props, text } })
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const list = await read($, annotations)
    const draft = await read($, pending)
    const selected = await read($, selection)

    const elements = $.ui.resolve(e)
    const { Box, Text, Button } = elements
    const Input = 'Input' in elements ? elements.Input : undefined
    const width = Math.max(10, e.props.bodyColumns - 4)

    const startAnnotation = async () => {
      const current = await read($, selection)
      if (!current) {
        $.ui.toast('Select text in the transcript first')
        return
      }
      await update($, pending, () => current)
      // Best effort: the ring stays put when the pane doesn't hold the keys.
      void $.ui.focus({ requestId: PANE, key: 'comment' }).catch(() => undefined)
    }

    const saveAnnotation = async (comment: string) => {
      const text = comment.trim()
      const current = await read($, pending)
      if (!text || !current) return
      const id = await read($, nextId)
      await update($, nextId, n => n + 1)
      await setAnnotations($, all => [...all, { ...current, id, comment: text }])
      await update($, used, () => current)
      await update($, pending, () => null)
      await update($, selection, () => null)
    }

    const cancelAnnotation = async () => {
      const current = await read($, pending)
      await update($, used, () => current)
      await update($, pending, () => null)
      await update($, selection, () => null)
    }

    const send = async () => {
      const all = await read($, annotations)
      if (all.length === 0) return
      await setAnnotations($, () => [])
      void $.prompt.submit({ text: toMarkdown(all), asUser: true })
    }

    const copy = async (surface: typeof e.surface) => {
      const result = await $.ui.copy({ text: toMarkdown(await read($, annotations)), surface })
      $.ui.toast(result.isCopied ? 'Annotations copied as Markdown' : `Copy failed: ${result.reason}`)
    }

    return (
      <Box flexDirection="column">
        {draft ? (
          <Box flexDirection="column">
            <Text dimColor>{quoteLines(preview(draft.quote, width - 2))}</Text>
            {Input ? (
              <Input key="comment" placeholder="Your comment" submitLabel="add" autoFocus onSubmit={saveAnnotation} />
            ) : (
              <Text dimColor>No text field on this surface.</Text>
            )}
            <Button key="cancel" label="Cancel" plain onPress={cancelAnnotation} />
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text dimColor>
              {selected ? quoteLines(preview(selected.quote, width - 2)) : 'Select text in the transcript to annotate it.'}
            </Text>
            <Box>
              <Button key="annotate" label="Annotate" hotkey="a" variant="primary" onPress={startAnnotation} />
            </Box>
          </Box>
        )}

        {list.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {list.map((one, i) => (
              <Box key={`row:${one.id}`} flexDirection="column" marginBottom={1}>
                <Text dimColor>{`${i + 1}. > ${preview(one.quote, width - 5)}`}</Text>
                <Box>
                  <Text>{`   💬 ${one.comment} `}</Text>
                  <Button
                    key={`remove:${one.id}`}
                    label="x"
                    onPress={() => setAnnotations($, all => all.filter(a => a.id !== one.id))}
                  />
                </Box>
              </Box>
            ))}
            <Box>
              <Button key="send" label={`Send ${list.length}`} hotkey="s" variant="primary" onPress={send} />
              <Button key="copy" label="Copy" hotkey="c" onPress={press => copy(press.surface)} />
              <Button key="clear" label="Clear" onPress={() => setAnnotations($, () => [])} />
            </Box>
          </Box>
        )}
      </Box>
    )
  })
}
