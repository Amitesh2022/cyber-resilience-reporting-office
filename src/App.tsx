import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Route, Switch } from 'wouter'
import './App.css'
import './forms.css'

type SecurityReport = { id: number; title: string; owner: string; status: 'Draft' | 'Review' | 'Closed'; priority: 'Low' | 'Medium' | 'High' }
const api = '/api/items'

async function readEvidence(): Promise<SecurityReport[]> {
  const response = await fetch(api)
  if (!response.ok) throw new Error('The cyber resilience reporting service is unavailable.')
  return response.json()
}

async function createEvidence(item: Omit<SecurityReport, 'id'>): Promise<SecurityReport> {
  const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
  if (!response.ok) throw new Error('The security report could not be saved.')
  return response.json()
}

async function advanceEvidence(item: SecurityReport): Promise<SecurityReport> {
  const status = item.status === 'Draft' ? 'Review' : 'Closed'
  const response = await fetch(`${api}/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, status }) })
  if (!response.ok) throw new Error('The security report could not be updated.')
  return response.json()
}

function Register() {
  const cache = useQueryClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { data = [], isPending, error } = useQuery({ queryKey: ['evidence'], queryFn: readEvidence })
  const save = useMutation({ mutationFn: createEvidence, onSuccess: () => { cache.invalidateQueries({ queryKey: ['evidence'] }); setOpen(false) } })
  const advance = useMutation({ mutationFn: advanceEvidence, onSuccess: () => cache.invalidateQueries({ queryKey: ['evidence'] }) })
  const visible = data.filter((item) => `${item.title} ${item.owner} ${item.status}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.title.localeCompare(b.title))
  const approved = data.filter((item) => item.status === 'Closed').length
  const high = data.filter((item) => item.priority === 'High').length

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    save.mutate({ title: String(values.get('title')), owner: String(values.get('owner')), status: 'Draft', priority: String(values.get('priority')) as SecurityReport['priority'] })
  }

  return <main>
    <header className="hero"><div><span className="eyebrow">Meet the 24-hour and 72-hour reporting windows</span><h1>Cyber Resilience Reporting Office</h1><p>Coordinate exploited vulnerabilities, severe incidents and accountable product security teams in one workspace.</p></div><button className="primary" onClick={() => setOpen(!open)}>{open ? 'Close form' : 'Add security report'}</button></header>
    <section className="metrics" aria-label="cyber resilience reporting summary"><article><span>Reports tracked</span><strong>{isPending ? '…' : data.length}</strong><small>Shared reporting view</small></article><article><span>Closed</span><strong>{approved}</strong><small>Corrective action recorded</small></article><article><span>High priority</span><strong>{high}</strong><small>Needs urgent attention</small></article></section>
    {open && <form className="panel form" onSubmit={submit}><h2>Add a security report</h2><label>Digital product vulnerability or severe incident<input required name="title" minLength={4} placeholder="Example: exploited router vulnerability" /></label><label>Responsible product security team<input required name="owner" minLength={3} placeholder="Example: Brussels Product Security Team" /></label><label>Priority<select name="priority"><option>High</option><option>Medium</option><option>Low</option></select></label><button className="primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save security report'}</button>{save.error && <p role="alert">{save.error.message}</p>}</form>}
    <section className="panel"><div className="panel-title"><h2>Cyber resilience reporting pipeline</h2><span>{error ? 'Connection problem' : 'Live API data'}</span></div><label className="search">Find a security report<input aria-label="Find a security report" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product, vulnerability, owner or status" /></label>{error && <p role="alert">{error.message}</p>}{!isPending && !error && visible.length === 0 && <p>No security reports match this view.</p>}{visible.map((item) => <div className="row" key={item.id}><span className={`dot ${item.status === 'Closed' ? '' : 'degraded'}`} /><div><b>{item.title}</b><small>{item.owner} · {item.status}</small></div><strong>{item.priority}</strong>{item.status !== 'Closed' && <button className="secondary" disabled={advance.isPending} onClick={() => advance.mutate(item)}>Move to {item.status === 'Draft' ? 'review' : 'approved'}</button>}</div>)}</section>
  </main>
}

function About() { return <main><header className="hero"><div><span className="eyebrow">Why it matters</span><h1>Timely reporting protects users of connected products</h1></div></header><section className="panel prose"><h2>A clear path from early warning to corrective action</h2><p>Teams can see who owns each response, which digital products are affected and what still needs attention before approval.</p></section></main> }

export default function App() { return <div className="shell"><nav><b>SecureProductEU<span>/security reports</span></b><div><Link href="/">Reviews</Link><Link href="/about">Purpose</Link></div></nav><Switch><Route path="/" component={Register} /><Route path="/about" component={About} /></Switch></div> }
