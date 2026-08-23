import {
  personalAccountSummary,
  toInvestorResponse,
  toStartupResponse,
} from './profiles.mapper'
import type { User } from '../users/entities'
import type { InvestorProfiles } from './entities/investor-profiles.entity'
import type { StartupProfiles } from './entities/startup-profiles.entity'

describe('profiles.mapper', () => {
  it('never falls back to email in account summaries', () => {
    const summary = personalAccountSummary({
      supabaseUid: '11111111-1111-1111-1111-111111111111',
      email: 'secret@example.com',
      name: null,
      url_key: 'alex-morgan',
      role: 'Founder',
      location: null,
      avatar_url: null,
    } as User)

    expect(summary.name).toBe('Member')
    expect(summary.name).not.toContain('@')
  })

  it('omits contactEmail from public startup responses', () => {
    const profile = {
      id: '22222222-2222-2222-2222-222222222222',
      user_id: '11111111-1111-1111-1111-111111111111',
      company_name: 'HelloWorld',
      description: null,
      stage: 'pre_seed',
      industry: 'climate',
      website_url: null,
      contact_email: 'hello@example.com',
      avatar_url: null,
      logo_url: null,
      founded_at: new Date('2024-01-15'),
      views: 1,
      connections: 0,
    } as StartupProfiles

    expect(
      toStartupResponse(profile, { includeContactEmail: false }),
    ).not.toHaveProperty('contactEmail')
    expect(toStartupResponse(profile).contactEmail).toBe('hello@example.com')
  })

  it('omits contactEmail from public investor responses', () => {
    const profile = {
      id: '33333333-3333-3333-3333-333333333333',
      user_id: '11111111-1111-1111-1111-111111111111',
      firm_name: 'North Bench',
      description: null,
      industry: 'climate',
      contact_email: 'partners@example.com',
      avatar_url: null,
      logo_url: null,
      website_url: null,
      min_investment_usd: null,
      max_investment_usd: null,
      views: 1,
      connections: 0,
    } as InvestorProfiles

    expect(
      toInvestorResponse(profile, { includeContactEmail: false }),
    ).not.toHaveProperty('contactEmail')
    expect(toInvestorResponse(profile).contactEmail).toBe(
      'partners@example.com',
    )
  })
})
