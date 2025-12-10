'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { uploadImage, getFullImageUrl } from '@/lib/api/upload'
import { toast } from 'sonner'
import { UPLOAD } from '@/lib/constants'

interface ImageUploadFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ImageUploadField({ value, onChange, disabled }: ImageUploadFieldProps) {
  const t = useTranslations('common.upload')
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [previewError, setPreviewError] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const previewUrl = React.useMemo(() => {
    if (!value) return ''
    return getFullImageUrl(value)
  }, [value])

  const handleFileSelect = async (file: File) => {
    if (!UPLOAD.ALLOWED_TYPES.includes(file.type as typeof UPLOAD.ALLOWED_TYPES[number])) {
      toast.error(t('invalidType'))
      return
    }

    if (file.size > UPLOAD.MAX_FILE_SIZE) {
      toast.error(t('tooLarge', { maxSize: UPLOAD.MAX_FILE_SIZE_MB }))
      return
    }

    setIsUploading(true)
    setPreviewError(false)

    try {
      const response = await uploadImage(file)
      onChange(response.imageUrl)
      toast.success(t('success'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled || isUploading) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleClear = () => {
    onChange('')
    setPreviewError(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || isUploading) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label={t('clickOrDrag')}
        aria-disabled={disabled || isUploading}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={UPLOAD.ALLOWED_TYPES.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <>
            <Loader2 className="size-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">{t('uploading')}</p>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">{t('clickOrDrag')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('allowedFormats', { maxSize: UPLOAD.MAX_FILE_SIZE_MB })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      {previewUrl && !previewError && (
        <div className="relative inline-block">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted">
            {/* FE-018: Native img is intentional here because:
                1. Preview images may be blob URLs or data URLs from file input
                2. Next.js Image doesn't support blob/data URLs well
                3. onError handler needs native img behavior for error states */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Product image preview"
              className="w-full h-full object-cover"
              onError={() => setPreviewError(true)}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute -top-2 -right-2"
            onClick={handleClear}
            disabled={disabled || isUploading}
            aria-label={t('remove')}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Preview Error */}
      {previewUrl && previewError && (
        <div className="relative inline-block">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute -top-2 -right-2"
            onClick={handleClear}
            disabled={disabled || isUploading}
            aria-label={t('remove')}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
