'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface PdfMaintenanceDialogProps {
  open: boolean
  onUseDemo: () => void
  onClose: () => void
}

export function PdfMaintenanceDialog({
  open,
  onUseDemo,
  onClose,
}: PdfMaintenanceDialogProps) {
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
          <Card className="w-full max-w-sm p-6 text-center">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-warning/12 text-warning">
              <ShieldAlert className="size-6" />
            </span>

            <h3 className="mt-4 font-semibold text-foreground">
              PDF analysis temporarily unavailable
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              For bank security reasons, we&apos;re researching and working on
              secure PDF statement support. Please cooperate by using the demo
              statement in the meantime.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full" onClick={onUseDemo}>
                Use Demo Statement
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
