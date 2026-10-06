import { expect, mock, test } from 'claude-code/testing'

import { withAnnotations } from './register'

const PANE = {
  component: 'Pane',
  requestId: 'annotate',
  props: {
    title: 'Annotations',
    isFocused: true,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('annotates the selection from the pane and sends the comments', async ($, on) => {
  const sent: string[] = []
  const clock = mock.clock(on)
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('ui.open', () => ({ value: { isPlaced: true as const } }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('ui.selection', () => ({ value: { text: 'Use a global cache here', requestId: 'r1' } }))
  on('prompt.submit', ($, e) => {
    sent.push(e.text)
    return { drop: 'captured by test' }
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(500)

  const ui = await $.ui.mount({ plugin: 'annotate', surface: 'terminal', ...PANE })
  await ui.press({ key: 'annotate' })
  await ui.input({ key: 'comment', text: 'No globals, pass it in' })

  expect((await ui.find({ key: 'send' }))?.text).toContain('Send 1')
  await ui.press({ key: 'send' })

  expect(sent.at(-1)).toContain('> Use a global cache here')
  expect(sent.at(-1)).toContain('No globals, pass it in')
  expect(await ui.find({ key: 'send' })).toBeUndefined()

  await clock.advance(500)
  expect(await ui.find({ type: 'Text', text: /Select text in the transcript/ })).toBeDefined()
})

test('places the comment after the paragraph the quote starts in', () => {
  const text = [
    'Intro line.',
    '',
    'We should **use a global cache** here',
    'because it is fast.',
    '',
    '```ts',
    'const cache = new Map()',
    '',
    'export default cache',
    '```',
    '',
    'Done.',
  ].join('\n')
  const one = { id: 1, comment: 'No globals', quote: 'We should use a global cache here' }
  const two = { id: 2, comment: 'Fine', quote: 'const cache = new Map()' }

  const out = withAnnotations(text, [one, two]).split('\n')

  expect(out.indexOf('> 💬 **No globals**')).toBe(out.indexOf('because it is fast.') + 2)
  expect(out.indexOf('> 💬 **Fine**')).toBe(out.indexOf('```', out.indexOf('```ts') + 1) + 2)
  expect(withAnnotations(text, [{ id: 3, comment: 'x', quote: 'not in there' }])).toBe(text)
})
