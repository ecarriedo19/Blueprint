
import { BarChart3, TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Card from './Card';
import { useDashboardSummary, useCurrentUser } from '../utils/queries';

interface DashboardProps {
  companyName?: string;
}


// Color palette for charts (using Tailwind colors)
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4'
};

const STATUS_COLORS: { [key: string]: string } = {
  'Draft': '#6b7280',
  'Sent': '#f59e0b',
  'Pending': '#f59e0b',
  'Client to be review': '#f59e0b',
  'Approved': '#10b981',
  'Working on it': '#3b82f6',
  'In Progress': '#3b82f6',
  'Completed': '#8b5cf6',
  'Rejected': '#ef4444'
};

export default function Dashboard({ companyName = 'Company Co' }: DashboardProps = {}) {
  const { data: currentUser } = useCurrentUser();
  const { data: dashboardData, isLoading: loading, error } = useDashboardSummary(!!currentUser);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage > 0) return 'text-green-600';
    if (percentage < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Transform status breakdown data for pie chart
  const getPieChartData = () => {
    if (!dashboardData?.statusBreakdown) return [];
    
    return Object.entries(dashboardData.statusBreakdown).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || CHART_COLORS.primary
    }));
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-blue-600">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-gray-600">
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Company Name Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            {companyName}
          </h1>
        </div>
        <Card variant="glass" className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span className="text-slate-300">Loading dashboard data...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Company Name Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            {companyName}
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} variant="glass" className="h-32 animate-pulse">
              <div className="h-full bg-white/5 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    console.error('Dashboard error:', error);
    console.log('Dashboard data:', dashboardData);
    return (
      <div className="space-y-6">
        {/* Company Name Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            {companyName}
          </h1>
        </div>
        <Card variant="glass" className="border-red-500/50 bg-red-500/10 text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <p className="text-red-300">{error?.message || 'Failed to load dashboard data'}</p>
          </div>
        </Card>
      </div>
    );
  }

  const { kpis, cashFlowData } = dashboardData;
  
  // Add defensive checks for undefined data
  if (!kpis) {
    console.error('KPIs data is missing from dashboard response:', dashboardData);
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{companyName || 'Blueprint'}</h1>
        </div>
        <Card variant="glass" className="border-yellow-500/50 bg-yellow-500/10 text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <p className="text-yellow-300">Dashboard data structure is incomplete. Please check server configuration.</p>
          </div>
        </Card>
      </div>
    );
  }
  
  const pieChartData = getPieChartData();

  return (
    <div className="space-y-6">
      {/* Company Name Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          {companyName}
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full bg-white/20 ${getPercentageColor(kpis.growthRate)}`}>
              {formatPercentage(kpis.growthRate)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {formatCurrency(kpis.totalRevenue)}
          </h3>
          <p className="uppercase tracking-wider text-xs text-slate-400">Total Revenue</p>
        </Card>

        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full bg-white/20 ${getPercentageColor(kpis.profitMargin)}`}>
              {formatPercentage(kpis.profitMargin)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {formatCurrency(kpis.totalBudget)}
          </h3>
          <p className="uppercase tracking-wider text-xs text-slate-400">Total Budget</p>
        </Card>

        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
              {kpis.activeProjects} Active
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {kpis.totalProjects}
          </h3>
          <p className="uppercase tracking-wider text-xs text-slate-400">Total Projects</p>
        </Card>

        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full bg-white/20 ${getPercentageColor(kpis.profitMargin)}`}>
              Margin
            </span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${getPercentageColor(kpis.profitMargin)}`}>
            {formatPercentage(kpis.profitMargin)}
          </h3>
          <p className="uppercase tracking-wider text-xs text-slate-400">Profit Margin</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <Card variant="glass">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-xl font-semibold text-white">Cash Flow Trend</h3>
            <p className="text-slate-400 mt-1">Revenue from approved projects over the last 6 months</p>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#colorGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Project Status Chart */}
        <Card variant="glass">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-xl font-semibold text-white">Project Status Distribution</h3>
            <p className="text-slate-400 mt-1">Breakdown of projects by current status</p>
          </div>
          <div className="p-6">
            {pieChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No project data available</p>
                  <p className="text-slate-500 text-sm">Create your first quote to see status distribution</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Additional Insights Card */}
      <Card variant="glass">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-xl font-semibold text-white">Business Insights</h3>
          <p className="text-slate-400 mt-1">Key metrics and recommendations for your construction business</p>
        </div>
        <div className="p-6 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Growth Rate</h4>
            <p className={`text-2xl font-bold mb-2 ${getPercentageColor(kpis.growthRate)}`}>
              {formatPercentage(kpis.growthRate)}
            </p>
            <p className="text-slate-400 text-sm">
              {kpis.growthRate > 0 ? 'Strong month-over-month growth' : 'Focus on new client acquisition'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full mx-auto mb-4">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Active Projects</h4>
            <p className="text-2xl font-bold text-white mb-2">
              {((kpis.activeProjects / Math.max(kpis.totalProjects, 1)) * 100).toFixed(0)}%
            </p>
            <p className="text-slate-400 text-sm">
              Of your projects are currently active
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Avg Project Value</h4>
            <p className="text-2xl font-bold text-white mb-2">
              {formatCurrency(kpis.totalProjects > 0 ? kpis.totalRevenue / kpis.totalProjects : 0)}
            </p>
            <p className="text-slate-400 text-sm">
              Average revenue per project
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}