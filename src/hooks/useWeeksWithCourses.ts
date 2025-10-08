import { useMemo } from 'react'
import type { Course } from './usePlanning'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekKey(date: Date): string {
  const weekStart = getWeekStart(date)
  return weekStart.toISOString().split('T')[0]
}

export function useWeeksWithCourses(allCourses: Course[]): Set<string> {
  return useMemo(() => {
    const weeksSet = new Set<string>()

    allCourses.forEach(course => {
      const courseDate = new Date(course.START)
      const weekKey = getWeekKey(courseDate)
      weeksSet.add(weekKey)
    })

    return weeksSet
  }, [allCourses])
}
