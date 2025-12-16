import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    MicOff,
    StopCircle,
    Volume2,
    VolumeX,
    Clock,
    AlertTriangle,
    CheckCircle,
    ArrowRight,
    BarChart3,
    XCircle
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/constants';
import BotAvatar from '../components/interview/BotAvatar';
import ResponseTimer from '../components/interview/ResponseTimer';

interface Score {
    technical: number;
    communication: number;
    confidence: number;
}

interface Question {
    questionText: string;
    audioUrl: string;
    questionNumber: number;
    totalQuestions: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

interface Analysis {
    transcript: string;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    keywords: string[];
    fillerWordCount: number;
}

type BotStatus = 'idle' | 'speaking' | 'listening' | 'processing' | 'waiting';

const ConversationalInterviewPage = () => {
    const { interviewId } = useParams<{ interviewId: string }>();
    const navigate = useNavigate();

    // State
    const [botStatus, setBotStatus] = useState<BotStatus>('idle');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [responseTime, setResponseTime] = useState(0);
    const [currentScore, setCurrentScore] = useState<Score>({ technical: 0, communication: 0, confidence: 0 });
    const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [showScoreCard, setShowScoreCard] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const responseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch interview status on mount
    useEffect(() => {
        if (interviewId) {
            fetchInterviewStatus();
        }
        return () => {
            cleanup();
        };
    }, [interviewId]);

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (responseTimerRef.current) clearInterval(responseTimerRef.current);
        if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };

    const fetchInterviewStatus = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/bot/status/${interviewId}`);
            const data = response.data.data;

            if (data.interview.status === 'completed') {
                setIsComplete(true);
                setCurrentScore(data.currentScore || { technical: 0, communication: 0, confidence: 0 });
            } else if (data.currentQuestion) {
                const question = {
                    questionText: data.currentQuestion.text,
                    audioUrl: data.currentQuestion.audioUrl,
                    questionNumber: data.questionNumber,
                    totalQuestions: 5,
                    difficulty: 'medium' as const
                };
                setCurrentQuestion(question);
                setCurrentScore(data.currentScore || { technical: 0, communication: 0, confidence: 0 });

                // Auto-play question audio after a short delay
                setTimeout(() => {
                    if (question.audioUrl) {
                        playQuestionAudio(question.audioUrl);
                    }
                }, 500);
            }
            setIsLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load interview');
            setIsLoading(false);
        }
    };

    // Play question audio
    const playQuestionAudio = useCallback(async (audioUrl: string) => {
        if (!audioUrl) {
            console.error('No audio URL provided');
            setBotStatus('waiting');
            startResponseTimer();
            return;
        }

        setBotStatus('speaking');

        if (audioRef.current) {
            // Convert Windows file path to URL - handle both formats
            let audioSrc = audioUrl;
            if (audioUrl.includes('\\') || audioUrl.includes('uploads/')) {
                // Extract just the filename from the path
                const filename = audioUrl.split(/[\\/]/).pop();
                audioSrc = `${API_URL.replace('/api', '')}/uploads/audio/${filename}`;
            }
            console.log('Playing audio from:', audioSrc);
            audioRef.current.src = audioSrc;

            audioRef.current.onended = () => {
                setBotStatus('waiting');
                // Timer removed - user can take their time to respond
            };

            audioRef.current.onerror = () => {
                console.error('Error playing audio');
                setBotStatus('waiting');
            };

            try {
                await audioRef.current.play();
            } catch (error) {
                console.error('Playback failed:', error);
                setBotStatus('waiting');
            }
        }
    }, []);

    // Timer functionality disabled for now
    const startResponseTimer = () => {
        // Timer disabled - user responds when ready
    };

    // Stop response timer
    const stopResponseTimer = () => {
        if (responseTimerRef.current) clearInterval(responseTimerRef.current);
        if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };

    // Handle timeout - no response in 6 seconds
    const handleTimeout = async () => {
        stopResponseTimer();
        setBotStatus('processing');

        try {
            const response = await axios.post(`${API_URL}/bot/timeout`, {
                interviewId
            });

            const data = response.data.data;

            if (data.isComplete) {
                setIsComplete(true);
                navigate(`/interview/results/${interviewId}`);
            } else if (data.nextQuestion) {
                setCurrentQuestion(data.nextQuestion);
                toast.error("Time's up! Moving to the next question.");
                playQuestionAudio(data.nextQuestion.audioUrl);
            }
        } catch (error) {
            console.error('Timeout handling failed:', error);
            toast.error('Failed to process timeout');
        }
    };

    // Start recording
    const startRecording = async () => {
        stopResponseTimer();
        setBotStatus('listening');

        try {
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            chunksRef.current = [];
            const mediaRecorder = new MediaRecorder(streamRef.current);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

        } catch (error) {
            toast.error('Microphone access denied');
            setBotStatus('waiting');
            startResponseTimer();
        }
    };

    // Stop recording and submit
    const stopRecording = async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

        setBotStatus('processing');
        setIsRecording(false);

        return new Promise<void>((resolve) => {
            mediaRecorderRef.current!.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await submitResponse(audioBlob);
                resolve();
            };

            mediaRecorderRef.current!.stop();
        });
    };

    // Submit audio response
    const submitResponse = async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('interviewId', interviewId!);
            formData.append('responseTime', responseTime.toString());
            formData.append('audio', audioBlob, 'response.webm');

            const response = await axios.post(`${API_URL}/bot/respond`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const data = response.data.data;

            // Update state with analysis
            setLastAnalysis(data.analysis);
            setTranscript(data.analysis.transcript);
            setCurrentScore(data.currentScore);
            setShowScoreCard(true);

            // Hide score card after 3 seconds and show next question
            setTimeout(() => {
                setShowScoreCard(false);

                if (data.isComplete) {
                    setIsComplete(true);
                    navigate(`/interview/results/${interviewId}`);
                } else if (data.nextQuestion) {
                    setCurrentQuestion(data.nextQuestion);
                    playQuestionAudio(data.nextQuestion.audioUrl);
                }
            }, 3000);

        } catch (error: any) {
            console.error('Submit response failed:', error);
            toast.error('Failed to submit response');
            setBotStatus('waiting');
        }
    };

    // Complete interview early
    const completeEarly = async () => {
        try {
            await axios.post(`${API_URL}/bot/complete/${interviewId}`);
            navigate(`/interview/results/${interviewId}`);
        } catch (error) {
            toast.error('Failed to complete interview');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-400 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading interview...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center">
                <div className="text-center bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                    <p className="text-white/70 mb-6">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="btn bg-indigo-600 text-white px-6 py-3 rounded-xl">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 relative overflow-hidden">
            {/* Hidden audio element */}
            <audio ref={audioRef} autoPlay />

            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float-delayed" />
            </div>

            {/* Main content */}
            <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-3">
                            <span className="text-white/60 text-sm">Question</span>
                            <span className="text-white text-2xl font-bold ml-2">
                                {currentQuestion?.questionNumber || 1} / {currentQuestion?.totalQuestions || 5}
                            </span>
                        </div>

                        <div className={`px-4 py-2 rounded-xl text-sm font-medium ${currentQuestion?.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                            currentQuestion?.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-red-500/20 text-red-300'
                            }`}>
                            {currentQuestion?.difficulty?.toUpperCase() || 'EASY'}
                        </div>
                    </div>

                    <button
                        onClick={completeEarly}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-xl transition-colors"
                    >
                        <XCircle className="w-5 h-5" />
                        End Interview
                    </button>
                </div>

                {/* Score display */}
                <div className="flex justify-center gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 text-center">
                        <div className="text-indigo-300 text-sm mb-1">Technical</div>
                        <div className="text-white text-2xl font-bold">{currentScore.technical}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 text-center">
                        <div className="text-purple-300 text-sm mb-1">Communication</div>
                        <div className="text-white text-2xl font-bold">{currentScore.communication}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 text-center">
                        <div className="text-pink-300 text-sm mb-1">Confidence</div>
                        <div className="text-white text-2xl font-bold">{currentScore.confidence}</div>
                    </div>
                </div>

                {/* Bot Avatar and Question */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <BotAvatar status={botStatus} />

                    {/* Question text */}
                    <motion.div
                        key={currentQuestion?.questionText}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 max-w-2xl text-center"
                    >
                        <p className="text-white text-xl leading-relaxed">
                            {currentQuestion?.questionText || "Preparing your interview..."}
                        </p>
                    </motion.div>

                    {/* Response Timer - disabled for now
                    {botStatus === 'waiting' && !isRecording && (
                        <ResponseTimer
                            seconds={6 - responseTime}
                            isActive={botStatus === 'waiting'}
                        />
                    )}
                    */}

                    {/* Transcript display */}
                    {transcript && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 bg-white/5 backdrop-blur-lg rounded-xl px-6 py-4 max-w-xl"
                        >
                            <p className="text-white/70 text-sm italic">"{transcript}"</p>
                        </motion.div>
                    )}
                </div>

                {/* Recording Controls */}
                <div className="flex justify-center mt-8 mb-4">
                    {isRecording ? (
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-red-500/30 transition-all"
                        >
                            <StopCircle className="w-6 h-6" />
                            Stop Recording
                        </button>
                    ) : botStatus === 'waiting' || botStatus === 'idle' ? (
                        <button
                            onClick={startRecording}
                            className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-indigo-500/30 transition-all"
                        >
                            <Mic className="w-6 h-6" />
                            Start Speaking
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 bg-white/10 text-white/60 px-8 py-4 rounded-2xl text-lg">
                            {botStatus === 'speaking' && (
                                <>
                                    <Volume2 className="w-6 h-6 animate-pulse" />
                                    Bot is speaking...
                                </>
                            )}
                            {botStatus === 'processing' && (
                                <>
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            )}
                            {botStatus === 'listening' && (
                                <>
                                    <Mic className="w-6 h-6 text-red-400 animate-pulse" />
                                    Listening...
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Start interview button if no question yet */}
                {!currentQuestion && !isLoading && (
                    <div className="text-center">
                        <button
                            onClick={() => playQuestionAudio(currentQuestion?.audioUrl || '')}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold"
                        >
                            Start Interview
                        </button>
                    </div>
                )}
            </div>

            {/* Score Card Popup */}
            <AnimatePresence>
                {showScoreCard && lastAnalysis && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
                            <div className="text-center mb-6">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900">Answer Analyzed</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Technical</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all"
                                                style={{ width: `${lastAnalysis.technicalScore}%` }}
                                            />
                                        </div>
                                        <span className="font-bold text-gray-900 w-12">{lastAnalysis.technicalScore}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Communication</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all"
                                                style={{ width: `${lastAnalysis.communicationScore}%` }}
                                            />
                                        </div>
                                        <span className="font-bold text-gray-900 w-12">{lastAnalysis.communicationScore}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Confidence</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-pink-500 rounded-full transition-all"
                                                style={{ width: `${lastAnalysis.confidenceScore}%` }}
                                            />
                                        </div>
                                        <span className="font-bold text-gray-900 w-12">{lastAnalysis.confidenceScore}</span>
                                    </div>
                                </div>
                            </div>

                            {lastAnalysis.keywords.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-sm text-gray-500 mb-2">Keywords detected:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {lastAnalysis.keywords.map((keyword, i) => (
                                            <span key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConversationalInterviewPage;
