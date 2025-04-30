import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../stores/interviewStore';
import { ArrowLeftIcon, Share2, Download, Printer, ChevronRight, Award, CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const InterviewResultsPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { currentInterview, getInterview, isLoading } = useInterviewStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (interviewId) {
      getInterview(interviewId);
    }
  }, [interviewId, getInterview]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!currentInterview || currentInterview.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-warning-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {!currentInterview ? 'Interview Not Found' : 'Interview Not Completed'}
            </h2>
            <p className="text-gray-600 mb-6">
              {!currentInterview 
                ? 'The interview you are looking for does not exist or has been removed.'
                : 'This interview has not been completed yet. Please complete the interview to see your results.'}
            </p>
            <Link 
              to="/dashboard" 
              className="btn btn-primary"
            >
              <ArrowLeftIcon className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Parse feedback sections (assuming formatted markdown)
  const feedback = currentInterview.feedback || 'Feedback is being generated. Please check back later.';
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Interview Results</h1>
            </div>
            
            <div className="flex space-x-2">
              <button className="btn btn-outline py-1 px-3">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
              <button className="btn btn-outline py-1 px-3">
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
              <button className="btn btn-outline py-1 px-3">
                <Printer className="h-4 w-4 mr-1" />
                Print
              </button>
            </div>
          </div>
          
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-success-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">{currentInterview.jobPosition} Interview</h2>
                  <p className="text-gray-600">
                    Completed on {new Date(currentInterview.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <div className="prose max-w-none">
                  <ReactMarkdown>
                    {feedback.split('\n\n')[0] || ''}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detailed Feedback */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Feedback</h2>
              <div className="prose max-w-none">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            </div>
          </div>
          
          {/* Questions and Answers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Questions & Answers</h2>
              
              <div className="space-y-6">
                {currentInterview.sessions.map((session, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-800 mb-4">{session.question.text}</p>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                        <p className="text-gray-600">{session.answer.text || 'No answer provided'}</p>
                        
                        {session.answer.audioUrl && (
                          <div className="mt-3">
                            <audio
                              controls
                              src={session.answer.audioUrl}
                              className="w-full"
                            ></audio>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="bg-primary-50 rounded-lg shadow-sm border border-primary-200 overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h2>
              
              <div className="space-y-4">
                <Link 
                  to="/interview/setup"
                  className="block bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">1</span>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">Practice Again</h3>
                        <p className="text-gray-600 text-sm">Try another interview to improve your skills</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
                
                <Link 
                  to="/dashboard"
                  className="block bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">2</span>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">View Past Interviews</h3>
                        <p className="text-gray-600 text-sm">Compare your progress across different interviews</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResultsPage;