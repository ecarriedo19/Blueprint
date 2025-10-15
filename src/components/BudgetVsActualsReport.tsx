import React, { useState, useMemo } from 'react';
import Card from './Card';
import BudgetHealthIndicator from './BudgetHealthIndicator';
import { BarChart3, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Download } from 'lucide-react';
import type { BudgetVsActualsItem, BudgetSummary } from '../utils/queries';

interface BudgetVsActualsReportProps {
  budgetVsActuals: BudgetVsActualsItem[];
  budgetSummary: BudgetSummary;
}

const BudgetVsActualsReport: React.FC<BudgetVsActualsReportProps> = ({ 
  budgetVsActuals, 
  budgetSummary 
}) => {
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'code' | 'budget' | 'actual' | 'variance'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Group by division
  const groupedData = useMemo(() => {
    const groups: Record<string, BudgetVsActualsItem[]> = {};
    
    budgetVsActuals.forEach(item => {
      const division = item.division || 'Uncategorized';
      if (!groups[division]) {
        groups[division] = [];
      }
      groups[division].push(item);
    });

    // Sort items within each division
    Object.keys(groups).forEach(division => {
      groups[division].sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'code') {
          comparison = a.code.localeCompare(b.code);
        } else if (sortBy === 'budget') {
          comparison = a.budgetedAmount - b.budgetedAmount;
        } else if (sortBy === 'actual') {
          comparison = a.actualAmount - b.actualAmount;
        } else if (sortBy === 'variance') {
          comparison = a.variance - b.variance;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    });

    return groups;
  }, [budgetVsActuals, sortBy, sortOrder]);

  const divisions = Object.keys(groupedData).sort();

  // Toggle division expansion
  const toggleDivision = (division: string) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(division)) {
      newExpanded.delete(division);
    } else {
      newExpanded.add(division);
    }
    setExpandedDivisions(newExpanded);
  };

  // Expand all/collapse all
  const expandAll = () => setExpandedDivisions(new Set(divisions));
  const collapseAll = () => setExpandedDivisions(new Set());

  // Handle sort
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Get variance color
  const getVarianceColor = (status: BudgetVsActualsItem['status']) => {
    switch (status) {
      case 'under_budget':
        return 'text-green-400';
      case 'over_budget':
        return 'text-red-400';
      default:
        return 'text-slate-300';
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Division', 'Cost Code', 'Description', 'Budgeted', 'Actual', 'Variance', 'Variance %', 'Status'];
    const rows = budgetVsActuals.map(item => [
      item.division || 'Uncategorized',
      item.code,
      item.description,
      item.budgetedAmount.toString(),
      item.actualAmount.toString(),
      item.variance.toString(),
      item.variancePercent.toFixed(2),
      item.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-vs-actuals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!budgetVsActuals || budgetVsActuals.length === 0) {
    return (
      <Card variant="default">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">
            No Budget Data Available
          </h3>
          <p className="text-muted-foreground">
            Approve quotes and log expenses to see budget analysis.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Budget vs. Actuals Analysis
          </h2>
          <p className="text-muted-foreground mt-2">
            Real-time financial performance tracking by cost code
          </p>
          {budgetSummary.baselineFrozen && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg">
              <span className="text-xs font-semibold text-primary">
                📌 Baseline Frozen: {new Date(budgetSummary.baseline?.frozen_at || '').toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Budget Health Indicator */}
        <div className="flex-shrink-0">
          <BudgetHealthIndicator summary={budgetSummary} size="md" showDetails={true} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground w-12"></th>
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('code')}
              >
                <div className="flex items-center gap-2">
                  Cost Code
                  {sortBy === 'code' && (
                    <span className="text-primary">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Description
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('budget')}
              >
                <div className="flex items-center justify-end gap-2">
                  Budgeted
                  {sortBy === 'budget' && (
                    <span className="text-blue-400">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('actual')}
              >
                <div className="flex items-center justify-end gap-2">
                  Actual
                  {sortBy === 'actual' && (
                    <span className="text-blue-400">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('variance')}
              >
                <div className="flex items-center justify-end gap-2">
                  Variance
                  {sortBy === 'variance' && (
                    <span className="text-blue-400">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {divisions.map(division => {
              const items = groupedData[division];
              const isExpanded = expandedDivisions.has(division);
              const divisionTotal = items.reduce((sum, item) => ({
                budget: sum.budget + item.budgetedAmount,
                actual: sum.actual + item.actualAmount,
                variance: sum.variance + item.variance
              }), { budget: 0, actual: 0, variance: 0 });

              return (
                <React.Fragment key={division}>
                  {/* Division Header Row */}
                  <tr
                    className="bg-slate-800/30 border-b border-slate-700/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => toggleDivision(division)}
                  >
                    <td className="py-3 px-4">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                    <td colSpan={2} className="py-3 px-4 font-semibold text-white">
                      {division}
                      <span className="ml-2 text-xs text-slate-400">
                        ({items.length} code{items.length !== 1 ? 's' : ''})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      ${divisionTotal.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      ${divisionTotal.actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      ${divisionTotal.variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>

                  {/* Cost Code Detail Rows */}
                  {isExpanded && items.map(item => (
                    <tr
                      key={item.costCodeId}
                      className="border-b border-slate-700/20 hover:bg-slate-800/20 transition-colors"
                    >
                      <td></td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm text-blue-400">{item.code}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {item.description}
                        <div className="text-xs text-slate-500 mt-1">
                          {item.lineItemCount} budget item{item.lineItemCount !== 1 ? 's' : ''} • {item.expenseCount} expense{item.expenseCount !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-slate-300">
                        ${item.budgetedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-slate-300">
                        ${item.actualAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-4 text-right text-sm font-semibold ${getVarianceColor(item.status)}`}>
                        <div className="flex items-center justify-end gap-1">
                          {item.variance >= 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          ${Math.abs(item.variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          <span className="text-xs">
                            ({item.variancePercent.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          item.status === 'under_budget'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : item.status === 'over_budget'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                          {item.status === 'under_budget' && '✓ Under'}
                          {item.status === 'over_budget' && '✗ Over'}
                          {item.status === 'on_budget' && '= On Track'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Grand Total Row */}
            <tr className="border-t-2 border-slate-600 bg-slate-800/50">
              <td colSpan={3} className="py-4 px-4 font-bold text-white text-right">
                TOTAL:
              </td>
              <td className="py-4 px-4 text-right font-bold text-white">
                ${budgetSummary.totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 text-right font-bold text-white">
                ${budgetSummary.totalActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className={`py-4 px-4 text-right font-bold ${getVarianceColor(
                budgetSummary.variancePercent < -5 ? 'over_budget' : budgetSummary.variancePercent > 5 ? 'under_budget' : 'on_budget'
              )}`}>
                ${Math.abs(budgetSummary.totalVariance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="text-sm ml-1">
                  ({budgetSummary.variancePercent.toFixed(1)}%)
                </span>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default BudgetVsActualsReport;

