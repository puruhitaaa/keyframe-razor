"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  extractVideoMetadata,
  formatDuration,
  formatDimensions,
  formatAspectRatio,
  formatBitrate,
  type VideoMetadata,
} from "@/lib/video-metadata-extractor"
import { Upload, FileVideo, Clock, Settings, Database, Music } from "lucide-react"

export default function VideoMetadataDemoPage() {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setMetadata(null)

    try {
      const result = await extractVideoMetadata(file, {
        timeout: 10000,
        extractAudioTracks: true,
        calculateBitrate: true,
      })
      setMetadata(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract metadata")
    } finally {
      setLoading(false)
    }
  }

  const MetadataItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <Icon className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-all">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Video Metadata Extractor</h1>
            <p className="text-muted-foreground text-lg">
              Extract comprehensive metadata from video files using HTML5 video element APIs
            </p>
          </div>

          {/* Upload Section */}
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4">
              <label
                htmlFor="video-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP4, WebM, OGG, MOV, AVI, MKV (MAX. 500MB)
                  </p>
                </div>
                <input
                  id="video-upload"
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>

              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Extracting metadata...</span>
                </div>
              )}

              {error && (
                <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Metadata Display */}
          {metadata && (
            <Card className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <FileVideo className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Video Metadata</h2>
                </div>

                <div className="grid gap-4">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <MetadataItem
                      icon={Clock}
                      label="Duration"
                      value={`${formatDuration(metadata.duration)} (${metadata.duration.toFixed(2)}s)`}
                    />
                    <MetadataItem
                      icon={Settings}
                      label="Resolution"
                      value={formatDimensions(metadata.width, metadata.height)}
                    />
                    <MetadataItem
                      icon={Settings}
                      label="Aspect Ratio"
                      value={formatAspectRatio(metadata.aspectRatio)}
                    />
                    <MetadataItem
                      icon={Database}
                      label="File Size"
                      value={metadata.fileSizeFormatted}
                    />
                  </div>

                  {/* Technical Details */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Technical Details</h3>
                    <MetadataItem
                      icon={FileVideo}
                      label="MIME Type"
                      value={metadata.mimeType}
                    />
                    {metadata.codec && (
                      <MetadataItem
                        icon={FileVideo}
                        label="Video Codec"
                        value={metadata.codec}
                      />
                    )}
                    {metadata.bitrate && (
                      <MetadataItem
                        icon={Database}
                        label="Estimated Bitrate"
                        value={formatBitrate(metadata.bitrate)}
                      />
                    )}
                  </div>

                  {/* Audio Information */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Audio Information</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        metadata.hasAudio
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}>
                        {metadata.hasAudio ? "Has Audio" : "No Audio"}
                      </span>
                    </div>

                    {metadata.hasAudio && metadata.audioTracks && metadata.audioTracks.length > 0 ? (
                      <div className="space-y-2">
                        {metadata.audioTracks.map((track, index) => (
                          <div key={track.id || index} className="p-3 bg-muted/50 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Track:</span>{" "}
                                <span className="font-medium">{track.label}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Kind:</span>{" "}
                                <span className="font-medium">{track.kind}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Language:</span>{" "}
                                <span className="font-medium">{track.language}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>{" "}
                                <span className="font-medium">{track.enabled ? "Enabled" : "Disabled"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : metadata.hasAudio ? (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                        Audio track detected but detailed information not available in this browser.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                        No audio tracks detected.
                      </p>
                    )}
                  </div>

                  {/* Raw Data */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Raw Metadata</h3>
                    <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Features Section */}
          <Card className="p-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Features</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Extract video duration, dimensions, and aspect ratio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Identify video and audio codecs from MIME type</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Detect and enumerate audio tracks with detailed information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Calculate file size and estimated bitrate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Support for multiple video formats (MP4, WebM, OGG, MOV, AVI, MKV)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Configurable timeout and extraction options</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Usage Example */}
          <Card className="p-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Usage Example</h2>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`import { extractVideoMetadata, formatDuration } from '@/lib/video-metadata-extractor'

// Extract metadata from a file
const file = document.querySelector('input[type="file"]').files[0]
const metadata = await extractVideoMetadata(file)

console.log(\`Duration: \${formatDuration(metadata.duration)}\`)
console.log(\`Resolution: \${metadata.width}x\${metadata.height}\`)
console.log(\`Codec: \${metadata.codec}\`)
console.log(\`Has Audio: \${metadata.hasAudio}\`)`}
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
