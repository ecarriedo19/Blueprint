import React from 'react';

interface WorkspaceLayoutProps {
  chatPanel: React.ReactNode;
  previewPanel: React.ReactNode;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ 
  chatPanel, 
  previewPanel 
}) => {
  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Main workspace container */}
      <div className="flex flex-col md:flex-row h-full gap-0">
        {/* Left Column - Chat Panel */}
        <div className="w-full md:w-1/3 md:flex-shrink-0 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-gray-200/30 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-sm">
          <div className="h-full overflow-hidden">
            {chatPanel}
          </div>
        </div>

        {/* Right Column - Preview Panel */}
        <div className="w-full md:w-2/3 md:flex-grow h-1/2 md:h-full bg-white/10 dark:bg-white/5 backdrop-blur-sm">
          <div className="h-full overflow-hidden">
            {previewPanel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;