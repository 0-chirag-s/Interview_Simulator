import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface InterviewerCardProps {
  interviewer: any;
  isSelected: boolean;
  onSelect: () => void;
}

const InterviewerCard = ({ interviewer, isSelected, onSelect }: InterviewerCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`cursor-pointer rounded-lg overflow-hidden border relative ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50' : 'border-gray-200'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <CheckCircle className="h-6 w-6 text-primary-600 bg-white rounded-full" />
        </div>
      )}
      
      <div className="h-32 overflow-hidden">
        <img 
          src={interviewer.avatar} 
          alt={interviewer.name}
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-lg">{interviewer.name}</h3>
        <p className="text-gray-600 text-sm">{interviewer.role}</p>
        
        <div className="mt-3 text-sm text-gray-600">
          <p><span className="font-medium">Personality:</span> {interviewer.personality}</p>
          <p><span className="font-medium">Industry:</span> {interviewer.industry}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewerCard;