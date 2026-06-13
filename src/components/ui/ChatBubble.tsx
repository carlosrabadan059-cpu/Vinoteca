import { theme } from '../../constants/theme'
import type { ChatMessage } from '../../types'

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip empty lines between blocks (add spacing)
    if (line.trim() === '') {
      nodes.push(<div key={`gap-${i}`} style={{ height: 6 }} />)
      i++
      continue
    }

    // Heading: ## or ###
    if (/^#{1,3}\s/.test(line)) {
      const content = line.replace(/^#{1,3}\s/, '')
      nodes.push(
        <p key={i} className="font-semibold" style={{ color: theme.colors.gold, marginBottom: 2 }}>
          {inlineFormat(content)}
        </p>
      )
      i++
      continue
    }

    // Unordered list block
    if (/^[-*•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, ''))
        i++
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 4, margin: 0 }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
              <span style={{ color: theme.colors.gold, flexShrink: 0 }}>·</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list block
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      let num = 1
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
        num++
      }
      nodes.push(
        <ol key={`ol-${i}`} style={{ paddingLeft: 4, margin: 0 }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
              <span style={{ color: theme.colors.gold, flexShrink: 0, minWidth: 14 }}>{j + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Regular paragraph
    nodes.push(
      <p key={i} style={{ margin: 0 }}>
        {inlineFormat(line)}
      </p>
    )
    i++
  }

  return nodes
}

function inlineFormat(text: string): React.ReactNode[] {
  // Process **bold** and *italic*
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    if (match[2]) {
      parts.push(<strong key={match.index} style={{ color: theme.colors.cream, fontWeight: 600 }}>{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(<em key={match.index} style={{ color: theme.colors.gold }}>{match[3]}</em>)
    }
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(text.slice(last))
  }

  return parts.length > 0 ? parts : [text]
}

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
        className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
        style={{
          maxWidth:                '85%',
          background:              isUser ? theme.colors.primary : theme.colors.surface,
          color:                   theme.colors.cream,
          border:                  isUser ? 'none' : `1px solid ${theme.colors.gold}30`,
          borderBottomRightRadius: isUser ? 4 : undefined,
          borderBottomLeftRadius:  isUser ? undefined : 4,
        }}
      >
        {isUser
          ? <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{renderMarkdown(message.content)}</div>
        }
      </div>
    </div>
  )
}
