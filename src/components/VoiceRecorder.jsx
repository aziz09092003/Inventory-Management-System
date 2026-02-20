import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Loader2 } from 'lucide-react'

/**
 * VoiceRecorder Component
 * Records audio using MediaRecorder API
 * Returns audio blob when recording is stopped
 */
function VoiceRecorder({ onRecordingComplete, minDuration = 3, maxDuration = 15 }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const durationRef = useRef(0) // Track duration in ref to avoid closure issues

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // Auto-stop when max duration reached
  useEffect(() => {
    if (duration >= maxDuration && isRecording) {
      stopRecording()
    }
  }, [duration, maxDuration, isRecording])

  const startRecording = async () => {
    setError('')
    audioChunksRef.current = []
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      })
      
      streamRef.current = stream
      
      // Setup audio analysis for visual feedback
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      
      // Start visual feedback
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 128) // Normalize to 0-2 range
        }
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Use ref value instead of state to avoid closure issues
        if (durationRef.current < minDuration) {
          setError(`Please record for at least ${minDuration} seconds`)
        } else {
          onRecordingComplete(audioBlob)
        }
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        setAudioLevel(0)
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setDuration(0)
      durationRef.current = 0 // Reset ref too
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          durationRef.current = newDuration // Keep ref in sync
          return newDuration
        })
      }, 1000)
      
    } catch (err) {
      console.error('Microphone access error:', err)
      setError('Could not access microphone. Please allow microphone permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
      {/* Audio Level Indicator */}
      <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-100"
          style={{ width: `${Math.min(audioLevel * 50, 100)}%` }}
        />
      </div>
      
      {/* Timer */}
      <div className="text-2xl font-mono text-gray-700 dark:text-gray-200">
        {formatTime(duration)} / {formatTime(maxDuration)}
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            duration >= minDuration ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${(duration / maxDuration) * 100}%` }}
        />
      </div>
      
      {/* Record Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isRecording ? (
          <Square className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>
      
      {/* Status Text */}
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {isRecording 
          ? duration < minDuration 
            ? `Keep speaking... (${minDuration - duration}s more)` 
            : 'Click to stop recording'
          : 'Click to start recording'
        }
      </p>
      
      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

export default VoiceRecorder
