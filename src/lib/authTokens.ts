export interface StoredAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number | null
}

interface RefreshResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

interface ApiResponse<T> {
  status: string
  result: T
}

export const ACCESS_TOKEN_KEY = 'bearerToken'
export const REFRESH_TOKEN_KEY = 'refreshToken'
export const TOKEN_EXPIRES_AT_KEY = 'tokenExpiresAt'
export const REFRESH_ENDPOINT = 'https://api.edusign.fr/student/account/auth/refresh'
export const DEFAULT_ACCESS_TOKEN_LIFETIME_SECONDS = 8 * 60 * 60

const TOKENS_UPDATED_EVENT = 'auth:tokens-updated'

function emitTokensUpdated(tokens: StoredAuthTokens) {
  window.dispatchEvent(new CustomEvent<StoredAuthTokens>(TOKENS_UPDATED_EVENT, { detail: tokens }))
}

export function getTokensUpdatedEventName() {
  return TOKENS_UPDATED_EVENT
}

export function getStoredAuthTokens(): StoredAuthTokens {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || ''
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || ''
  const expiresAtRaw = localStorage.getItem(TOKEN_EXPIRES_AT_KEY)
  const parsedExpiresAt = expiresAtRaw ? Number(expiresAtRaw) : null

  return {
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(parsedExpiresAt) ? parsedExpiresAt : null,
  }
}

export function storeAuthTokens(
  accessToken: string,
  refreshToken: string,
  expiresInSeconds = DEFAULT_ACCESS_TOKEN_LIFETIME_SECONDS
): StoredAuthTokens {
  const expiresAt = Date.now() + expiresInSeconds * 1000
  const nextTokens: StoredAuthTokens = { accessToken, refreshToken, expiresAt }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAt))
  emitTokensUpdated(nextTokens)

  return nextTokens
}

export function clearStoredAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
  emitTokensUpdated({ accessToken: '', refreshToken: '', expiresAt: null })
}

export async function refreshAccessTokenWithStoredRefreshToken(
  refreshTokenOverride?: string
): Promise<StoredAuthTokens | null> {
  const activeRefreshToken = refreshTokenOverride || localStorage.getItem(REFRESH_TOKEN_KEY) || ''
  if (!activeRefreshToken) {
    return null
  }

  try {
    const response = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: activeRefreshToken,
      }),
    })

    if (!response.ok) {
      return null
    }

    const data: ApiResponse<RefreshResponse> = await response.json()
    if (data.status !== 'success' || !data.result?.access_token || !data.result?.refresh_token) {
      return null
    }

    return storeAuthTokens(
      data.result.access_token,
      data.result.refresh_token,
      data.result.expires_in || DEFAULT_ACCESS_TOKEN_LIFETIME_SECONDS
    )
  } catch {
    return null
  }
}
