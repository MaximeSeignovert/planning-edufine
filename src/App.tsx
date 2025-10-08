import { useState, useMemo } from 'react'
import { Header } from './components/Header'
import { WeekCarousel } from './components/WeekCarousel'
import { Calendar } from './components/Calendar'
import { useAuth } from './hooks/useAuth'
import { useAllCoursesQuery } from './hooks/useAllCoursesQuery'
import { useWeeksWithCourses } from './hooks/useWeeksWithCourses'
import { useProfessorsQuery } from './hooks/useProfessorsQuery'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lundi
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function App() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const { bearerToken, userInfo, isLoading, error, login, logout } = useAuth()

  // Charge les cours 6 mois avant et 6 mois après la semaine actuelle
  const {
    data: allCourses = [],
    isLoading: planningLoading,
    error: planningError,
  } = useAllCoursesQuery({ bearerToken, currentWeek: weekStart })

  // Détermine quelles semaines contiennent des cours
  const weeksWithCourses = useWeeksWithCourses(allCourses)

  // Extrait tous les IDs de professeurs uniques
  const professorIds = useMemo(() => {
    const ids = new Set<string>()
    allCourses.forEach(course => {
      if (course.PROFESSOR) {
        ids.add(course.PROFESSOR)
      }
    })
    return Array.from(ids)
  }, [allCourses])

  // Charge les données des professeurs
  const { data: professors = [] } = useProfessorsQuery(bearerToken, professorIds)

  // Crée un map pour accès rapide aux professeurs par ID
  const professorsMap = useMemo(() => {
    const map = new Map()
    professors.forEach(prof => {
      map.set(prof.ID, prof)
    })
    return map
  }, [professors])

  // Filtre les cours de la semaine actuelle pour le calendrier
  const currentWeekCourses = useMemo(() => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return allCourses.filter(course => {
      const courseDate = new Date(course.START)
      return courseDate >= weekStart && courseDate <= weekEnd
    })
  }, [allCourses, weekStart])

  const handleWeekChange = (newWeekStart: Date) => {
    setWeekStart(newWeekStart)
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-5">
      <Header
        userInfo={userInfo}
        isLoading={isLoading}
        error={error}
        onLogin={login}
        onLogout={logout}
      />

      <div className="bg-white p-4 md:p-5 rounded-lg shadow mb-5">
        <WeekCarousel
          currentWeek={weekStart}
          onWeekChange={handleWeekChange}
          weeksWithCourses={weeksWithCourses}
        />
      </div>

      {planningLoading ? (
        <div className="text-center py-10 text-slate-600">
          Chargement du planning...
        </div>
      ) : planningError ? (
        <div className="p-4 bg-red-50 text-red-600 rounded border-l-4 border-red-600">
          {planningError instanceof Error ? planningError.message : 'Erreur lors du chargement'}
        </div>
      ) : (
        <Calendar
          courses={currentWeekCourses}
          weekStart={weekStart}
          professorsMap={professorsMap}
        />
      )}
    </div>
  )
}

export default App
