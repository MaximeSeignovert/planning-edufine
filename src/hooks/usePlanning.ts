import { useState, useEffect } from 'react'
import type { ApiResponse } from './useAuth'

export interface Course {
  ID: number | string
  NAME: string
  START: string
  END: string
  CLASSROOM?: string
  PROFESSOR?: string
  STUDENT_PRESENCE?: boolean
  STUDENT_ABSENCE_ID?: number | null
  STUDENT_IS_JUSTIFICATED?: boolean
  JUSTIFIED?: boolean
}

export function usePlanning(bearerToken: string, weekStart: Date) {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!bearerToken) {
      setCourses([])
      return
    }

    const loadPlanning = async () => {
      setIsLoading(true)
      setError('')

      const start = new Date(weekStart)
      start.setHours(0, 0, 0, 0)

      const end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)

      const url = `https://api.edusign.fr/student/planning?start=${start.toISOString()}&end=${end.toISOString()}`

      try {
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
          setCourses(data.result)
        } else {
          throw new Error('Format de réponse invalide')
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur lors du chargement'
        setError(message)
        setCourses([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPlanning()
  }, [bearerToken, weekStart])

  return { courses, isLoading, error }
}
