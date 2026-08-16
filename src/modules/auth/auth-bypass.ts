/**
 * Local-only escape hatch when Supabase env is unset.
 * Requires BOTH `ALLOW_INSECURE_AUTH_BYPASS=true` and a non-production NODE_ENV.
 * Never enable this in staging/preview/production.
 */
export function isInsecureAuthBypassAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.ALLOW_INSECURE_AUTH_BYPASS !== 'true') return false
  return env.NODE_ENV === 'development' || !env.NODE_ENV
}
