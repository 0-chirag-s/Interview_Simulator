import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Mic, MicOff, StopCircle } from 'lucide-react';
import { useInterviewStore } from '../../stores/interviewStore';

const AudioRecorder = () => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { isRecording, setIsRecording, setUserAudioBlob } = useInterviewStore();
  
  useEffect(() => {
    const requestMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setIsPermissionGranted(true);
      } catch (error) {
        console.error('Error requesting microphone permission:', error);
        setIsPermissionGranted(false);
      }
    };
    
    requestMicrophonePermission();
    
    // Clean up
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const startRecording = async () => {
    if (!isPermissionGranted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setIsPermissionGranted(true);
      } catch (error) {
        toast.error('Microphone permission denied');
        return;
      }
    }
    
    if (!streamRef.current) {
      toast.error('Failed to access microphone');
      return;
    }
    
    chunksRef.current = [];
    setRecordingTime(0);
    
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setUserAudioBlob(audioBlob);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    
    mediaRecorder.start();
    setIsRecording(true);
    
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prevTime => prevTime + 1);
    }, 1000);
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      {isRecording ? (
        <button
          onClick={stopRecording}
          className="btn bg-error-600 hover:bg-error-700 text-white"
        >
          <StopCircle className="mr-2 h-5 w-5" />
          Stop Recording
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={!isPermissionGranted}
          className="btn btn-outline"
        >
          <Mic className="mr-2 h-5 w-5" />
          Record Answer
        </button>
      )}
      
      {isRecording && (
        <div className="text-error-600 pulse-recording pl-4">
          Recording {formatTime(recordingTime)}
        </div>
      )}
      
      {!isPermissionGranted && (
        <div className="text-warning-600 text-sm flex items-center">
          <MicOff className="h-4 w-4 mr-1" />
          Microphone access needed
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;