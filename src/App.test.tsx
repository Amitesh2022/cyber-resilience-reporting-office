// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

describe('cyber resilience reporting office', () => {
  it('loads security reports from the Java API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, title: 'Actively exploited gateway vulnerability', owner: 'European Product Security Team', status: 'Review', priority: 'High' }],
    }))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><App /></QueryClientProvider>)
    expect(await screen.findByText('Actively exploited gateway vulnerability')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Cyber Resilience Reporting Office' })).toBeTruthy()
  })
})
