export function isTestTeamsEnabled() {
  return process.env.ENABLE_TEST_TEAMS === 'true'
}

export function isTestTeamsEnabledClient() {
  return process.env.NEXT_PUBLIC_ENABLE_TEST_TEAMS === 'true'
}

