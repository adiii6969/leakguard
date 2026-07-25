'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Lock,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/app/page-header'
import { cn } from '@/lib/utils'
import { api, ApiError } from '@/lib/api'

export default function UploadPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    setFile(files[0])
    setProgress(100) // file selected & ready to analyze; real progress happens on submit
  }

  const handleAnalyze = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const result = await api.upload.statement(file)
      router.push(`/processing?statementId=${result.statement_id}`)
    } catch (err) {
      setUploading(false)
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not reach the analysis server. Please try again.'
      )
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 lg:px-8">
      <PageHeader
        title="Upload your statement"
        description="Drop your bank or card statement below. Everything is processed locally on your device and deleted the moment analysis completes."
      />

      <Card className="p-6 sm:p-8">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <motion.div
            animate={{ y: dragging ? -6 : 0 }}
            className="flex size-16 items-center justify-center rounded-2xl gradient-hero text-white shadow-soft"
          >
            <UploadCloud className="size-8" />
          </motion.div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">
            {dragging ? 'Drop it here' : 'Drag & drop your statement'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            or <span className="font-medium text-primary">browse files</span> from
            your computer
          </p>
        </div>

        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setProgress(0)
                      }}
                      aria-label="Remove file"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={progress} className="flex-1" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {progress === 100 ? (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="size-3.5" /> Ready
                        </span>
                      ) : (
                        `${progress}%`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File specs */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileSpreadsheet className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Supported files</p>
              <p className="text-sm font-semibold text-foreground">CSV, PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <UploadCloud className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Maximum size</p>
              <p className="text-sm font-semibold text-foreground">10 MB</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-12 flex-1 text-sm"
            disabled={!file || progress < 100 || uploading}
            onClick={handleAnalyze}
          >
            <Sparkles className="size-4" />
            {uploading ? 'Analyzing…' : 'Analyze Statement'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 flex-1 text-sm"
            onClick={() => router.push('/processing')}
          >
            Use Demo Statement
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm font-medium text-destructive">{error}</p>
        )}

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-success" />
          Your file is analyzed in memory and never written to disk or storage — nothing is retained after processing.
        </p>
      </Card>
    </div>
  )
}
