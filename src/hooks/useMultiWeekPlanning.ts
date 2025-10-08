import { useState, useEffect } from 'react'
import type { Course } from './usePlanning'
import type { ApiResponse } from './useAuth'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

export function useMultiWeekPlanning(bearerToken: string, currentWeek: Date, weeksRange = 2) {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!bearerToken) {
      setAllCourses([])
      return
    }

    const loadMultiWeekPlanning = async () => {
      setIsLoading(true)
      setError('')

      try {
        const weekStart = getWeekStart(currentWeek)
        const start = addWeeks(weekStart, -weeksRange)
        start.setHours(0, 0, 0, 0)

        const end = addWeeks(weekStart, weeksRange)
        end.setDate(end.getDate() + 6)
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
          setAllCourses(data.result)
        } else {
          throw new Error('Format de réponse invalide')
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur lors du chargement'
        setError(message)
        setAllCourses([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMultiWeekPlanning()
  }, [bearerToken, currentWeek, weeksRange])

  return { allCourses, isLoading, error }
}
