/**
 * ExpensesTab
 * Spesenverwaltung mit Beleg-Upload
 */

import React, { useState, useRef } from 'react';
import {
  DollarSign,
  Plus,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Receipt,
  Edit,
  Trash2,
  Download,
  Eye
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, LoadingSpinner } from '../admin/GlassUI';
import { 
  useExpenses, 
  useSubmitExpense, 
  useApproveExpense 
} from '../../api/hrHooks';
import type { 
  ExpenseCreate, 
  ExpenseResponse, 
  ExpenseApprovalRequest
} from '../../types/hr';
import { ExpenseCategory, ExpenseStatus, EXPENSE_CATEGORY_LABELS, EXPENSE_STATUS_LABELS } from '../../types/hr';

interface ExpensesTabProps {
  employeeId: string;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ employeeId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formular-Daten
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    category: ExpenseCategory.TRAVEL,
    description: '',
    receipt_url: ''
  });

  const { 
    data: expensesData, 
    isLoading, 
    error 
  } = useExpenses({
    employee_id: employeeId,
    status: filterStatus === 'all' ? undefined : filterStatus,
    category: filterCategory === 'all' ? undefined : filterCategory,
    start_date: new Date(filterYear, filterMonth, 1).toISOString().split('T')[0],
    end_date: new Date(filterYear, filterMonth + 1, 0).toISOString().split('T')[0]
  });

  const submitExpenseMutation = useSubmitExpense();
  const approveExpenseMutation = useApproveExpense();

  const expenses = expensesData?.items || [];

  const handleSubmitExpense = async () => {
    if (!formData.date || !formData.amount || !formData.description) return;

    const expenseData: ExpenseCreate = {
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      receipt_url: formData.receipt_url || undefined
    };

    try {
      await submitExpenseMutation.mutateAsync(expenseData);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Fehler beim Einreichen der Spesen:', error);
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense || !formData.date || !formData.amount || !formData.description) return;

    // TODO: Implement update expense mutation
    console.log('Edit expense:', editingExpense.id, formData);
    setShowEditModal(false);
    setEditingExpense(null);
    resetForm();
  };

  const handleApproveExpense = async (expenseId: string, approved: boolean) => {
    const approvalData: ExpenseApprovalRequest = {
      approved,
      manager_notes: approved ? 'Genehmigt' : 'Abgelehnt'
    };

    try {
      await approveExpenseMutation.mutateAsync({
        expenseId,
        approvalData
      });
    } catch (error) {
      console.error('Fehler beim Genehmigen/Ablehnen:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement file upload to server
      // For now, just set a placeholder URL
      setFormData(prev => ({ ...prev, receipt_url: `uploaded_${file.name}` }));
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      amount: '',
      category: ExpenseCategory.TRAVEL,
      description: '',
      receipt_url: ''
    });
  };

  const openEditModal = (expense: ExpenseResponse) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      receipt_url: expense.receipt_url || ''
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case ExpenseStatus.SUBMITTED:
        return <Badge variant="warning">Eingereicht</Badge>;
      case ExpenseStatus.APPROVED:
        return <Badge variant="success">Genehmigt</Badge>;
      case ExpenseStatus.REJECTED:
        return <Badge variant="danger">Abgelehnt</Badge>;
      case ExpenseStatus.PAID:
        return <Badge variant="default">Bezahlt</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getApprovedExpenses = () => {
    return expenses
      .filter(expense => expense.status === ExpenseStatus.APPROVED || expense.status === ExpenseStatus.PAID)
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const getPendingExpenses = () => {
    return expenses
      .filter(expense => expense.status === ExpenseStatus.SUBMITTED)
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return categoryTotals;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Fehler beim Laden der Spesen
        </h3>
        <p className="text-gray-600">
          Die Spesendaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="w-6 h-6 mr-2" />
            Spesenverwaltung
          </h2>
          <p className="text-gray-600 mt-1">
            Spesen einreichen und Belege verwalten
          </p>
        </div>
        
        <GlassButton 
          variant="primary" 
          className="flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Spesen einreichen
        </GlassButton>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamt Spesen</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(getTotalExpenses())}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Genehmigte Spesen</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(getApprovedExpenses())}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ausstehende Spesen</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(getPendingExpenses())}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Anzahl Belege</p>
              <p className="text-2xl font-bold text-gray-900">
                {expenses.length}
              </p>
            </div>
            <Receipt className="w-8 h-8 text-purple-500" />
          </div>
        </GlassCard>
      </div>

      {/* Kategorie-Übersicht */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Spesen nach Kategorien
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(getExpensesByCategory()).map(([category, amount]) => (
            <div key={category} className="text-center">
              <p className="text-sm text-gray-600">{EXPENSE_CATEGORY_LABELS[category as ExpenseCategory]}</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(amount)}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Filter und Suche */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Spesen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ExpenseStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Status</option>
              <option value={ExpenseStatus.SUBMITTED}>Eingereicht</option>
              <option value={ExpenseStatus.APPROVED}>Genehmigt</option>
              <option value={ExpenseStatus.REJECTED}>Abgelehnt</option>
              <option value={ExpenseStatus.PAID}>Bezahlt</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Kategorien</option>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleDateString('de-DE', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Spesenliste */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beleg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(expense.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {expense.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {expense.receipt_url ? (
                      <div className="flex items-center gap-2">
                        <GlassButton
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(expense.receipt_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </GlassButton>
                        <GlassButton
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(expense.receipt_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </GlassButton>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Kein Beleg</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(expense.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {expense.status === ExpenseStatus.SUBMITTED && (
                        <>
                          <GlassButton
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveExpense(expense.id, true)}
                            disabled={approveExpenseMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </GlassButton>
                          <GlassButton
                            variant="danger"
                            size="sm"
                            onClick={() => handleApproveExpense(expense.id, false)}
                            disabled={approveExpenseMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" />
                          </GlassButton>
                        </>
                      )}
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(expense)}
                      >
                        <Edit className="w-4 h-4" />
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leerer Zustand */}
        {expenses.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Spesen gefunden
            </h3>
            <p className="text-gray-600">
              Es wurden noch keine Spesen für den ausgewählten Zeitraum eingereicht.
            </p>
          </div>
        )}
      </GlassCard>

      {/* Spesen einreichen Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Spesen einreichen
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betrag (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Beschreibung der Ausgabe..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beleg hochladen
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <GlassButton
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Datei auswählen
                  </GlassButton>
                  {formData.receipt_url && (
                    <span className="text-sm text-gray-600 truncate max-w-32">
                      {formData.receipt_url}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Abbrechen
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleSubmitExpense}
                disabled={!formData.date || !formData.amount || !formData.description || submitExpenseMutation.isPending}
              >
                {submitExpenseMutation.isPending ? 'Wird eingereicht...' : 'Einreichen'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Spesen bearbeiten Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Spesen bearbeiten
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betrag (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingExpense(null);
                  resetForm();
                }}
              >
                Abbrechen
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleEditExpense}
                disabled={!formData.date || !formData.amount || !formData.description}
              >
                Speichern
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesTab;
