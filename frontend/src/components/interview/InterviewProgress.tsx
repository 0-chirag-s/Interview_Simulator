import { CheckCircle } from 'lucide-react';

interface InterviewProgressProps {
  currentIndex: number;
  totalSessions: number;
  interviewPosition: string;
}

const InterviewProgress = ({ currentIndex, totalSessions, interviewPosition }: InterviewProgressProps) => {
  const progress = Math.round(((currentIndex + 1) / totalSessions) * 100);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">{interviewPosition} Interview</h2>
        <div className="text-sm text-gray-600">
          Question {currentIndex + 1} of {totalSessions}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary-600 h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex mt-3 overflow-x-auto pb-2">
        {Array.from({ length: totalSessions }).map((_, index) => (
          <div 
            key={index}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              index < currentIndex
                ? 'bg-primary-100 text-primary-600 border border-primary-300'
                : index === currentIndex
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            {index < currentIndex ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <span className="text-xs">{index + 1}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewProgress;