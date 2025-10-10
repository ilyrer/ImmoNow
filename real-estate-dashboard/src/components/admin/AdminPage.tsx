import React from 'react';
import { motion } from 'framer-motion';
import EmployeeManagement from './EmployeeManagement';

const AdminPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Mitarbeiterverwaltung
      </h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <EmployeeManagement />
      </motion.div>
    </div>
  );
};

export default AdminPage; 
