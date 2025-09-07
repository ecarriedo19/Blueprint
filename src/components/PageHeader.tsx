import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      {subtitle && <p className="text-lg text-slate-400">{subtitle}</p>}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
    </div>
  );
};

export default PageHeader;
