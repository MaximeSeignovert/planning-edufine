import { useState, useMemo, useEffect } from 'react'
import { useCoursesQuery } from './useCoursesQuery'

interface UseAllCoursesQueryParams {
  bearerToken: string
  currentWeek: Date
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function getSixMonthsRange(currentWeek: Date): { start: Date; end: Date } {
  const weekStart = getWeekStart(currentWeek)

  // Charge 6 mois avant et 6 mois après la semaine actuelle
  const start = addMonths(weekStart, -6)
  start.setHours(0, 0, 0, 0)

  const end = addMonths(weekStart, 6)
  end.setDate(end.getDate() + 6) // Fin de la dernière semaine
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end
}

export function useAllCoursesQuery({ bearerToken, currentWeek }: UseAllCoursesQueryParams) {
  // État pour garder la plage de dates actuelle en cache
  const [cachedRange, setCachedRange] = useState(() => getSixMonthsRange(currentWeek))

  // Vérifie si la semaine actuelle est dans la plage en cache
  const weekStart = useMemo(() => getWeekStart(currentWeek), [currentWeek])
  const isInCache = useMemo(() => {
    return isDateInRange(weekStart, cachedRange.start, cachedRange.end)
  }, [weekStart, cachedRange])

  // Met à jour la plage en cache si nécessaire
  useEffect(() => {
    if (!isInCache) {
      const newRange = getSixMonthsRange(currentWeek)
      setCachedRange(newRange)
    }
  }, [isInCache, currentWeek])

  // Utilise la plage en cache pour la requête
  // La queryKey est basée sur les dates de la plage, pas sur currentWeek
  return useCoursesQuery({
    bearerToken,
    startDate: cachedRange.start,
    endDate: cachedRange.end,
    enabled: !!bearerToken,
  })
}
