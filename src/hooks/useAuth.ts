import { useState, useEffect } from 'react'

export interface UserInfo {
  FIRSTNAME: string
  LASTNAME: string
  EMAIL: string
  TOKEN: string
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

export function useAuth() {
  const [bearerToken, setBearerToken] = useState<string>('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('bearerToken') || ''
    const user = localStorage.getItem('userInfo')
    setBearerToken(token)
    if (user) {
      setUserInfo(JSON.parse(user))
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

      if (data.status === 'success' && data.result.TOKEN) {
        const token = data.result.TOKEN
        const user = data.result

        localStorage.setItem('bearerToken', token)
        localStorage.setItem('userInfo', JSON.stringify(user))

        setBearerToken(token)
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

  const logout = () => {
    localStorage.removeItem('bearerToken')
    localStorage.removeItem('userInfo')
    setBearerToken('')
    setUserInfo(null)
    setError('')
  }

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
