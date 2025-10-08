import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

interface WeekNavigationProps {
  weekStart: Date
  onPrevWeek: () => void
  onNextWeek: () => void
}

export function WeekNavigation({
  weekStart,
  onPrevWeek,
  onNextWeek,
}: WeekNavigationProps) {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
  const startStr = weekStart.toLocaleDateString('fr-FR', options)
  const endStr = weekEnd.toLocaleDateString('fr-FR', options)

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-2.5">
      <Button
        variant="outline"
        onClick={onPrevWeek}
        className="w-full md:w-auto"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Semaine précédente
      </Button>
      <span className="font-bold text-slate-800 text-sm md:text-base text-center">
        {startStr} - {endStr}
      </span>
      <Button
        variant="outline"
        onClick={onNextWeek}
        className="w-full md:w-auto"
      >
        Semaine suivante
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
