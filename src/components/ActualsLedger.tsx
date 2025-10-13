import React, { useState } from 'react';
import { useProjectActuals, type ActualCost } from '../utils/queries';
import { useActualCostMutations } from '../contexts/ActualCostContext';
import ActualCostModal from './ActualCostModal';
import Button from './Button';
import Card from './Card';
import { Plus, Edit2, Trash2, Filter, Download, Calendar, DollarSign, Package } from 'lucide-react';

interface ActualsLedgerProps {
  projectId: number;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

const ActualsLedger: React.FC<ActualsLedgerProps> = ({ projectId, onSuccess }) => {
  const { data: actuals = [], isLoading, error } = useProjectActuals(projectId);
  const { deleteActualCost } = useActualCostMutations();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actualToEdit, setActualToEdit] = useState<ActualCost | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [costCodeFilter, setCostCodeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'cost_code'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort actuals
  const filteredAndSortedActuals = React.useMemo(() => {
    let result = [...actuals];

    // Apply search filter
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      result = result.filter(actual => 
        actual.description?.toLowerCase().includes(search) ||
        actual.cost_code.toLowerCase().includes(search) ||
        actual.cost_code_description.toLowerCase().includes(search) ||
        actual.vendor_name?.toLowerCase().includes(search)
      );
    }

    // Apply cost code filter
    if (costCodeFilter) {
      result = result.filter(actual => actual.cost_code === costCodeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'cost_code') {
        comparison = a.cost_code.localeCompare(b.cost_code);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [actuals, searchFilter, costCodeFilter, sortBy, sortOrder]);

  // Calculate total
  const total = filteredAndSortedActuals.reduce((sum, actual) => sum + actual.amount, 0);

  // Get unique cost codes for filter dropdown
  const uniqueCostCodes = Array.from(new Set(actuals.map(a => a.cost_code))).sort();

  // Handle add/edit modal
  const handleOpenModal = (actual?: ActualCost) => {
    setActualToEdit(actual || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActualToEdit(null);
  };

  // Handle delete with confirmation
  const handleDelete = async (actual: ActualCost) => {
    if (!window.confirm(`Are you sure you want to delete this expense of $${actual.amount.toLocaleString()}?`)) {
      return;
    }

    try {
      await deleteActualCost(projectId, actual.id);
      if (onSuccess) {
        onSuccess('Expense deleted successfully');
      }
    } catch (error) {
      if (onSuccess) {
        onSuccess(
          error instanceof Error ? error.message : 'Failed to delete expense',
          'error'
        );
      }
    }
  };

  // Handle export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Cost Code', 'Description', 'Amount', 'Vendor', 'Logged By'];
    const rows = filteredAndSortedActuals.map(actual => [
      actual.date,
      `${actual.cost_code} - ${actual.cost_code_description}`,
      actual.description || '',
      actual.amount.toString(),
      actual.vendor_name || '',
      actual.created_by_email
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `actual-costs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Toggle sort
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <Card variant="glass">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-400">Loading actual costs...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glass">
        <div className="text-center py-8">
          <p className="text-red-400">Failed to load actual costs</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card variant="glass">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Actual Costs Ledger</h3>
            <p className="text-slate-400 mt-1">
              Track and manage actual expenses for this project
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Log Expense
          </Button>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Cost Code Filter */}
          <select
            value={costCodeFilter}
            onChange={(e) => setCostCodeFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Cost Codes</option>
            {uniqueCostCodes.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>

          {/* Export Button */}
          <Button
            variant="secondary"
            onClick={handleExport}
            className="flex items-center gap-2"
            disabled={filteredAndSortedActuals.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Table */}
        {filteredAndSortedActuals.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              {actuals.length === 0 ? 'No expenses logged yet' : 'No expenses match your filters'}
            </h3>
            <p className="text-slate-500 mb-6">
              {actuals.length === 0 
                ? 'Start tracking actual costs by logging your first expense.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {actuals.length === 0 && (
              <Button
                variant="primary"
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Log First Expense
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date
                        {sortBy === 'date' && (
                          <span className="text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('cost_code')}
                    >
                      <div className="flex items-center gap-2">
                        Cost Code
                        {sortBy === 'cost_code' && (
                          <span className="text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                      Vendor
                    </th>
                    <th
                      className="text-right py-3 px-4 text-sm font-semibold text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="w-4 h-4" />
                        Amount
                        {sortBy === 'amount' && (
                          <span className="text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedActuals.map((actual) => (
                    <tr
                      key={actual.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {new Date(actual.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm font-mono text-blue-400">{actual.cost_code}</div>
                          <div className="text-xs text-slate-500">{actual.cost_code_description}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {actual.description || <span className="text-slate-500 italic">No description</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {actual.vendor_name || <span className="text-slate-500 italic">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-white">
                        ${actual.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(actual)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(actual)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-600">
                    <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-slate-300 text-right">
                      Total:
                    </td>
                    <td className="py-3 px-4 text-right text-lg font-bold text-white">
                      ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 text-sm text-slate-400 text-center">
              Showing {filteredAndSortedActuals.length} of {actuals.length} expenses
            </div>
          </>
        )}
      </Card>

      {/* Modal */}
      <ActualCostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={onSuccess}
        projectId={projectId}
        actualCostToEdit={actualToEdit}
      />
    </>
  );
};

export default ActualsLedger;

