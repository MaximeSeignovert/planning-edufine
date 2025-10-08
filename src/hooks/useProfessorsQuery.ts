import { useQuery } from '@tanstack/react-query'
import type { ApiResponse } from './useAuth'

export interface Professor {
  ID: string
  FIRSTNAME: string
  LASTNAME: string
  TAGS: string[]
  TEAMS_ID: string[]
  ZOOM_ID: string[]
  LOGIN_CODE: string[]
  id: string
}

async function fetchProfessors(
  bearerToken: string,
  professorIds: string[]
): Promise<Professor[]> {
  if (!professorIds.length) {
    return []
  }

  const url = 'https://api.edusign.fr/student/professors'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: professorIds }),
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Token invalide ou expiré')
    }
    throw new Error(`Erreur HTTP: ${response.status}`)
  }

  const data: ApiResponse<Professor[]> = await response.json()

  if (data.status === 'success' && Array.isArray(data.result)) {
    return data.result
  }

  throw new Error('Format de réponse invalide')
}

export function useProfessorsQuery(bearerToken: string, professorIds: string[]) {
  return useQuery({
    queryKey: ['professors', professorIds.sort().join(',')],
    queryFn: () => fetchProfessors(bearerToken, professorIds),
    enabled: !!bearerToken && professorIds.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes - les infos des profs changent rarement
  })
}
