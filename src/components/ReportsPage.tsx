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
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <p className="text-foreground font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render Profitability Report
  const renderProfitabilityReport = () => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Profitability Data</h3>
          <p className="text-muted-foreground">
            No profitability data found. Create quotes and mark them as completed to see quarterly performance.
          </p>
        </div>
      );
    }

    const totalRevenue = reportData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalCosts = reportData.reduce((sum, item) => sum + item.totalCosts, 0);
    const avgProfitMargin = reportData.length > 0 
      ? reportData.reduce((sum, item) => sum + item.profitMargin, 0) / reportData.length 
      : 0;

    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 text-success rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue (4Q)</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Costs (4Q)</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCosts)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${avgProfitMargin >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Profit Margin</p>
                <p className={`text-2xl font-bold ${avgProfitMargin >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatPercentage(avgProfitMargin)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Quarterly Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214.3 31.8% 91.4%)" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: 'hsl(215.4 16.3% 46.9%)' }}
                  stroke="hsl(214.3 31.8% 91.4%)"
                />
                <YAxis 
                  tick={{ fill: 'hsl(215.4 16.3% 46.9%)' }}
                  stroke="hsl(214.3 31.8% 91.4%)"
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
        </div>
      </div>
    );
  };

  // Render Budget vs Actuals Report
  const renderBudgetVsActualsReport = () => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Budget Data</h3>
          <p className="text-muted-foreground">
            No projects with budgets found. Create projects and quotes to track budget vs actual performance.
          </p>
        </div>
      );
    }

    const overBudgetProjects = reportData.filter(project => project.isOverBudget).length;
    const totalBudget = reportData.reduce((sum, project) => sum + project.totalBudget, 0);
    const totalActual = reportData.reduce((sum, project) => sum + project.totalActual, 0);
    const overallVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold text-foreground">{reportData.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Over Budget</p>
                <p className="text-2xl font-bold text-destructive">{overBudgetProjects}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${overallVariance >= 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                {overallVariance >= 0 ? 
                  <TrendingUp className="w-6 h-6" /> : 
                  <TrendingDown className="w-6 h-6" />
                }
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Variance</p>
                <p className={`text-2xl font-bold ${overallVariance >= 0 ? 'text-destructive' : 'text-success'}`}>
                  {formatPercentage(overallVariance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-bold text-foreground">Project Budget Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-muted-foreground font-semibold">Project</th>
                  <th className="text-right py-4 px-6 text-muted-foreground font-semibold">Budget</th>
                  <th className="text-right py-4 px-6 text-muted-foreground font-semibold">Actual</th>
                  <th className="text-right py-4 px-6 text-muted-foreground font-semibold">Variance</th>
                  <th className="text-center py-4 px-6 text-muted-foreground font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportData.map((project) => (
                  <tr key={project.projectId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-foreground font-medium">{project.projectName}</p>
                        <p className="text-muted-foreground text-sm">{project.totalQuotes} quotes</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-foreground font-medium">
                      {formatCurrency(project.totalBudget)}
                    </td>
                    <td className="py-4 px-6 text-right text-foreground font-medium">
                      {formatCurrency(project.totalActual)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-medium ${
                        project.variance >= 0 ? 'text-destructive' : 'text-success'
                      }`}>
                        {project.variance >= 0 ? '+' : ''}{formatCurrency(project.variance)}
                      </span>
                      <p className={`text-sm ${
                        project.variancePercentage >= 0 ? 'text-destructive' : 'text-success'
                      }`}>
                        ({formatPercentage(project.variancePercentage)})
                      </p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        project.isOverBudget 
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-success/10 text-success border-success/20'
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
        </div>
      </div>
    );
  };

  // Render Cash Flow Report
  const renderCashFlowReport = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Cash Flow Data</h3>
          <p className="text-muted-foreground">
            No cash flow data available. Add completed quotes to see cash flow projections.
          </p>
        </div>
      );
    }

    const { data: cashFlowData, summary } = reportData;

    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 text-success rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Monthly Revenue</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.avgMonthlyRevenue)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Monthly Costs</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.avgMonthlyCosts)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${summary.avgNetCashFlow >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Net Cash Flow</p>
                <p className={`text-2xl font-bold ${summary.avgNetCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(summary.avgNetCashFlow)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected Revenue (6M)</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalProjectedRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Cash Flow Trends & Projections</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214.3 31.8% 91.4%)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(215.4 16.3% 46.9%)' }}
                  stroke="hsl(214.3 31.8% 91.4%)"
                />
                <YAxis 
                  tick={{ fill: 'hsl(215.4 16.3% 46.9%)' }}
                  stroke="hsl(214.3 31.8% 91.4%)"
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
              <span className="text-muted-foreground">Costs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary border-dashed border-t-2"></div>
              <span className="text-muted-foreground">Net Cash Flow</span>
            </div>
            <div className="text-muted-foreground text-xs">
              Historical (6M) | Projected (6M)
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render report content based on selected report
  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Loading Report...</h3>
          <p className="text-muted-foreground">Please wait while we fetch your data</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Error Loading Report</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button 
            onClick={() => fetchReportData(selectedReport)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
        </div>
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

      {/* Report Type Tabs */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-wrap gap-2 border-b border-border pb-4 mb-4">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleReportChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedReport === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
        
        {/* Selected Tab Description */}
        <div className="text-sm text-muted-foreground">
          {REPORT_TABS.find(tab => tab.id === selectedReport)?.description}
        </div>
      </div>

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