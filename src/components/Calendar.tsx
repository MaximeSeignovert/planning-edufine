import { useEffect, useState } from 'react'
import { Card } from './ui/card'
import type { Course } from '~/hooks/usePlanning'

interface CalendarProps {
  courses: Course[]
  weekStart: Date
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function getCourseStatus(course: Course): string {
  if (course.STUDENT_PRESENCE) return 'bg-emerald-500 border-l-emerald-700'
  if (course.STUDENT_IS_JUSTIFICATED || course.JUSTIFIED) return 'bg-orange-500 border-l-orange-700'
  if (course.STUDENT_ABSENCE_ID) return 'bg-red-500 border-l-red-700'
  return 'bg-blue-500 border-l-blue-700'
}

export function Calendar({ courses, weekStart }: CalendarProps) {
  const [minHour, setMinHour] = useState(8)
  const [maxHour, setMaxHour] = useState(18)
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null)
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null)

  // Calculer les heures min et max
  useEffect(() => {
    if (courses.length === 0) {
      setMinHour(8)
      setMaxHour(18)
      return
    }

    let min = 24
    let max = 0

    courses.forEach((course) => {
      const startDate = new Date(course.START)
      const endDate = new Date(course.END)
      const startHour = startDate.getHours()
      const endHour = endDate.getHours() + (endDate.getMinutes() > 0 ? 1 : 0)

      min = Math.min(min, startHour)
      max = Math.max(max, endHour)
    })

    setMinHour(Math.max(0, min - 1))
    setMaxHour(Math.min(23, max + 1))
  }, [courses])

  // Mettre à jour la ligne de temps actuelle
  useEffect(() => {
    const updateTimeLine = () => {
      const now = new Date()
      const today = now.toDateString()

      // Trouver l'index du jour actuel
      let dayIndex: number | null = null
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart)
        currentDate.setDate(currentDate.getDate() + i)
        if (currentDate.toDateString() === today) {
          dayIndex = i
          break
        }
      }

      setCurrentDayIndex(dayIndex)

      if (dayIndex !== null) {
        const currentHour = now.getHours() + now.getMinutes() / 60
        const position = (currentHour - minHour) * 60

        // Vérifier si l'heure actuelle est dans la plage visible
        const totalHeight = (maxHour - minHour + 1) * 60
        if (position >= 0 && position <= totalHeight) {
          setCurrentTimePosition(position)
        } else {
          setCurrentTimePosition(null)
        }
      } else {
        setCurrentTimePosition(null)
      }
    }

    updateTimeLine()
    const interval = setInterval(updateTimeLine, 60000)

    return () => clearInterval(interval)
  }, [weekStart, minHour, maxHour])

  const hourRange = maxHour - minHour + 1
  const timeSlots = Array.from({ length: hourRange }, (_, i) => minHour + i)

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Colonne des heures */}
        <div className="w-16 md:w-20 border-r flex-shrink-0">
          <div className="h-[60px] border-b bg-slate-50" />
          <div className="relative">
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b text-xs md:text-sm text-slate-600 text-center p-1"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Colonnes des jours */}
        <div className="flex flex-1 overflow-x-auto">
          {DAYS_OF_WEEK.map((day, i) => {
            const currentDate = new Date(weekStart)
            currentDate.setDate(currentDate.getDate() + i)

            const dayCourses = courses.filter((course) => {
              const courseDate = new Date(course.START)
              return courseDate.toDateString() === currentDate.toDateString()
            })

            return (
              <div
                key={i}
                className="flex-1 min-w-[85px] md:min-w-[150px] border-r last:border-r-0"
              >
                <div className="h-[60px] border-b bg-slate-50 p-2 md:p-2.5 text-center">
                  <div className="font-bold text-slate-800 text-xs md:text-sm">
                    {day}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {currentDate.getDate().toString().padStart(2, '0')}/
                    {(currentDate.getMonth() + 1).toString().padStart(2, '0')}
                  </div>
                </div>
                <div
                  className="relative"
                  style={{ height: `${hourRange * 60}px` }}
                >
                  {/* Grille des heures */}
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 h-[60px] border-b"
                      style={{ top: `${(hour - minHour) * 60}px` }}
                    />
                  ))}

                  {/* Cours */}
                  {dayCourses.map((course) => {
                    const startDate = new Date(course.START)
                    const endDate = new Date(course.END)
                    const startHour =
                      startDate.getHours() + startDate.getMinutes() / 60
                    const endHour =
                      endDate.getHours() + endDate.getMinutes() / 60
                    const duration = endHour - startHour

                    return (
                      <div
                        key={course.ID}
                        className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 text-white rounded border-l-2 md:border-l-3 p-1 md:p-1.5 text-[8px] md:text-[11px] overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg hover:z-10 ${getCourseStatus(course)}`}
                        style={{
                          top: `${(startHour - minHour) * 60}px`,
                          height: `${duration * 60}px`,
                        }}
                        title={`${course.NAME}\n${formatTime(startDate)} - ${formatTime(endDate)}\n${course.CLASSROOM ? 'Salle ' + course.CLASSROOM : ''}`}
                      >
                        <div className="font-bold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis text-[9px] md:text-[11px]">
                          {course.NAME}
                        </div>
                        <div className="opacity-90 text-[8px] md:text-[10px]">
                          {formatTime(startDate)} - {formatTime(endDate)}
                        </div>
                        {course.CLASSROOM && (
                          <div className="opacity-90 mt-0.5 text-[8px] md:text-[10px]">
                            Salle {course.CLASSROOM}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Ligne de temps actuelle */}
                  {currentDayIndex === i &&
                    currentTimePosition !== null && (
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-50 pointer-events-none"
                        style={{ top: `${currentTimePosition}px` }}
                      >
                        <div className="absolute left-0 top-[-4px] w-2 h-2 rounded-full bg-red-500" />
                      </div>
                    )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
