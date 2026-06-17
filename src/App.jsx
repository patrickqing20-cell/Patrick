import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const API = '/reviewhub-api'
const ADMIN = ['青山']

function pad(n) { return String(n).padStart(3, '0') }

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
    </div>
  )
}

function LoginPage({ onLogin, error }) {
  const [name, setName] = useState('')
  return (
    <div className="login-overlay">
      <div className="login-box">
        <h2>ReviewHub</h2>
        <div className="sub">多人协同评审平台</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="输入你的名字"
          onKeyDown={e => e.key === 'Enter' && onLogin(name)} autoFocus />
        <button onClick={() => onLogin(name)}>进入</button>
        {error && <div className="login-err">{error}</div>}
      </div>
    </div>
  )
}

function TaskListPage({ user, tasks, onSelect, onLogout, onProduction, onDashboard }) {
  const [cat, setCat] = useState('all')

  const catIcon = c => ({ image: '🖼️', video: '🎬', audio: '🎵' }[c] || '📋')
  const catLabel = c => ({ image: '图片', video: '视频', audio: '音频' }[c] || c)

  const counts = { all: tasks.length, image: 0, video: 0, audio: 0 }
  tasks.forEach(t => { if (t.category && counts[t.category] !== undefined) counts[t.category]++ })

  const filtered = cat === 'all' ? tasks : tasks.filter(t => t.category === cat)

  return (
    <>
      <div className="user-bar">
        <span><span className="user-badge">👤 {user}</span><span className="logout-btn" onClick={onLogout}>退出</span></span>
      </div>
      <div className="task-list">
        <h1>WorkStation</h1>
        <div className="sub">评审协作 · 生产任务 · 一站式管理</div>
        <div className="filters" style={{ marginBottom: 12 }}>
          <button className="filter-btn active" style={{ fontSize: 14, padding: '8px 20px' }}>📋 评审任务</button>
          <button className="filter-btn" style={{ fontSize: 14, padding: '8px 20px' }} onClick={onProduction}>🚀 生产任务</button>
        </div>
        <div className="cat-tabs">
          {['all', 'image', 'video', 'audio'].map(c => (
            <button key={c} className={`cat-tab ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {c === 'all' ? '全部' : `${catIcon(c)} ${catLabel(c)}`}
              <span className="cat-count">{counts[c]}</span>
            </button>
          ))}
        </div>
        {filtered.map(t => (
          <div key={t.id} className="task-card" onClick={() => onSelect(t.id)}>
            <h3>
              {t.category && <span className="cat-icon">{catIcon(t.category)}</span>}
              {t.title}
            </h3>
            <div className="desc">{t.description || ''}</div>
            <div className="meta-row">
              <span>条目: <b>{t.itemCount}</b></span>
              <span>评审人: <b>{t.reviewers}</b></span>
              <span>模式: <b>{t.mode === 'single_choice' ? '单选' : t.mode === 'triage' ? '三态' : t.mode === 'video_blind' ? '视频盲选' : t.mode}</b></span>
              {t.created && <span>创建: <b>{t.created}</b></span>}
              {ADMIN.includes(user) && (
                <span className="dash-link" onClick={e => { e.stopPropagation(); onDashboard(t.id) }}>📊 报告</span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty">暂无{cat === 'all' ? '' : catLabel(cat)}评审任务</div>}
      </div>
    </>
  )
}

function ReviewPage({ user, token, taskId, onBack, showToast }) {
  const [task, setTask] = useState(null)
  const [myLabels, setMyLabels] = useState({})
  const [summary, setSummary] = useState({})
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [expandedPrompts, setExpandedPrompts] = useState({})
  const [pendingPicks, setPendingPicks] = useState({})
  // Note: expandedSections is only used in DashboardPage, not here
  const audioRef = useRef(null)
  const playBtnRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    async function load() {
      const [taskRes, labelsRes, summaryRes] = await Promise.all([
        fetch(`${API}/api/tasks/${taskId}`).then(r => r.json()),
        fetch(`${API}/api/tasks/${taskId}/labels?user=${encodeURIComponent(user)}`).then(r => r.json()),
        fetch(`${API}/api/tasks/${taskId}/summary`).then(r => r.json()),
      ])
      setTask(taskRes)
      setMyLabels(labelsRes)
      setSummary(summaryRes.summary || {})
    }
    load()
    pollRef.current = setInterval(async () => {
      try {
        const s = await fetch(`${API}/api/tasks/${taskId}/summary`).then(r => r.json())
        setSummary(s.summary || {})
      } catch {}
    }, 10000)
    return () => clearInterval(pollRef.current)
  }, [taskId, user])

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    if (playBtnRef.current) { playBtnRef.current.classList.remove('playing'); playBtnRef.current.innerHTML = '&#9654;' }
    audioRef.current = null; playBtnRef.current = null
  }, [])

  const playAudio = useCallback((url, btn) => {
    if (playBtnRef.current === btn) { stopAudio(); return }
    stopAudio()
    const a = new Audio(url)
    a.play()
    btn.classList.add('playing'); btn.innerHTML = '&#9632;'
    audioRef.current = a; playBtnRef.current = btn
    a.onended = () => { btn.classList.remove('playing'); btn.innerHTML = '&#9654;'; audioRef.current = null; playBtnRef.current = null }
    a.onerror = () => { btn.classList.remove('playing'); btn.innerHTML = '!' }
  }, [stopAudio])

  const submitLabel = useCallback(async (itemId, pick, note) => {
    try {
      const r = await fetch(`${API}/api/tasks/${taskId}/labels`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, token, itemId, pick, note: note || '' })
      })
      if (!r.ok) { showToast('保存失败', 'error'); return }
      setMyLabels(prev => {
        const next = { ...prev }
        if (pick === 'remove') delete next[String(itemId)]
        else next[String(itemId)] = { ...next[String(itemId)], pick, note: note !== undefined ? note : (next[String(itemId)]?.note || ''), time: new Date().toISOString() }
        return next
      })
      showToast(pick === 'remove' ? '已取消' : '已保存', 'success')
    } catch { showToast('网络错误', 'error') }
  }, [taskId, user, token, showToast])

  const submitNote = useCallback(async (itemId, note) => {
    const existing = myLabels[String(itemId)] || {}
    try {
      await fetch(`${API}/api/tasks/${taskId}/labels`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, token, itemId, pick: existing.pick || '', note })
      })
      setMyLabels(prev => ({ ...prev, [String(itemId)]: { ...prev[String(itemId)], note } }))
      showToast('备注已保存', 'success')
    } catch { showToast('网络错误', 'error') }
  }, [taskId, user, token, myLabels, showToast])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') { setLightboxSrc(null); stopAudio() } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [stopAudio])

  if (!task) return <div className="empty">加载中...</div>

  const items = task.items || []
  const options = task.options || []
  const isAdmin = ADMIN.includes(user)
  const negativeOptions = options.filter(o => o.negative).map(o => o.id)

  const allVals = Object.values(myLabels).filter(l => l.pick)
  const doneCount = allVals.filter(l => !negativeOptions.includes(l.pick)).length
  const noneCount = allVals.filter(l => negativeOptions.includes(l.pick)).length
  const pendingCount = items.length - doneCount - noneCount
  const progressPct = (doneCount + noneCount) / Math.max(items.length, 1) * 100

  let filtered = items
  if (filter === 'pending') filtered = items.filter(i => !myLabels[i.id]?.pick)
  else if (filter === 'done') filtered = items.filter(i => { const p = myLabels[i.id]?.pick; return p && !negativeOptions.includes(p) })
  else if (filter === 'none') filtered = items.filter(i => negativeOptions.includes(myLabels[i.id]?.pick))
  else if (filter === 'male') filtered = items.filter(i => i.meta?.gender === '男')
  else if (filter === 'female') filtered = items.filter(i => i.meta?.gender === '女')

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(i => (i.title || '').toLowerCase().includes(q) || (i.meta?.genre || '').toLowerCase().includes(q) || i.id.includes(q))
  }

  const vLabel = v => { const opt = options.find(o => o.id === v); return opt ? opt.label : v }

  return (
    <>
      <div className="review-header">
        <div className="header-top">
          <span>
            <span className="header-title" onClick={onBack}>← {task.title}</span>
            <span className="user-badge" style={{ marginLeft: 12 }}>👤 {user}</span>
          </span>
          <div className="stats">
            <span>已选: <b>{doneCount}</b></span>
            {negativeOptions.length > 0 && <span style={{ color: 'var(--reject)' }}>{vLabel(negativeOptions[0])}: <b>{noneCount}</b></span>}
            <span>待选: <b>{pendingCount}</b></span>
            <span>共 <b>{items.length}</b></span>
          </div>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: progressPct + '%' }} /></div>
        <div className="filters">
          {['all', 'pending', 'done', 'none', 'male', 'female'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {{ all: '全部', pending: '待评', done: '已选', none: negativeOptions.length ? vLabel(negativeOptions[0]) : '不通过', male: '男', female: '女' }[f]}
            </button>
          ))}
          <input className="search-input" placeholder="🔍 搜索..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="cards-container">
        {filtered.length === 0 && <div className="empty">暂无匹配项</div>}
        {filtered.map(item => {
          const label = myLabels[item.id] || {}
          const myPick = label.pick || ''
          const note = label.note || ''
          const itemSummary = summary[item.id] || { picks: {}, notes: [] }
          const allVoters = new Set()
          Object.values(itemSummary.picks || {}).forEach(us => us.forEach(u => allVoters.add(u)))
          const voterCount = allVoters.size
          let pickDetail = ''
          if (isAdmin && voterCount > 0) {
            pickDetail = ' (' + Object.entries(itemSummary.picks || {}).map(([v, us]) => `${vLabel(v)}: ${us.join(',')}`).join(' | ') + ')'
          }

          const images = (item.assets || []).filter(a => a.type === 'image')
          const audios = (item.assets || []).filter(a => a.type === 'audio')
          const videos = (item.assets || []).filter(a => a.type === 'video')
          const cardClass = negativeOptions.includes(myPick) ? 'card rejected' : myPick ? 'card done' : 'card'

          return (
            <div key={item.id} className={cardClass}>
              <div className="card-top">
                <div className="card-info">
                  <h3>#{pad(parseInt(item.id) || 0)} {item.title}</h3>
                  <div className="card-meta">
                    {item.meta?.genre && <span className="genre-tag">{item.meta.genre}</span>}
                    {item.meta?.theme && <span className="genre-tag">{item.meta.theme}</span>}
                    {item.meta?.gender && <span>{item.meta.gender}</span>}
                    {item.meta?.age && <span> · {item.meta.age}岁</span>}
                    {item.meta?.route && <span> · 链路{item.meta.route}</span>}
                    {item.meta?.tags && <span className="genre-tag">{item.meta.tags}</span>}
                  </div>
                  {images.map((img, i) => (
                    <div key={i} className="card-img" onClick={() => setLightboxSrc(img.url)}>
                      <img src={img.url} alt={item.title} loading="lazy" />
                    </div>
                  ))}
                  {item.text?.line && <div className="card-line">{item.text.line}</div>}
                  {item.text?.prompt && (
                    <>
                      {task.mode === 'video_blind' ? (
                        <div className="prompt-box video-prompt">{item.text.prompt}</div>
                      ) : (
                        <>
                          <span className="prompt-toggle" onClick={() => setExpandedPrompts(p => ({ ...p, [item.id]: !p[item.id] }))}>
                            {expandedPrompts[item.id] ? '收起描述' : '查看描述'}
                          </span>
                          {expandedPrompts[item.id] && <div className="prompt-box">{item.text.prompt}</div>}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* video_blind 模式：视频盲选（评论在选中视频下方） */}
              {task.mode === 'video_blind' && (() => {
                const pendingPick = pendingPicks[item.id]
                const activePick = pendingPick || myPick
                const hasPick = !!myPick
                const hasNote = !!(note && note.trim())
                const isComplete = hasPick && hasNote
                return (
                <div className="videos-section">
                  {videos.length > 0 && (
                  <div className="videos-grid">
                    {videos.map((video, i) => {
                      const optId = `video_${String.fromCharCode(65 + i)}`
                      const isPicked = activePick === optId
                      const label = video.label || `视频${String.fromCharCode(65 + i)}`
                      return (
                        <div key={i} className={`video-cell ${isPicked ? 'picked' : ''}`}>
                          <div className="video-label">{label}</div>
                          <video controls preload="metadata" playsInline className="video-player">
                            <source src={video.url} type="video/mp4" />
                          </video>
                          <button
                            className={`video-pick-btn ${isPicked ? 'selected' : ''}`}
                            onClick={e => {
                              e.stopPropagation()
                              if (isPicked) {
                                setPendingPicks(p => { const n = {...p}; delete n[item.id]; return n })
                                if (myPick) submitLabel(item.id, 'remove')
                              } else {
                                setPendingPicks(p => ({ ...p, [item.id]: optId }))
                              }
                            }}>
                            {isPicked ? '✓ 已选' : '👆 选这个'}
                          </button>
                          {/* 评论框：直接在选中按钮下方 */}
                          {isPicked && (
                            <div className="video-inline-comment">
                              <textarea
                                className="video-comment-input"
                                data-comment-id={item.id}
                                placeholder="写下选择理由（必填）..."
                                defaultValue={note}
                                rows={2}
                                autoFocus={!!pendingPick}
                              />
                              {pendingPick && (
                                <button className="video-submit-btn"
                                  onClick={e => {
                                    e.stopPropagation()
                                    const textarea = e.currentTarget.parentElement.querySelector('textarea')
                                    const val = textarea?.value?.trim()
                                    if (!val) {
                                      showToast('请先写评论再提交', 'error')
                                      textarea?.focus()
                                      return
                                    }
                                    submitLabel(item.id, pendingPick, val)
                                    setPendingPicks(p => { const n = {...p}; delete n[item.id]; return n })
                                  }}>
                                  提交
                                </button>
                              )}
                              {!pendingPick && isComplete && (
                                <div className="comment-saved">✅ 已保存</div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  )}
                  <div className="video-none-row">
                    {negativeOptions.map(neg => (
                      <div key={neg} className="video-none-wrap">
                        <button className={`none-btn ${activePick === neg ? 'selected' : ''}`}
                          onClick={() => {
                            if (activePick === neg) {
                              setPendingPicks(p => { const n = {...p}; delete n[item.id]; return n })
                              if (myPick) submitLabel(item.id, 'remove')
                            } else {
                              setPendingPicks(p => ({ ...p, [item.id]: neg }))
                            }
                          }}>
                          {activePick === neg ? `✗ 已标记${vLabel(neg)}` : `❌ ${vLabel(neg)}`}
                        </button>
                        {activePick === neg && (
                          <div className="video-inline-comment">
                            <textarea
                              className="video-comment-input"
                              data-comment-id={item.id}
                              placeholder="写下原因（必填）..."
                              defaultValue={note}
                              rows={2}
                              autoFocus={!!pendingPick}
                            />
                            {pendingPick && (
                              <button className="video-submit-btn"
                                onClick={e => {
                                  e.stopPropagation()
                                  const textarea = e.currentTarget.parentElement.querySelector('textarea')
                                  const val = textarea?.value?.trim()
                                  if (!val) {
                                    showToast('请先写评论再提交', 'error')
                                    textarea?.focus()
                                    return
                                  }
                                  submitLabel(item.id, pendingPick, val)
                                  setPendingPicks(p => { const n = {...p}; delete n[item.id]; return n })
                                }}>
                                提交
                              </button>
                            )}
                            {!pendingPick && isComplete && (
                              <div className="comment-saved">✅ 已保存</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                )
              })()}

              {task.mode === 'single_choice' && audios.length > 0 && (
                <div className="voices-section">
                  {audios.map((audio, i) => {
                    const optId = options[i]?.id || `voice_${i + 1}`
                    const isPicked = myPick === optId
                    return (
                      <div key={i} className={`voice-row ${isPicked ? 'picked' : ''}`}>
                        <span className="voice-label">{audio.label || `音色${i + 1}`}</span>
                        <button className="play-btn" onClick={e => { e.stopPropagation(); playAudio(audio.url, e.currentTarget) }}>&#9654;</button>
                        <button className={`pick-btn ${isPicked ? 'selected' : ''}`}
                          onClick={e => { e.stopPropagation(); submitLabel(item.id, isPicked ? 'remove' : optId) }}>
                          {isPicked ? '✓ 已选' : '选这个'}
                        </button>
                      </div>
                    )
                  })}
                  {negativeOptions.map(neg => (
                    <div key={neg} className="none-row">
                      <button className={`none-btn ${myPick === neg ? 'selected' : ''}`}
                        onClick={() => submitLabel(item.id, myPick === neg ? 'remove' : neg)}>
                        {myPick === neg ? `✗ 已标记${vLabel(neg)}` : `❌ ${vLabel(neg)}`}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {task.mode === 'triage' && (
                <div className="triage-section">
                  {options.map(opt => (
                    <button key={opt.id}
                      className={`triage-btn ${myPick === opt.id ? `sel-${opt.id}` : ''}`}
                      onClick={() => submitLabel(item.id, myPick === opt.id ? 'remove' : opt.id)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="card-footer">
                {task.mode !== 'video_blind' && (
                  <input className="note-input" placeholder="备注（可选）" defaultValue={note}
                    onBlur={e => { if (e.target.value !== note) submitNote(item.id, e.target.value) }} />
                )}
                <div className="card-votes">
                  {voterCount > 0 ? `👁️ ${voterCount}人已评审${isAdmin ? pickDetail : ''}` : '暂无人评审'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {lightboxSrc && (
        <div className="lightbox show" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" />
        </div>
      )}
    </>
  )
}

// ========== PRODUCTION PAGE (TaskHub) ==========
function ProductionPage({ user, onBack, showToast }) {
  const [tasks, setTasks] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [logs, setLogs] = useState([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [resuming, setResuming] = useState(false)
  const pollRef = useRef(null)
  const logEndRef = useRef(null)

  // Icon map by type
  const typeIcon = type => ({
    voice_generation: '️', tagging: '🏷️', search_eval: '📊', image_generation: '🎨', other: '📦'
  }[type] || '📦')

  async function loadTasks() {
    try {
      const r = await fetch(`${API}/api/production`).then(r => r.json())
      setTasks(r.tasks || [])
    } catch {}
  }

  useEffect(() => {
    loadTasks()
    pollRef.current = setInterval(loadTasks, 5000)
    return () => clearInterval(pollRef.current)
  }, [])

  async function loadDetail(taskId) {
    try {
      const r = await fetch(`${API}/api/production/${taskId}`).then(r => r.json())
      setDetail(r)
      // Load logs via dedicated endpoint
      if (r.taskId) {
        const lr = await fetch(`${API}/api/production/${r.taskId}/logs`).then(r => r.json())
        setLogs(lr.logs || [])
      }
    } catch {}
  }

  useEffect(() => {
    if (selected) {
      loadDetail(selected)
      const iv = setInterval(() => loadDetail(selected), 5000)
      return () => clearInterval(iv)
    }
  }, [selected])

  // Auto scroll logs
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const statusLabel = s => ({ pending: '⏳ 排队', running: '🔄 运行中', completed: '✅ 已完成', failed: '❌ 失败', cancelled: '️ 已取消' }[s] || s)
  const statusColor = s => ({ running: 'var(--accent)', completed: 'var(--pick)', failed: 'var(--reject)', pending: 'var(--dim)' }[s] || 'var(--dim)')

  const handleResume = async () => {
    if (!detail || resuming) return
    setResuming(true)
    try {
      const r = await fetch(`${API}/api/production/${detail.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume', clearLogs: true })
      })
      if (r.ok) {
        showToast('已触发断点续跑', 'success')
        loadDetail(detail.taskId)
      } else {
        showToast('续跑失败', 'error')
      }
    } catch { showToast('网络错误', 'error') }
    finally { setResuming(false) }
  }

  if (selected && detail) {
    const prog = detail.progress || { done: 0, total: 0 }
    const pct = prog.total > 0 ? (prog.done / prog.total * 100) : 0
    return (
      <>
        <div className="review-header">
          <div className="header-top">
            <span className="header-title" onClick={() => { setSelected(null); setDetail(null); setLogs([]) }}>← {detail.title}</span>
            <span style={{ color: statusColor(detail.status), fontWeight: 700, fontSize: 13 }}>{statusLabel(detail.status)}</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%', background: statusColor(detail.status) }} /></div>
        </div>
        <div className="cards-container">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <div><span style={{ color: 'var(--dim)', fontSize: 12 }}>进度</span><div style={{ fontSize: 24, fontWeight: 700 }}>{prog.done}/{prog.total}</div></div>
              {prog.failed > 0 && <div><span style={{ color: 'var(--dim)', fontSize: 12 }}>失败</span><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--reject)' }}>{prog.failed}</div></div>}
              {detail.duration && <div><span style={{ color: 'var(--dim)', fontSize: 12 }}>耗时</span><div style={{ fontSize: 14, fontWeight: 600 }}>{detail.duration}</div></div>}
              {detail.eta && <div><span style={{ color: 'var(--dim)', fontSize: 12 }}>预估</span><div style={{ fontSize: 14, fontWeight: 600 }}>{detail.eta}</div></div>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 12 }}>{detail.description}</div>
            {detail.tags && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {detail.tags.map(t => <span key={t} className="genre-tag">{t}</span>)}
            </div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {detail.resultUrl && <a href={detail.resultUrl} target="_blank" rel="noreferrer" className="pick-btn selected" style={{ textDecoration: 'none' }}> 查看结果</a>}
              {(detail.status === 'failed' || detail.status === 'cancelled' || detail.status === 'running') && (
                <button className="pick-btn" onClick={handleResume} disabled={resuming}>
                  {resuming ? '触发中...' : (detail.status === 'running' ? '🔄 重新触发' : '🔄 断点续跑')}
                </button>
              )}
            </div>
          </div>

          {/* Real-time Logs */}
          {logs.length > 0 && (
            <div className="card" style={{ padding: 0, marginTop: 16 }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}> 实时日志</span>
                <label style={{ fontSize: 11, color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} /> 自动滚动
                </label>
              </div>
              <pre style={{ padding: 16, fontSize: 11, color: 'var(--dim)', maxHeight: 400, overflow: 'auto', background: 'var(--row)', margin: 0, borderRadius: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {logs.map((line, i) => {
                  let color = 'inherit'
                  if (line.includes('✓') || line.includes('Done')) color = 'var(--pick)'
                  if (line.includes('✗') || line.includes('ERR') || line.includes('failed')) color = 'var(--reject)'
                  if (line.includes('ETA') || line.includes('Progress')) color = 'var(--accent)'
                  return <div key={i} style={{ color, lineHeight: 1.6 }}>{line}</div>
                })}
                <div ref={logEndRef} />
              </pre>
            </div>
          )}
        </div>
      </>
    )
  }

  const running = tasks.filter(t => t.status === 'running')
  const completed = tasks.filter(t => t.status === 'completed')
  const failed = tasks.filter(t => t.status === 'failed')
  const other = tasks.filter(t => !['running', 'completed', 'failed'].includes(t.status))

  const renderTask = t => {
    const prog = t.progress || { done: 0, total: 0 }
    const pct = prog.total > 0 ? (prog.done / prog.total * 100) : 0
    return (
      <div key={t.taskId} className="task-card" onClick={() => setSelected(t.taskId)}>
        <h3>{typeIcon(t.type)} {t.title}</h3>
        <div className="desc">{t.description || ''}</div>
        <div className="progress-bar" style={{ marginBottom: 8 }}><div className="progress-fill" style={{ width: pct + '%', background: statusColor(t.status) }} /></div>
        <div className="meta-row">
          <span style={{ color: statusColor(t.status), fontWeight: 600 }}>{statusLabel(t.status)}</span>
          <span>{prog.done}/{prog.total}</span>
          {t.created && <span>{new Date(t.created).toLocaleDateString('zh-CN')}</span>}
          {t.tags && t.tags.slice(0, 3).map(tag => <span key={tag} className="genre-tag">{tag}</span>)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="user-bar">
        <span>
          <span className="header-title" onClick={onBack}>← 返回</span>
          <span className="user-badge" style={{ marginLeft: 12 }}>👤 {user}</span>
        </span>
      </div>
      <div className="task-list">
        <h1>🚀 生产任务中心</h1>
        <div className="sub">批量生成任务的进度、日志和结果</div>
        {running.length > 0 && <><div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, margin: '16px 0 8px' }}>运行中</div>{running.map(renderTask)}</>}
        {other.length > 0 && <><div style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 600, margin: '16px 0 8px' }}>排队中</div>{other.map(renderTask)}</>}
        {failed.length > 0 && <><div style={{ fontSize: 12, color: 'var(--reject)', fontWeight: 600, margin: '16px 0 8px' }}>失败</div>{failed.map(renderTask)}</>}
        {completed.length > 0 && <><div style={{ fontSize: 12, color: 'var(--pick)', fontWeight: 600, margin: '16px 0 8px' }}>已完成</div>{completed.map(renderTask)}</>}
        {tasks.length === 0 && <div className="empty">暂无生产任务</div>}
      </div>
    </>
  )
}

// ========== DASHBOARD (Admin only) ==========
function DashboardPage({ user, taskId, onBack }) {
  const [task, setTask] = useState(null)
  const [summary, setSummary] = useState({})
  const [users, setUsers] = useState([])
  const [expandedSections, setExpandedSections] = useState({ scenes: false, reviewers: false })
  const [radarVisible, setRadarVisible] = useState({}) // modelKey → boolean, default all visible

  useEffect(() => {
    async function load() {
      const [taskRes, summaryRes, usersRes] = await Promise.all([
        fetch(`${API}/api/tasks/${taskId}`).then(r => r.json()),
        fetch(`${API}/api/tasks/${taskId}/summary`).then(r => r.json()),
        fetch(`${API}/api/tasks/${taskId}/users`).then(r => r.json()),
      ])
      setTask(taskRes)
      setSummary(summaryRes.summary || {})
      setUsers(Array.isArray(usersRes) ? usersRes : [])
    }
    load()
    const iv = setInterval(load, 10000)
    return () => clearInterval(iv)
  }, [taskId])

  if (!task) return <div className="empty">加载中...</div>

  const items = task.items || []
  const options = task.options || []
  const negativeOptions = options.filter(o => o.negative).map(o => o.id)
  const positiveOptions = options.filter(o => !o.negative)
  const vLabel = v => { const opt = options.find(o => o.id === v); return opt ? opt.label : v }
  const totalVoters = users.length

  // Per-item stats
  const itemStats = items.map(item => {
    const s = summary[item.id] || { picks: {}, notes: [] }
    const votes = {}
    let totalVotes = 0
    options.forEach(o => {
      const count = (s.picks[o.id] || []).length
      votes[o.id] = count
      totalVotes += count
    })
    return { item, votes, totalVotes, notes: s.notes || [], picks: s.picks || {} }
  })

  // Global stats
  const totalItems = items.length
  const completedItems = itemStats.filter(s => s.totalVotes > 0).length
  const totalAllVotes = itemStats.reduce((s, x) => s + x.totalVotes, 0)
  const noneVotes = itemStats.reduce((s, x) => negativeOptions.reduce((a, n) => a + (x.votes[n] || 0), 0) + s, 0)

  // Build model-level aggregation from _source filenames
  // Convention: filename = {group}{modelId}.mp4, e.g. q1.mp4 → group "q", model "1"
  // Same modelId across groups = same model (q1 + a1 = model "1")
  // For richer names like "sora_scene01.mp4": extract trailing number as model key
  const modelAgg = {} // modelKey → { totalVotes, wins, scenes, sources[] }
  itemStats.forEach(({ item, votes }) => {
    const videos = (item.assets || []).filter(a => a.type === 'video')
    let winnerOpt = null, winnerVotes = 0
    positiveOptions.forEach(o => {
      if (votes[o.id] > winnerVotes) { winnerVotes = votes[o.id]; winnerOpt = o.id }
    })

    videos.forEach((v, i) => {
      const optId = `video_${String.fromCharCode(65 + i)}`
      const source = v._source || v.url?.split('/').pop() || ''
      const bare = source.replace(/\.(mp4|webm|mov|avi|mkv)$/i, '')
      // Extract model key: trailing digits = model id (q1→"1", sora_scene01→"01", modelA_v2→"2")
      const numMatch = bare.match(/(\d+)$/)
      const modelKey = numMatch ? numMatch[1] : bare
      if (!modelAgg[modelKey]) modelAgg[modelKey] = { totalVotes: 0, wins: 0, scenes: 0, sources: [] }
      modelAgg[modelKey].totalVotes += (votes[optId] || 0)
      modelAgg[modelKey].scenes++
      if (!modelAgg[modelKey].sources.includes(source)) modelAgg[modelKey].sources.push(source)
      if (optId === winnerOpt && winnerVotes > 0) modelAgg[modelKey].wins++
    })
  })

  const modelRanking = Object.entries(modelAgg)
    .map(([key, data]) => ({ key, ...data, winRate: data.scenes > 0 ? (data.wins / data.scenes * 100) : 0 }))
    .sort((a, b) => b.wins - a.wins || b.totalVotes - a.totalVotes)

  // Consensus: how many items have >70% agreement
  const consensusItems = itemStats.filter(s => {
    if (s.totalVotes < 2) return false
    return positiveOptions.some(o => (s.votes[o.id] || 0) / s.totalVotes >= 0.7)
  }).length
  const splitItems = itemStats.filter(s => {
    if (s.totalVotes < 2) return false
    return !positiveOptions.some(o => (s.votes[o.id] || 0) / s.totalVotes >= 0.5)
  }).length

  // === Generate narrative summary ===
  const narrative = []
  // Status
  if (totalAllVotes === 0) {
    narrative.push({ type: 'status', text: `评审尚未开始，共 ${totalItems} 个场景待评审。` })
  } else if (completedItems < totalItems) {
    narrative.push({ type: 'status', text: `评审进行中：${totalVoters} 人参与，已完成 ${completedItems}/${totalItems} 个场景，累计 ${totalAllVotes} 票。` })
  } else {
    narrative.push({ type: 'status', text: `评审已完成：${totalVoters} 人参与，${totalItems} 个场景全部完成，累计 ${totalAllVotes} 票。` })
  }
  // Winner
  if (modelRanking.length > 0 && modelRanking[0].wins > 0) {
    const top = modelRanking[0]
    const dominance = top.winRate >= 80 ? '表现碾压级领先' : top.winRate >= 60 ? '表现明显领先' : '表现略有优势'
    narrative.push({ type: 'winner', text: `模型 ${top.key} ${dominance}，${top.scenes} 个场景中胜出 ${top.wins} 场（胜率 ${top.winRate.toFixed(0)}%），累计 ${top.totalVotes} 票。` })
  }
  // Competition
  if (modelRanking.length >= 2 && modelRanking[0].wins > 0 && modelRanking[1].wins > 0) {
    const [m1, m2] = modelRanking
    if (m1.wins - m2.wins <= 1) {
      narrative.push({ type: 'competition', text: `模型 ${m1.key} 与模型 ${m2.key} 竞争胶着，胜场仅差 ${m1.wins - m2.wins} 场，尚无法下定论。` })
    }
  }
  // Consensus
  if (consensusItems > 0 && totalAllVotes > 0) {
    narrative.push({ type: 'consensus', text: `${consensusItems}/${totalItems} 个场景评审高度一致（≥70% 投同一选项），结果可信度高。` })
  }
  if (splitItems > 0) {
    narrative.push({ type: 'split', text: `${splitItems} 个场景存在意见分歧（无选项过半），建议增加评审人数或讨论后重评。` })
  }
  // Unanimous scenes
  const unanimousScenes = itemStats.filter(s => {
    if (s.totalVotes < 2) return false
    return positiveOptions.some(o => (s.votes[o.id] || 0) === s.totalVotes)
  })
  if (unanimousScenes.length > 0) {
    narrative.push({ type: 'unanimous', text: `${unanimousScenes.length} 个场景全票通过（所有人选了同一个），信号强烈。` })
  }
  // Comments
  const totalNotes = itemStats.reduce((s, x) => s + x.notes.length, 0)
  const noteCoverage = totalAllVotes > 0 ? (totalNotes / totalAllVotes * 100) : 0
  if (totalAllVotes > 0) {
    narrative.push({ type: 'comments', text: `评论覆盖率 ${noteCoverage.toFixed(0)}%（${totalNotes}/${totalAllVotes} 票附带评论）。${noteCoverage >= 80 ? '评论充分，可支撑深度分析。' : '部分投票未附评论，建议提醒评审人补充。'}` })
  }
  // Participation
  if (totalVoters > 0 && totalVoters < 3) {
    narrative.push({ type: 'participation', text: `当前仅 ${totalVoters} 人参与，建议邀请更多评审人以提高结果可信度。` })
  }

  const toggleSection = key => setExpandedSections(p => ({ ...p, [key]: !p[key] }))

  return (
    <>
      <div className="dash-header">
        <span className="header-title" onClick={onBack}>← 返回</span>
        <h1 className="dash-title">📊 {task.title} — 评审报告</h1>
        <span className="user-badge">👤 {user}</span>
      </div>

      <div className="dash-container">
        {/* === 1. Narrative Summary (FIRST) === */}
        <div className="dash-narrative">
          <h2>📋 评审总结</h2>
          <div className="dash-narrative-body">
            {narrative.map((n, i) => (
              <div key={i} className={`dash-narrative-line ${n.type}`}>
                {n.type === 'status' && '📊 '}
                {n.type === 'winner' && '🏆 '}
                {n.type === 'competition' && '⚔️ '}
                {n.type === 'consensus' && '✅ '}
                {n.type === 'split' && '⚠️ '}
                {n.type === 'unanimous' && '🎯 '}
                {n.type === 'comments' && '💬 '}
                {n.type === 'participation' && '📢 '}
                {n.text}
              </div>
            ))}
          </div>
          <div className="dash-participants-inline">
            <span className="dash-p-label">评审人：</span>
            {users.map(u => (
              <span key={u.name} className="dash-p-tag">👤 {u.name} <b>{u.count}票</b></span>
            ))}
            {users.length === 0 && <span className="dash-p-tag">暂无</span>}
          </div>
        </div>

        {/* === 2. Visual Charts === */}
        {modelRanking.length > 0 && totalAllVotes > 0 && (() => {
          const chartColors = ['#6b8f71', '#a8917a', '#c4877a', '#7a9cc4', '#c4b87a', '#8f6b8f']
          const totalModelVotes = modelRanking.reduce((s, m) => s + m.totalVotes, 0)

          // Donut chart SVG data
          const donutSize = 180, donutR = 70, donutStroke = 28
          let donutOffset = 0
          const donutCirc = 2 * Math.PI * donutR
          const donutSegments = modelRanking.map((m, i) => {
            const pct = totalModelVotes > 0 ? m.totalVotes / totalModelVotes : 0
            const dashLen = pct * donutCirc
            const seg = { m, pct, dashLen, offset: donutOffset, color: chartColors[i % chartColors.length] }
            donutOffset += dashLen
            return seg
          })

          return (
          <>
            <div className="chart-grid">
              {/* Bar chart: win rate */}
              <div className="chart-card">
                <h3>模型胜率排名</h3>
                <div className="chart-bars">
                  {modelRanking.map((m, i) => (
                    <div key={m.key} className="chart-bar-row">
                      <div className="chart-bar-name">模型 {m.key}</div>
                      <div className="chart-bar-track">
                        <div className="chart-bar-fill" style={{ width: `${m.winRate}%`, background: chartColors[i % chartColors.length] }}>
                          {m.winRate >= 15 && <span className="chart-bar-pct">{m.winRate.toFixed(0)}%</span>}
                        </div>
                        {m.winRate < 15 && <span className="chart-bar-pct-out">{m.winRate.toFixed(0)}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donut chart: vote share */}
              <div className="chart-card">
                <h3>得票占比</h3>
                <div className="chart-donut-wrap">
                  <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
                    {donutSegments.map((seg, i) => (
                      <circle key={i} cx={donutSize/2} cy={donutSize/2} r={donutR}
                        fill="none" stroke={seg.color} strokeWidth={donutStroke}
                        strokeDasharray={`${seg.dashLen} ${donutCirc - seg.dashLen}`}
                        strokeDashoffset={-seg.offset}
                        transform={`rotate(-90 ${donutSize/2} ${donutSize/2})`}
                        style={{ transition: 'stroke-dasharray .5s, stroke-dashoffset .5s' }}
                      />
                    ))}
                    <text x={donutSize/2} y={donutSize/2 - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--text)">{totalModelVotes}</text>
                    <text x={donutSize/2} y={donutSize/2 + 14} textAnchor="middle" fontSize="11" fill="var(--dim)">总票数</text>
                  </svg>
                  <div className="chart-donut-legend">
                    {donutSegments.map((seg, i) => (
                      <div key={i} className="chart-legend-item">
                        <span className="chart-legend-dot" style={{ background: seg.color }} />
                        <span>模型 {seg.m.key}</span>
                        <b>{(seg.pct * 100).toFixed(0)}%</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Score overview cards */}
            <div className="chart-scores">
              {modelRanking.map((m, i) => {
                const votePct = totalModelVotes > 0 ? (m.totalVotes / totalModelVotes * 100) : 0
                return (
                  <div key={m.key} className="chart-score-card" style={{ borderTopColor: chartColors[i % chartColors.length] }}>
                    <div className="chart-score-pct" style={{ color: chartColors[i % chartColors.length] }}>{votePct.toFixed(0)}%</div>
                    <div className="chart-score-name">模型 {m.key}</div>
                    <div className="chart-score-detail">{m.totalVotes} 票 / {m.scenes} 场景 · 胜{m.wins}场</div>
                  </div>
                )
              })}
            </div>
            {/* Radar chart: model performance by category/theme */}
            {(() => {
              // Fixed 10 category dimensions
              const allDimensions = ['短剧', '漫剧', '动漫游戏', '广告', '影视风格', '视觉艺术', '短视频', '玩法类', '微表情', '音频']
              // Collect themes that have data
              const dataThemes = new Set(items.map(i => i.meta?.theme).filter(Boolean))
              const themes = allDimensions // Always show all 10 axes
              if (themes.length < 2) return null

              // Per model × theme: win rate (votes won / total votes in that theme)
              const modelKeys = modelRanking.map(m => m.key)
              const radarData = {} // modelKey → { theme → score 0-100 }
              modelKeys.forEach(mk => { radarData[mk] = {} })

              themes.forEach(theme => {
                const themeItems = itemStats.filter(({ item }) => (item.meta?.theme || '未分类') === theme)
                modelKeys.forEach(mk => {
                  let modelVotes = 0, themeTotal = 0
                  themeItems.forEach(({ item, votes }) => {
                    const videos = (item.assets || []).filter(a => a.type === 'video')
                    videos.forEach((v, vi) => {
                      const optId = `video_${String.fromCharCode(65 + vi)}`
                      const src = v._source || ''
                      const bare = src.replace(/\.(mp4|webm|mov|avi|mkv)$/i, '')
                      const num = bare.match(/(\d+)$/)
                      const mid = num ? num[1] : bare
                      const voteCount = votes[optId] || 0
                      themeTotal += voteCount
                      if (mid === mk) modelVotes += voteCount
                    })
                  })
                  radarData[mk][theme] = themeTotal > 0 ? (modelVotes / themeTotal * 100) : 0
                })
              })

              // SVG radar — larger for 10 dimensions
              const radarSize = 400, cx = radarSize / 2, cy = radarSize / 2, maxR = 150
              const n = themes.length
              const angleStep = (2 * Math.PI) / n
              const getPoint = (i, r) => ({
                x: cx + r * Math.sin(i * angleStep),
                y: cy - r * Math.cos(i * angleStep)
              })

              // Grid rings
              const rings = [25, 50, 75, 100]

              return (
                <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                  <h3>模型垂类表现雷达图</h3>
                  <div className="chart-radar-wrap">
                    <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
                      {/* Grid rings */}
                      {rings.map(r => {
                        const pts = themes.map((_, i) => getPoint(i, maxR * r / 100))
                        return <polygon key={r} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none" stroke="var(--border)" strokeWidth="1" />
                      })}
                      {/* Scale labels on first axis */}
                      {rings.map(r => {
                        const p = getPoint(0, maxR * r / 100)
                        return <text key={`sc${r}`} x={p.x + 6} y={p.y + 3}
                          fontSize="9" fill="var(--dim)" textAnchor="start">{r}</text>
                      })}
                      {/* Axis lines */}
                      {themes.map((_, i) => {
                        const p = getPoint(i, maxR)
                        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="1" />
                      })}
                      {/* Model polygons — filtered by radarVisible */}
                      {modelKeys.map((mk, mi) => {
                        const isVisible = radarVisible[mk] !== false // default visible
                        if (!isVisible) return null
                        const pts = themes.map((t, i) => getPoint(i, maxR * (radarData[mk][t] || 0) / 100))
                        const color = chartColors[mi % chartColors.length]
                        return (
                          <g key={mk}>
                            <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                              fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
                            {pts.map((p, pi) => (
                              <circle key={pi} cx={p.x} cy={p.y} r="4" fill={color} />
                            ))}
                          </g>
                        )
                      })}
                      {/* Score labels on each axis for visible models */}
                      {modelKeys.filter(mk => radarVisible[mk] !== false).length === 1 && (() => {
                        const mk = modelKeys.find(k => radarVisible[k] !== false)
                        const mi = modelKeys.indexOf(mk)
                        const color = chartColors[mi % chartColors.length]
                        return themes.map((t, i) => {
                          const score = radarData[mk][t] || 0
                          if (score === 0) return null
                          const p = getPoint(i, maxR * score / 100)
                          return <text key={`s${i}`} x={p.x} y={p.y - 10} textAnchor="middle"
                            fontSize="10" fontWeight="700" fill={color}>{score.toFixed(0)}%</text>
                        })
                      })()}
                      {/* Axis labels — highlight dimensions with data */}
                      {themes.map((t, i) => {
                        const p = getPoint(i, maxR + 24)
                        const hasData = dataThemes.has(t)
                        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                          fontSize="12" fontWeight={hasData ? '700' : '400'} fill={hasData ? 'var(--text)' : 'var(--dim)'}>{t}</text>
                      })}
                    </svg>
                    <div className="chart-radar-legend">
                      {modelKeys.map((mk, mi) => {
                        const isVisible = radarVisible[mk] !== false
                        return (
                          <div key={mk}
                            className={`chart-legend-item clickable ${isVisible ? '' : 'hidden'}`}
                            onClick={() => setRadarVisible(p => ({ ...p, [mk]: !isVisible }))}>
                            <span className="chart-legend-dot" style={{ background: isVisible ? chartColors[mi % chartColors.length] : 'var(--border)' }} />
                            <span style={{ opacity: isVisible ? 1 : 0.4 }}>模型 {mk}</span>
                          </div>
                        )
                      })}
                      <div className="chart-radar-actions">
                        <span className="chart-radar-btn" onClick={() => {
                          const all = {}; modelKeys.forEach(k => { all[k] = true }); setRadarVisible(all)
                        }}>全选</span>
                        <span className="chart-radar-btn" onClick={() => {
                          const none = {}; modelKeys.forEach(k => { none[k] = false }); setRadarVisible(none)
                        }}>清空</span>
                      </div>
                      <div className="chart-radar-hint">点击模型名筛选 · 各维度为该垂类下的得票占比</div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </>
          )
        })()}

        {/* === 3. Per-reviewer breakdown (collapsible) === */}
        {users.length > 0 && (
          <div className="dash-section dash-collapsible">
            <h2 className="dash-collapse-toggle" onClick={() => toggleSection('reviewers')}>
              {expandedSections.reviewers ? '▼' : '▶'} 👥 评审人明细（{users.length} 人）
            </h2>
            {expandedSections.reviewers && <div className="dash-reviewer-list">
              {users.map(u => {
                // Gather this user's picks + notes across all items
                const userPicks = []
                itemStats.forEach(({ item }) => {
                  const s = summary[item.id] || { picks: {}, notes: [] }
                  // Find what this user picked
                  let userPick = null
                  for (const [optId, voters] of Object.entries(s.picks || {})) {
                    if (voters.includes(u.name)) { userPick = optId; break }
                  }
                  // Find this user's note
                  const userNote = (s.notes || []).find(n => n.user === u.name)

                  if (userPick || userNote) {
                    // Get source for video tasks
                    const videos = (item.assets || []).filter(a => a.type === 'video')
                    let sourceFile = ''
                    if (userPick && videos.length > 0) {
                      const idx = userPick.charCodeAt(userPick.length - 1) - 65
                      if (idx >= 0 && idx < videos.length) {
                        sourceFile = videos[idx]._source || ''
                      }
                    }
                    userPicks.push({
                      itemId: item.id,
                      itemTitle: item.title,
                      pick: userPick,
                      pickLabel: userPick ? vLabel(userPick) : '',
                      sourceFile,
                      note: userNote?.note || ''
                    })
                  }
                })

                return (
                  <div key={u.name} className="dash-reviewer-card">
                    <div className="dash-reviewer-header">
                      <span className="user-badge" style={{ fontSize: 12, padding: '3px 12px' }}>👤 {u.name}</span>
                      <span className="dash-reviewer-stat">{u.count} 票 / {items.length} 场景</span>
                    </div>
                    <table className="dash-reviewer-table">
                      <thead>
                        <tr>
                          <th>场景</th>
                          <th>选择</th>
                          <th>模型</th>
                          <th>评论</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userPicks.map(p => (
                          <tr key={p.itemId}>
                            <td className="rv-scene">#{pad(parseInt(p.itemId) || 0)} {p.itemTitle}</td>
                            <td className="rv-pick">{p.pickLabel || '—'}</td>
                            <td className="rv-source">{p.sourceFile || '—'}</td>
                            <td className="rv-note">{p.note || <span className="rv-empty">无评论</span>}</td>
                          </tr>
                        ))}
                        {userPicks.length === 0 && (
                          <tr><td colSpan={4} className="rv-empty">暂无投票</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>}
          </div>
        )}

        {/* === 4. Scene results — video cards sorted by votes === */}
        {totalAllVotes > 0 && (() => {
          // Sort scenes: most consensus first (highest top-vote percentage)
          const sortedStats = [...itemStats]
            .filter(s => s.totalVotes > 0)
            .sort((a, b) => {
              const aMax = Math.max(...positiveOptions.map(o => a.votes[o.id] || 0))
              const bMax = Math.max(...positiveOptions.map(o => b.votes[o.id] || 0))
              return bMax - aMax
            })

          return sortedStats.map(({ item, votes, totalVotes: tv, notes, picks }) => {
            const videos = (item.assets || []).filter(a => a.type === 'video')
            // Build per-video data sorted by votes desc
            const videoCards = videos.map((v, i) => {
              const optId = `video_${String.fromCharCode(65 + i)}`
              const count = votes[optId] || 0
              const pct = tv > 0 ? (count / tv * 100) : 0
              const source = v._source || v.url?.split('/').pop() || ''
              const bare = source.replace(/\.(mp4|webm|mov|avi|mkv)$/i, '')
              const numMatch = bare.match(/(\d+)$/)
              const modelId = numMatch ? numMatch[1] : bare
              const voters = picks[optId] || []
              // Find comments from voters who picked this video
              const voterNotes = (notes || []).filter(n => voters.includes(n.user) && n.note)
              return { optId, label: v.label || `视频${String.fromCharCode(65 + i)}`, count, pct, source, modelId, voters, voterNotes, url: v.url }
            }).sort((a, b) => b.count - a.count)

            const winner = videoCards[0]?.count > 0 ? videoCards[0] : null

            return (
              <div key={item.id} className="dash-scene-card">
                <div className="dash-scene-header">
                  <div className="dash-scene-title">#{pad(parseInt(item.id) || 0)} {item.title}</div>
                  {winner && <span className="dash-winner">🏆 模型 {winner.modelId}（{winner.count}票 · {winner.pct.toFixed(0)}%）</span>}
                  <span className="dash-scene-meta">{tv} 票</span>
                </div>
                {item.text?.prompt && item.text.prompt !== '（待填写 prompt）' && (
                  <div className="dash-prompt">{item.text.prompt}</div>
                )}
                <div className="dash-video-cards">
                  {videoCards.map((vc, vi) => {
                    const isWinner = vi === 0 && vc.count > 0
                    return (
                      <div key={vc.optId} className={`dash-vcard ${isWinner ? 'winner' : ''} ${vc.count === 0 ? 'zero' : ''}`}>
                        {/* Rank badge */}
                        <div className="dash-vcard-rank">
                          {vi === 0 && vc.count > 0 ? '🥇' : vi === 1 ? '🥈' : vi === 2 ? '🥉' : ''}
                        </div>
                        {/* Video player */}
                        <video controls preload="metadata" playsInline className="dash-vcard-video">
                          <source src={vc.url} type="video/mp4" />
                        </video>
                        {/* Model + votes */}
                        <div className="dash-vcard-info">
                          <div className="dash-vcard-model">模型 {vc.modelId}</div>
                          <div className="dash-vcard-source">{vc.source}</div>
                          <div className="dash-vcard-votes">
                            <div className="dash-vcard-bar">
                              <div className={`dash-vcard-fill ${isWinner ? 'winner' : ''}`} style={{ width: `${vc.pct}%` }} />
                            </div>
                            <span className="dash-vcard-count">{vc.count} 票（{vc.pct.toFixed(0)}%）</span>
                          </div>
                          {vc.voters.length > 0 && (
                            <div className="dash-vcard-voters">
                              {vc.voters.map(u => <span key={u} className="dash-voter-chip">{u}</span>)}
                            </div>
                          )}
                        </div>
                        {/* Comments from voters who picked this */}
                        {vc.voterNotes.length > 0 && (
                          <div className="dash-vcard-comments">
                            {vc.voterNotes.map((n, ni) => (
                              <div key={ni} className="dash-vcard-comment">
                                <span className="dash-comment-user">{n.user}:</span> {n.note}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        })()}
      </div>
    </>
  )
}

// ========== Hash Router ==========
function parseHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (!h) return { view: 'tasks', taskId: null }
  const parts = h.split('/')
  if (parts[0] === 'review' && parts[1]) return { view: 'review', taskId: parts[1] }
  if (parts[0] === 'dashboard' && parts[1]) return { view: 'dashboard', taskId: parts[1] }
  if (parts[0] === 'production') return { view: 'production', taskId: null }
  return { view: 'tasks', taskId: null }
}

function navigate(view, taskId) {
  if (view === 'review' && taskId) window.location.hash = `#/review/${taskId}`
  else if (view === 'dashboard' && taskId) window.location.hash = `#/dashboard/${taskId}`
  else if (view === 'production') window.location.hash = '#/production'
  else window.location.hash = '#/tasks'
}

export default function App() {
  const [view, setView] = useState('login') // login | tasks | review | production | dashboard
  const [user, setUser] = useState('')
  const [token, setToken] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [tasks, setTasks] = useState([])
  const [activeTask, setActiveTask] = useState(null)
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((msg, type = 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  async function loadTasks() {
    try {
      const r = await fetch(`${API}/api/tasks`).then(r => r.json())
      setTasks(r.tasks || [])
    } catch {}
  }

  async function doLogin(name) {
    if (!name || !/^[\u4e00-\u9fffa-zA-Z0-9_-]{1,20}$/.test(name)) {
      setLoginErr('只允许中英文/数字，1-20字'); return
    }
    try {
      const tasksRes = await fetch(`${API}/api/tasks`).then(r => r.json())
      const taskList = tasksRes.tasks || []
      setTasks(taskList)
      if (taskList.length > 0) {
        const savedToken = localStorage.getItem('reviewhub_token_' + name) || ''
        const r = await fetch(`${API}/api/tasks/${taskList[0].id}/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: name, token: savedToken })
        })
        const d = await r.json()
        if (!r.ok) { setLoginErr(d.error || '登录失败'); return }
        setToken(d.token)
        localStorage.setItem('reviewhub_token_' + name, d.token)
      }
      setUser(name)
      localStorage.setItem('reviewhub_user', name)
      // Restore hash route or go to tasks
      const { view: hView, taskId } = parseHash()
      if (hView === 'review' && taskId) { setActiveTask(taskId); setView('review') }
      else if (hView === 'dashboard' && taskId) { setActiveTask(taskId); setView('dashboard') }
      else if (hView === 'production') { setView('production') }
      else { setView('tasks'); navigate('tasks') }
      setLoginErr('')
    } catch { setLoginErr('网络错误') }
  }

  function doLogout() {
    localStorage.removeItem('reviewhub_user')
    setUser(''); setToken(''); setView('login'); setActiveTask(null)
    window.location.hash = ''
  }

  function selectTask(taskId) {
    setActiveTask(taskId)
    setView('review')
    navigate('review', taskId)
    const savedToken = localStorage.getItem('reviewhub_token_' + user) || token
    fetch(`${API}/api/tasks/${taskId}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, token: savedToken })
    }).then(r => r.json()).then(d => {
      if (d.token) { setToken(d.token); localStorage.setItem('reviewhub_token_' + user, d.token) }
    }).catch(() => {})
  }

  // Listen for browser back/forward
  useEffect(() => {
    function onHashChange() {
      const { view: hView, taskId } = parseHash()
      if (hView === 'review' && taskId) { setActiveTask(taskId); setView('review') }
      else if (hView === 'dashboard' && taskId) { setActiveTask(taskId); setView('dashboard') }
      else if (hView === 'production') { setActiveTask(null); setView('production') }
      else { setActiveTask(null); setView('tasks') }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Init: restore session
  useEffect(() => {
    const urlUser = new URLSearchParams(window.location.search).get('user')
    if (urlUser) { doLogin(urlUser); return }
    const saved = localStorage.getItem('reviewhub_user')
    if (saved) {
      const savedToken = localStorage.getItem('reviewhub_token_' + saved)
      if (savedToken) {
        setUser(saved); setToken(savedToken); loadTasks()
        // Restore hash route
        const { view: hView, taskId } = parseHash()
        if (hView === 'review' && taskId) { setActiveTask(taskId); setView('review') }
        else if (hView === 'dashboard' && taskId) { setActiveTask(taskId); setView('dashboard') }
        else if (hView === 'production') { setView('production') }
        else { setView('tasks') }
      }
    }
  }, [])

  return (
    <>
      {view === 'login' && <LoginPage onLogin={doLogin} error={loginErr} />}
      {view === 'tasks' && <TaskListPage user={user} tasks={tasks} onSelect={selectTask} onLogout={doLogout}
        onProduction={() => { setView('production'); navigate('production') }}
        onDashboard={id => { setActiveTask(id); setView('dashboard'); navigate('dashboard', id) }} />}
      {view === 'review' && activeTask && (
        <ReviewPage user={user} token={token} taskId={activeTask}
          onBack={() => { setActiveTask(null); loadTasks(); navigate('tasks') }}
          showToast={showToast} />
      )}
      {view === 'production' && <ProductionPage user={user} onBack={() => { loadTasks(); navigate('tasks') }} showToast={showToast} />}
      {view === 'dashboard' && activeTask && (
        <DashboardPage user={user} taskId={activeTask}
          onBack={() => { setActiveTask(null); loadTasks(); navigate('tasks') }} />
      )}
      <Toast toasts={toasts} />
    </>
  )
}
