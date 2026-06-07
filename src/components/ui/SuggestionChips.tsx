import { theme } from '../../constants/theme'

interface SuggestionChipsProps {
  suggestions: string[]
  onSelect: (text: string) => void
}

export default function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 py-2">
      {suggestions.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 rounded-full text-sm transition-opacity active:opacity-60"
          style={{
            border:     `1px solid ${theme.colors.gold}`,
            color:      theme.colors.cream,
            background: 'transparent',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
