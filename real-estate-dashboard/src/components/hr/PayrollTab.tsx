/**
 * PayrollTab
 * Lohnabrechnungen Tab mit PDF-Download
 */

import React, { useState } from 'react';
import {
  Download,
  FileText,
  Calendar,
  Euro,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, LoadingSpinner } from '../admin/GlassUI';
import { useEmployeePayslips, useDownloadPayslipPDF, useCreateManualPayslip, useCreateAutoPayslip } from '../../api/hrHooks';
import type { PayslipEntry } from '../../types/hr';

interface PayrollTabProps {
  employeeId: string;
}

const PayrollTab: React.FC<PayrollTabProps> = ({ employeeId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'auto'>('auto');
  
  const pageSize = 10;
  
  const { 
    data: payslipsData, 
    isLoading, 
    error 
  } = useEmployeePayslips(employeeId, currentPage, pageSize);
  
  const downloadPayslipMutation = useDownloadPayslipPDF();
  const createManualPayslipMutation = useCreateManualPayslip();
  const createAutoPayslipMutation = useCreateAutoPayslip();

  const handleDownloadPayslip = async (payslipId: string) => {
    try {
      const pdfBlob = await downloadPayslipMutation.mutateAsync({
        employeeId,
        payslipId
      });
      
      // Erstelle Download-Link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lohnzettel_${payslipId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Fehler beim Download:', error);
    }
  };

  const handleCreatePayslip = async (data: any) => {
    try {
      if (createMode === 'manual') {
        await createManualPayslipMutation.mutateAsync({ employeeId, data });
      } else {
        await createAutoPayslipMutation.mutateAsync({ employeeId, data });
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating payslip:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="success">Bezahlt</Badge>;
      case 'pending':
        return <Badge variant="warning">Ausstehend</Badge>;
      case 'draft':
        return <Badge variant="default">Entwurf</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
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
          Fehler beim Laden der Lohnabrechnungen
        </h3>
        <p className="text-gray-600">
          Die Lohnabrechnungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    );
  }

  const payslips = payslipsData?.items || [];
  const totalPages = Math.ceil((payslipsData?.total || 0) / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Euro className="w-6 h-6 mr-2" />
            Lohnabrechnungen
          </h2>
          <p className="text-gray-600 mt-1">
            Übersicht aller Lohnzettel und Gehaltsabrechnungen
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <GlassButton 
            variant="primary" 
            className="flex items-center"
            onClick={() => setShowCreateModal(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Lohnzettel erstellen
          </GlassButton>
        </div>
      </div>

      {/* Filter und Suche */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Lohnzettel durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamt Lohnzettel</p>
              <p className="text-2xl font-bold text-gray-900">
                {payslipsData?.total || 0}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Letzter Lohnzettel</p>
              <p className="text-lg font-semibold text-gray-900">
                {payslips.length > 0 ? formatDate(payslips[0].payroll_period_end) : 'Keine'}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Durchschnittliches Brutto</p>
              <p className="text-lg font-semibold text-gray-900">
                {payslips.length > 0 
                  ? formatCurrency(
                      payslips.reduce((sum, p) => sum + p.gross_salary, 0) / payslips.length
                    )
                  : 'N/A'
                }
              </p>
            </div>
            <Euro className="w-8 h-8 text-purple-500" />
          </div>
        </GlassCard>
      </div>

      {/* Lohnzettel Tabelle */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lohnzettel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zeitraum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bruttolohn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nettolohn
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
              {payslips.map((payslip) => (
                <tr key={payslip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Lohnzettel #{payslip.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(payslip.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(payslip.payroll_period_start)} - {formatDate(payslip.payroll_period_end)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payslip.gross_salary)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payslip.net_salary)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payslip.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {/* TODO: Implement view payslip */}}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Anzeigen
                      </GlassButton>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        className="flex items-center"
                        onClick={() => handleDownloadPayslip(payslip.id)}
                        disabled={downloadPayslipMutation.isPending}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <GlassButton
                variant="secondary"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Zurück
              </GlassButton>
              <GlassButton
                variant="secondary"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Weiter
              </GlassButton>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Zeige{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  bis{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, payslipsData?.total || 0)}
                  </span>{' '}
                  von{' '}
                  <span className="font-medium">{payslipsData?.total || 0}</span>{' '}
                  Ergebnissen
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <GlassButton
                    variant="secondary"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </GlassButton>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <GlassButton
                        key={page}
                        variant={currentPage === page ? "primary" : "secondary"}
                        onClick={() => setCurrentPage(page)}
                        className="relative inline-flex items-center px-4 py-2"
                      >
                        {page}
                      </GlassButton>
                    );
                  })}
                  
                  <GlassButton
                    variant="secondary"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </GlassButton>
                </nav>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Leerer Zustand */}
      {payslips.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Keine Lohnzettel gefunden
          </h3>
          <p className="text-gray-600 mb-6">
            Es wurden noch keine Lohnzettel für diesen Mitarbeiter erstellt.
          </p>
          <GlassButton 
            variant="primary" 
            className="flex items-center mx-auto"
            onClick={() => setShowCreateModal(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Ersten Lohnzettel erstellen
          </GlassButton>
        </div>
      )}

      {/* Lohnzettel-Erstellungs-Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Lohnzettel erstellen</h2>
            
            {/* Mode Selection */}
            <div className="flex space-x-4 mb-6">
              <button
                className={`px-4 py-2 rounded-lg ${
                  createMode === 'auto' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => setCreateMode('auto')}
              >
                Automatisch
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  createMode === 'manual' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => setCreateMode('manual')}
              >
                Manuell
              </button>
            </div>
            
            {createMode === 'auto' ? (
              <AutoPayslipForm onSubmit={handleCreatePayslip} />
            ) : (
              <ManualPayslipForm onSubmit={handleCreatePayslip} />
            )}
            
            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <GlassButton variant="secondary" onClick={() => setShowCreateModal(false)}>
                Abbrechen
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Automatische Lohnzettel-Form
const AutoPayslipForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [period, setPeriod] = useState('');
  const [includeOvertime, setIncludeOvertime] = useState(true);
  const [includeBonuses, setIncludeBonuses] = useState(true);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      period,
      include_overtime: includeOvertime,
      include_bonuses: includeBonuses
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Periode (YYYY-MM)</label>
        <input
          type="text"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="2024-01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeOvertime}
            onChange={(e) => setIncludeOvertime(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Überstunden einbeziehen</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeBonuses}
            onChange={(e) => setIncludeBonuses(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Boni einbeziehen</span>
        </label>
      </div>
      
      <button type="submit" className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Automatisch erstellen
      </button>
    </form>
  );
};

// Manuelle Lohnzettel-Form
const ManualPayslipForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    period: '',
    gross_salary: '',
    deductions: '',
    net_salary: '',
    bonuses: '',
    overtime_pay: '',
    notes: ''
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Periode (YYYY-MM)</label>
          <input
            type="text"
            value={formData.period}
            onChange={(e) => setFormData({...formData, period: e.target.value})}
            placeholder="2024-01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bruttogehalt (€)</label>
          <input
            type="number"
            step="0.01"
            value={formData.gross_salary}
            onChange={(e) => setFormData({...formData, gross_salary: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Abzüge (€)</label>
          <input
            type="number"
            step="0.01"
            value={formData.deductions}
            onChange={(e) => setFormData({...formData, deductions: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nettogehalt (€)</label>
          <input
            type="number"
            step="0.01"
            value={formData.net_salary}
            onChange={(e) => setFormData({...formData, net_salary: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boni (€)</label>
          <input
            type="number"
            step="0.01"
            value={formData.bonuses}
            onChange={(e) => setFormData({...formData, bonuses: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Überstunden-Vergütung (€)</label>
          <input
            type="number"
            step="0.01"
            value={formData.overtime_pay}
            onChange={(e) => setFormData({...formData, overtime_pay: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <button type="submit" className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Manuell erstellen
      </button>
    </form>
  );
};

export default PayrollTab;
