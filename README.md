# Explorer Font

Shows the VSCode explorer pane in a font of your choice, for example a monospace font.

## Settings

| Setting | Default | Meaning |
|---|---|---|
| `explorerFont.family` | `Monaco, Menlo, monospace` | Font for the explorer pane |
| `explorerFont.size` | `0` | Size in pixels. `0` keeps the VSCode size |

## Commands

- **Explorer Font: Pick Font** — choose from a list of monospace fonts, or type the name of any installed font.
- **Explorer Font: Apply** — apply the font now.
- **Explorer Font: Remove** — go back to the VSCode font.

## Note

VSCode has no setting for this. The extension adds one style rule to a VSCode file and updates its checksum, so VSCode does not report a corrupt installation. A VSCode update removes the rule; the extension puts it back at the next start.
