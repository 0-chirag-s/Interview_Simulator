import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { ArrowRightIcon, BrainCircuitIcon, GraduationCapIcon, BarChartIcon, MicIcon } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Ace Your Next Interview with AI-Powered Practice
            </motion.h1>
            <motion.p 
              className="text-xl mb-8 text-primary-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Practice interviews with AI interviewers, get real-time feedback, and build your confidence for your dream job.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link 
                to={isAuthenticated ? "/dashboard" : "/auth"} 
                className="btn btn-secondary text-base px-8 py-3"
              >
                Get Started <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Practice with Interview Simulator?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <BrainCircuitIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">AI-Powered Interviewers</h3>
              <p className="text-gray-600 text-center">
                Practice with intelligent AI interviewers that adapt to your job position and provide realistic interview experiences.
              </p>
            </motion.div>
            
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <MicIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Voice Interaction</h3>
              <p className="text-gray-600 text-center">
                Natural voice-based interactions with audio playback and recording for a more immersive interview simulation.
              </p>
            </motion.div>
            
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <BarChartIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Detailed Feedback</h3>
              <p className="text-gray-600 text-center">
                Receive comprehensive feedback on your performance, highlighting strengths and areas for improvement.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary-200"></div>
              
              {[
                {
                  title: "Setup Your Profile",
                  description: "Create an account and upload your resume to personalize your interview experience."
                },
                {
                  title: "Choose Your Interview",
                  description: "Select a job position and AI interviewer that matches your career goals."
                },
                {
                  title: "Practice with AI",
                  description: "Answer questions from your AI interviewer using voice or text responses."
                },
                {
                  title: "Get Feedback",
                  description: "Receive detailed feedback on your answers, communication style, and overall performance."
                }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  className="relative flex items-start mb-12 last:mb-0"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="flex items-center justify-center min-w-[40px] h-10 bg-primary-600 text-white rounded-full text-xl font-bold z-10">
                    {index + 1}
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary-900 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Boost Your Interview Skills?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-100">
            Join thousands of job seekers who have improved their interview performance and landed their dream jobs.
          </p>
          <Link 
            to={isAuthenticated ? "/dashboard" : "/auth"} 
            className="btn btn-secondary text-base px-8 py-3"
          >
            Start Practicing Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;