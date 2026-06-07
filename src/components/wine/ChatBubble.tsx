import { theme } from '../../constants/theme'
import type { ChatMessage } from '../../types'

interface ChatBubbleProps {
  message: ChatMessage
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-xs px-4 py-2 rounded-2xl text-sm"
        style={{
          background: isUser ? theme.colors.primary : theme.colors.surface,
          color:      theme.colors.cream,
          borderBottomRightRadius: isUser ? 4 : undefined,
          borderBottomLeftRadius:  isUser ? undefined : 4,
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
