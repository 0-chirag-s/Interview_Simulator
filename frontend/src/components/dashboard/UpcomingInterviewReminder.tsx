import { Link } from 'react-router-dom';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react';

interface UpcomingInterviewReminderProps {
  interview: any;
}

const UpcomingInterviewReminder = ({ interview }: UpcomingInterviewReminderProps) => {
  if (!interview) return null;
  
  const formattedDate = new Date(interview.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent-500"></div>
      <div className="flex items-start">
        <div className="bg-accent-100 p-2 rounded-full">
          <CalendarIcon className="h-5 w-5 text-accent-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold">Upcoming Interview</h3>
          <p className="text-gray-600 text-sm">{formattedDate}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="font-medium">{interview.jobPosition}</p>
        <p className="text-gray-600 text-sm mt-1">
          {interview.sessions.length} questions prepared
        </p>
      </div>
      <div className="mt-4 flex justify-between">
        <Link
          to={`/interview/session/${interview._id}`}
          className="btn btn-primary py-1 px-4"
        >
          Start Now
        </Link>
        <Link
          to={`/interview/session/${interview._id}`}
          className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
        >
          View Details
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default UpcomingInterviewReminder;