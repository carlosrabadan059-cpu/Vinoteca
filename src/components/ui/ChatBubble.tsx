import { theme } from '../../constants/theme'
import type { ChatMessage } from '../../types'

interface ChatBubbleProps {
  message: ChatMessage
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
      style={{ animationDuration: '0.2s', animationFillMode: 'both' }}
    >
      <div
        className="max-w-xs rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          background:              isUser ? theme.colors.primary : theme.colors.surface,
          color:                   theme.colors.cream,
          border:                  isUser ? 'none' : `1px solid ${theme.colors.gold}30`,
          borderBottomRightRadius: isUser ? 4 : undefined,
          borderBottomLeftRadius:  isUser ? undefined : 4,
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
