import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, X } from 'lucide-react';
import { useQuotes } from '../contexts/QuoteContext';
import Button from './Button';
import Card from './Card';

interface UploadQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

const UploadQuoteModal: React.FC<UploadQuoteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { addQuote, addLineItem } = useQuotes();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setIsDragOver(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    // Validate file type (accept PDF and text-based formats)
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/json'
    ];

    const fileName = selectedFile.name.toLowerCase();
    const isValidType = allowedTypes.includes(selectedFile.type) || 
                       fileName.match(/\.(pdf|txt|csv|md|json)$/i);

    if (!isValidType) {
      if (onSuccess) {
        onSuccess('Please upload a PDF or text file (.pdf, .txt, .csv, .md, .json)', 'error');
      }
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      if (onSuccess) {
        onSuccess('File size must be less than 10MB', 'error');
      }
      return;
    }

    setFile(selectedFile);
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles[0]);
    }
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle clear file
  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle start analysis - AI-powered quote generation with full integration
  const handleStartAnalysis = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      // Step 1: Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Step 2: Make API call to backend for AI analysis
      const response = await fetch('http://localhost:4000/api/quotes/upload-and-analyze', {
        method: 'POST',
        credentials: 'include', // Include session cookies
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText || 'Unknown server error'}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      const { quoteName, lineItems } = result.data;
      console.log('🤖 AI Analysis Result:', { quoteName, lineItemCount: lineItems.length });

      // Step 3: Create the new quote using the AI-extracted quote name
      const newQuote = await addQuote({
        quoteName: quoteName,
        status: 'Draft',
        timeToDevelop: '2-3 weeks',
        timeToDevelopValue: 2,
        timeToDevelopUnit: 'Weeks',
        variancePercentage: 10,
        quoteTotal: 0, // Will be calculated from line items
        budget: 0
      });

      console.log('✅ Quote created:', newQuote);

      // Step 4: Create line items in parallel using Promise.all
      const lineItemPromises = lineItems.map((item: { description: string; estimatedCost: number }) => 
        addLineItem(newQuote.id, {
          description: item.description,
          estimatedCost: item.estimatedCost
        })
      );

      await Promise.all(lineItemPromises);
      console.log('✅ All line items created successfully');

      // Step 5: Show success message
      if (onSuccess) {
        onSuccess(`Quote "${quoteName}" created successfully with ${lineItems.length} line items!`, 'success');
      }

      // Step 6: Close modal
      onClose();

      // Step 7: Navigate to the new quote's detail page
      navigate(`/quotes/${newQuote.id}`);
      
    } catch (error) {
      console.error('❌ AI Analysis & Integration Error:', error);
      
      if (onSuccess) {
        const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
        onSuccess(errorMessage, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl my-8">
          <Card variant="glass" className="relative animate-fade-in z-50">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Create Quote from Document
                </h2>
                <p className="text-slate-400">
                  Upload a PDF or text file containing a bill of materials, cost sheet, or other document to generate a quote using AI.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* File Upload Area */}
            <div className="mb-8">
              {!file ? (
                /* Drag and Drop Area */
                <div
                  className={`
                    relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
                    ${isDragOver 
                      ? 'border-blue-400 bg-blue-500/10 scale-[1.02]' 
                      : 'border-slate-600/50 hover:border-slate-500/70 hover:bg-white/5'
                    }
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    accept=".pdf,.txt,.csv,.md,.json"
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300
                      ${isDragOver 
                        ? 'bg-blue-500/20 text-blue-400 scale-110' 
                        : 'bg-slate-700/50 text-slate-400'
                      }
                    `}>
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {isDragOver ? 'Drop your file here' : 'Drag & drop your file here'}
                    </h3>
                    
                    <p className="text-slate-400 mb-4">
                      or <span className="text-blue-400 hover:text-blue-300 underline">click to browse</span>
                    </p>
                    
                    <div className="text-sm text-slate-500">
                      <p>Supported formats: PDF, Word, Excel, CSV, Text</p>
                      <p>Maximum file size: 10MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Selected File Display */
                <div className="border border-slate-600/50 rounded-2xl p-6 bg-slate-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-1">
                          {file.name}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFile}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Processing Info */}
            <div className="mb-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 text-blue-400 mt-0.5">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-300 mb-1">How AI Quote Generation Works</h4>
                  <p className="text-sm text-blue-200/80">
                    Our AI will analyze your document to extract materials, quantities, and costs, then generate a comprehensive construction quote with line items, totals, and time estimates.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-700/50">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                variant="primary"
                onClick={handleStartAnalysis}
                className="flex-1"
                loading={isProcessing}
                disabled={!file || isProcessing}
              >
                {isProcessing ? 'Creating Quote...' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadQuoteModal;