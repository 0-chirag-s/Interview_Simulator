import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInterviewStore } from '../stores/interviewStore';
import { useAuthStore } from '../stores/authStore';
import { DEFAULT_INTERVIEWERS, JOB_CATEGORIES, POPULAR_JOB_TITLES } from '../config/constants';
import { toast } from 'react-hot-toast';
import {
  BriefcaseIcon,
  UserIcon,
  ArrowRightIcon,
  SearchIcon,
  XIcon,
  Bot,
  MessageSquare,
  Mic,
  Clock
} from 'lucide-react';
import InterviewerCard from '../components/interview/InterviewerCard';
import ResumeUploader from '../components/profile/ResumeUploader';

type InterviewMode = 'traditional' | 'conversational';

const InterviewSetupPage = () => {
  const [step, setStep] = useState(1);
  const [jobPosition, setJobPosition] = useState('');
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('conversational');

  const { createInterview, startConversationalInterview, isLoading } = useInterviewStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const filteredJobs = POPULAR_JOB_TITLES.filter(job =>
    job.toLowerCase().includes(jobSearch.toLowerCase())
  );

  useEffect(() => {
    // Show suggestions when typing
    if (jobSearch.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [jobSearch]);

  const handleJobSelect = (job: string) => {
    setJobPosition(job);
    setJobSearch(job);
    setShowSuggestions(false);
  };

  const handleCreateInterview = async () => {
    if (!jobPosition) {
      toast.error('Please enter a job position');
      return;
    }

    try {
      if (interviewMode === 'conversational') {
        // Start conversational AI interview
        const result = await startConversationalInterview(jobPosition);
        toast.success('AI Interview Bot started!');
        navigate(`/interview/bot/${result.interviewId}`);
      } else {
        // Traditional batch interview
        const interviewId = await createInterview(jobPosition, selectedInterviewer);
        toast.success('Interview created successfully!');
        navigate(`/interview/session/${interviewId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create interview');
    }
  };

  const handleNext = () => {
    if (step === 1 && !jobPosition) {
      toast.error('Please enter a job position');
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Progress Steps */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Job Position</span>
              <span>Interview Mode</span>
              <span>Review</span>
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Job Position */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">What position are you interviewing for?</h2>
                  <p className="text-gray-600 mt-1">Enter the specific job title to get tailored interview questions.</p>
                </div>

                <div className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      placeholder="Enter job title"
                      className="input pl-10 pr-10"
                    />
                    {jobSearch && (
                      <button
                        onClick={() => {
                          setJobSearch('');
                          setJobPosition('');
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <XIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Job Suggestions */}
                  {showSuggestions && filteredJobs.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60">
                      {filteredJobs.map((job) => (
                        <div
                          key={job}
                          onClick={() => handleJobSelect(job)}
                          className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                        >
                          {job}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Popular Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {JOB_CATEGORIES.slice(0, 6).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setJobCategory(category);
                          setJobSearch(category);
                          setJobPosition(category);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${jobCategory === category
                            ? 'bg-primary-100 text-primary-800 border border-primary-300'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                          }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resume Section */}
                {!user?.resume && (
                  <div className="mt-8 bg-primary-50 p-4 rounded-lg border border-primary-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Resume</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Upload your resume to get more personalized interview questions.
                    </p>
                    <ResumeUploader isCompact={true} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Interview Mode Selection */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Interview Mode</h2>
                  <p className="text-gray-600 mt-1">Select how you want to experience your interview.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Conversational AI Mode */}
                  <button
                    type="button"
                    onClick={() => setInterviewMode('conversational')}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${interviewMode === 'conversational'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    {interviewMode === 'conversational' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">AI Conversational</h3>
                        <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">Recommended</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      Real-time voice interaction with an AI interviewer that adapts questions based on your answers.
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mic className="w-4 h-4 text-indigo-500" />
                        <span>Voice-based Q&A</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>6-second response timer</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        <span>Adaptive difficulty</span>
                      </div>
                    </div>
                  </button>

                  {/* Traditional Mode */}
                  <button
                    type="button"
                    onClick={() => setInterviewMode('traditional')}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${interviewMode === 'traditional'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    {interviewMode === 'traditional' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Traditional</h3>
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Self-paced</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      Answer questions at your own pace with text or audio. All questions are shown upfront.
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span>Text or audio answers</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>No time pressure</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span>Choose interviewer</span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Interviewer Selection for Traditional Mode */}
                {interviewMode === 'traditional' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6"
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Interviewer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {DEFAULT_INTERVIEWERS.map((interviewer) => (
                        <InterviewerCard
                          key={interviewer.id}
                          interviewer={interviewer}
                          isSelected={selectedInterviewer === interviewer.id}
                          onSelect={() => setSelectedInterviewer(interviewer.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Review Interview Setup</h2>
                  <p className="text-gray-600 mt-1">Review your interview details before starting.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Job Position</p>
                    <div className="flex items-center mt-1">
                      <BriefcaseIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <p className="text-lg font-medium">{jobPosition}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Interview Mode</p>
                    <div className="flex items-center mt-1">
                      {interviewMode === 'conversational' ? (
                        <>
                          <Bot className="h-5 w-5 text-indigo-500 mr-2" />
                          <p className="text-lg font-medium">AI Conversational Interview</p>
                        </>
                      ) : (
                        <>
                          <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <p className="text-lg font-medium">Traditional Interview</p>
                        </>
                      )}
                    </div>
                  </div>

                  {interviewMode === 'traditional' && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Interviewer</p>
                      <div className="flex items-center mt-1">
                        <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <p className="text-lg font-medium">
                          {selectedInterviewer
                            ? DEFAULT_INTERVIEWERS.find(i => i.id === selectedInterviewer)?.name || 'Custom Interviewer'
                            : 'AI-Generated Interviewer'}
                        </p>
                      </div>
                    </div>
                  )}

                  {user?.resume && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Resume</p>
                      <div className="flex items-center mt-1">
                        <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-800">Resume uploaded</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    {interviewMode === 'conversational' ? (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">What to expect:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• The AI bot will introduce itself and start asking questions</li>
                          <li>• Speak your answers clearly - you have 6 seconds to respond</li>
                          <li>• Questions adapt based on your performance</li>
                          <li>• Get scored on Technical, Communication, and Confidence</li>
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-700">
                        Your interview will include questions tailored to your job position
                        {user?.resume ? ' and your resume' : ''}.
                        The AI interviewer will evaluate your answers and provide feedback at the end.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-outline"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                >
                  Next <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateInterview}
                  disabled={isLoading}
                  className={`btn ${interviewMode === 'conversational' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white' : 'btn-primary'}`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting Interview...
                    </div>
                  ) : (
                    <>
                      {interviewMode === 'conversational' ? (
                        <>
                          <Bot className="mr-2 h-4 w-4" />
                          Start AI Interview
                        </>
                      ) : (
                        <>
                          Start Interview <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetupPage;