import React, { useState } from 'react';
import PageHeader from './PageHeader';
import Card from './Card';
import Button from './Button';
import { useQuotes, Quote } from '../contexts/QuoteContext';

const QuotesPage = () => {
  const { quotes, loading, error, addQuote } = useQuotes();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    quoteName: '',
    status: 'Draft',
    timeToDevelop: '',
    variancePercentage: 0,
    quoteTotal: 0,
    budget: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quoteName.trim()) return;

    setIsSubmitting(true);
    try {
      await addQuote(formData);
      setFormData({
        quoteName: '',
        status: 'Draft',
        timeToDevelop: '',
        variancePercentage: 0,
        quoteTotal: 0,
        budget: 0
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create quote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  // Empty State Component
  const EmptyState = () => (
    <Card variant="glass" className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">No Quotes Yet</h3>
        <p className="text-slate-400 mb-8 leading-relaxed">
          You don't have any quotes yet. Create your first quote to start managing construction project estimates and costs.
        </p>
        <Button
          onClick={() => setShowCreateForm(true)}
          size="lg"
          className="px-8"
        >
          + Add Your First Quote
        </Button>
      </div>
    </Card>
  );

  // Create Quote Form Component
  const CreateQuoteForm = () => (
    <Card variant="glass" className="mb-6">
      <form onSubmit={handleCreateQuote} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Create New Quote</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCreateForm(false)}
            size="sm"
          >
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Quote Name *
            </label>
            <input
              type="text"
              value={formData.quoteName}
              onChange={(e) => setFormData({ ...formData, quoteName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Downtown Office Building"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time to Develop
            </label>
            <input
              type="text"
              value={formData.timeToDevelop}
              onChange={(e) => setFormData({ ...formData, timeToDevelop: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 8-12 weeks"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Variance Percentage
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.variancePercentage}
              onChange={(e) => setFormData({ ...formData, variancePercentage: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Quote Total
            </label>
            <input
              type="number"
              step="1000"
              value={formData.quoteTotal}
              onChange={(e) => setFormData({ ...formData, quoteTotal: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Budget
            </label>
            <input
              type="number"
              step="1000"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!formData.quoteName.trim()}
          >
            Create Quote
          </Button>
        </div>
      </form>
    </Card>
  );

  // Quotes Table Component
  const QuotesTable = () => (
    <Card variant="glass">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Quote
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Time to Develop
              </th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Percentage of Variances
              </th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Quote Total
              </th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Budget
              </th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote, index) => (
              <tr
                key={quote.id}
                className={`
                  border-b border-slate-700/30 hover:bg-white/5 transition-colors duration-200
                  ${index === quotes.length - 1 ? 'border-b-0' : ''}
                `}
              >
                <td className="py-4 px-4">
                  <div>
                    <h4 className="text-white font-medium">{quote.quoteName}</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Created {new Date(quote.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`
                      inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                      ${getStatusBadgeClass(quote.status)}
                    `}
                  >
                    {quote.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-slate-300">
                    {quote.timeToDevelop || '—'}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-slate-300">
                    {formatPercentage(quote.variancePercentage)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-white font-semibold">
                    {formatCurrency(quote.quoteTotal)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-slate-300">
                    {formatCurrency(quote.budget)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Quotes" 
          subtitle="Generate and manage construction quotes with AI assistance."
          size="lg"
        />
        
        {quotes.length > 0 && !showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="shrink-0"
          >
            + New Quote
          </Button>
        )}
      </div>

      {error && (
        <Card variant="glass" className="border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-300">{error}</p>
          </div>
        </Card>
      )}

      {showCreateForm && <CreateQuoteForm />}

      {loading ? (
        <Card variant="glass" className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span className="text-slate-300">Loading quotes...</span>
          </div>
        </Card>
      ) : quotes.length === 0 && !showCreateForm ? (
        <EmptyState />
      ) : quotes.length > 0 ? (
        <QuotesTable />
      ) : null}
    </div>
  );
};

export default QuotesPage;
