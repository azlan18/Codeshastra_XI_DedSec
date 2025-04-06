"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Lock, Mail, User, Shield, ArrowRight } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const endpoint = isAdmin ? "/api/employees/login" : "/api/users/login"

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      // Store user/admin data in localStorage
      localStorage.setItem(
        "authData",
        JSON.stringify({
          role: isAdmin ? "admin" : "user",
          data: isAdmin ? data.admin : data.user,
        }),
      )

      // Redirect to /chat
      navigate("/chat")
    } catch (err: any) {
      setError(err.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLoginType = () => {
    setIsAdmin(!isAdmin)
    setEmail("")
    setPassword("")
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 sm:px-6 md:px-8 max-w-[600px]"
      >
        <Card className="w-full shadow-lg border-0 overflow-hidden bg-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-red-500/5 pointer-events-none" />

          <CardHeader className="space-y-1 pb-6 relative z-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-red-100"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isAdmin ? "admin" : "user"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {isAdmin ? <Shield className="h-8 w-8 text-red-600" /> : <User className="h-8 w-8 text-blue-600" />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <CardTitle className="text-3xl font-bold text-center">Enterprise RAG</CardTitle>
            <CardDescription className="text-center text-base">
              {isAdmin ? "Admin Login" : "User Login"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 px-6 sm:px-8 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={isAdmin ? "admin" : "user"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder={isAdmin ? "Admin email" : "Email address"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 h-12 text-base"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      className="text-red-500 text-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className={`w-full h-12 text-white text-base ${
                        isAdmin ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        `Sign in as ${isAdmin ? "Admin" : "User"}`
                      )}
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 text-center space-y-4 relative z-20">
              <Button
                type="button"
                variant="ghost"
                onClick={toggleLoginType}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative z-20"
              >
                {isAdmin ? (
                  <>
                    Switch to User Login
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Switch to Admin Login
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <motion.p
                className="text-muted-foreground text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Secure enterprise authentication
              </motion.p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

