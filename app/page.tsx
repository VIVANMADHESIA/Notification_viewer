'use client'

import { useMemo, useState } from 'react'

type Channel = 'whatsapp' | 'email' | 'push'
type Template = { subject?: string; body: string; enabled: boolean; updated: string }
type Trigger = { id: string; name: string; description: string; templates: Record<Channel, Template> }

const channelMeta: Record<Channel, { label: string; icon: string; tone: string; detail: string }> = {
  whatsapp: { label: 'WhatsApp', icon: 'WA', tone: 'green', detail: 'WhatsApp Cloud API' },
  email: { label: 'Email', icon: '✉', tone: 'blue', detail: 'Postmark sandbox' },
  push: { label: 'Web Push', icon: '⌁', tone: 'purple', detail: 'Browser notification' },
}

const initialTriggers: Trigger[] = [
  {
    id: 'login', name: 'Login', description: 'User signs in on the website',
    templates: {
      whatsapp: { body: 'Welcome back, {{first_name}}. You are signed in.', enabled: true, updated: '2 min ago' },
      email: { subject: 'You logged in successfully', body: 'Hi {{first_name}},\n\nYour account was just accessed successfully.', enabled: true, updated: '2 min ago' },
      push: { body: 'Welcome back, {{first_name}}.', enabled: true, updated: '2 min ago' },
    },
  },
  {
    id: 'logout', name: 'Logout', description: 'User signs out on the website',
    templates: {
      whatsapp: { body: 'You have been safely signed out.', enabled: true, updated: 'Yesterday' },
      email: { subject: 'You have been signed out', body: 'Your session has ended. See you next time.', enabled: true, updated: 'Yesterday' },
      push: { body: 'You are signed out. See you soon.', enabled: false, updated: 'Yesterday' },
    },
  },
  {
    id: 'inactive-week', name: 'Not logged in for 1 week', description: 'User has not visited for 7 days',
    templates: {
      whatsapp: { body: 'We miss you, {{first_name}}. Come back and see what is new.', enabled: false, updated: 'Never' },
      email: { subject: "It's been a week", body: 'There is something new waiting for you.', enabled: false, updated: 'Never' },
      push: { body: 'Come visit us again.', enabled: false, updated: 'Never' },
    },
  },
]

export default function Page() {
  const [triggers, setTriggers] = useState(initialTriggers)
  const [activeNav, setActiveNav] = useState('Notifications')
  const [selectedCell, setSelectedCell] = useState<{ trigger: string; channel: Channel } | null>(null)
  const [draft, setDraft] = useState<Template | null>(null)
  const [notice, setNotice] = useState('')
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [simulated, setSimulated] = useState<string | null>(null)
  const [selectedTriggerId, setSelectedTriggerId] = useState('login')
  const [deliveryResult, setDeliveryResult] = useState<{ trigger: string; channel: string; status: 'success' | 'warning'; message: string; eventId: string; pulled: boolean; processed: boolean } | null>(null)

  const enabledCount = useMemo(() => triggers.flatMap(t => Object.values(t.templates)).filter(t => t.enabled).length, [triggers])

  function openEditor(triggerId: string, channel: Channel) {
    const trigger = triggers.find(item => item.id === triggerId)
    if (!trigger) return
    setSelectedCell({ trigger: triggerId, channel })
    setDraft({ ...trigger.templates[channel] })
  }

  function saveTemplate() {
    if (!selectedCell || !draft) return
    setTriggers(current => current.map(trigger => trigger.id === selectedCell.trigger ? {
      ...trigger, templates: { ...trigger.templates, [selectedCell.channel]: { ...draft, updated: 'Just now' } },
    } : trigger))
    setSelectedCell(null); setDraft(null); setNotice('Template saved successfully')
  }

  function toggleChannel(triggerId: string, channel: Channel) {
    setTriggers(current => current.map(trigger => trigger.id === triggerId ? {
      ...trigger, templates: { ...trigger.templates, [channel]: { ...trigger.templates[channel], enabled: !trigger.templates[channel].enabled } },
    } : trigger))
  }

  function executeTrigger(trigger: Trigger, channel: Channel) {
    const enabled = trigger.templates[channel].enabled
    setActiveNav('Delivery logs')
    setSimulated(trigger.id)
    const eventId = `evt_${Date.now().toString(36)}`
    setDeliveryResult({
      trigger: trigger.name,
      channel: channelMeta[channel].label,
      status: enabled ? 'success' : 'warning',
      message: enabled ? `${trigger.name} executed successfully. The ${channelMeta[channel].label} notification was pulled from the sandbox queue and processed.` : `${trigger.name} ran, but ${channelMeta[channel].label} is disabled for this trigger, so no notification was pulled.`,
      eventId,
      pulled: enabled,
      processed: enabled,
    })
    setNotice(enabled ? `${channelMeta[channel].label} notification pulled and processed` : `${trigger.name} completed with a disabled channel`)
    window.setTimeout(() => setSimulated(null), 1800)
  }

  function testSend(trigger: Trigger, channel: Channel) {
    executeTrigger(trigger, channel)
  }

  function fireSelectedEvent() {
    const trigger = triggers.find(item => item.id === selectedTriggerId)
    if (!trigger) return
    const firstEnabledChannel = (Object.keys(channelMeta) as Channel[]).find(channel => trigger.templates[channel].enabled) || 'email'
    executeTrigger(trigger, firstEnabledChannel)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">N</div><div><strong>notify<span>flow</span></strong><small>Admin console</small></div></div>
        <div className="workspace"><span className="workspace-dot">A</span><div><small>Workspace</small><strong>Acme Inc.</strong></div><span className="chevron">⌄</span></div>
        <p className="nav-label">Workspace</p>
        {['Overview', 'Notifications', 'Delivery logs'].map(item => <button key={item} className={`nav-item ${activeNav === item ? 'active' : ''}`} onClick={() => setActiveNav(item)}><span className="nav-icon">{item === 'Overview' ? '▦' : item === 'Notifications' ? '◉' : '≡'}</span>{item}{item === 'Notifications' && <span className="nav-count">3</span>}</button>)}
        <p className="nav-label">Configuration</p>
        {['Recipients', 'Integrations'].map(item => <button key={item} className={`nav-item ${activeNav === item ? 'active' : ''}`} onClick={() => setActiveNav(item)}><span className="nav-icon">{item === 'Recipients' ? '◎' : '⌘'}</span>{item}</button>)}
        <div className="sidebar-bottom"><button className="nav-item"><span className="nav-icon">?</span>Help center</button><button className="profile"><span className="avatar">JD</span><span><strong>Jordan Davis</strong><small>Administrator</small></span><span className="more">•••</span></button></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="crumbs">Workspace <span>/</span> <strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button" aria-label="Notifications">♢<i /></button><div className="top-avatar">JD</div></div></header>
        <div className="page-wrap">
          <div className="page-heading"><div><p className="eyebrow">NOTIFICATION CENTER</p><h1>Notifications</h1><p className="subtitle">Manage triggers, templates, and delivery channels from one place.</p></div><button className="primary-button" onClick={() => setNotice('New trigger flow started')}><span>＋</span> Add trigger</button></div>
          {notice && <div className="toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice('')}>×</button></div>}
          {deliveryResult && <section className={`delivery-response card ${deliveryResult.status}`} role="status" aria-live="polite"><div className="response-icon">{deliveryResult.status === 'success' ? '✓' : '!'}</div><div className="response-copy"><p className="eyebrow">DELIVERY LOG · SANDBOX</p><h2>{deliveryResult.status === 'success' ? 'Notification pulled successfully' : 'Trigger completed with a warning'}</h2><p>{deliveryResult.message}</p><div className="event-meta"><span><i className={deliveryResult.pulled ? 'complete' : ''} /> Pulled {deliveryResult.pulled ? 'successfully' : 'not pulled'}</span><span><i className={deliveryResult.processed ? 'complete' : ''} /> Processed {deliveryResult.processed ? 'successfully' : 'not processed'}</span><small>{deliveryResult.trigger} · {deliveryResult.channel} · {deliveryResult.eventId}</small></div></div><button className="outline-button" onClick={() => setDeliveryResult(null)}>Dismiss</button></section>}
          <div className="stats-grid"><div className="stat-card"><div className="stat-icon violet">◉</div><div><span>Active triggers</span><strong>2 <small>of 3</small></strong></div><em>+1 this month</em></div><div className="stat-card"><div className="stat-icon green">↗</div><div><span>Enabled channels</span><strong>{enabledCount} <small>of 9</small></strong></div><em>66.7% coverage</em></div><div className="stat-card"><div className="stat-icon amber">◷</div><div><span>Sent this month</span><strong>1,284</strong></div><em>+18.4% vs last month</em></div><div className="stat-card"><div className="stat-icon blue">✓</div><div><span>Delivery rate</span><strong>98.6%</strong></div><em>Across all channels</em></div></div>

          <section className="simulator card"><div className="section-title"><div><h2>Trigger simulator</h2><p>Fire an event to test your notification flows.</p></div><span className="live-pill"><i /> Sandbox mode</span></div><div className="simulator-row"><div className="select-wrap"><label htmlFor="trigger">Select a trigger</label><select id="trigger" value={selectedTriggerId} onChange={e => setSelectedTriggerId(e.target.value)}>{triggers.map(trigger => <option key={trigger.id} value={trigger.id}>{trigger.name}</option>)}</select></div><button className="secondary-button" onClick={fireSelectedEvent}>▶ Fire event</button><div className="simulator-result">{simulated ? <><span className="pulse-dot" /> Sending {triggers.find(t => t.id === simulated)?.name} notifications...</> : <><span className="check-circle">✓</span> Last event: Login · 2 min ago</>}</div></div></section>

          <section className="matrix-section"><div className="section-title"><div><h2>Notification templates</h2><p>Each trigger can send a different message on every channel.</p></div><button className="filter-button">All triggers <span>⌄</span></button></div><div className="table-wrap"><table><thead><tr><th className="trigger-col">TRIGGER</th>{(Object.keys(channelMeta) as Channel[]).map(channel => <th key={channel}><div className={`channel-heading ${channelMeta[channel].tone}`}><span>{channelMeta[channel].icon}</span>{channelMeta[channel].label}<small>{channelMeta[channel].detail}</small></div></th>)}<th className="row-actions"></th></tr></thead><tbody>{triggers.map(trigger => <tr key={trigger.id}><td className="trigger-cell"><strong>{trigger.name}</strong><span>{trigger.description}</span></td>{(Object.keys(channelMeta) as Channel[]).map(channel => { const template = trigger.templates[channel]; return <td key={channel}><div className={`template-card ${!template.enabled ? 'disabled' : ''}`}><div className="template-top"><span className={`status ${template.enabled ? 'on' : ''}`}><i />{template.enabled ? 'Active' : 'Off'}</span><button className="switch" aria-label={`Toggle ${channelMeta[channel].label} for ${trigger.name}`} onClick={() => toggleChannel(trigger.id, channel)}><span className={template.enabled ? 'on' : ''} /></button></div><p>{template.subject || template.body}</p><small className="updated">{template.updated}</small><div className="template-actions"><button onClick={() => openEditor(trigger.id, channel)}>{template.updated === 'Never' ? '＋ Create template' : 'Edit template'}</button><button onClick={() => testSend(trigger, channel)} disabled={template.updated === 'Never'}>Test send <span>↗</span></button></div></div></td>})}<td className="row-menu"><button aria-label={`More actions for ${trigger.name}`}>•••</button></td></tr>)}</tbody></table></div></section>

          <div className="bottom-grid"><section className="push-card card"><div className="section-title"><div><h2>Browser delivery</h2><p>Web Push is ready for this workspace.</p></div><span className="status on"><i /> Connected</span></div><div className="push-body"><div className="browser-icon">⌁</div><div><strong>Test browser subscription</strong><p>{pushSubscribed ? 'This browser is subscribed and ready for test notifications.' : 'Subscribe this browser to receive a real test notification.'}</p></div><button className={pushSubscribed ? 'outline-button' : 'secondary-button'} onClick={() => { setPushSubscribed(!pushSubscribed); setNotice(pushSubscribed ? 'Browser unsubscribed' : 'Browser subscribed successfully') }}>{pushSubscribed ? 'Subscribed' : 'Subscribe browser'}</button></div></section><section className="guide-card card"><div className="section-title"><div><h2>Assignment progress</h2><p>Follow the walkthrough before you record your demo.</p></div><span className="progress-label">4 / 6</span></div><div className="progress-track"><span /></div><div className="checklist"><label><input type="checkbox" defaultChecked /> Set up Login on all channels</label><label><input type="checkbox" defaultChecked /> Set up Logout on all channels</label><label><input type="checkbox" defaultChecked /> Edit a template and test again</label><label><input type="checkbox" defaultChecked /> Toggle a channel off and on</label><label><input type="checkbox" /> Configure sandbox credentials</label><label><input type="checkbox" /> Record narrated walkthrough</label></div></section></div>
          <footer><span>notifyflow admin console</span><span>Sandbox environment · No production credentials</span></footer>
        </div>
      </section>

      {draft && selectedCell && <div className="modal-backdrop" role="presentation" onMouseDown={() => { setDraft(null); setSelectedCell(null) }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={e => e.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">{channelMeta[selectedCell.channel].label} TEMPLATE</p><h2 id="modal-title">{triggers.find(t => t.id === selectedCell.trigger)?.name}</h2></div><button className="close-button" onClick={() => { setDraft(null); setSelectedCell(null) }}>×</button></div>{selectedCell.channel === 'email' && <label>Subject<input value={draft.subject || ''} onChange={e => setDraft({ ...draft, subject: e.target.value })} /></label>}<label>Message body<textarea rows={6} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} /></label><p className="variable-hint">Available variables: <code>{'{{first_name}}'}</code> <code>{'{{email}}'}</code></p><div className="modal-actions"><button className="outline-button" onClick={() => { setDraft(null); setSelectedCell(null) }}>Cancel</button><button className="primary-button" onClick={saveTemplate}>Save template</button></div></div></div>}
    </main>
  )
}
