import { useState } from 'react';
import { ChevronDown, Menu, X, Calculator, BarChart3, Brain, Shield, Link, FileText, Users, Video } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

interface NavigationProps {
  onAuthClick: () => void;
}

export default function Navigation({ onAuthClick }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuОpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleMouseEnter = (dropdown: string) => {
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navbar container is back to its original slim height */}
        <div className="flex justify-between items-center h-16">
          {/* Logo - horizontally aligned, left side, clean style */}
          <div className="flex items-center mr-8">
            <img 
              src="/logo-new.png" 
              alt="Blueprint Logo" 
              className="h-8 w-auto mr-2" // Example: smaller, aligned with nav
            />
            <span className="text-xl font-bold tracking-tight text-gray-900">Blueprint</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Platform Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('platform')}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
                Platform
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {activeDropdown === 'platform' && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Planning</div>
                        <div className="text-sm text-gray-500">Project budgets and cost forecasting</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Reporting</div>
                        <div className="text-sm text-gray-500">Real-time financial dashboards</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Intelligence</div>
                        <div className="text-sm text-gray-500">AI-powered insights and recommendations</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                      <Link className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Integrations</div>
                        <div className="text-sm text-gray-500">Connect QuickBooks, Xero, and more</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Security</div>
                        <div className="text-sm text-gray-500">Enterprise-grade data protection</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('solutions')}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:shadow-lg hover:shadow-purple-200/50 transition-all duration-300">
                Solutions
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {activeDropdown === 'solutions' && (
                <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Compare</h3>
                      <div className="space-y-2">
                        <div className="p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                          <div className="font-medium text-gray-900">Vs Excel</div>
                        </div>
                        <div className="p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                          <div className="font-medium text-gray-900">Vs QuickBooks</div>
                        </div>
                        <div className="p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                          <div className="font-medium text-gray-900">Vs Procore</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Use Cases</h3>
                      <div className="space-y-2">
                        <div className="p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                          <div className="font-medium text-gray-900">Construction FP&A</div>
                        </div>
                        <div className="p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                          <div className="font-medium text-gray-900">Project Profitability</div>
                        </div>
                        <div className="p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                          <div className="font-medium text-gray-900">Vendor Management</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customers */}
            <button className="px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:shadow-lg hover:shadow-emerald-200/50 transition-all duration-300">
              Customers
            </button>

            {/* Pricing */}
            <RouterLink 
              to="/pricing"
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-300"
            >
              Pricing
            </RouterLink>

            {/* Resources Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('resources')}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:shadow-lg hover:shadow-orange-200/50 transition-all duration-300">
                Resources
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {activeDropdown === 'resources' && (
                <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">Construction Finance Guide</div>
                          <div className="text-sm text-gray-500">Best practices for project budgeting</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">ROI Calculator</div>
                          <div className="text-sm text-gray-500">Calculate project profitability</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">Case Studies</div>
                          <div className="text-sm text-gray-500">Success stories from contractors</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                        <Video className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">Webinars</div>
                          <div className="text-sm text-gray-500">Live training sessions</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Featured</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Blueprint Intelligence</h4>
                      <p className="text-sm text-gray-600 mb-3">AI-powered insights for construction finance</p>
                      <div className="bg-white/80 p-3 rounded-lg">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Cost Savings</span>
                          <span className="font-medium text-green-600">+15%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-500">Project Accuracy</span>
                          <span className="font-medium text-blue-600">94%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={onAuthClick}
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
            >
              Log In
            </button>
            <button 
              onClick={onAuthClick}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-300 font-medium"
            >
              Book a demo
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuОpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                Platform
              </button>
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                Solutions
              </button>
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                Customers
              </button>
              <RouterLink 
                to="/pricing"
                className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Pricing
              </RouterLink>
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                Resources
              </button>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button 
                  onClick={onAuthClick}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={onAuthClick}
                  className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-300 font-medium text-center"
                >
                  Book a demo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}