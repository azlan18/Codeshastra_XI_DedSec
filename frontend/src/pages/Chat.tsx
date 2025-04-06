"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Copy, Download, ThumbsUp, ThumbsDown, Menu, Loader2, BarChart, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart as ReBarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: string
  visualizations?: Visualization[]
  isAccessDenied?: boolean
  denialReason?: string
  appealSent?: boolean
}

interface Visualization {
  type: string
  title: string
  subtitle?: string
  xAxisLabel?: string
  yAxisLabel?: string
  growthRate?: number
  data: Array<{
    name: string
    value: number
    previousValue?: number
    category?: string
    color?: string
  }>
  timeSeriesData?: Array<{
    date: string
    value: number
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#a4de6c"]
const GROWTH_POSITIVE_COLOR = "#4ade80"
const GROWTH_NEGATIVE_COLOR = "#ef4444"

export default function Chat() {
  const [input, setInput] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [empId, setEmpId] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null)
  const [typingText, setTypingText] = useState("")
  const [typingIndex, setTypingIndex] = useState(0)

  // Retrieve user data from localStorage with logging
  const authDataRaw = localStorage.getItem("authData")
  console.log("Raw localStorage 'authData':", authDataRaw)
  const authData = JSON.parse(authDataRaw || "{}")
  console.log("Parsed authData:", authData)
  const userProfile = authData.data || null
  console.log("userProfile (authData.data):", userProfile)

  // Default user profile for testing if none exists
  const defaultUserProfile = {
    user_role: "Employee",
    department: "Unknown",
    employee_status: "Full-time",
    past_violations: 0,
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Typing animation effect
  useEffect(() => {
    if (isLoading) {
      const texts = ["Thinking...", "Processing your request...", "Analyzing data...", "Generating response..."]

      const interval = setInterval(() => {
        setTypingIndex((prev) => (prev + 1) % texts.length)
        setTypingText(texts[(typingIndex + 1) % texts.length])
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isLoading, typingIndex])

  const sendAppealEmail = async (query: string, empId: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/mail/to-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "sahil.g.sharma7@gmail.com",
          subject: "Access Request Appeal",
          text: `I need access to information related to: "${query}"`,
          empId: empId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send appeal")
      }

      return true
    } catch (error) {
      console.error("Error sending appeal:", error)
      return false
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setError("")
    setIsLoading(true)

    try {
      // Use the userProfile if available, otherwise fallback to default
      const profileToSend = userProfile || defaultUserProfile
      if (!userProfile) {
        console.warn("No user profile found in localStorage under 'authData', using default:", defaultUserProfile)
      } else {
        console.log("Sending user_profile:", profileToSend)
      }

      const response = await fetch("http://localhost:5000/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          user_profile: profileToSend,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Access to this information has been denied.",
            timestamp: new Date().toLocaleTimeString(),
            isAccessDenied: true,
            denialReason: data.details || "No specific reason provided.",
            appealSent: false,
          }
          setMessages((prev) => [...prev, assistantMessage])
        } else {
          throw new Error(data.error || "Failed to get response")
        }
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.textResponse,
          timestamp: new Date().toLocaleTimeString(),
        }

        if (data.hasVisualizations && data.visualizations && data.visualizations.length > 0) {
          assistantMessage.visualizations = data.visualizations
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (err) {
      setError(`Failed to fetch response: ${err.message}. Try again.`)
      console.error("Error in handleSendMessage:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    alert("Copied to clipboard")
  }

  const handleAppeal = async (messageId: string, query: string) => {
    if (!empId.trim()) {
      alert("Please enter your Employee ID")
      return
    }

    setIsSending(true)
    setCurrentMessageId(messageId)
    const success = await sendAppealEmail(query, empId)
    setIsSending(false)
    setCurrentMessageId(null)

    if (success) {
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, appealSent: true } : msg)))
    } else {
      alert("Failed to send appeal. Please try again.")
    }
  }

  const renderAccessDeniedCard = (message: Message) => {
    const isSendingForThisMessage = isSending && currentMessageId === message.id

    return (
      <div className="mt-4 rounded-lg overflow-hidden border border-red-200 shadow-sm">
        <div className="bg-gradient-to-r from-red-600 to-blue-600 p-1">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-t-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg">Access Denied</h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Your request:</p>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm">
                {message.content}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Reason for denial:</p>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
                {message.denialReason}
              </div>
            </div>

            {!message.appealSent ? (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Need access? Send an appeal to the administrator</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="Enter your Employee ID"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  />
                  <Button
                    onClick={() => handleAppeal(message.id, message.content)}
                    disabled={isSendingForThisMessage || !empId.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSendingForThisMessage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
                      </>
                    ) : (
                      "Send Appeal"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-100 dark:border-green-800 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3 h-3 text-white"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-green-800 dark:text-green-300">
                    Appeal sent successfully! The administrator will review your request.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderTable = (content: string) => {
    // Check if content contains a markdown table
    if (!content.includes("|")) return null

    const lines = content.split("\n")
    const tableLines = lines.filter((line) => line.trim().startsWith("|"))

    if (tableLines.length < 2) return null

    // Extract headers and rows
    const headerLine = tableLines[0]
    const headers = headerLine
      .split("|")
      .filter((cell) => cell.trim() !== "")
      .map((cell) => cell.trim())

    // Skip the separator line
    const dataRows = tableLines.slice(2).map((line) =>
      line
        .split("|")
        .filter((cell) => cell.trim() !== "")
        .map((cell) => cell.trim()),
    )

    return (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dataRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderVisualization = (visualization: Visualization) => {
    const { type, title, subtitle, xAxisLabel, yAxisLabel, data, timeSeriesData, growthRate } = visualization

    return (
      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="mb-4">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {growthRate !== undefined && (
            <div
              className={`inline-flex items-center text-sm mt-1 px-2 py-0.5 rounded ${growthRate >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {growthRate >= 0 ? "↑" : "↓"} {Math.abs(growthRate)}% {growthRate >= 0 ? "increase" : "decrease"}
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          {type === "bar" && (
            <ReBarChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                label={xAxisLabel ? { value: xAxisLabel, position: "bottom", offset: 10 } : undefined}
                tick={{ fontSize: 12 }}
                height={60}
              />
              <YAxis
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "left", offset: -15 } : undefined}
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(229, 231, 235, 1)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Bar dataKey="value" fill="#3b82f6" name={yAxisLabel || "Value"} radius={[4, 4, 0, 0]} />
              {data[0]?.previousValue !== undefined && (
                <Bar dataKey="previousValue" fill="#93c5fd" name="Previous" radius={[4, 4, 0, 0]} />
              )}
            </ReBarChart>
          )}

          {type === "line" && (
            <ReLineChart data={timeSeriesData || data} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={timeSeriesData ? "date" : "name"}
                label={xAxisLabel ? { value: xAxisLabel, position: "bottom", offset: 10 } : undefined}
                tick={{ fontSize: 12 }}
                height={60}
              />
              <YAxis
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "left", offset: -15 } : undefined}
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(229, 231, 235, 1)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                activeDot={{ r: 8, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                name={yAxisLabel || "Value"}
              />
            </ReLineChart>
          )}

          {type === "area" && (
            <AreaChart data={timeSeriesData || data} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={timeSeriesData ? "date" : "name"}
                label={xAxisLabel ? { value: xAxisLabel, position: "bottom", offset: 10 } : undefined}
                tick={{ fontSize: 12 }}
                height={60}
              />
              <YAxis
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "left", offset: -15 } : undefined}
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(229, 231, 235, 1)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                name={yAxisLabel || "Value"}
              />
            </AreaChart>
          )}

          {type === "pie" && (
            <RePieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(229, 231, 235, 1)",
                }}
              />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 20 }} />
            </RePieChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  // Check if content contains a table
  const containsTable = (content: string) => {
    return (
      content.includes("|") &&
      content.includes("\n") &&
      content.split("\n").filter((line) => line.trim().startsWith("|")).length >= 2
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-80 border-r border-gray-200 bg-white shadow-sm relative"
          >
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold">
                  ER
                </div>
                <span className="font-semibold">Enterprise RAG Chat</span>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-64px)] p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Recent Conversations</h3>
                  {[1, 2, 3].map((i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-3 hover:bg-blue-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">Conversation {i}</div>
                        <div className="text-xs text-gray-500 truncate">Last message from this conversation...</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-gray-200 px-4 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-medium">Enterprise RAG Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessages([])}
              className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300 transition-colors"
            >
              New Chat
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Enterprise RAG Chat</h3>
                <p className="text-gray-500 mb-6">Ask a question to get started with our AI assistant</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {[
                    "What were our Q2 financial results?",
                    "Show me sales by region",
                    "Compare Q1 vs Q2 performance",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion)
                        textareaRef.current?.focus()
                      }}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn("flex gap-3 max-w-[90%]", message.role === "user" ? "ml-auto" : "")}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold mt-1 shadow-sm">
                      ER
                    </div>
                  )}
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{message.role === "assistant" ? "Assistant" : "You"}</span>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>
                    <div
                      className={cn(
                        "p-4 rounded-lg shadow-sm",
                        message.role === "assistant"
                          ? message.isAccessDenied
                            ? "bg-red-50 border border-red-200 text-red-800"
                            : "bg-white border border-gray-200 shadow-sm"
                          : "bg-blue-600 text-white shadow-sm",
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          {message.isAccessDenied ? (
                            <>
                              <div className="flex items-start gap-2">
                                <Lock className="h-5 w-5 mt-1" />
                                <div>
                                  <ReactMarkdown>{message.content}</ReactMarkdown>
                                </div>
                              </div>
                              {renderAccessDeniedCard(message)}
                            </>
                          ) : (
                            <>
                              {containsTable(message.content) ? (
                                <>
                                  {message.content.split("\n").map((line, idx) => {
                                    if (line.trim().startsWith("|") && line.includes("|")) {
                                      return null // Skip table lines, they'll be rendered by renderTable
                                    }
                                    return (
                                      <ReactMarkdown
                                        key={idx}
                                        components={{
                                          code({ node, inline, className, children, ...props }) {
                                            if (inline) {
                                              return (
                                                <code
                                                  className="bg-gray-100 px-1 py-0.5 rounded text-gray-800"
                                                  {...props}
                                                >
                                                  {children}
                                                </code>
                                              )
                                            }
                                            return (
                                              <div className="bg-gray-100 rounded-md p-3 my-2 overflow-auto">
                                                <code className="text-gray-800" {...props}>
                                                  {children}
                                                </code>
                                              </div>
                                            )
                                          },
                                          p({ children }) {
                                            return <p className="mb-2 last:mb-0">{children}</p>
                                          },
                                          ul({ children }) {
                                            return <ul className="list-disc pl-6 mb-2">{children}</ul>
                                          },
                                          ol({ children }) {
                                            return <ol className="list-decimal pl-6 mb-2">{children}</ol>
                                          },
                                          li({ children }) {
                                            return <li className="mb-1">{children}</li>
                                          },
                                          h1({ children }) {
                                            return <h1 className="text-xl font-bold mb-2">{children}</h1>
                                          },
                                          h2({ children }) {
                                            return <h2 className="text-lg font-bold mb-2">{children}</h2>
                                          },
                                          h3({ children }) {
                                            return <h3 className="text-md font-bold mb-2">{children}</h3>
                                          },
                                          blockquote({ children }) {
                                            return (
                                              <blockquote className="border-l-4 border-gray-200 pl-4 italic">
                                                {children}
                                              </blockquote>
                                            )
                                          },
                                        }}
                                      >
                                        {line}
                                      </ReactMarkdown>
                                    )
                                  })}
                                  {renderTable(message.content)}
                                </>
                              ) : (
                                <ReactMarkdown
                                  components={{
                                    code({ node, inline, className, children, ...props }) {
                                      if (inline) {
                                        return (
                                          <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800" {...props}>
                                            {children}
                                          </code>
                                        )
                                      }
                                      return (
                                        <div className="bg-gray-100 rounded-md p-3 my-2 overflow-auto">
                                          <code className="text-gray-800" {...props}>
                                            {children}
                                          </code>
                                        </div>
                                      )
                                    },
                                    p({ children }) {
                                      return <p className="mb-2 last:mb-0">{children}</p>
                                    },
                                    ul({ children }) {
                                      return <ul className="list-disc pl-6 mb-2">{children}</ul>
                                    },
                                    ol({ children }) {
                                      return <ol className="list-decimal pl-6 mb-2">{children}</ol>
                                    },
                                    li({ children }) {
                                      return <li className="mb-1">{children}</li>
                                    },
                                    h1({ children }) {
                                      return <h1 className="text-xl font-bold mb-2">{children}</h1>
                                    },
                                    h2({ children }) {
                                      return <h2 className="text-lg font-bold mb-2">{children}</h2>
                                    },
                                    h3({ children }) {
                                      return <h3 className="text-md font-bold mb-2">{children}</h3>
                                    },
                                    blockquote({ children }) {
                                      return (
                                        <blockquote className="border-l-4 border-gray-200 pl-4 italic">
                                          {children}
                                        </blockquote>
                                      )
                                    },
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              )}
                              {message.visualizations && message.visualizations.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                                    <BarChart className="h-4 w-4" /> Data Visualizations
                                  </h3>
                                  {message.visualizations.map((vis, index) => (
                                    <div key={`vis-${message.id}-${index}`} className="mb-6 last:mb-0">
                                      {renderVisualization(vis)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                    {message.role === "assistant" && !message.isAccessDenied && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 max-w-[90%]"
              >
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold mt-1 shadow-sm">
                    ER
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Assistant</span>
                      <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-blue-600 animate-pulse"></div>
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-600 animate-ping"></div>
                        </div>
                        <div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-48 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center">
                        <span className="text-blue-600 font-medium">{typingText}</span>
                        <span className="ml-1 inline-flex">
                          <span className="animate-bounce mx-0.5 delay-0">.</span>
                          <span className="animate-bounce mx-0.5 delay-150">.</span>
                          <span className="animate-bounce mx-0.5 delay-300">.</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg shadow-sm"
              >
                {error}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] max-h-[200px] resize-none bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className={`h-10 w-10 rounded-full ${
                  isLoading || !input.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
                }`}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  )
}

