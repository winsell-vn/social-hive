import { Button } from '@/components/ui/button'
import type { TimeRange } from '../types/trending'

interface TimeRangeFilterProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
]

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Bộ lọc khoảng thời gian">
      {timeRangeOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'outline'}
          size="sm"
          className="flex-1 md:flex-none min-h-[40px]"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

