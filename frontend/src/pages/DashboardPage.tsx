import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useInterviewStore } from '../stores/interviewStore';
import { PlusIcon, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import InterviewCard from '../components/interview/InterviewCard';
import RecentFeedback from '../components/dashboard/RecentFeedback';
import UpcomingInterviewReminder from '../components/dashboard/UpcomingInterviewReminder';
import ResumeUploader from '../components/profile/ResumeUploader';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { interviews, getInterviews, isLoading } = useInterviewStore();
  const [showResumeUploader, setShowResumeUploader] = useState(false);
  
  useEffect(() => {
    getInterviews();
  }, [getInterviews]);
  
  useEffect(() => {
    
    setShowResumeUploader(!user?.resume);
  }, [user]);
  

  const completedInterviews = interviews.filter(interview => interview.status === 'completed');
  const pendingInterviews = interviews.filter(interview => interview.status === 'pending');
  const inProgressInterviews = interviews.filter(interview => interview.status === 'in-progress');
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
          </div>
          <Link 
            to="/interview/setup" 
            className="btn btn-primary mt-4 md:mt-0"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Interview
          </Link>
        </div>
        
        {/* Resume Uploader */}
        {showResumeUploader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h2 className="text-lg font-semibold mb-4">Upload Your Resume</h2>
            <p className="text-gray-600 mb-4">
              Upload your resume to get more personalized interview questions and better feedback.
            </p>
            <ResumeUploader onUploadComplete={() => setShowResumeUploader(false)} />
          </motion.div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            variants={item}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Completed</h2>
                <p className="text-3xl font-bold text-gray-900">{completedInterviews.length}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={item}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center">
              <div className="bg-warning-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Pending</h2>
                <p className="text-3xl font-bold text-gray-900">
                  {pendingInterviews.length + inProgressInterviews.length}
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={item}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center">
              <div className="bg-success-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Total</h2>
                <p className="text-3xl font-bold text-gray-900">{interviews.length}</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Interview Lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* In Progress & Pending Interviews */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Your Interviews</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : interviews.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {inProgressInterviews.map(interview => (
                  <motion.div key={interview._id} variants={item}>
                    <InterviewCard interview={interview} />
                  </motion.div>
                ))}
                
                {pendingInterviews.map(interview => (
                  <motion.div key={interview._id} variants={item}>
                    <InterviewCard interview={interview} />
                  </motion.div>
                ))}
                
                {completedInterviews.slice(0, 3).map(interview => (
                  <motion.div key={interview._id} variants={item}>
                    <InterviewCard interview={interview} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-600 mb-4">No interviews found. Start a new interview!</p>
                <Link 
                  to="/interview/setup" 
                  className="btn btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Start Your First Interview
                </Link>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Activity</h2>
            
            {/* Upcoming Interview Reminder */}
            {pendingInterviews.length > 0 && (
              <motion.div 
                variants={item}
                className="mb-6"
              >
                <UpcomingInterviewReminder interview={pendingInterviews[0]} />
              </motion.div>
            )}
            
            {/* Recent Feedback */}
            {completedInterviews.length > 0 && (
              <motion.div variants={item}>
                <RecentFeedback interview={completedInterviews[0]} />
              </motion.div>
            )}
            
            {/* Tips Card */}
            <motion.div 
              variants={item}
              className="bg-primary-50 p-6 rounded-lg border border-primary-200 mt-6"
            >
              <h3 className="text-lg font-semibold text-primary-900 mb-3">Interview Tips</h3>
              <ul className="text-primary-800 space-y-2">
                <li className="flex items-start">
                  <span className="inline-block bg-primary-200 rounded-full h-2 w-2 mt-2 mr-2"></span>
                  Research the company before your interview
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-primary-200 rounded-full h-2 w-2 mt-2 mr-2"></span>
                  Practice the STAR method for behavioral questions
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-primary-200 rounded-full h-2 w-2 mt-2 mr-2"></span>
                  Prepare questions to ask the interviewer
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-primary-200 rounded-full h-2 w-2 mt-2 mr-2"></span>
                  Follow up with a thank-you email
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;