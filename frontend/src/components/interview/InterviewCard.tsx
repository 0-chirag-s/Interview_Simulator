import { Link } from 'react-router-dom';
import { PlayIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface InterviewCardProps {
  interview: any;
}

const InterviewCard = ({ interview }: InterviewCardProps) => {
  const formattedDate = new Date(interview.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Determine card variant based on status
  const getStatusDetails = () => {
    switch (interview.status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-success-600" />,
          label: 'Completed',
          color: 'text-success-600',
          bg: 'bg-success-50',
          border: 'border-success-200'
        };
      case 'in-progress':
        return {
          icon: <AlertCircle className="h-5 w-5 text-warning-600" />,
          label: 'In Progress',
          color: 'text-warning-600',
          bg: 'bg-warning-50',
          border: 'border-warning-200'
        };
      case 'pending':
      default:
        return {
          icon: <Clock className="h-5 w-5 text-primary-600" />,
          label: 'Pending',
          color: 'text-primary-600',
          bg: 'bg-primary-50',
          border: 'border-primary-200'
        };
    }
  };
  
  const status = getStatusDetails();
  
  const getProgress = () => {
    if (interview.status === 'pending') return 0;
    
    const totalQuestions = interview.sessions.length;
    if (totalQuestions === 0) return 0;
    
    const answeredQuestions = interview.sessions.filter(
      (session: any) => session.answer && session.answer.text
    ).length;
    
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };
  
  const progress = getProgress();
  
  const getInterviewLink = () => {
    if (interview.status === 'completed') {
      return `/interview/results/${interview._id}`;
    }
    return `/interview/session/${interview._id}`;
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${status.border} overflow-hidden`}>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{interview.jobPosition}</h3>
            <p className="text-gray-600 text-sm">{formattedDate}</p>
          </div>
          <div className={`${status.bg} ${status.color} px-3 py-1 rounded-full text-xs font-medium flex items-center`}>
            {status.icon}
            <span className="ml-1">{status.label}</span>
          </div>
        </div>
        
        {interview.status === 'in-progress' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Question count */}
        <div className="mt-4 text-sm text-gray-600">
          <span>{interview.sessions.length} questions</span>
          {interview.interviewer && (
            <span className="ml-2">• Interviewer: {interview.interviewer.name}</span>
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Link 
            to={getInterviewLink()}
            className="btn btn-primary py-1 px-4 flex items-center"
          >
            {interview.status === 'completed' ? 'View Results' : (
              <>
                <PlayIcon className="mr-1 h-4 w-4" />
                {interview.status === 'in-progress' ? 'Continue' : 'Start'}
              </>
            )}
          </Link>
          
          {interview.status === 'completed' && interview.feedback && (
            <div className="text-gray-600 text-sm">
              <span className="font-medium">Feedback available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;