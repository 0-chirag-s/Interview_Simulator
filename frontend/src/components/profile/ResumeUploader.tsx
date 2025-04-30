import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, FileText, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface ResumeUploaderProps {
  isCompact?: boolean;
  onUploadComplete?: () => void;
}

const ResumeUploader = ({ isCompact = false, onUploadComplete }: ResumeUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadResume, isLoading, error } = useAuthStore();
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };
  
  const validateAndSetFile = (file: File) => {
    // Check file type (PDF, DOC, DOCX)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }
    
    setSelectedFile(file);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    try {
      await uploadResume(selectedFile);
      toast.success('Resume uploaded successfully');
      setSelectedFile(null);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      // Error is handled in the auth store
    }
  };
  
  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  if (isCompact) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <label
          htmlFor="resume-upload-compact"
          className="flex-1 cursor-pointer flex items-center justify-center h-10 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          {selectedFile ? selectedFile.name : 'Select Resume'}
          <input
            id="resume-upload-compact"
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
          />
        </label>
        
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className="btn btn-primary h-10 px-4"
        >
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    );
  }
  
  return (
    <div>
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'
          }`}
        >
          <div className="mx-auto flex justify-center">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <p className="mt-2 text-gray-600">
            Drag and drop your resume, or{' '}
            <label
              htmlFor="resume-upload"
              className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
            >
              browse
              <input
                id="resume-upload"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </label>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supported formats: PDF, DOC, DOCX (max 10MB)
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="btn btn-primary py-1 px-4"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              ) : 'Upload Resume'}
            </button>
          </div>
        </div>
      )}
      
      {error && <p className="mt-2 text-sm text-error-600">{error}</p>}
    </div>
  );
};

export default ResumeUploader;