"use client"

import type React from "react"
import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Download,
  Copy,
  Settings,
  ImageIcon,
  Palette,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Monitor,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ColoredChar = {
  char: string
  color: string
}

type Preset = {
  name: string
  resolution: number
  charSet: string
  inverted: boolean
  grayscale: boolean
  icon: React.ReactNode
}

export default function AsciiConverter() {
  const [resolution, setResolution] = useState(0.11)
  const [inverted, setInverted] = useState(false)
  const [grayscale, setGrayscale] = useState(true)
  const [charSet, setCharSet] = useState("standard")
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [asciiArt, setAsciiArt] = useState<string>("")
  const [coloredAsciiArt, setColoredAsciiArt] = useState<ColoredChar[][]>([])
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [previewMode, setPreviewMode] = useState<"ascii" | "original">("ascii")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const outputCanvasRef = useRef<HTMLCanvasElement>(null)

  const charSets = {
    standard: " .:-=+*#%@",
    detailed: " .,:;i1tfLCG08@",
    blocks: " ░▒▓█",
    minimal: " .:█",
    custom: " .-~:;=!*#$@",
  }

  const presets: Preset[] = [
    {
      name: "Quick",
      resolution: 0.08,
      charSet: "minimal",
      inverted: false,
      grayscale: true,
      icon: <Zap className="h-4 w-4" />,
    },
    {
      name: "Detailed",
      resolution: 0.15,
      charSet: "detailed",
      inverted: false,
      grayscale: true,
      icon: <Eye className="h-4 w-4" />,
    },
    {
      name: "Colorful",
      resolution: 0.12,
      charSet: "standard",
      inverted: false,
      grayscale: false,
      icon: <Palette className="h-4 w-4" />,
    },
    {
      name: "Retro",
      resolution: 0.1,
      charSet: "blocks",
      inverted: true,
      grayscale: true,
      icon: <Monitor className="h-4 w-4" />,
    },
  ]

  useEffect(() => {
    document.documentElement.style.backgroundColor = "#0a0a0a"
    document.body.style.backgroundColor = "#0a0a0a"
    loadDefaultImage()

    return () => {
      document.documentElement.style.backgroundColor = ""
      document.body.style.backgroundColor = ""
    }
  }, [])

  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      setIsProcessing(true)
      const timer = setTimeout(() => {
        convertToAscii()
        setIsProcessing(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [resolution, inverted, grayscale, charSet, imageLoaded])

  useEffect(() => {
    if (imageLoaded && !loading && !error) {
      renderToCanvas()
    }
  }, [asciiArt, coloredAsciiArt, grayscale, loading, error, imageLoaded])

  const loadDefaultImage = () => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        setError("Invalid image dimensions")
        setLoading(false)
        return
      }

      imageRef.current = img
      setImageLoaded(true)
      setLoading(false)
    }

    img.onerror = () => {
      setError("Failed to load image")
      setLoading(false)
    }

    img.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CleanShot%202025-04-21%20at%2007.18.50%402x-dZYTCjkP7AhQCvCtNcNHt4amOQSwtX.png"
  }

  const loadImage = (src: string) => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        setError("Invalid image dimensions")
        setLoading(false)
        return
      }

      imageRef.current = img
      setImageLoaded(true)
      setLoading(false)
    }

    img.onerror = () => {
      setError("Failed to load image")
      setLoading(false)
    }

    img.src = src
  }

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        loadImage(e.target.result as string)
      }
    }
    reader.onerror = () => {
      setError("Failed to read file")
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(true)
  }

  const handleDragLeave = () => {
    setIsDraggingFile(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const adjustColorBrightness = (r: number, g: number, b: number, factor: number): string => {
    const minBrightness = 40
    r = Math.max(Math.min(Math.round(r * factor), 255), minBrightness)
    g = Math.max(Math.min(Math.round(g * factor), 255), minBrightness)
    b = Math.max(Math.min(Math.round(b * factor), 255), minBrightness)
    return `rgb(${r}, ${g}, ${b})`
  }

  const renderToCanvas = () => {
    if (!outputCanvasRef.current || !asciiArt || coloredAsciiArt.length === 0) return

    const canvas = outputCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const fontSize = 8
    ctx.font = `${fontSize}px monospace`
    ctx.textBaseline = "top"

    const lineHeight = fontSize
    const charWidth = fontSize * 0.6

    if (grayscale) {
      const lines = asciiArt.split("\n")
      const maxLineLength = Math.max(...lines.map((line) => line.length))
      canvas.width = maxLineLength * charWidth
      canvas.height = lines.length * lineHeight
    } else {
      canvas.width = coloredAsciiArt[0].length * charWidth
      canvas.height = coloredAsciiArt.length * lineHeight
    }

    ctx.font = `${fontSize}px monospace`
    ctx.textBaseline = "top"

    if (grayscale) {
      ctx.fillStyle = "white"
      asciiArt.split("\n").forEach((line, lineIndex) => {
        ctx.fillText(line, 0, lineIndex * lineHeight)
      })
    } else {
      coloredAsciiArt.forEach((row, rowIndex) => {
        row.forEach((col, colIndex) => {
          ctx.fillStyle = col.color
          ctx.fillText(col.char, colIndex * charWidth, rowIndex * lineHeight)
        })
      })
    }
  }

  const convertToAscii = () => {
    try {
      if (!canvasRef.current || !imageRef.current) {
        throw new Error("Canvas or image not available")
      }

      const img = imageRef.current

      if (img.width === 0 || img.height === 0) {
        throw new Error("Invalid image dimensions")
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      const width = Math.floor(img.width * resolution)
      const height = Math.floor(img.height * resolution)

      canvas.width = img.width
      canvas.height = img.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, img.width, img.height)

      let imageData
      try {
        imageData = ctx.getImageData(0, 0, img.width, img.height)
      } catch (e) {
        throw new Error("Failed to get image data. This might be a CORS issue.")
      }

      const data = imageData.data
      const chars = charSets[charSet as keyof typeof charSets]

      const fontAspect = 0.5
      const widthStep = Math.ceil(img.width / width)
      const heightStep = Math.ceil(img.height / height / fontAspect)

      let result = ""
      const coloredResult: ColoredChar[][] = []

      for (let y = 0; y < img.height; y += heightStep) {
        const coloredRow: ColoredChar[] = []

        for (let x = 0; x < img.width; x += widthStep) {
          const pos = (y * img.width + x) * 4

          const r = data[pos]
          const g = data[pos + 1]
          const b = data[pos + 2]

          let brightness
          if (grayscale) {
            brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
          } else {
            brightness = Math.sqrt(
              0.299 * (r / 255) * (r / 255) + 0.587 * (g / 255) * (g / 255) + 0.114 * (b / 255) * (b / 255),
            )
          }

          if (inverted) brightness = 1 - brightness

          const charIndex = Math.floor(brightness * (chars.length - 1))
          const char = chars[charIndex]

          result += char

          if (!grayscale) {
            const brightnessFactor = (charIndex / (chars.length - 1)) * 1.5 + 0.5
            const color = adjustColorBrightness(r, g, b, brightnessFactor)
            coloredRow.push({ char, color })
          } else {
            coloredRow.push({ char, color: "white" })
          }
        }

        result += "\n"
        coloredResult.push(coloredRow)
      }

      setAsciiArt(result)
      setColoredAsciiArt(coloredResult)
      setError(null)
    } catch (err) {
      console.error("Error converting to ASCII:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setAsciiArt("")
      setColoredAsciiArt([])
    }
  }

  const applyPreset = (preset: Preset) => {
    setResolution(preset.resolution)
    setCharSet(preset.charSet)
    setInverted(preset.inverted)
    setGrayscale(preset.grayscale)
  }

  const copyToClipboard = async () => {
    if (!asciiArt) {
      setError("No ASCII art to copy")
      return
    }

    try {
      await navigator.clipboard.writeText(asciiArt)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const el = document.createElement("textarea")
      el.value = asciiArt
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const downloadAsciiArt = () => {
    if (!asciiArt) {
      setError("No ASCII art to download")
      return
    }

    const element = document.createElement("a")
    const file = new Blob([asciiArt], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "ascii-art.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fillRule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fillOpacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              ASCII Art Studio
            </h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Transform your images into stunning ASCII art with advanced customization options and real-time preview
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Upload Image</h3>
                </div>

                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                    isDraggingFile
                      ? "border-purple-400 bg-purple-400/10"
                      : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30",
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">
                    {isDraggingFile ? "Drop your image here" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-slate-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Presets */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Quick Presets</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {presets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      className="h-auto p-4 bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 hover:border-purple-400 transition-all duration-200"
                      onClick={() => applyPreset(preset)}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {preset.icon}
                        <span className="text-sm font-medium text-white">{preset.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Settings</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-slate-400 hover:text-white"
                  >
                    {showSettings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <div className={cn("space-y-6 transition-all duration-300", showSettings ? "block" : "hidden")}>
                  {/* Resolution */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Resolution</Label>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {resolution.toFixed(2)}
                      </Badge>
                    </div>
                    <Slider
                      min={0.05}
                      max={0.3}
                      step={0.01}
                      value={[resolution]}
                      onValueChange={(value) => setResolution(value[0])}
                      className="[&>span]:border-none [&_.bg-primary]:bg-purple-500 [&>.bg-background]:bg-slate-600"
                    />
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Character Set */}
                  <div className="space-y-3">
                    <Label className="text-slate-300">Character Set</Label>
                    <Select value={charSet} onValueChange={setCharSet}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="blocks">Block Characters</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Switches */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Invert Colors</Label>
                      <Switch
                        checked={inverted}
                        onCheckedChange={setInverted}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Grayscale Mode</Label>
                      <Switch
                        checked={grayscale}
                        onCheckedChange={setGrayscale}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Download className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Export</h3>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={copyToClipboard}
                    disabled={loading || !imageLoaded || !asciiArt}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copySuccess ? "Copied!" : "Copy"}
                  </Button>

                  <Button
                    onClick={downloadAsciiArt}
                    disabled={loading || !imageLoaded || !asciiArt}
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm h-full">
              <CardContent className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Preview</h3>
                    {isProcessing && (
                      <div className="flex items-center gap-2 text-purple-400">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(previewMode === "ascii" ? "original" : "ascii")}
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      {previewMode === "ascii" ? "Show Original" : "Show ASCII"}
                    </Button>
                  </div>
                </div>

                <div className="relative bg-black rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center">
                  {loading ? (
                    <div className="flex items-center gap-3 text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span>Loading image...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center p-8">
                      <div className="text-red-400 mb-2">⚠️ Error</div>
                      <div className="text-slate-400">{error}</div>
                      <Button
                        onClick={loadDefaultImage}
                        variant="outline"
                        className="mt-4 border-slate-600 hover:bg-slate-700"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : previewMode === "original" && imageRef.current ? (
                    <img
                      src={imageRef.current.src || "/placeholder.svg"}
                      alt="Original"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <canvas
                      ref={outputCanvasRef}
                      className="max-w-full max-h-full object-contain"
                      style={{
                        fontSize: "0.4rem",
                        lineHeight: "0.4rem",
                        fontFamily: "monospace",
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden Elements */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
