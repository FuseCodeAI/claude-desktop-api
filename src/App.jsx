import React, { useEffect, useState, useRef } from 'react'

const api = window.api

const FONT = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif'
const MONO = '"JetBrains Mono", "SF Mono", "Fira Code", monospace'

const C = {
  bg: '#0e0e10',
  surface: '#141416',
  line: '#1f1f23',
  lineSubtle: '#19191d',
  textPrimary: '#d4d4d8',
  textSecondary: '#6e6e78',
  textMuted: '#3e3e46',
  accent: '#c5a24d',
  accentDim: 'rgba(197,162,77,0.12)',
  accentBorder: 'rgba(197,162,77,0.25)',
  green: '#5faa6e',
  greenDim: 'rgba(95,170,110,0.1)',
  greenBorder: 'rgba(95,170,110,0.2)',
  red: '#c45c5c',
  redDim: 'rgba(196,92,92,0.1)',
  redBorder: 'rgba(196,92,92,0.2)',
}

const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: ${C.bg}; }
  body { overflow: hidden; }
  ::-webkit-scrollbar { display: none; }
  input::placeholder { color: ${C.textMuted}; }
  select option { background: ${C.bg}; color: ${C.textPrimary}; }
  input:focus, select:focus { border-color: ${C.accent} !important; }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`
document.head.appendChild(style)

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 3,
        background: on ? C.accent : C.line,
        border: `1px solid ${on ? C.accent : C.lineSubtle}`,
        cursor: 'pointer', position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
        padding: 0, flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: on ? 18 : 2,
        width: 14, height: 14, borderRadius: 2,
        background: on ? C.bg : C.textMuted,
        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
      }} />
    </button>
  )
}

function StatusDot({ active }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 6, height: 6, borderRadius: 1,
      background: active ? C.green : C.red,
      boxShadow: active ? `0 0 8px ${C.green}` : 'none',
      marginRight: 8, flexShrink: 0,
    }} />
  )
}

function Section({ children, delay = 0 }) {
  return (
    <div style={{
      borderBottom: `1px solid ${C.line}`,
      padding: '18px 0',
      animation: `fadeSlideIn 0.35s ${delay}s both cubic-bezier(0.16,1,0.3,1)`,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, fontWeight: 500,
      color: C.textMuted, letterSpacing: 1.5,
      textTransform: 'uppercase', marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

function Btn({ variant = 'default', children, ...props }) {
  const base = {
    fontFamily: FONT, fontSize: 12, fontWeight: 500,
    padding: '6px 14px', borderRadius: 3, cursor: 'pointer',
    transition: 'all 0.15s', flexShrink: 0, letterSpacing: 0.2,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  }
  const variants = {
    default: { background: C.surface, color: C.textSecondary, border: `1px solid ${C.line}` },
    accent: { background: C.accentDim, color: C.accent, border: `1px solid ${C.accentBorder}` },
    danger: { background: C.redDim, color: C.red, border: `1px solid ${C.redBorder}` },
  }
  return <button style={{ ...base, ...variants[variant] }} {...props}>{children}</button>
}

export default function App() {
  const [configs, setConfigs] = useState(null)
  const [syncResult, setSyncResult] = useState(null)
  const [gatewayForm, setGatewayForm] = useState({ url: '', apiKey: '', authScheme: 'bearer' })
  const [showApiKey, setShowApiKey] = useState(false)
  const [gatewaySaved, setGatewaySaved] = useState(null)
  const [restarting, setRestarting] = useState(false)
  const [showManualGateway, setShowManualGateway] = useState(false)

  const load = async () => {
    if (!api) return
    const data = await api.readConfigs()
    setConfigs(data)
    if (data.gateway) {
      setGatewayForm((f) => ({
        ...f,
        url: data.gateway.url || '',
        authScheme: data.gateway.authScheme || 'bearer',
      }))
    }
  }

  useEffect(() => { load() }, [])

  const handleDevMode = async (val) => {
    await api.toggleDevMode(val)
    setConfigs((c) => ({ ...c, devMode: val }))
  }

  const handleSync = async () => {
    setSyncResult(null)
    const result = await api.syncEnvVars()
    setSyncResult(result)
  }

  const handleSaveGateway = async () => {
    setGatewaySaved(null)
    try {
      await api.saveGateway(gatewayForm)
      setGatewaySaved('ok')
      await load()
    } catch {
      setGatewaySaved('err')
    }
  }

  const handleRestart = async () => {
    setRestarting(true)
    await api.restartClaude()
    setTimeout(() => setRestarting(false), 2000)
  }

  const envEntries = configs ? Object.entries(configs.envVars || {}) : []
  const hasEnv = envEntries.length > 0

  const inputStyle = {
    fontFamily: MONO, background: C.bg,
    border: `1px solid ${C.line}`, borderRadius: 3,
    color: C.textPrimary, fontSize: 12, padding: '8px 10px',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      fontFamily: FONT, background: C.bg, color: C.textPrimary,
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
    }}>
      {/* Title bar */}
      <div style={{
        height: 44, WebkitAppRegion: 'drag',
        background: C.bg, display: 'flex', alignItems: 'center',
        paddingLeft: 80, borderBottom: `1px solid ${C.line}`,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: MONO, fontSize: 11, fontWeight: 500,
          color: C.textMuted, letterSpacing: 1,
        }}>
          SYNCER
        </span>
        <span style={{
          fontFamily: MONO, fontSize: 10, color: C.textMuted,
          marginLeft: 8, opacity: 0.5,
        }}>
          v1.0
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '0 28px', flex: 1 }}>

        {/* Dev Mode */}
        <Section delay={0}>
          <SectionLabel>01 — Developer Mode</SectionLabel>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {configs && <StatusDot active={configs.devMode} />}
              <span style={{ fontSize: 14, color: C.textPrimary, fontWeight: 400 }}>
                DevTools 调试面板
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 11, color: C.textMuted,
                marginLeft: 10,
              }}>
                allowDevTools
              </span>
            </div>
            {configs ? (
              <Toggle on={configs.devMode} onChange={handleDevMode} />
            ) : (
              <span style={{
                fontFamily: MONO, fontSize: 11, color: C.textMuted,
                animation: 'pulse 1.5s infinite',
              }}>LOADING</span>
            )}
          </div>
        </Section>

        {/* Gateway */}
        <Section delay={0.06}>
          <SectionLabel>02 — Inference Gateway</SectionLabel>

          {configs && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 14,
            }}>
              <StatusDot active={configs.deploymentMode === '3p'} />
              <span style={{ fontSize: 13, color: C.textSecondary }}>
                {configs.deploymentMode === '3p'
                  ? '第三方网关已激活'
                  : '使用默认推理端点'}
              </span>
              {configs.gateway?.url && (
                <span style={{
                  fontFamily: MONO, fontSize: 10, color: C.textMuted,
                  marginLeft: 'auto',
                }}>
                  {configs.gateway.url}
                </span>
              )}
            </div>
          )}

          {hasEnv ? (
            <>
              <div style={{ marginBottom: 12 }}>
                {envEntries.map(([k, v], i) => (
                  <div key={k} style={{
                    display: 'flex', alignItems: 'baseline', gap: 12,
                    padding: '6px 0',
                    borderBottom: i < envEntries.length - 1 ? `1px solid ${C.lineSubtle}` : 'none',
                  }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 11, fontWeight: 500,
                      color: C.accent, minWidth: 140, flexShrink: 0,
                    }}>{k}</span>
                    <span style={{
                      fontFamily: MONO, fontSize: 11, color: C.textMuted,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {String(v).slice(0, 60)}{String(v).length > 60 ? '…' : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="accent" onClick={handleSync}>同步到系统</Btn>
                <Btn onClick={load}>刷新</Btn>
              </div>
              {syncResult && (
                <div style={{
                  fontFamily: MONO, fontSize: 11, marginTop: 10, padding: '8px 10px',
                  borderRadius: 3, lineHeight: 1.6,
                  background: syncResult.errors.length ? C.redDim : C.greenDim,
                  color: syncResult.errors.length ? C.red : C.green,
                  border: `1px solid ${syncResult.errors.length ? C.redBorder : C.greenBorder}`,
                }}>
                  {syncResult.synced.length > 0 && <div>✓ {syncResult.synced.join(', ')}</div>}
                  {syncResult.errors.length > 0 && <div>✗ {syncResult.errors.join('; ')}</div>}
                </div>
              )}
            </>
          ) : showManualGateway ? (
            <div style={{ animation: 'fadeSlideIn 0.25s both cubic-bezier(0.16,1,0.3,1)' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 500,
                  color: C.textMuted, letterSpacing: 1, display: 'block', marginBottom: 6,
                }}>URL</label>
                <input
                  style={inputStyle}
                  value={gatewayForm.url}
                  onChange={(e) => setGatewayForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://gateway.example.com"
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 500,
                  color: C.textMuted, letterSpacing: 1, display: 'block', marginBottom: 6,
                }}>API KEY</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={inputStyle}
                    type={showApiKey ? 'text' : 'password'}
                    value={gatewayForm.apiKey}
                    onChange={(e) => setGatewayForm((f) => ({ ...f, apiKey: e.target.value }))}
                    placeholder={configs?.gateway?.apiKeyHint || '输入密钥'}
                  />
                  <Btn onClick={() => setShowApiKey((v) => !v)}>
                    {showApiKey ? '隐藏' : '显示'}
                  </Btn>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 500,
                  color: C.textMuted, letterSpacing: 1, display: 'block', marginBottom: 6,
                }}>AUTH</label>
                <select
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  value={gatewayForm.authScheme}
                  onChange={(e) => setGatewayForm((f) => ({ ...f, authScheme: e.target.value }))}
                >
                  <option value="bearer">bearer</option>
                  <option value="x-api-key">x-api-key</option>
                  <option value="auto">auto</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="accent" onClick={handleSaveGateway}>保存</Btn>
                <Btn onClick={() => setShowManualGateway(false)}>返回</Btn>
              </div>
              {gatewaySaved === 'ok' && (
                <div style={{
                  fontFamily: MONO, fontSize: 11, marginTop: 10, padding: '8px 10px',
                  borderRadius: 3, background: C.greenDim, color: C.green,
                  border: `1px solid ${C.greenBorder}`,
                }}>✓ 已保存，重启 Claude 生效</div>
              )}
              {gatewaySaved === 'err' && (
                <div style={{
                  fontFamily: MONO, fontSize: 11, marginTop: 10, padding: '8px 10px',
                  borderRadius: 3, background: C.redDim, color: C.red,
                  border: `1px solid ${C.redBorder}`,
                }}>✗ 保存失败</div>
              )}
            </div>
          ) : (
            <div>
              <div style={{
                fontSize: 13, color: C.textMuted, lineHeight: 1.7, marginBottom: 2,
              }}>
                未检测到 <span style={{ fontFamily: MONO, color: C.textSecondary }}>~/.claude/settings.json</span> 中的 env 配置
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
                请先在 Claude Code 中设置，或
                <span
                  onClick={() => setShowManualGateway(true)}
                  style={{
                    color: C.accent, cursor: 'pointer', marginLeft: 4,
                    borderBottom: `1px solid ${C.accentBorder}`,
                    paddingBottom: 1,
                  }}
                >手动填写网关</span>
              </div>
            </div>
          )}
        </Section>

        {/* Actions */}
        <Section delay={0.12}>
          <SectionLabel>03 — Actions</SectionLabel>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: C.textSecondary }}>
              修改配置后需重启 Claude Desktop
            </span>
            <Btn variant="danger" onClick={handleRestart} disabled={restarting}>
              {restarting ? '重启中…' : '重启应用'}
            </Btn>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '16px 0 18px',
        fontSize: 10, fontFamily: MONO, color: C.textMuted,
        letterSpacing: 0.5,
      }}>
        made by{' '}
        <a
          href="https://fusecode.cc"
          style={{
            color: C.textMuted, textDecoration: 'none',
            borderBottom: `1px solid ${C.lineSubtle}`,
            paddingBottom: 1, transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => { e.target.style.color = C.accent; e.target.style.borderColor = C.accent }}
          onMouseLeave={(e) => { e.target.style.color = C.textMuted; e.target.style.borderColor = C.lineSubtle }}
          onClick={(e) => { e.preventDefault(); api?.openExternal('https://fusecode.cc') }}
        >
          fusecode.cc
        </a>
      </div>
    </div>
  )
}
