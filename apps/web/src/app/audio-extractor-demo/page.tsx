"use client";

import { useState } from "react";
import { VideoUploadZone, VideoFile } from "@/components/video-upload-zone";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Music, Waves, Info, Download } from "lucide-react";
import { toast } from "sonner";
import {
  extractAudioData,
  formatAudioMetadata,
  formatAudioAnalysis,
  AudioExtractionError,
} from "@/lib/audio-extractor";
import { getAudioContextManager } from "@/lib/audio-context-manager";
import type { ExtractedAudioData } from "@/lib/audio-extractor";

export default function AudioExtractorDemoPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [extractedAudio, setExtractedAudio] = useState<ExtractedAudioData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleVideoSelect = (video: VideoFile) => {
    setSelectedVideo(video);
    setExtractedAudio(null);
    setErrors([]);
    toast.success("Video uploaded successfully!", {
      description: `${video.file.name} (${(video.file.size / 1024 / 1024).toFixed(2)} MB)`,
    });
  };

  const handleError = (errorMessages: string[]) => {
    setErrors(errorMessages);
    errorMessages.forEach((error) => {
      toast.error("Upload error", {
        description: error,
      });
    });
  };

  const handleReset = () => {
    setSelectedVideo(null);
    setExtractedAudio(null);
    setErrors([]);
  };

  const handleExtractAudio = async () => {
    if (!selectedVideo) return;

    setIsExtracting(true);
    setErrors([]);

    try {
      // Initialize audio context manager (requires user gesture)
      const manager = getAudioContextManager();
      await manager.resume();

      // Extract audio data
      const audioData = await extractAudioData(selectedVideo.file, {
        timeout: 60000, // 60 seconds
        analyze: true,
        generateWaveform: true,
        waveformSamples: 200,
        audioContextManager: manager,
      });

      setExtractedAudio(audioData);
      toast.success("Audio extracted successfully!", {
        description: `Duration: ${formatAudioMetadata(audioData.metadata).duration}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof AudioExtractionError
          ? error.message
          : "Failed to extract audio data";

      setErrors([errorMessage]);
      toast.error("Extraction failed", {
        description: errorMessage,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadWav = () => {
    if (!extractedAudio) return;

    try {
      const { audioBufferToWav } = require("@/lib/audio-extractor");
      const wavArrayBuffer = audioBufferToWav(extractedAudio.audioBuffer);

      const blob = new Blob([wavArrayBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedVideo?.file.name.replace(/\.[^/.]+$/, "")}_audio.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("WAV file downloaded!");
    } catch (error) {
      toast.error("Failed to download WAV file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const renderWaveform = () => {
    if (!extractedAudio?.waveform) return null;

    const { waveform } = extractedAudio;
    const maxAmplitude = Math.max(...waveform.amplitudes);

    return (
      <div className="relative h-32 w-full bg-muted rounded-md overflow-hidden">
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox={`0 0 ${waveform.amplitudes.length} 1`}
        >
          {waveform.amplitudes.map((amplitude, index) => {
            const height = maxAmplitude > 0 ? amplitude / maxAmplitude : 0;
            const x = index;
            const y = (1 - height) / 2;
            const barHeight = height;

            return (
              <rect
                key={index}
                x={x}
                y={y}
                width="1"
                height={barHeight}
                fill="currentColor"
                className="text-primary"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Music className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Audio Extractor</h1>
            <p className="text-muted-foreground">
              Extract audio data from uploaded video files using Web Audio API
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Error Display */}
        {errors.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="flex items-start gap-3 pt-4">
              <AlertCircle className="size-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-semibold text-destructive">
                  Errors
                </h3>
                <ul className="list-inside list-disc text-xs text-destructive/90">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>
              Upload a video file to extract its audio data. Maximum file size: 100MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUploadZone
              onVideoSelect={handleVideoSelect}
              onError={handleError}
              maxSize={100 * 1024 * 1024}
            />
          </CardContent>
        </Card>

        {/* Selected Video & Extract Button */}
        {selectedVideo && !extractedAudio && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Video</CardTitle>
              <CardDescription>
                {selectedVideo.file.name} ({(selectedVideo.file.size / 1024 / 1024).toFixed(2)} MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={handleExtractAudio} disabled={isExtracting}>
                  {isExtracting ? "Extracting..." : "Extract Audio"}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isExtracting}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Audio Results */}
        {extractedAudio && (
          <>
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="size-5" />
                  Audio Extraction Complete
                </CardTitle>
                <CardDescription>
                  Audio data successfully extracted from video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleDownloadWav} variant="default">
                    <Download className="size-4 mr-2" />
                    Download as WAV
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Extract Another Video
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Waveform Visualization */}
            {extractedAudio.waveform && (
              <Card>
                <CardHeader>
                  <CardTitle>Waveform Visualization</CardTitle>
                  <CardDescription>
                    Visual representation of the audio waveform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderWaveform()}
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>0:00</span>
                    <span>
                      {formatAudioMetadata(extractedAudio.metadata).duration}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Audio Metadata</CardTitle>
                <CardDescription>
                  Detailed information about the extracted audio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-4">
                  <dl className="grid gap-3 text-sm">
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-muted-foreground">Duration:</dt>
                      <dd>{formatAudioMetadata(extractedAudio.metadata).duration}</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-muted-foreground">Sample Rate:</dt>
                      <dd>{formatAudioMetadata(extractedAudio.metadata).sampleRate}</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-muted-foreground">Channels:</dt>
                      <dd>{formatAudioMetadata(extractedAudio.metadata).channels}</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-muted-foreground">Total Samples:</dt>
                      <dd>{formatAudioMetadata(extractedAudio.metadata).length}</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-muted-foreground">Number of Channels:</dt>
                      <dd>{extractedAudio.metadata.numberOfChannels}</dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>

            {/* Audio Analysis */}
            {extractedAudio.analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Audio Analysis</CardTitle>
                  <CardDescription>
                    Amplitude and loudness analysis of the audio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted p-4">
                    <dl className="grid gap-3 text-sm">
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <dt className="font-medium text-muted-foreground">Peak Level:</dt>
                        <dd>{formatAudioAnalysis(extractedAudio.analysis).peakLevel}</dd>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <dt className="font-medium text-muted-foreground">RMS Level:</dt>
                        <dd>{formatAudioAnalysis(extractedAudio.analysis).rmsLevel}</dd>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <dt className="font-medium text-muted-foreground">Peak (dB):</dt>
                        <dd>{formatAudioAnalysis(extractedAudio.analysis).peakDecibels}</dd>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <dt className="font-medium text-muted-foreground">RMS (dB):</dt>
                        <dd>{formatAudioAnalysis(extractedAudio.analysis).rmsDecibels}</dd>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <dt className="font-medium text-muted-foreground">Loudness:</dt>
                        <dd>{formatAudioAnalysis(extractedAudio.analysis).loudness}</dd>
                      </div>
                    </dl>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-5" />
              Features
            </CardTitle>
            <CardDescription>Capabilities of the audio extractor</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Extract audio data from video files using Web Audio API</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Decode audio data for analysis and processing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Extract comprehensive audio metadata (duration, sample rate, channels)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Analyze audio properties (peak levels, RMS, loudness in dB/LUFS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Generate waveform data for visualization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Convert audio to WAV format for download</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Support for multi-channel audio (mono, stereo, surround)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Proper AudioContext lifecycle management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Comprehensive error handling and timeout management</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Usage Example */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Example</CardTitle>
            <CardDescription>
              How to use the audio extractor in your code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4 overflow-x-auto">
              <pre className="text-xs">
                <code>{`import { extractAudioData } from '@/lib/audio-extractor';

// Extract audio from a video file
const audioData = await extractAudioData(videoFile, {
  timeout: 60000,
  analyze: true,
  generateWaveform: true,
  waveformSamples: 200,
});

// Access metadata
console.log(audioData.metadata.duration);
console.log(audioData.metadata.sampleRate);
console.log(audioData.metadata.numberOfChannels);

// Access analysis
console.log(audioData.analysis?.peakLevel);
console.log(audioData.analysis?.rmsDecibels);
console.log(audioData.analysis?.loudness);

// Access waveform
console.log(audioData.waveform?.amplitudes);

// Convert to WAV
const { audioBufferToWav } = await import('@/lib/audio-extractor');
const wavData = audioBufferToWav(audioData.audioBuffer);`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
