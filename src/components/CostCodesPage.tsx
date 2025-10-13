import { useState } from 'react';
import { Search, Plus, Download, Upload, Trash2, Edit2, X, Check } from 'lucide-react';
import { useCostCodes, useCostCodeTemplates, type CostCode } from '../utils/queries';
import { useCostCodes as useCostCodeMutations } from '../contexts/CostCodeContext';
import PageHeader from './PageHeader';
import Button from './Button';
import Card from './Card';

interface CostCodesPageProps {
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

const CostCodesPage: React.FC<CostCodesPageProps> = ({ onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CostCode | null>(null);

  // Fetch cost codes and templates
  const { data: costCodes = [], isLoading, error } = useCostCodes({
    search: searchTerm,
    division: selectedDivision,
    includeTemplates: false, // Only show user's custom codes
  });

  const { data: templatesData, isLoading: templatesLoading } = useCostCodeTemplates();
  const { addCostCode, updateCostCode, deleteCostCode, importTemplate } = useCostCodeMutations();

  // Get unique divisions for filter
  const divisions = Array.from(new Set(costCodes.map(code => code.division).filter(Boolean)));

  const handleDeleteCode = async (code: CostCode) => {
    if (!window.confirm(`Are you sure you want to delete cost code "${code.code}"?`)) {
      return;
    }

    try {
      await deleteCostCode(code.id);
      onSuccess?.(`Cost code "${code.code}" deleted successfully`);
    } catch (error: any) {
      onSuccess?.(error.message || 'Failed to delete cost code', 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Description', 'Division'];
    const rows = costCodes.map(code => [
      code.code,
      code.description,
      code.division || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-codes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <PageHeader title="Cost Code Library" />
        <div className="text-center py-12">Loading cost codes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <PageHeader title="Cost Code Library" />
        <div className="text-center py-12 text-red-600 dark:text-red-400">
          Error loading cost codes: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cost Code Library" />

      {/* Action Bar */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto flex gap-2">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Division Filter */}
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Divisions</option>
              {divisions.map(division => (
                <option key={division} value={division!}>{division}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsImportModalOpen(true)} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import CSI Template
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Code
            </Button>
          </div>
        </div>
      </Card>

      {/* Cost Codes Table */}
      <Card>
        {costCodes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No cost codes found. {searchTerm || selectedDivision ? 'Try adjusting your filters.' : 'Get started by creating a custom code or importing CSI templates.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create First Code
              </Button>
              <Button onClick={() => setIsImportModalOpen(true)} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {costCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {code.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {code.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {code.division || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingCode(code)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingCode) && (
        <CostCodeFormModal
          code={editingCode}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingCode(null);
          }}
          onSuccess={(message) => {
            setIsCreateModalOpen(false);
            setEditingCode(null);
            onSuccess?.(message);
          }}
        />
      )}

      {/* Import Template Modal */}
      {isImportModalOpen && (
        <ImportTemplateModal
          templatesData={templatesData}
          isLoading={templatesLoading}
          onClose={() => setIsImportModalOpen(false)}
          onImport={async (templateId, customDescription) => {
            try {
              await importTemplate(templateId, customDescription);
              onSuccess?.('Template imported successfully');
              setIsImportModalOpen(false);
            } catch (error: any) {
              onSuccess?.(error.message || 'Failed to import template', 'error');
            }
          }}
        />
      )}
    </div>
  );
};

// Cost Code Form Modal Component
interface CostCodeFormModalProps {
  code: CostCode | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CostCodeFormModal: React.FC<CostCodeFormModalProps> = ({ code, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: code?.code || '',
    description: code?.description || '',
    division: code?.division || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addCostCode, updateCostCode } = useCostCodeMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (code) {
        await updateCostCode(code.id, formData);
        onSuccess(`Cost code "${formData.code}" updated successfully`);
      } else {
        await addCostCode(formData);
        onSuccess(`Cost code "${formData.code}" created successfully`);
      }
    } catch (error: any) {
      onSuccess(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {code ? 'Edit Cost Code' : 'Create Custom Cost Code'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., 01 11 00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Summary of Work"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Division (Optional)
            </label>
            <input
              type="text"
              value={formData.division}
              onChange={(e) => setFormData({ ...formData, division: e.target.value })}
              placeholder="e.g., 01 - General Requirements"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : code ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import Template Modal Component
interface ImportTemplateModalProps {
  templatesData: { templates: CostCode[]; groupedByDivision: Record<string, CostCode[]> } | undefined;
  isLoading: boolean;
  onClose: () => void;
  onImport: (templateId: number, customDescription?: string) => Promise<void>;
}

const ImportTemplateModal: React.FC<ImportTemplateModalProps> = ({ templatesData, isLoading, onClose, onImport }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CostCode | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());

  const groupedTemplates = templatesData?.groupedByDivision || {};
  const divisions = Object.keys(groupedTemplates).sort();

  const filteredDivisions = searchTerm
    ? divisions.filter(division => {
        const templates = groupedTemplates[division];
        return templates.some(t => 
          t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : divisions;

  const toggleDivision = (division: string) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(division)) {
      newExpanded.delete(division);
    } else {
      newExpanded.add(division);
    }
    setExpandedDivisions(newExpanded);
  };

  const handleImport = async () => {
    if (!selectedTemplate) return;
    await onImport(selectedTemplate.id, customDescription || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import CSI MasterFormat Template
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading templates...</div>
          ) : (
            <div className="space-y-2">
              {filteredDivisions.map(division => (
                <div key={division} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => toggleDivision(division)}
                    className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{division}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {groupedTemplates[division].length} codes
                    </span>
                  </button>
                  
                  {expandedDivisions.has(division) && (
                    <div className="p-2 space-y-1">
                      {groupedTemplates[division]
                        .filter(template => 
                          !searchTerm ||
                          template.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(template => (
                          <button
                            key={template.id}
                            onClick={() => {
                              setSelectedTemplate(template);
                              setCustomDescription(template.description);
                            }}
                            className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                              selectedTemplate?.id === template.id
                                ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                  {template.code}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {template.description}
                                </div>
                              </div>
                              {selectedTemplate?.id === template.id && (
                                <Check className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedTemplate && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Customize Description (Optional)</h4>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder={selectedTemplate.description}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            className="flex-1"
            disabled={!selectedTemplate}
          >
            Import Selected Template
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CostCodesPage;

