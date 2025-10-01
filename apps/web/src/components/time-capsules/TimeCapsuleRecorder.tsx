'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Heart, Mic, MicOff, Play, Square, Upload, Video, VideoOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeCapsuleRecorderProps {
  onSave: (data: TimeCapsuleData) => Promise<void>
  isLoading?: boolean
}

export interface TimeCapsuleData {
  title: string
  message: string
  messageType: 'text' | 'audio' | 'video'
  deliveryDate: string
  recipientEmail?: string
  recipientName?: string
  file?: File
}

export function TimeCapsuleRecorder({ onSave, isLoading = false }: TimeCapsuleRecorderProps) {
  const [formData, setFormData] = useState<TimeCapsuleData>({
    title: '',
    message: '',
    messageType: 'text',
    deliveryDate: '',
    recipientEmail: '',
    recipientName: ''
  })

  const [isRecording, setIsRecording] = useState(false)
  const [recordedFile, setRecordedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleInputChange = (field: keyof TimeCapsuleData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMessageTypeChange = (type: 'text' | 'audio' | 'video') => {
    setFormData(prev => ({ ...prev, messageType: type }))
    setRecordedFile(null)
    setPreviewUrl(null)
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: formData.messageType === 'video'
      })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: formData.messageType === 'video' ? 'video/webm' : 'audio/webm'
        })

        const file = new File([blob], `time-capsule-${Date.now()}.webm`, {
          type: blob.type
        })

        setRecordedFile(file)
        setFormData(prev => ({ ...prev, file }))

        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Nie je možné spustiť nahrávanie. Skontrolujte povolenia pre mikrofón/kameru.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setRecordedFile(file)
      setFormData(prev => ({ ...prev, file }))

      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.deliveryDate) {
      alert('Prosím vyplňte názov a dátum doručenia.')
      return
    }

    if (formData.messageType === 'text' && !formData.message.trim()) {
      alert('Prosím napíšte správu.')
      return
    }

    if ((formData.messageType === 'audio' || formData.messageType === 'video') && !recordedFile) {
      alert('Prosím nahrajte alebo vyberte súbor.')
      return
    }

    await onSave(formData)
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1) // Minimum tomorrow
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Časová schránka</CardTitle>
        <CardDescription>
          Vytvorte správu pre budúcnosť - pre seba alebo svojich blízkych
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Názov časovej schránky</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="napr. Správa pre moje 40. narodeniny"
            disabled={isLoading}
          />
        </div>

        {/* Message Type Selector */}
        <div className="space-y-3">
          <Label>Typ správy</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.messageType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleMessageTypeChange('text')}
              disabled={isLoading}
            >
              <span className="mr-2">📝</span>
              Text
            </Button>
            <Button
              type="button"
              variant={formData.messageType === 'audio' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleMessageTypeChange('audio')}
              disabled={isLoading}
            >
              <Mic className="h-4 w-4 mr-2" />
              Audio
            </Button>
            <Button
              type="button"
              variant={formData.messageType === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleMessageTypeChange('video')}
              disabled={isLoading}
            >
              <Video className="h-4 w-4 mr-2" />
              Video
            </Button>
          </div>
        </div>

        {/* Message Content */}
        {formData.messageType === 'text' ? (
          <div className="space-y-2">
            <Label htmlFor="message">Vaša správa</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Napíšte svoju správu pre budúcnosť..."
              className="min-h-32"
              disabled={isLoading}
            />
            <div className="text-sm text-muted-foreground">
              {formData.message.length} znakov
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Label>Audio/Video správa</Label>

            {/* Recording Controls */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  size="sm"
                  disabled={isLoading}
                >
                  {formData.messageType === 'video' ? (
                    <Video className="h-4 w-4 mr-2" />
                  ) : (
                    <Mic className="h-4 w-4 mr-2" />
                  )}
                  Začať nahrávanie
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={stopRecording}
                  variant="destructive"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Zastaviť nahrávanie
                </Button>
              )}

              <span className="text-sm text-muted-foreground">alebo</span>

              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Nahrať súbor
                  </span>
                </Button>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept={formData.messageType === 'video' ? 'video/*' : 'audio/*'}
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Nahrávam...</span>
              </div>
            )}

            {/* Preview */}
            {previewUrl && recordedFile && (
              <div className="space-y-2">
                <Label>Náhľad</Label>
                {formData.messageType === 'video' ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-w-md rounded-lg"
                  />
                ) : (
                  <audio
                    src={previewUrl}
                    controls
                    className="w-full"
                  />
                )}
                <Badge variant="secondary" className="text-xs">
                  {(recordedFile.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Delivery Date */}
        <div className="space-y-2">
          <Label htmlFor="deliveryDate">
            <Calendar className="h-4 w-4 inline mr-2" />
            Dátum doručenia
          </Label>
          <Input
            id="deliveryDate"
            type="date"
            value={formData.deliveryDate}
            onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
            min={minDateString}
            disabled={isLoading}
          />
        </div>

        {/* Optional Recipient */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Príjemca (voliteľné)</Label>
            <Badge variant="secondary" className="text-xs">
              Ak nevyplníte, správa sa doručí vám
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Meno príjemcu</Label>
              <Input
                id="recipientName"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                placeholder="napr. Mária Nováková"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Email príjemcu</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                placeholder="maria@email.com"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          <Clock className="h-4 w-4 mr-2" />
          {isLoading ? 'Ukladám...' : 'Vytvoriť časovú schránku'}
        </Button>
      </CardContent>
    </Card>
  )
}