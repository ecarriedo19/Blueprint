import React from 'react';

export default function TrustedBy() {
  const companies = [
    'BuildCorp', 'ConstructTech', 'SteelFrame', 'ModernBuild', 'UrbanDev', 'SkylineGroup'
  ];

  return (
    <section className="bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <p className="text-slate-600 text-lg font-medium">
            Trusted by modern finance and construction teams
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {companies.map((company, index) => (
              <div
                key={index}
                className="flex items-center justify-center h-16 px-4 bg-white rounded-lg shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-300"
              >
                <span className="text-slate-700 font-semibold text-lg">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}