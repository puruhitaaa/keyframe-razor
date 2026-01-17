"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react"

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string
  poster?: string
}

export function VideoPlayer({
  src,
  poster,
  className,
  ...props
}: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(1)
  const [isMuted, setIsMuted] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showControls, setShowControls] = React.useState(true)
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout>()
  const seekSliderRef = React.useRef<HTMLInputElement>(null)
  const volumeSliderRef = React.useRef<HTMLInputElement>(null)

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when the player or its container has focus
      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== containerRef.current
      ) {
        return
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "ArrowLeft":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
            seekSliderRef.current?.focus()
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5)
            seekSliderRef.current?.focus()
          }
          break
        case "ArrowUp":
          e.preventDefault()
          if (volume < 1) {
            const newVolume = Math.min(1, volume + 0.1)
            setVolume(newVolume)
            if (videoRef.current) {
              videoRef.current.volume = newVolume
            }
            volumeSliderRef.current?.focus()
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (volume > 0) {
            const newVolume = Math.max(0, volume - 0.1)
            setVolume(newVolume)
            if (videoRef.current) {
              videoRef.current.volume = newVolume
            }
            volumeSliderRef.current?.focus()
          }
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
        case "Home":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = 0
            seekSliderRef.current?.focus()
          }
          break
        case "End":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = duration
            seekSliderRef.current?.focus()
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isPlaying, duration, volume, isMuted])

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      if (newVolume > 0) {
        setIsMuted(false)
      }
    }
  }

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Handle fullscreen change
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Auto-hide controls when playing
  React.useEffect(() => {
    if (isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Handle video end
  const handleEnded = () => {
    setIsPlaying(false)
    setShowControls(true)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group bg-black rounded-lg overflow-hidden",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      role="region"
      aria-label="Video player"
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        aria-label={`Video ${formatTime(currentTime)} of ${formatTime(duration)}`}
        {...props}
      />

      {/* Play/Pause Overlay Button */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          aria-label="Play"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
            <Play className="w-6 h-6 sm:w-8 sm:h-8 text-black ml-1" />
          </div>
        </button>
      )}

      {/* Controls Bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300",
          "pt-8 pb-2 px-2 sm:px-4",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
        role="toolbar"
        aria-label="Video playback controls"
      >
        {/* Progress Bar */}
        <div className="mb-2 sm:mb-3">
          <input
            ref={seekSliderRef}
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 sm:h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
            aria-label={`Seek: ${formatTime(currentTime)} of ${formatTime(duration)}. Use left and right arrow keys to seek.`}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20 flex-shrink-0"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>

            {/* Time Display - Hide on very small screens, show abbreviated on mobile */}
            <span className="text-white text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0">
              <span className="hidden xs:inline">{formatTime(currentTime)} / {formatTime(duration)}</span>
              <span className="xs:hidden">{formatTime(currentTime)}</span>
            </span>

            {/* Volume Control - Hide slider on mobile, show toggle only */}
            <div className="flex items-center gap-1 sm:gap-2 ml-0 sm:ml-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20 flex-shrink-0"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </Button>
              <input
                ref={volumeSliderRef}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden xs:block w-16 sm:w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer flex-shrink-0"
                aria-label={`Volume: ${Math.round(volume * 100)}%. Use up and down arrow keys to adjust.`}
              />
            </div>
          </div>

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20 flex-shrink-0"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Maximize className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
