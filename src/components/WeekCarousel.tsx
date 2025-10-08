import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { useState, useEffect, useRef } from 'react'

interface WeekCarouselProps {
  currentWeek: Date
  onWeekChange: (weekStart: Date) => void
  weeksWithCourses?: Set<string>
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
  }
  const startStr = weekStart.toLocaleDateString('fr-FR', options)
  const endStr = weekEnd.toLocaleDateString('fr-FR', options)

  return `${startStr} - ${endStr}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getWeekKey(date: Date): string {
  const weekStart = getWeekStart(date)
  return weekStart.toISOString().split('T')[0]
}

export function WeekCarousel({ currentWeek, onWeekChange, weeksWithCourses = new Set() }: WeekCarouselProps) {
  const [weeks, setWeeks] = useState<Date[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Génère plus de semaines pour remplir l'espace
  useEffect(() => {
    const weekStart = getWeekStart(currentWeek)
    const weeksArray: Date[] = []

    // Génère 26 semaines (13 avant, semaine actuelle, 12 après)
    for (let i = -13; i <= 12; i++) {
      weeksArray.push(addWeeks(weekStart, i))
    }

    setWeeks(weeksArray)
  }, [currentWeek])

  // Centre le scroll sur la semaine actuelle
  useEffect(() => {
    if (containerRef.current && weeks.length > 0) {
      const container = containerRef.current
      const weekWidth = container.scrollWidth / weeks.length
      const centerPosition = weekWidth * 13 - container.clientWidth / 2 + weekWidth / 2
      container.scrollLeft = centerPosition
    }
  }, [weeks])

  const handlePrevious = () => {
    const weekStart = getWeekStart(currentWeek)
    onWeekChange(addWeeks(weekStart, -1))
  }

  const handleNext = () => {
    const weekStart = getWeekStart(currentWeek)
    onWeekChange(addWeeks(weekStart, 1))
  }

  const handleWeekClick = (week: Date) => {
    if (!isDragging) {
      onWeekChange(week)
    }
  }

  const isCurrentWeek = (week: Date): boolean => {
    const today = new Date()
    const todayWeekStart = getWeekStart(today)
    return week.getTime() === todayWeekStart.getTime()
  }

  const isSelectedWeek = (week: Date): boolean => {
    const currentWeekStart = getWeekStart(currentWeek)
    return week.getTime() === currentWeekStart.getTime()
  }

  const hasCoursesInWeek = (week: Date): boolean => {
    return weeksWithCourses.has(getWeekKey(week))
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    setIsMouseDown(true)
    setIsDragging(false)
    setStartX(e.pageX)
    setScrollLeft(containerRef.current.scrollLeft)
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !containerRef.current) return

    const x = e.pageX
    const walk = startX - x

    if (Math.abs(walk) > 5) {
      setIsDragging(true)
    }

    containerRef.current.scrollLeft = scrollLeft + walk
  }

  const handleMouseUp = () => {
    setIsMouseDown(false)
    setTimeout(() => setIsDragging(false), 100)
  }

  const handleMouseLeave = () => {
    setIsMouseDown(false)
    setTimeout(() => setIsDragging(false), 100)
  }

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    setIsDragging(false)
    setStartX(e.touches[0].pageX)
    setScrollLeft(containerRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    const x = e.touches[0].pageX
    const walk = startX - x

    if (Math.abs(walk) > 5) {
      setIsDragging(true)
    }

    containerRef.current.scrollLeft = scrollLeft + walk
  }

  const handleTouchEnd = () => {
    setTimeout(() => setIsDragging(false), 100)
  }

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        className="shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={containerRef}
        className="flex gap-1 md:gap-2 overflow-x-auto flex-1 cursor-grab active:cursor-grabbing select-none scrollbar-hide"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {weeks.map((week) => {
          const isSelected = isSelectedWeek(week)
          const isCurrent = isCurrentWeek(week)
          const hasCourses = hasCoursesInWeek(week)

          return (
            <button
              key={week.getTime()}
              onClick={() => handleWeekClick(week)}
              className={`
                relative px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium
                transition-all duration-200 shrink-0 min-w-[80px] md:min-w-[100px]
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }
                ${isCurrent && !isSelected ? 'ring-2 ring-blue-400' : ''}
              `}
            >
              <div className="text-center">
                <div className="font-bold">S{getWeekNumber(week)}</div>
                <div className="text-[10px] md:text-xs opacity-90 whitespace-nowrap">
                  {formatWeekRange(week)}
                </div>
              </div>
              {hasCourses && (
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                  isSelected ? 'bg-white' : 'bg-green-500'
                }`} title="Cette semaine contient des cours" />
              )}
            </button>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        className="shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
