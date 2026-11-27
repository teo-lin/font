const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const START_MARKER = '<!-- explorer-font:start -->';
const END_MARKER = '<!-- explorer-font:end -->';
const BLOCK_PATTERN = new RegExp(`\\s*${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'g');

function findWorkbenchFile() {
  const candidates = ['electron-browser', 'electron-sandbox'].map((folder) =>
    path.join(vscode.env.appRoot, 'out', 'vs', 'code', folder, 'workbench', 'workbench.html'),
  );
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function buildStyleBlock() {
  const configuration = vscode.workspace.getConfiguration('explorerFont');
  const family = configuration.get('family');
  const size = configuration.get('size');
  const sizeRule = size > 0 ? ` font-size: ${size}px !important;` : '';
  const css = `.explorer-folders-view .monaco-list-row { font-family: ${family} !important;${sizeRule} }`;
  return `\n\t\t${START_MARKER}<style>${css}</style>${END_MARKER}`;
}

function readWorkbench() {
  const workbenchFile = findWorkbenchFile();
  if (!workbenchFile) {
    vscode.window.showErrorMessage('Explorer Font: cannot find the VSCode workbench file.');
    return undefined;
  }
  return { workbenchFile, html: fs.readFileSync(workbenchFile, 'utf8') };
}

// VSCode shows "installation appears to be corrupt" when this checksum does not match the file.
function updateChecksum(workbenchFile, html) {
  const productFile = path.join(vscode.env.appRoot, 'product.json');
  const checksumKey = path.relative(path.join(vscode.env.appRoot, 'out'), workbenchFile).split(path.sep).join('/');
  const checksum = crypto.createHash('sha256').update(html, 'utf8').digest('base64').replace(/=+$/, '');
  const product = fs.readFileSync(productFile, 'utf8');
  const keyPattern = new RegExp(`("${checksumKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:\\s*")[^"]*(")`);
  if (!keyPattern.test(product)) return;
  fs.writeFileSync(productFile, product.replace(keyPattern, `$1${checksum}$2`), 'utf8');
}

function writeWorkbench(workbenchFile, html) {
  try {
    fs.writeFileSync(workbenchFile, html, 'utf8');
    updateChecksum(workbenchFile, html);
    return true;
  } catch (error) {
    vscode.window.showErrorMessage(`Explorer Font: cannot write ${workbenchFile}: ${error.message}`);
    return false;
  }
}

async function offerReload(message) {
  const choice = await vscode.window.showInformationMessage(message, 'Reload Window');
  if (choice === 'Reload Window') {
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

async function apply() {
  const workbench = readWorkbench();
  if (!workbench) return;
  const cleanHtml = workbench.html.replace(BLOCK_PATTERN, '');
  const patchedHtml = cleanHtml.replace('</head>', `${buildStyleBlock()}\n\t</head>`);
  if (patchedHtml === workbench.html) {
    updateChecksum(workbench.workbenchFile, patchedHtml);
    return;
  }
  if (writeWorkbench(workbench.workbenchFile, patchedHtml)) {
    await offerReload('Explorer Font: applied. Reload to see it.');
  }
}

async function remove() {
  const workbench = readWorkbench();
  if (!workbench) return;
  const cleanHtml = workbench.html.replace(BLOCK_PATTERN, '');
  if (cleanHtml === workbench.html) {
    vscode.window.showInformationMessage('Explorer Font: nothing to remove.');
    return;
  }
  if (writeWorkbench(workbench.workbenchFile, cleanHtml)) {
    await offerReload('Explorer Font: removed. Reload to see it.');
  }
}

const SUGGESTED_FONTS = [
  { label: 'Lekton', css: 'Lekton', description: 'narrow, free download' },
  { label: 'Iosevka', css: 'Iosevka', description: 'narrow, free download' },
  { label: 'Ubuntu Mono', css: "'Ubuntu Mono'", description: 'narrow, free download' },
  { label: 'JetBrains Mono', css: "'JetBrains Mono'", description: 'free download' },
  { label: 'Fira Code', css: "'Fira Code'", description: 'free download' },
  { label: 'Source Code Pro', css: "'Source Code Pro'", description: 'free download' },
  { label: 'SF Mono', css: 'ui-monospace', description: 'built in on macOS' },
  { label: 'Monaco', css: 'Monaco', description: 'built in on macOS' },
  { label: 'Menlo', css: 'Menlo', description: 'built in on macOS' },
  { label: 'Consolas', css: 'Consolas', description: 'built in on Windows' },
  { label: 'Cascadia Code', css: "'Cascadia Code'", description: 'built in on Windows' },
  { label: 'Courier New', css: "'Courier New'", description: 'built in on macOS and Windows' },
];

async function pickFont() {
  const configuration = vscode.workspace.getConfiguration('explorerFont');
  const current = configuration.get('family');
  const typeOwn = { label: '$(edit) Type a font name…', alwaysShow: true };
  const choice = await vscode.window.showQuickPick(
    [typeOwn, { label: '', kind: vscode.QuickPickItemKind.Separator }, ...SUGGESTED_FONTS],
    { placeHolder: `Current font: ${current}`, matchOnDescription: true },
  );
  if (!choice) return;
  let css = choice.css;
  if (choice === typeOwn) {
    const name = await vscode.window.showInputBox({
      prompt: 'Font name, exactly as installed on this computer',
      placeHolder: 'For example: Lekton',
    });
    if (!name || !name.trim()) return;
    css = name.includes(' ') ? `'${name.trim()}'` : name.trim();
  }
  await configuration.update('family', `${css}, monospace`, vscode.ConfigurationTarget.Global);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('explorerFont.pick', pickFont),
    vscode.commands.registerCommand('explorerFont.apply', apply),
    vscode.commands.registerCommand('explorerFont.remove', remove),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('explorerFont')) apply();
    }),
  );
  // A VSCode update replaces the workbench file, so the patch must be put back.
  apply();
}

function deactivate() {}

module.exports = { activate, deactivate };
