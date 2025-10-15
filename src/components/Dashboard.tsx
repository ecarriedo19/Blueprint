
import { BarChart3, TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useDashboardSummary, useCurrentUser } from '../utils/queries';

interface DashboardProps {
  companyName?: string;
}


// Color palette for charts (using new design system)
const CHART_COLORS = {
  primary: 'hsl(221.2 83.2% 53.3%)', // Primary blue
  secondary: 'hsl(262.1 83.3% 57.8%)', // Accent purple
  success: 'hsl(142.1 76.2% 36.3%)', // Success green
  warning: 'hsl(32.1 94.6% 43.7%)', // Warning orange
  danger: 'hsl(0 84.2% 60.2%)', // Destructive red
  muted: 'hsl(215.4 16.3% 46.9%)' // Muted gray
};

const STATUS_COLORS: { [key: string]: string } = {
  'Draft': 'hsl(215.4 16.3% 46.9%)', // Muted
  'Sent': 'hsl(32.1 94.6% 43.7%)', // Warning
  'Pending': 'hsl(32.1 94.6% 43.7%)', // Warning
  'Client to be review': 'hsl(32.1 94.6% 43.7%)', // Warning
  'Approved': 'hsl(142.1 76.2% 36.3%)', // Success
  'Working on it': 'hsl(221.2 83.2% 53.3%)', // Primary
  'In Progress': 'hsl(221.2 83.2% 53.3%)', // Primary
  'Completed': 'hsl(262.1 83.3% 57.8%)', // Accent
  'Rejected': 'hsl(0 84.2% 60.2%)' // Destructive
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
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{label}</p>
          <p className="text-primary">
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
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-muted-foreground">
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Company Name Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {companyName}
          </h1>
        </div>
        <div className="border border-border rounded-lg bg-card p-12 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span className="text-muted-foreground">Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }



  if (error || !dashboardData) {
    console.error('Dashboard error:', error);
    console.log('Dashboard data:', dashboardData);
    return (
      <div className="space-y-8">
        {/* Company Name Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {companyName}
          </h1>
        </div>
        <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <p className="text-destructive">{error?.message || 'Failed to load dashboard data'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, cashFlowData } = dashboardData;
  
  // Add defensive checks for undefined data
  if (!kpis) {
    console.error('KPIs data is missing from dashboard response:', dashboardData);
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{companyName || 'Blueprint'}</h1>
        </div>
        <div className="border border-warning/50 bg-warning/10 rounded-lg p-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-warning" />
            <p className="text-warning-foreground">Dashboard data structure is incomplete. Please check server configuration.</p>
          </div>
        </div>
      </div>
    );
  }
  
  const pieChartData = getPieChartData();

  return (
    <div className="space-y-8">
      {/* Company Name Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {companyName}
        </h1>
      </div>

      {/* KPI Header Bar */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue KPI */}
          <div className="flex items-center space-x-4 lg:border-r border-border lg:pr-6">
            <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-foreground">
                  {formatCurrency(kpis.totalRevenue)}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getPercentageColor(kpis.growthRate)} bg-muted/50`}>
                  {formatPercentage(kpis.growthRate)}
                </span>
              </div>
            </div>
          </div>

          {/* Total Budget KPI */}
          <div className="flex items-center space-x-4 lg:border-r border-border lg:pr-6">
            <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <h3 className="text-2xl font-bold text-foreground">
                {formatCurrency(kpis.totalBudget)}
              </h3>
            </div>
          </div>

          {/* Total Projects KPI */}
          <div className="flex items-center space-x-4 lg:border-r border-border lg:pr-6">
            <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-foreground">
                  {kpis.totalProjects}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  {kpis.activeProjects} Active
                </span>
              </div>
            </div>
          </div>

          {/* Profit Margin KPI */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
              <h3 className={`text-2xl font-bold ${getPercentageColor(kpis.profitMargin)}`}>
                {formatPercentage(kpis.profitMargin)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cash Flow Chart Section */}
        <div className="border border-border rounded-lg bg-card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Cash Flow Trend</h2>
            <p className="text-sm text-muted-foreground mt-1">Revenue from approved projects over the last 6 months</p>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214.3 31.8% 91.4%)" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(215.4 16.3% 46.9%)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(215.4 16.3% 46.9%)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(221.2 83.2% 53.3%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Project Status Chart Section */}
        <div className="border border-border rounded-lg bg-card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Project Status Distribution</h2>
            <p className="text-sm text-muted-foreground mt-1">Breakdown of projects by current status</p>
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
                      wrapperStyle={{ color: 'hsl(222.2 47.4% 11.2%)', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No project data available</p>
                  <p className="text-muted-foreground/60 text-sm">Create your first quote to see status distribution</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Insights Section */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Business Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">Key metrics and recommendations for your construction business</p>
        </div>
        <div className="p-6 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-lg mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Growth Rate</h3>
            <p className={`text-2xl font-bold mb-2 ${getPercentageColor(kpis.growthRate)}`}>
              {formatPercentage(kpis.growthRate)}
            </p>
            <p className="text-sm text-muted-foreground">
              {kpis.growthRate > 0 ? 'Strong month-over-month growth' : 'Focus on new client acquisition'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-lg mx-auto mb-4">
              <Activity className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Active Projects</h3>
            <p className="text-2xl font-bold text-foreground mb-2">
              {((kpis.activeProjects / Math.max(kpis.totalProjects, 1)) * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Of your projects are currently active
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-lg mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Avg Project Value</h3>
            <p className="text-2xl font-bold text-foreground mb-2">
              {formatCurrency(kpis.totalProjects > 0 ? kpis.totalRevenue / kpis.totalProjects : 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              Average revenue per project
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}