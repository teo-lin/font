# Explorer Font

Shows the VSCode explorer pane in a font of your choice, for example a monospace font.

## Settings

| Setting | Default | Meaning |
|---|---|---|
| `explorerFont.family` | `Lekton, Monaco, Menlo, monospace` | Font for the explorer pane. [Lekton](https://fonts.google.com/specimen/Lekton) is a free download; if it is not installed, the next font in the list is used |
| `explorerFont.size` | `0` | Size in pixels. `0` keeps the VSCode size |

## Commands

- **Explorer Font: Pick Font** — choose from a list of monospace fonts, or type the name of any installed font.
- **Explorer Font: Apply** — apply the font now.
- **Explorer Font: Remove** — go back to the VSCode font.

## Note

VSCode has no setting for this. The extension adds one style rule to a VSCode file (`workbench.html`) and updates that file's checksum in `product.json`. A VSCode update removes the rule; the extension puts it back at the next start.

**"Your installation appears to be corrupt":** VSCode reads its checksums once, when the app starts, so right after the extension changes the file it can show this warning. The installation is fine. **Quit VSCode completely and reopen it** (on a Mac: `Cmd+Q`; closing the window or running *Reload Window* is not enough) and the warning is gone. You may see it once more after each VSCode update, because the extension re-applies the rule then. If it stays after a full restart, run **Explorer Font: Remove** and open an issue.

The extension needs write access to the VSCode install folder. If VSCode is installed for all users (for example in `Program Files`), run VSCode as administrator once.
