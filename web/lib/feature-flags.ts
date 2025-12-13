const normalize = (value: string | undefined | null) =>
  typeof value === 'string' && value.toLowerCase() === 'true'

export function isTestTeamsEnabled() {
  return normalize(process.env.ENABLE_TEST_TEAMS)
}

export function isTestTeamsEnabledClient() {
  return normalize(process.env.NEXT_PUBLIC_ENABLE_TEST_TEAMS)
}
