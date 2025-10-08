import { useQuery } from '@tanstack/react-query'
import type { Course } from './usePlanning'
import type { ApiResponse } from './useAuth'

interface UseCoursesQueryParams {
  bearerToken: string
  startDate: Date
  endDate: Date
  enabled?: boolean
}

async function fetchCourses(
  bearerToken: string,
  startDate: Date,
  endDate: Date
): Promise<Course[]> {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  const url = `https://api.edusign.fr/student/planning?start=${start.toISOString()}&end=${end.toISOString()}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Token invalide ou expiré')
    }
    throw new Error(`Erreur HTTP: ${response.status}`)
  }

  const data: ApiResponse<Course[]> = await response.json()

  if (data.status === 'success' && Array.isArray(data.result)) {
    return data.result
  }

  throw new Error('Format de réponse invalide')
}

export function useCoursesQuery({
  bearerToken,
  startDate,
  endDate,
  enabled = true,
}: UseCoursesQueryParams) {
  return useQuery({
    queryKey: ['courses', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => fetchCourses(bearerToken, startDate, endDate),
    enabled: enabled && !!bearerToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
