import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';

interface RecentFeedbackProps {
  interview: any;
}

const RecentFeedback = ({ interview }: RecentFeedbackProps) => {
  if (!interview || !interview.feedback) return null;
  
  const firstParagraph = interview.feedback.split('\n')[0];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
    >
      <h3 className="text-lg font-semibold mb-3">Recent Feedback</h3>
      <div className="text-gray-600 text-sm mb-4">
        <p className="font-medium">{interview.jobPosition} Interview</p>
        <p className="text-xs text-gray-500">
          {new Date(interview.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <p className="text-gray-700 mb-4 line-clamp-3">
        {firstParagraph}
      </p>
      <Link 
        to={`/interview/results/${interview._id}`}
        className="flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
      >
        View Full Feedback
        <ArrowRightIcon className="ml-1 h-4 w-4" />
      </Link>
    </motion.div>
  );
};

export default RecentFeedback;