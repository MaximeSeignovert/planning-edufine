import { useState, useEffect, useCallback } from 'react'
import {
  clearStoredAuthTokens,
  DEFAULT_ACCESS_TOKEN_LIFETIME_SECONDS,
  getStoredAuthTokens,
  getTokensUpdatedEventName,
  refreshAccessTokenWithStoredRefreshToken,
  storeAuthTokens,
  type StoredAuthTokens,
} from '../lib/authTokens'

export interface UserInfo {
  FIRSTNAME: string
  LASTNAME: string
  EMAIL: string
  TOKEN: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number | null
}

export interface LoginCredentials {
  EMAIL: string
  PASSWORD: string
  LANGUAGE: string
}

export interface ApiResponse<T> {
  status: string
  result: T
}

interface LoginResponse extends UserInfo {
  ACCESS_TOKEN?: string
  REFRESH_TOKEN?: string
}

const REFRESH_BUFFER_MS = 60 * 1000

export function useAuth() {
  const [bearerToken, setBearerToken] = useState<string>('')
  const [refreshToken, setRefreshToken] = useState<string>('')
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const setAuthSession = useCallback(
    ({ accessToken, refreshToken: nextRefreshToken, expiresAt }: AuthTokens) => {
      setBearerToken(accessToken)
      setRefreshToken(nextRefreshToken)
      setTokenExpiresAt(expiresAt)
    },
    []
  )

  const logout = useCallback(() => {
    clearStoredAuthTokens()
    localStorage.removeItem('userInfo')
    setBearerToken('')
    setRefreshToken('')
    setTokenExpiresAt(null)
    setUserInfo(null)
    setError('')
  }, [])

  const refreshAccessToken = useCallback(
    async (tokenToUse?: string) => {
      const refreshedTokens = await refreshAccessTokenWithStoredRefreshToken(
        tokenToUse || refreshToken
      )
      if (refreshedTokens) {
        setAuthSession({
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken,
          expiresAt: refreshedTokens.expiresAt,
        })
        return true
      }
      logout()
      return false
    },
    [logout, refreshToken, setAuthSession]
  )

  useEffect(() => {
    const storedTokens = getStoredAuthTokens()
    const user = localStorage.getItem('userInfo')

    setBearerToken(storedTokens.accessToken)
    setRefreshToken(storedTokens.refreshToken)
    setTokenExpiresAt(storedTokens.expiresAt)

    if (user) {
      setUserInfo(JSON.parse(user))
    }

    // Si le token est proche de l'expiration (ou date inconnue), on tente un refresh immédiat.
    if (
      storedTokens.refreshToken &&
      (!storedTokens.expiresAt || Date.now() >= storedTokens.expiresAt - REFRESH_BUFFER_MS)
    ) {
      void refreshAccessToken(storedTokens.refreshToken)
    }
  }, [refreshAccessToken])

  useEffect(() => {
    const onTokensUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<StoredAuthTokens>
      const next = customEvent.detail
      if (!next) {
        return
      }

      setBearerToken(next.accessToken)
      setRefreshToken(next.refreshToken)
      setTokenExpiresAt(next.expiresAt)
    }

    window.addEventListener(getTokensUpdatedEventName(), onTokensUpdated)
    return () => {
      window.removeEventListener(getTokensUpdatedEventName(), onTokensUpdated)
    }
  }, [])

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return false
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(
        'https://api.edusign.fr/student/account/getByCredentials',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            EMAIL: email,
            PASSWORD: password,
            LANGUAGE: 'fr',
          } as LoginCredentials),
        }
      )

      if (!response.ok) {
        throw new Error('Identifiants incorrects')
      }

      const data: ApiResponse<UserInfo> = await response.json()

      if (data.status === 'success' && data.result) {
        const loginResult = data.result as LoginResponse
        const token = loginResult.ACCESS_TOKEN || loginResult.TOKEN
        const refreshToken = loginResult.REFRESH_TOKEN

        if (!token || !refreshToken) {
          throw new Error('Réponse invalide du serveur')
        }

        const user = data.result
        localStorage.setItem('userInfo', JSON.stringify(user))
        const stored = storeAuthTokens(token, refreshToken, DEFAULT_ACCESS_TOKEN_LIFETIME_SECONDS)
        setAuthSession(stored)
        setUserInfo(user)
        return true
      } else {
        throw new Error('Réponse invalide du serveur')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!refreshToken || !tokenExpiresAt) {
      return
    }

    const delay = Math.max(tokenExpiresAt - Date.now() - REFRESH_BUFFER_MS, 0)
    const timeoutId = window.setTimeout(() => {
      void refreshAccessToken()
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refreshAccessToken, refreshToken, tokenExpiresAt])

  return {
    bearerToken,
    userInfo,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!bearerToken && !!userInfo,
  }
}
