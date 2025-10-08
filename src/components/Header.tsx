import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import type { UserInfo } from '~/hooks/useAuth'

interface HeaderProps {
  userInfo: UserInfo | null
  isLoading: boolean
  error: string
  onLogin: (email: string, password: string) => Promise<boolean>
  onLogout: () => void
}

export function Header({
  userInfo,
  isLoading,
  error,
  onLogin,
  onLogout,
}: HeaderProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const success = await onLogin(email, password)
    if (success) {
      setPassword('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <Card className="p-5 mb-5">
      <h1 className="text-2xl font-bold text-slate-800 mb-5">
        Planning Edusign
      </h1>

      {!userInfo ? (
        <div className="flex flex-col md:flex-row gap-2.5">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleLogin} disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-4 p-2.5 bg-emerald-50 border-2 border-emerald-600 rounded">
          <span className="flex-1 font-bold text-slate-800">
            {userInfo.FIRSTNAME} {userInfo.LASTNAME}
          </span>
          <Button variant="destructive" onClick={onLogout}>
            Se déconnecter
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded border-l-4 border-red-600">
          {error}
        </div>
      )}
    </Card>
  )
}
