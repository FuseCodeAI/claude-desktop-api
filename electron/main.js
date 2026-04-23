const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { spawnSync } = require('child_process')

const isDev = process.env.NODE_ENV !== 'production'

const HOME = process.env.HOME || require('os').homedir()
const CLAUDE_DIR = path.join(HOME, 'Library', 'Application Support', 'Claude')
const CLAUDE_3P_DIR = path.join(HOME, 'Library', 'Application Support', 'Claude-3p')
const CONFIG_LIB_DIR = path.join(CLAUDE_3P_DIR, 'configLibrary')
const DEV_SETTINGS = path.join(CLAUDE_DIR, 'developer_settings.json')
const DESKTOP_CONFIG = path.join(CLAUDE_3P_DIR, 'claude_desktop_config.json')
const META_JSON = path.join(CONFIG_LIB_DIR, '_meta.json')
const CC_SETTINGS = path.join(HOME, '.claude', 'settings.json')

function readJson(file, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 })
}

function getAppliedGatewayConfig() {
  const meta = readJson(META_JSON, { entries: [] })
  const id = meta.appliedId
  if (!id) return null
  const cfgPath = path.join(CONFIG_LIB_DIR, `${id}.json`)
  const cfg = readJson(cfgPath, null)
  if (!cfg) return null
  return { id, ...cfg }
}

ipcMain.handle('read-configs', () => {
  const devSettings = readJson(DEV_SETTINGS)
  const desktopConfig = readJson(DESKTOP_CONFIG)
  const ccSettings = readJson(CC_SETTINGS)
  const gateway = getAppliedGatewayConfig()

  return {
    devMode: !!devSettings.allowDevTools,
    deploymentMode: desktopConfig.deploymentMode || null,
    envVars: ccSettings.env || {},
    gateway: gateway
      ? {
          url: gateway.inferenceGatewayBaseUrl || '',
          authScheme: gateway.inferenceGatewayAuthScheme || 'bearer',
          hasApiKey: !!gateway.inferenceGatewayApiKey,
          apiKeyHint: gateway.inferenceGatewayApiKey
            ? gateway.inferenceGatewayApiKey.slice(0, 6) + '••••••'
            : '',
        }
      : null,
  }
})

ipcMain.handle('toggle-dev-mode', (_, enable) => {
  const current = readJson(DEV_SETTINGS)
  writeJson(DEV_SETTINGS, { ...current, allowDevTools: enable })
})

ipcMain.handle('sync-env-vars', () => {
  const ccSettings = readJson(CC_SETTINGS)
  const envVars = ccSettings.env || {}
  const synced = []
  const errors = []

  for (const [key, val] of Object.entries(envVars)) {
    const result = spawnSync('launchctl', ['setenv', key, String(val)])
    if (result.status === 0) {
      synced.push(key)
    } else {
      errors.push(`${key}: ${result.stderr?.toString().trim() || 'unknown error'}`)
    }
  }

  return { synced, errors }
})

ipcMain.handle('save-gateway', (_, { url, apiKey, authScheme }) => {
  fs.mkdirSync(CONFIG_LIB_DIR, { recursive: true, mode: 0o700 })

  const meta = readJson(META_JSON, { entries: [] })
  const id = meta.appliedId || crypto.randomUUID()
  meta.appliedId = id
  meta.entries = Array.isArray(meta.entries) ? meta.entries : []
  if (!meta.entries.some((e) => e.id === id)) {
    meta.entries.push({ id, name: 'Default' })
  }
  writeJson(META_JSON, meta)

  const cfgPath = path.join(CONFIG_LIB_DIR, `${id}.json`)
  const existing = readJson(cfgPath)
  writeJson(cfgPath, {
    ...existing,
    inferenceProvider: 'gateway',
    inferenceGatewayBaseUrl: url,
    ...(apiKey ? { inferenceGatewayApiKey: apiKey } : {}),
    inferenceGatewayAuthScheme: authScheme,
    disableDeploymentModeChooser: true,
  })

  const desktopConfig = readJson(DESKTOP_CONFIG)
  writeJson(DESKTOP_CONFIG, { ...desktopConfig, deploymentMode: '3p' })
})

ipcMain.handle('restart-claude', () => {
  spawnSync('pkill', ['-x', 'Claude'])
  setTimeout(() => spawnSync('open', ['-a', 'Claude']), 800)
})

ipcMain.handle('open-external', (_, url) => {
  shell.openExternal(url)
})

function createWindow() {
  const win = new BrowserWindow({
    width: 780,
    height: 640,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
