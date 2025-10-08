import { useCoursesQuery } from './useCoursesQuery'

interface UseAllCoursesQueryParams {
  bearerToken: string
}

function getAcademicYearRange(): { start: Date; end: Date } {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // L'année scolaire commence en septembre (mois 8) et se termine en août (mois 7) de l'année suivante
  let startYear = currentYear
  let endYear = currentYear + 1

  // Si on est avant septembre, l'année scolaire a commencé l'année précédente
  if (currentMonth < 8) {
    startYear = currentYear - 1
    endYear = currentYear
  }

  const start = new Date(startYear, 8, 1) // 1er septembre
  const end = new Date(endYear, 7, 31) // 31 août

  return { start, end }
}

export function useAllCoursesQuery({ bearerToken }: UseAllCoursesQueryParams) {
  const { start, end } = getAcademicYearRange()

  return useCoursesQuery({
    bearerToken,
    startDate: start,
    endDate: end,
    enabled: !!bearerToken,
  })
}
