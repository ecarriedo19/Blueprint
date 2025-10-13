import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from './Button';
import Card from './Card';
import { Lock, Unlock, Calendar, User, FileText, AlertCircle } from 'lucide-react';
import type { BudgetSummary } from '../utils/queries';

interface BaselineBudgetControlsProps {
  projectId: number;
  budgetSummary: BudgetSummary;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

const BaselineBudgetControls: React.FC<BaselineBudgetControlsProps> = ({
  projectId,
  budgetSummary,
  onSuccess
}) => {
  const queryClient = useQueryClient();
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showUnfreezeModal, setShowUnfreezeModal] = useState(false);
  const [notes, setNotes] = useState('');

  const { baselineFrozen, baseline } = budgetSummary;

  // Freeze baseline mutation
  const freezeMutation = useMutation({
    mutationFn: async (freezeNotes: string) => {
      const response = await fetch(`/api/projects/${projectId}/baseline/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: freezeNotes }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to freeze baseline');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setShowFreezeModal(false);
      setNotes('');
      if (onSuccess) {
        onSuccess('Budget baseline frozen successfully! Budget changes are now locked.');
      }
    },
    onError: (error: Error) => {
      if (onSuccess) {
        onSuccess(error.message, 'error');
      }
    }
  });

  // Unfreeze baseline mutation
  const unfreezeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/baseline`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to unfreeze baseline');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setShowUnfreezeModal(false);
      if (onSuccess) {
        onSuccess('Budget baseline unfrozen. You can now modify the budget.');
      }
    },
    onError: (error: Error) => {
      if (onSuccess) {
        onSuccess(error.message, 'error');
      }
    }
  });

  const handleFreeze = () => {
    freezeMutation.mutate(notes);
  };

  const handleUnfreeze = () => {
    unfreezeMutation.mutate();
  };

  if (!baselineFrozen) {
    return (
      <>
        <Card variant="glass">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <Unlock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Budget Baseline Not Frozen
                </h3>
                <p className="text-slate-400 text-sm max-w-2xl">
                  Freeze your budget baseline to lock in current budgeted amounts for accurate variance tracking. 
                  This creates a snapshot of your approved quotes and change orders, preventing budget modifications 
                  from affecting historical analysis.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Only admins can freeze/unfreeze baselines</span>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowFreezeModal(true)}
              className="flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Freeze Baseline
            </Button>
          </div>
        </Card>

        {/* Freeze Confirmation Modal */}
        {showFreezeModal && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowFreezeModal(false)}
          >
            <Card variant="glass" className="max-w-lg w-full">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                Freeze Budget Baseline
              </h3>
              <p className="text-slate-300 mb-4">
                This will create a snapshot of your current budget (approved quotes + change orders) for variance analysis. 
                You won't be able to modify the budget until you unfreeze it.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="e.g., Q4 2024 baseline, Post-design changes freeze, etc."
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowFreezeModal(false)}
                  className="flex-1"
                  disabled={freezeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleFreeze}
                  loading={freezeMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Freeze Baseline
                </Button>
              </div>
            </Card>
          </div>
        )}
      </>
    );
  }

  // Baseline is frozen - show info card
  return (
    <>
      <Card variant="glass">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <Lock className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                Budget Baseline Frozen
                <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs font-semibold text-green-400">
                  LOCKED
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Frozen: {new Date(baseline?.frozen_at || '').toLocaleString()}</span>
                </div>
                {baseline?.notes && (
                  <div className="flex items-start gap-2 text-slate-300 md:col-span-2">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                    <span className="italic">"{baseline.notes}"</span>
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-3">
                Budget is locked for accurate variance tracking. Unfreeze to allow budget modifications.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowUnfreezeModal(true)}
            className="flex items-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            Unfreeze
          </Button>
        </div>
      </Card>

      {/* Unfreeze Confirmation Modal */}
      {showUnfreezeModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowUnfreezeModal(false)}
        >
          <Card variant="glass" className="max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Unfreeze Budget Baseline
            </h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to unfreeze the budget baseline? This will allow budget modifications 
              but may affect your variance analysis accuracy. You can freeze it again later.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowUnfreezeModal(false)}
                className="flex-1"
                disabled={unfreezeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleUnfreeze}
                loading={unfreezeMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Unfreeze
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default BaselineBudgetControls;

