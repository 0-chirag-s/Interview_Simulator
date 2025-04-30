import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useInterviewStore } from '../stores/interviewStore';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User, FileText, Settings, LogOut, Edit } from 'lucide-react';
import ResumeUploader from '../components/profile/ResumeUploader';

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const { interviews } = useInterviewStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const completedInterviews = interviews.filter(i => i.status === 'completed').length;
  
  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };
  
  const handleSaveProfile = () => {
 
    toast.success('Profile updated successfully');
    setIsEditing(false);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="p-6 bg-primary-50 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary-600" />
                  </div>
                </div>
                <div className="ml-6">
                  <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-600">{user?.email}</p>
                  
                  <div className="mt-2 flex space-x-2">
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="text-sm text-gray-600 hover:text-gray-700 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Form */}
            <div className="p-6">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 input"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 input"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      className="btn btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-8">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-primary-600">{interviews.length}</div>
                      <div className="text-sm text-gray-600">Total Interviews</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-success-600">{completedInterviews}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-gray-800">{interviews.length - completedInterviews}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                  </div>
                  
                  {/* Resume Section */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="font-medium text-gray-900">Resume</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      {user?.resume ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary-600" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">Your Resume</p>
                                <p className="text-sm text-gray-600">Uploaded resume will be used to tailor interview questions</p>
                              </div>
                            </div>
                            <button className="btn btn-outline py-1 px-3 text-sm">
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        <ResumeUploader />
                      )}
                    </div>
                  </div>
                  
                  {/* Account Settings */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center">
                        <Settings className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="font-medium text-gray-900">Account Settings</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Notifications</p>
                            <p className="text-sm text-gray-600">Receive email notifications about your interviews</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                          </div>
                          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            Enable
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Data Privacy</p>
                            <p className="text-sm text-gray-600">Manage how your data is used and stored</p>
                          </div>
                          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;