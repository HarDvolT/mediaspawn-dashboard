import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  created_at: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load existing messages on open
  useEffect(() => {
    if (isOpen) {
      loadMessages()
    }
  }, [isOpen])

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)

      if (!error && data) {
        setMessages(data.map(m => ({
          id: m.id,
          content: m.content,
          sender: m.sender,
          created_at: m.created_at,
        })))
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
      // If table doesn't exist, start with empty messages
      setMessages([])
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)

    // Add user message optimistically
    const tempId = Date.now().toString()
    setMessages(prev => [...prev, {
      id: tempId,
      content: userMessage,
      sender: 'user',
      created_at: new Date().toISOString(),
    }])

    try {
      // Save to database
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: userMessage,
          sender: 'user',
        })

      if (error) {
        // If table doesn't exist, still show the message
        console.log('Chat table not yet created, message stored locally')
      }

      // Placeholder AI response (no actual AI backend)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: "Thanks for your message! This is a placeholder response. AI integration will be added later.",
          sender: 'assistant',
          created_at: new Date().toISOString(),
        }])
        setSending(false)
      }, 1000)
    } catch (err) {
      console.error('Failed to send message:', err)
      setSending(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-40"
        style={{
          background: isOpen ? '#1e2030' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col z-40"
          style={{
            background: '#0d0e14',
            border: '1px solid #1e2030',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-t-2xl"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Assistant</h3>
              <p className="text-white/70 text-xs">Ask me anything</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Start a conversation</p>
                <p className="text-gray-600 text-xs mt-1">AI integration coming soon</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-violet-500 text-white rounded-br-md'
                      : 'bg-gray-800 text-gray-300 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl px-4 py-3 rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t" style={{ borderColor: '#1e2030' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 bg-gray-800 text-white text-sm rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                }}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
