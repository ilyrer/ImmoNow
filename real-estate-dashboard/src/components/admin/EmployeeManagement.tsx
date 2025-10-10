import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useEmployeeLeaveRequests,
  useCreateEmployeeLeaveRequest
} from '../../hooks/useApi';

// Map between local UI Employee form and backend Employee shape
type UiEmployee = {
  id?: string;
  name: string;
  position: string;
  team: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'active' | 'inactive';
  cv?: string;
  qualifications?: string;
  skills?: string;
  notes?: string;
};

interface Employee extends UiEmployee { id: string }

const EmployeeManagement: React.FC = () => {
  // Data
  const { data: employeesData = [], isLoading, error } = useEmployees();
  const [employees, setEmployees] = useState<Employee[]>([]);
  useEffect(() => {
    // Map backend employees to UI employees list
    const mapped = (employeesData as any[]).map((e: any) => ({
      id: String(e.id || e.employee_id || e.user_id || Math.random()),
      name: e.name || [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email || 'Mitarbeiter',
      position: e.position || '',
      team: e.team || e.department || '',
      email: e.email || '',
      phone: e.phone || '',
      avatar: e.avatar || '',
      status: (e.status === 'terminated' ? 'inactive' : (e.status || 'active')) as 'active' | 'inactive',
      qualifications: Array.isArray(e.qualifications) ? e.qualifications.join(', ') : e.qualifications,
      skills: Array.isArray(e.skills) ? e.skills.join(', ') : e.skills,
      notes: e.notes || '',
    })) as Employee[];
    setEmployees(mapped);
  }, [employeesData]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    name: '',
    position: '',
    team: '',
    email: '',
    phone: '',
    avatar: '',
    status: 'active'
  });
  const [avatarDragActive, setAvatarDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [profileTab, setProfileTab] = useState<'profil' | 'dokumente' | 'abwesenheiten' | 'payrolls'>('profil');
  const [employeeDocs, setEmployeeDocs] = useState<{ [id: string]: { name: string; type: string; url: string; date: string }[] }>({});
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({ cv: '', qualifications: '', skills: '', notes: '' });
  const [cvFiles, setCvFiles] = useState<{ [id: string]: { name: string; url: string } | null }>({});
  const [globalTab, setGlobalTab] = useState<'mitarbeiter' | 'abwesenheiten'>('mitarbeiter');
  const [absences, setAbsences] = useState<{ id: string; employeeId: string; type: 'Urlaub' | 'Krankheit'; from: string; to: string; reason: string; status: 'offen' | 'genehmigt' | 'abgelehnt'; }[]>([]);
  const [absenceToReject, setAbsenceToReject] = useState<string | null>(null);
  const [payrolls, setPayrolls] = useState<{ [employeeId: string]: { name: string; url: string; month: string; year: string; date: string }[] }>({});

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const names = formData.name.trim().split(/\s+/);
    const first_name = names[0] || 'Mitarbeiter';
    const last_name = names.slice(1).join(' ') || first_name;

    const payload: any = {
      first_name,
      last_name,
      email: formData.email,
      phone: formData.phone,
      position: formData.position,
      department: formData.team?.toLowerCase?.() || 'administration',
      team: formData.team,
      status: formData.status,
      avatar: formData.avatar || undefined,
      // Backend required fields
      hire_date: today,
    };

    try {
      if (editingEmployee) {
        await updateEmployee.mutateAsync({ id: editingEmployee.id, employee: payload });
        setEditingEmployee(null);
      } else {
        await createEmployee.mutateAsync(payload);
      }
    } catch {}
    setIsAddingEmployee(false);
    setFormData({
      name: '',
      position: '',
      team: '',
      email: '',
      phone: '',
      avatar: '',
      status: 'active'
    });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteEmployee.mutateAsync(deleteConfirmId);
    } catch {}
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData(employee);
    setIsAddingEmployee(true);
  };

  // Avatar-Upload per Drag & Drop
  const handleAvatarDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setAvatarDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const target = event.target;
        if (target && target.result) {
          setFormData({ ...formData, avatar: target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleAvatarDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setAvatarDragActive(true);
  };
  const handleAvatarDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setAvatarDragActive(false);
  };
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const target = event.target;
        if (target && target.result) {
          setFormData({ ...formData, avatar: target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Verwalte deine Mitarbeiter
        </h2>
        <button
          onClick={() => setIsAddingEmployee(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl shadow hover:bg-indigo-700 transition-colors text-base font-semibold"
        >
          <i className="ri-add-line mr-2"></i>
          Mitarbeiter hinzufügen
        </button>
      </div>

      {/* Tabs oben auf der Seite */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
        <button
          className={`px-4 py-2 font-semibold ${globalTab === 'mitarbeiter' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-300'}`}
          onClick={() => setGlobalTab('mitarbeiter')}
        >
          Mitarbeiter
        </button>
        <button
          className={`px-4 py-2 font-semibold ${globalTab === 'abwesenheiten' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-300'}`}
          onClick={() => setGlobalTab('abwesenheiten')}
        >
          Abwesenheiten
        </button>
      </div>

      {/* Employee Form Modal */}
      {isAddingEmployee && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white text-center">
              {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-2">
                <div
                  className={`relative w-28 h-28 rounded-full border-4 ${avatarDragActive ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'} bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer group transition-all`}
                  onDrop={handleAvatarDrop}
                  onDragOver={handleAvatarDragOver}
                  onDragLeave={handleAvatarDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  title="Avatar per Drag & Drop oder Klick hochladen"
                >
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <i className="ri-user-3-line text-4xl text-gray-400"></i>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleAvatarFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="absolute bottom-1 right-1 bg-indigo-600 text-white rounded-full p-1 text-xs shadow">
                    <i className="ri-upload-cloud-line"></i>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Avatar per Drag & Drop oder Klick hochladen</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avatar URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.avatar.startsWith('data:') ? '' : formData.avatar}
                  onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Team
                  </label>
                  <select
                    value={formData.team}
                    onChange={e => setFormData({ ...formData, team: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Vertrieb">Vertrieb</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Management">Azubi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingEmployee(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingEmployee ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Employees List */}
    {globalTab === 'mitarbeiter' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {isLoading && <div className="text-gray-500">Lade Mitarbeiter…</div>}
      {error && <div className="text-red-600">Fehler beim Laden der Mitarbeiter</div>}
      {employees.map(employee => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-10 flex flex-col items-center transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
              onClick={() => setSelectedEmployee(employee)}
            >
              <div className="relative mb-4">
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className={`w-24 h-24 rounded-full object-cover border-4 shadow-lg ${employee.status === 'active' ? 'border-indigo-500' : 'border-gray-400'}`}
                />
                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold shadow ${employee.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {employee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 text-center">
                {employee.name}
              </h3>
              <p className="text-base text-gray-500 dark:text-gray-400 mb-1 text-center">
                {employee.position}
              </p>
              <p className="text-base text-gray-400 dark:text-gray-500 mb-3 text-center">
                {employee.team}
              </p>
              <div className="grid grid-cols-2 gap-6 w-full text-base mb-6">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">E-Mail</p>
                  <a href={`mailto:${employee.email}`} className="text-indigo-600 dark:text-indigo-300 hover:underline break-all">{employee.email}</a>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Telefon</p>
                  <a href={`tel:${employee.phone}`} className="text-indigo-600 dark:text-indigo-300 hover:underline break-all">{employee.phone}</a>
                </div>
              </div>
              <div className="flex space-x-4 mt-auto">
                <button
                  onClick={() => handleEdit(employee)}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-full p-3 shadow transition-all"
                  title="Bearbeiten"
                >
                  <i className="ri-edit-line text-xl"></i>
                </button>
                <button
                  onClick={() => handleDelete(employee.id)}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 rounded-full p-3 shadow transition-all"
                  title="Löschen"
                >
                  <i className="ri-delete-bin-line text-xl"></i>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bestätigungsdialog für Löschen */}
      {deleteConfirmId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Mitarbeiter wirklich löschen?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Bist du sicher, dass du diesen Mitarbeiter löschen willst? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ja, löschen
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Mitarbeiter-Detailansicht Modal */}
      {selectedEmployee && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
              title="Schließen"
            >
              <i className="ri-close-line"></i>
            </button>
            <div className="flex flex-col items-center mb-6">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className={`w-24 h-24 rounded-full object-cover border-4 shadow-lg ${selectedEmployee.status === 'active' ? 'border-indigo-500' : 'border-gray-400'}`}
              />
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-3 mb-1 text-center">
                {selectedEmployee.name}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${selectedEmployee.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{selectedEmployee.status === 'active' ? 'Aktiv' : 'Inaktiv'}</span>
              <p className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center">{selectedEmployee.position} – {selectedEmployee.team}</p>
              
              {/* Bearbeiten-Button für Grunddaten */}
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => handleEdit(selectedEmployee)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Grunddaten bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(selectedEmployee.id)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Löschen
                </button>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                className={`px-4 py-2 font-semibold ${profileTab === 'profil' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-300'}`}
                onClick={() => setProfileTab('profil')}
              >
                Profil
              </button>
              <button
                className={`px-4 py-2 font-semibold ${profileTab === 'dokumente' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-300'}`}
                onClick={() => setProfileTab('dokumente')}
              >
                Dokumente
              </button>
              <button
                className={`px-4 py-2 font-semibold ${profileTab === 'abwesenheiten' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-300'}`}
                onClick={() => setProfileTab('abwesenheiten')}
              >
                Abwesenheiten
              </button>
              <button
                className={`px-4 py-2 font-semibold ${profileTab === 'payrolls' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-300'}`}
                onClick={() => setProfileTab('payrolls')}
              >
                Lohnabrechnungen
              </button>
            </div>
            {/* Tab-Inhalte */}
            {profileTab === 'profil' && (
              <div className="space-y-4">
                <div className="mb-2 text-xs text-gray-400 dark:text-gray-500">
                  Angaben im Profil sollten durch Dokumente im Tab "Dokumente" belegt werden.
                </div>
                {profileEdit ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lebenslauf (PDF)</label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const target = event.target;
                                if (target && target.result) {
                                  setCvFiles(prev => ({
                                    ...prev,
                                    [selectedEmployee.id]: { name: file.name, url: target.result as string }
                                  }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {cvFiles[selectedEmployee.id] ? (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">{cvFiles[selectedEmployee.id]?.name}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Noch kein Lebenslauf hochgeladen. Klicke zum Hinzufügen auf "Bearbeiten"</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qualifikationen</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        placeholder="z.B. IHK, Bachelor, ..."
                        value={profileForm.qualifications}
                        onChange={e => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        placeholder="z.B. React, Vertrieb, ..."
                        value={profileForm.skills}
                        onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        rows={2}
                        placeholder="Notizen..."
                        value={profileForm.notes}
                        onChange={e => setProfileForm({ ...profileForm, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        onClick={() => setProfileEdit(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={() => {
                          setEmployees(emps => emps.map(emp => emp.id === selectedEmployee.id ? { ...emp, ...profileForm } : emp));
                          setSelectedEmployee(emp => emp ? { ...emp, ...profileForm } : emp);
                          setProfileEdit(false);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Speichern
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lebenslauf (PDF)</label>
                      {cvFiles[selectedEmployee.id] ? (
                        <div className="mt-2">
                          <embed
                            src={cvFiles[selectedEmployee.id]?.url}
                            type="application/pdf"
                            className="w-full h-64 rounded border border-gray-200 dark:border-gray-700 bg-white"
                          />
                          <a
                            href={cvFiles[selectedEmployee.id]?.url}
                            download={cvFiles[selectedEmployee.id]?.name}
                            className="block mt-2 text-indigo-600 dark:text-indigo-300 hover:underline text-sm"
                          >
                            PDF herunterladen
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">Kein Lebenslauf vorhanden.</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qualifikationen</label>
                      <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" placeholder="z.B. IHK, Bachelor, ..." value={selectedEmployee.qualifications || ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</label>
                      <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" placeholder="z.B. React, Vertrieb, ..." value={selectedEmployee.skills || ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen</label>
                      <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" rows={2} placeholder="Notizen..." value={selectedEmployee.notes || ''} readOnly />
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => {
                          setProfileForm({
                            cv: selectedEmployee.cv || '',
                            qualifications: selectedEmployee.qualifications || '',
                            skills: selectedEmployee.skills || '',
                            notes: selectedEmployee.notes || ''
                          });
                          setProfileEdit(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {profileTab === 'dokumente' && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dokumente hochladen</label>
                  <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vorhandene Dokumente</h4>
                  <ul className="space-y-2">
                    {(employeeDocs[selectedEmployee.id] || []).map(doc => (
                      <li key={doc.url} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                        <span>{doc.name} <span className="text-xs text-gray-400 ml-2">({doc.type})</span></span>
                        <a href={doc.url} download className="text-indigo-600 dark:text-indigo-300 hover:underline ml-4">Download</a>
                      </li>
                    ))}
                    {(!employeeDocs[selectedEmployee.id] || employeeDocs[selectedEmployee.id].length === 0) && (
                      <li className="text-gray-400 text-sm">Keine Dokumente vorhanden.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
            {profileTab === 'abwesenheiten' && selectedEmployee && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Abwesenheiten von {selectedEmployee.name}</h4>
                {selectedEmployee && (
                  <AbwesenheitenSection employeeId={selectedEmployee.id} />
                )}
              </div>
            )}
            {profileTab === 'payrolls' && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Lohnabrechnungen von {selectedEmployee.name}</h4>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const fileInput = form.elements.namedItem('payroll') as HTMLInputElement;
                    const file = fileInput.files?.[0];
                    const month = (form.elements.namedItem('month') as HTMLSelectElement).value;
                    const year = (form.elements.namedItem('year') as HTMLSelectElement).value;
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const target = event.target;
                        if (target && target.result) {
                          setPayrolls(prev => ({
                            ...prev,
                            [selectedEmployee.id]: [
                              { name: file.name, url: target.result as string, month, year, date: new Date().toLocaleDateString() },
                              ...(prev[selectedEmployee.id] || [])
                            ]
                          }));
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                    form.reset();
                  }}
                  className="mb-6 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monat</label>
                      <select name="month" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" required>
                        <option value="">Bitte wählen</option>
                        <option value="Januar">Januar</option>
                        <option value="Februar">Februar</option>
                        <option value="März">März</option>
                        <option value="April">April</option>
                        <option value="Mai">Mai</option>
                        <option value="Juni">Juni</option>
                        <option value="Juli">Juli</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="Oktober">Oktober</option>
                        <option value="November">November</option>
                        <option value="Dezember">Dezember</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jahr</label>
                      <select name="year" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" required>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lohnabrechnung (PDF)</label>
                    <input name="payroll" type="file" accept="application/pdf" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" required />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Hochladen</button>
                  </div>
                </form>
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vorhandene Lohnabrechnungen</h5>
                <ul className="space-y-2">
                  {(payrolls[selectedEmployee.id] || []).length === 0 && (
                    <li className="text-gray-400 text-sm">Keine Lohnabrechnungen vorhanden.</li>
                  )}
                  {(payrolls[selectedEmployee.id] || []).map((pr, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <span>{pr.month} {pr.year} <span className="text-xs text-gray-400 ml-2">({pr.name})</span></span>
                      <a href={pr.url} download={pr.name} className="text-indigo-600 dark:text-indigo-300 hover:underline ml-4">Download</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Bestätigungsdialog für Ablehnen */}
      {absenceToReject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Abwesenheit ablehnen?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Möchtest du diesen Abwesenheitsantrag wirklich ablehnen?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setAbsenceToReject(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setAbsences(list => list.map(a => a.id === absenceToReject ? { ...a, status: 'abgelehnt' } : a));
                  setAbsenceToReject(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ja, ablehnen
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Abwesenheiten-Tab */}
    {globalTab === 'abwesenheiten' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Alle Abwesenheiten</h2>
      <div className="text-sm text-gray-500">Globale Abwesenheiten werden noch nicht vom Backend bereitgestellt. Bitte Abwesenheiten pro Mitarbeiter verwalten.</div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement; 

// Internal section for per-employee leave requests
const AbwesenheitenSection: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const { data: requests = [], isLoading } = useEmployeeLeaveRequests(employeeId);
  const createReq = useCreateEmployeeLeaveRequest(employeeId);

  const submit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const typeUi = (form.elements.namedItem('type') as HTMLSelectElement).value as 'Urlaub' | 'Krankheit';
    const reason = (form.elements.namedItem('reason') as HTMLInputElement).value;
    const from = (form.elements.namedItem('from') as HTMLInputElement).value;
    const to = (form.elements.namedItem('to') as HTMLInputElement).value;
    const type = typeUi === 'Urlaub' ? 'vacation' : 'sick_leave';
    try {
      await createReq.mutateAsync({ type, start_date: from, end_date: to, reason });
      form.reset();
    } catch {}
  };

  return (
    <div>
      <form onSubmit={submit} className="mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ</label>
            <select name="type" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" required>
              <option value="Urlaub">Urlaub</option>
              <option value="Krankheit">Krankheit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grund</label>
            <input name="reason" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" placeholder="z.B. Sommerurlaub, Grippe..." required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Von</label>
            <input name="from" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bis</label>
            <input name="to" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={createReq.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Abwesenheit beantragen</button>
        </div>
      </form>

      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bisherige Abwesenheiten</h5>
      {isLoading ? (
        <div className="text-gray-500">Lade Abwesenheiten…</div>
      ) : (
        <ul className="space-y-2">
          {(!requests || requests.length === 0) && (
            <li className="text-gray-400 text-sm">Keine Abwesenheiten eingetragen.</li>
          )}
          {requests.map((abs: any) => (
            <li key={abs.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 ">
              <span>{abs.type} ({abs.start_date} – {abs.end_date}): {abs.reason}</span>
              <div className="px-4 py-2 align-top">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${abs.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : abs.status === 'approved' ? 'bg-green-100 text-green-800' : abs.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{abs.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
