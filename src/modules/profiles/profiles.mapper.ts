import type { User } from '../users/entities'
import type { InvestorProfiles } from './entities/investor-profiles.entity'
import type { StartupProfiles } from './entities/startup-profiles.entity'

export type AccountType = 'user' | 'startup' | 'investor'

export type AccountSummary = {
  id: string
  name: string
  headline: string | null
  location: string | null
  avatarUrl: string | null
  views?: number
  connections?: number
  accountType: AccountType
}

export type StartupProfileResponse = {
  id: string
  userId: string
  companyName: string
  description: string | null
  stage: StartupProfiles['stage']
  industry: string
  websiteUrl: string | null
  contactEmail: string
  avatarUrl: string | null
  logoUrl: string | null
  foundedAt: string
  views: number
  connections: number
}

export type InvestorProfileResponse = {
  id: string
  userId: string
  firmName: string
  description: string | null
  industry: string
  contactEmail: string
  avatarUrl: string | null
  logoUrl: string | null
  websiteUrl: string | null
  minInvestmentUsd: number | null
  maxInvestmentUsd: number | null
  views: number
  connections: number
}

export type PublicUserProfileResponse = {
  id: string
  name: string | null
  role: User['role']
  occupation: string | null
  location: string | null
  avatarUrl: string | null
  goals: string[]
}

export function toStartupResponse(
  profile: StartupProfiles,
): StartupProfileResponse {
  const founded =
    profile.founded_at instanceof Date
      ? profile.founded_at.toISOString().slice(0, 10)
      : String(profile.founded_at).slice(0, 10)

  return {
    id: profile.id,
    userId: profile.user_id,
    companyName: profile.company_name,
    description: profile.description ?? null,
    stage: profile.stage,
    industry: profile.industry,
    websiteUrl: profile.website_url ?? null,
    contactEmail: profile.contact_email,
    avatarUrl: profile.avatar_url ?? null,
    logoUrl: profile.logo_url ?? null,
    foundedAt: founded,
    views: profile.views,
    connections: profile.connections,
  }
}

export function toInvestorResponse(
  profile: InvestorProfiles,
): InvestorProfileResponse {
  return {
    id: profile.id,
    userId: profile.user_id,
    firmName: profile.firm_name,
    description: profile.description ?? null,
    industry: profile.industry,
    contactEmail: profile.contact_email,
    avatarUrl: profile.avatar_url ?? null,
    logoUrl: profile.logo_url ?? null,
    websiteUrl: profile.website_url ?? null,
    minInvestmentUsd:
      profile.min_investment_usd == null
        ? null
        : Number(profile.min_investment_usd),
    maxInvestmentUsd:
      profile.max_investment_usd == null
        ? null
        : Number(profile.max_investment_usd),
    views: profile.views,
    connections: profile.connections,
  }
}

export function toPublicUserProfile(user: User): PublicUserProfileResponse {
  return {
    id: user.supabaseUid,
    name: user.name ?? null,
    role: user.role,
    occupation: user.occupation ?? null,
    location: user.location ?? null,
    avatarUrl: user.avatar_url ?? null,
    goals: user.tags?.map((tag) => tag.key) ?? [],
  }
}

export function personalAccountSummary(user: User): AccountSummary {
  const roleLabel = user.role ? `${user.role} / Personal Account` : 'Personal'
  return {
    id: user.supabaseUid,
    name: user.name || user.email,
    headline: roleLabel,
    location: user.location ?? null,
    avatarUrl: user.avatar_url ?? null,
    accountType: 'user',
  }
}

export function startupAccountSummary(
  profile: StartupProfiles,
): AccountSummary {
  return {
    id: profile.id,
    name: profile.company_name,
    headline: `${profile.industry} / ${profile.stage}`,
    location: null,
    avatarUrl: profile.avatar_url ?? profile.logo_url ?? null,
    views: profile.views,
    connections: profile.connections,
    accountType: 'startup',
  }
}

export function investorAccountSummary(
  profile: InvestorProfiles,
): AccountSummary {
  return {
    id: profile.id,
    name: profile.firm_name,
    headline: profile.industry,
    location: null,
    avatarUrl: profile.avatar_url ?? profile.logo_url ?? null,
    views: profile.views,
    connections: profile.connections,
    accountType: 'investor',
  }
}
