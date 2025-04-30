import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../stores/interviewStore';
import { toast } from 'react-hot-toast';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause,
  XCircle,
  SkipForward,
  AlertCircle,
} from 'lucide-react';
import AudioPlayer from '../components/interview/AudioPlayer';
import AudioRecorder from '../components/interview/AudioRecorder';
import InterviewProgress from '../components/interview/InterviewProgress';

const InterviewSessionPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [answer, setAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  
  const {
    currentInterview,
    getInterview,
    startInterview,
    answerQuestion,
    completeInterview,
    isLoading,
    currentSessionIndex,
    setCurrentSessionIndex,
    userAudioBlob,
    isRecording,
  } = useInterviewStore();
  
  useEffect(() => {
    if (interviewId) {
      getInterview(interviewId);
    }
  }, [interviewId, getInterview]);
  
  useEffect(() => {
    // Focus on answer textarea when session changes
    if (answerRef.current && !isRecording) {
      answerRef.current.focus();
    }
  }, [currentSessionIndex, isRecording]);
  
  const handleStartInterview = async () => {
    if (!interviewId) return;
    
    try {
      await startInterview(interviewId);
      toast.success('Interview started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start interview');
    }
  };
  
  const handleSubmitAnswer = async () => {
    if (!interviewId || !currentInterview) return;
    
    if (!answer.trim() && !userAudioBlob) {
      toast.error('Please provide an answer or record your response');
      return;
    }
    
    try {
      await answerQuestion(interviewId, currentSessionIndex, answer, userAudioBlob || undefined);
      
      // Clear current answer
      setAnswer('');
      
      // If this was the last question, complete the interview
      if (currentSessionIndex === currentInterview.sessions.length - 1) {
        await completeInterview(interviewId);
        toast.success('Interview completed! Generating feedback...');
        navigate(`/interview/results/${interviewId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit answer');
    }
  };
  
  const handleSkipQuestion = async () => {
    if (!interviewId || !currentInterview) return;
    
    if (currentSessionIndex < currentInterview.sessions.length - 1) {
      setCurrentSessionIndex(currentSessionIndex + 1);
      setAnswer('');
    } else {
      // If this was the last question, complete the interview
      try {
        await completeInterview(interviewId);
        toast.success('Interview completed! Generating feedback...');
        navigate(`/interview/results/${interviewId}`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to complete interview');
      }
    }
  };
  
  if (isLoading && !currentInterview) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!currentInterview) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Not Found</h2>
          <p className="text-gray-600 mb-6">The interview you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const currentSession = currentInterview.sessions[currentSessionIndex];
  
  // If the interview is pending, show the start screen
  if (currentInterview.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Your Interview?</h1>
              <p className="text-gray-600 mb-8">
                You'll be interviewed for the <span className="font-semibold">{currentInterview.jobPosition}</span> position.
                The interview consists of {currentInterview.sessions.length} questions.
              </p>
              
              <div className="bg-primary-50 p-6 rounded-lg border border-primary-200 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Interview Tips</h3>
                <ul className="text-primary-800 space-y-3 text-left">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                      <div className="absolute inset-0 bg-primary-200 rounded-full"></div>
                      <div className="absolute inset-1 bg-primary-400 rounded-full"></div>
                    </div>
                    <p className="ml-3 text-gray-700">Find a quiet place where you won't be interrupted</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                      <div className="absolute inset-0 bg-primary-200 rounded-full"></div>
                      <div className="absolute inset-1 bg-primary-400 rounded-full"></div>
                    </div>
                    <p className="ml-3 text-gray-700">You can type your answers or use your microphone to record responses</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                      <div className="absolute inset-0 bg-primary-200 rounded-full"></div>
                      <div className="absolute inset-1 bg-primary-400 rounded-full"></div>
                    </div>
                    <p className="ml-3 text-gray-700">Take your time to think before answering</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                      <div className="absolute inset-0 bg-primary-200 rounded-full"></div>
                      <div className="absolute inset-1 bg-primary-400 rounded-full"></div>
                    </div>
                    <p className="ml-3 text-gray-700">You'll receive detailed feedback after completing all questions</p>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={handleStartInterview}
                disabled={isLoading}
                className="btn btn-primary px-8 py-3 text-base"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting Interview...
                  </div>
                ) : (
                  <>
                    Start Interview <Play className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Interview Progress */}
          <div className="mb-6">
            <InterviewProgress 
              currentIndex={currentSessionIndex}
              totalSessions={currentInterview.sessions.length}
              interviewPosition={currentInterview.jobPosition}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Question Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-semibold">Q</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {currentSession.question.text}
                  </h3>
                  
                  {/* Audio Player for Question */}
                  {currentSession.question.audioUrl && (
                    <div className="mt-3">
                      <AudioPlayer 
                        audioUrl={currentSession.question.audioUrl} 
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Answer Section */}
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-secondary-700 font-semibold">A</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Your Answer</h3>
                  
                 
                  <div className="mb-4">
                    <AudioRecorder />
                  </div>
              
                  <div className="relative">
                    <textarea
                      ref={answerRef}
                      value={answer}
                      onChange={(e) => {
                        setAnswer(e.target.value);
                        setIsTyping(true);
                      }}
                      onBlur={() => setIsTyping(false)}
                      placeholder="Type your answer here or use the microphone to record..."
                      rows={6}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      disabled={isRecording || isPlaying}
                    ></textarea>
                    
                    {answer && (
                      <button
                        onClick={() => setAnswer('')}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                    
                    {isTyping && (
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                        {answer.length} characters
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  className="btn btn-outline"
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip Question
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={isLoading || isRecording || (!answer.trim() && !userAudioBlob)}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSessionPage;