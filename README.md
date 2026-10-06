# claude-code-annotate-mod

A Claude Code mod for reviewing Claude's replies in the terminal: select text in a reply, comment on it, and send all your comments back as the next prompt.

- Comments show inline in the reply (`> 💬 your comment`), under the paragraph or code block they refer to.
- A side pane lists every annotation, with delete, **Send**, **Copy** (as Markdown) and **Clear**.

## Install

```
/plugin install annotate --marketplace sagarr/claude-code-annotate-mod
```

Answer `y` to add the marketplace, then pick a scope.

## Use

1. Select text in a Claude reply with the mouse. The pane shows it as a quote.
2. Press **Annotate** (or `a` while the pane has focus), type a comment, press Enter.
3. Repeat, then **Send** (`s`). The annotations go to Claude as:

   ```
   Feedback on your previous response:

   1.
   > quoted text

   your comment
   ```

`/annotate-mod` toggles the pane. It opens on its own at session start when the terminal is at least 144 columns wide.

## Limits

- Selecting text needs Claude Code's fullscreen mode.
- Inline comments are placed by matching the first line of the selection against the reply; a selection that can't be matched (a table, say) is still listed and sent, just not shown inline.
- Inline comments change only what you see; Claude reads them when you press **Send**.

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
