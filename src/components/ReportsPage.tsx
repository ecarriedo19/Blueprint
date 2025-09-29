import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import PageHeader from './PageHeader';
import Card from './Card';
import Button from './Button';
import Toast from './Toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Chart color palette
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6', 
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  slate: '#64748b'
};

// Report types
type ReportType = 'profitability' | 'budgetVsActuals' | 'cashFlow';

interface ReportTab {
  id: ReportType;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const REPORT_TABS: ReportTab[] = [
  {
    id: 'profitability',
    name: 'Quarterly Profitability',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Revenue, costs, and profit margins by quarter'
  },
  {
    id: 'budgetVsActuals',
    name: 'Budget vs. Actuals',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Compare budgeted costs with actual spending across projects'
  },
  {
    id: 'cashFlow',
    name: 'Cash Flow Projections',
    icon: <Activity className="w-5 h-5" />,
    description: 'Historical and projected cash flow analysis'
  }
];

const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('profitability');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type: 'success' | 'error' }>({ 
    message: '', 
    isVisible: false, 
    type: 'success' 
  });

  // Toast functions
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Fetch report data
  const fetchReportData = useCallback(async (reportType: ReportType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports?reportName=${reportType}`, {
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch report data');
      }

      if (result.success) {
        setReportData(result.data);
        showToast(`${REPORT_TABS.find(tab => tab.id === reportType)?.name} report loaded successfully!`);
      } else {
        throw new Error(result.error || 'Failed to fetch report data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report data';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Handle report tab change
  const handleReportChange = (reportType: ReportType) => {
    setSelectedReport(reportType);
    setReportData(null);
    fetchReportData(reportType);
  };

  // Load initial report
  useEffect(() => {
    fetchReportData(selectedReport);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card variant="glass" className="p-4 border border-white/20">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  // Render Profitability Report
  const renderProfitabilityReport = () => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return (
        <Card variant="glass" className="p-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-white mb-2">No Profitability Data</h3>
          <p className="text-slate-400">
            No completed quotes found for the last 4 quarters. Start adding approved quotes to see profitability trends.
          </p>
        </Card>
      );
    }

    const totalRevenue = reportData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalCosts = reportData.reduce((sum, item) => sum + item.totalCosts, 0);
    const avgProfitMargin = reportData.length > 0 
      ? reportData.reduce((sum, item) => sum + item.profitMargin, 0) / reportData.length 
      : 0;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue (4Q)</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Costs (4Q)</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totalCosts)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Profit Margin</p>
                <p className={`text-3xl font-bold ${avgProfitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(avgProfitMargin)}
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${avgProfitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </Card>
        </div>

        {/* Chart */}
        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-bold text-white mb-6">Quarterly Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#9CA3AF' }}
                  stroke="#6B7280"
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF' }}
                  stroke="#6B7280"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={CustomTooltip} />
                <Bar 
                  dataKey="totalRevenue" 
                  name="Revenue"
                  fill={CHART_COLORS.success} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="totalCosts" 
                  name="Costs"
                  fill={CHART_COLORS.danger} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="netProfit" 
                  name="Net Profit"
                  fill={CHART_COLORS.primary} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  };

  // Render Budget vs Actuals Report
  const renderBudgetVsActualsReport = () => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return (
        <Card variant="glass" className="p-8 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-white mb-2">No Budget Data</h3>
          <p className="text-slate-400">
            No projects with budgets found. Create projects and quotes to track budget vs actual performance.
          </p>
        </Card>
      );
    }

    const overBudgetProjects = reportData.filter(project => project.isOverBudget).length;
    const totalBudget = reportData.reduce((sum, project) => sum + project.totalBudget, 0);
    const totalActual = reportData.reduce((sum, project) => sum + project.totalActual, 0);
    const overallVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Projects</p>
                <p className="text-3xl font-bold text-white">{reportData.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Over Budget</p>
                <p className="text-3xl font-bold text-red-400">{overBudgetProjects}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Budget</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totalBudget)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Overall Variance</p>
                <p className={`text-3xl font-bold ${overallVariance >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatPercentage(overallVariance)}
                </p>
              </div>
              {overallVariance >= 0 ? 
                <TrendingUp className="w-8 h-8 text-red-400" /> : 
                <TrendingDown className="w-8 h-8 text-green-400" />
              }
            </div>
          </Card>
        </div>

        {/* Projects Table */}
        <Card variant="glass" className="overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-xl font-bold text-white">Project Budget Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-4 px-6 text-slate-300 font-semibold">Project</th>
                  <th className="text-right py-4 px-6 text-slate-300 font-semibold">Budget</th>
                  <th className="text-right py-4 px-6 text-slate-300 font-semibold">Actual</th>
                  <th className="text-right py-4 px-6 text-slate-300 font-semibold">Variance</th>
                  <th className="text-center py-4 px-6 text-slate-300 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((project) => (
                  <tr key={project.projectId} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white font-medium">{project.projectName}</p>
                        <p className="text-slate-400 text-sm">{project.totalQuotes} quotes</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-white font-medium">
                      {formatCurrency(project.totalBudget)}
                    </td>
                    <td className="py-4 px-6 text-right text-white font-medium">
                      {formatCurrency(project.totalActual)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-medium ${
                        project.variance >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {project.variance >= 0 ? '+' : ''}{formatCurrency(project.variance)}
                      </span>
                      <p className={`text-sm ${
                        project.variancePercentage >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        ({formatPercentage(project.variancePercentage)})
                      </p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        project.isOverBudget 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {project.isOverBudget ? (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Over Budget
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            On Track
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // Render Cash Flow Report
  const renderCashFlowReport = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return (
        <Card variant="glass" className="p-8 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-white mb-2">No Cash Flow Data</h3>
          <p className="text-slate-400">
            No cash flow data available. Add completed quotes to see cash flow projections.
          </p>
        </Card>
      );
    }

    const { data: cashFlowData, summary } = reportData;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Monthly Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(summary.avgMonthlyRevenue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Monthly Costs</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(summary.avgMonthlyCosts)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Net Cash Flow</p>
                <p className={`text-3xl font-bold ${summary.avgNetCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(summary.avgNetCashFlow)}
                </p>
              </div>
              <Activity className={`w-8 h-8 ${summary.avgNetCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Projected Revenue (6M)</p>
                <p className="text-3xl font-bold text-blue-400">{formatCurrency(summary.totalProjectedRevenue)}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
        </div>

        {/* Cash Flow Chart */}
        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-bold text-white mb-6">Cash Flow Trends & Projections</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#9CA3AF' }}
                  stroke="#6B7280"
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF' }}
                  stroke="#6B7280"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={CustomTooltip} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={CHART_COLORS.success}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="costs" 
                  stroke={CHART_COLORS.danger}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.danger, strokeWidth: 2, r: 4 }}
                  name="Costs"
                />
                <Line 
                  type="monotone" 
                  dataKey="netCashFlow" 
                  stroke={CHART_COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                  name="Net Cash Flow"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-400"></div>
              <span className="text-slate-300">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-400"></div>
              <span className="text-slate-300">Costs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-400 border-dashed border-t-2"></div>
              <span className="text-slate-300">Net Cash Flow</span>
            </div>
            <div className="text-slate-400 text-xs">
              Historical (6M) | Projected (6M)
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Render report content based on selected report
  const renderReportContent = () => {
    if (loading) {
      return (
        <Card variant="glass" className="p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-spin" />
          <h3 className="text-xl font-semibold text-white mb-2">Generating Report</h3>
          <p className="text-slate-400">Please wait while we analyze your data...</p>
        </Card>
      );
    }

    if (error) {
      return (
        <Card variant="glass" className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Report</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button 
            onClick={() => fetchReportData(selectedReport)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </Card>
      );
    }

    switch (selectedReport) {
      case 'profitability':
        return renderProfitabilityReport();
      case 'budgetVsActuals':
        return renderBudgetVsActualsReport();
      case 'cashFlow':
        return renderCashFlowReport();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Advanced Reporting Suite" 
        subtitle="Comprehensive business intelligence and financial analysis dashboard."
        size="lg"
      />

      {/* Report Tabs */}
      <Card variant="glass" className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white">Select Report Type</h2>
          <Button
            onClick={() => fetchReportData(selectedReport)}
            variant="outline"
            className="flex items-center gap-2 shrink-0"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleReportChange(tab.id)}
              className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                selectedReport === tab.id
                  ? 'bg-blue-500/20 border-blue-500/50 text-white'
                  : 'bg-slate-800/30 border-slate-600/30 text-slate-300 hover:bg-slate-800/50 hover:border-slate-500/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedReport === tab.id ? 'bg-blue-500/30' : 'bg-slate-700/50'
                }`}>
                  {tab.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{tab.name}</h3>
                  <p className={`text-sm ${
                    selectedReport === tab.id ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    {tab.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Report Content */}
      {renderReportContent()}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default ReportsPage;