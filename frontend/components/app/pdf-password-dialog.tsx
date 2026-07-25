'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface PdfPasswordDialogProps {
  open: boolean
  fileName: string
  incorrect: boolean
  submitting: boolean
  onSubmit: (password: string) => void
  onClose: () => void
}

export function PdfPasswordDialog({
  open,
  fileName,
  incorrect,
  submitting,
  onSubmit,
  onClose,
}: PdfPasswordDialogProps) {
  const [password, setPassword] = useState('')

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full max-w-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="size-4" />
                </span>
                <h3 className="font-semibold text-foreground">
                  Password protected PDF
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{fileName}</span> is
              encrypted. Enter the password to unlock and analyze it.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (password.trim()) onSubmit(password)
              }}
              className="mt-4 space-y-3"
            >
              <Input
                type="password"
                autoFocus
                placeholder="Statement password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="PDF password"
              />

              {incorrect && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <AlertCircle className="size-3.5" />
                  Incorrect password. Please try again.
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!password.trim() || submitting}
              >
                {submitting ? 'Unlocking…' : 'Unlock & Analyze'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Your password is used only to decrypt this file in memory and is
              never stored.
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
