/**
 * Main Documents Page - Neue Dokumentenverwaltung
 * Ersetzt das alte DocumentManager System komplett
 */

import React from 'react';
import ModernDocumentDashboard from '../components/documents/ModernDocumentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DocumentsPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <Card className="flex-none border-b rounded-none">
        <CardHeader>
          <CardTitle className="text-2xl">Dokumente</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalten Sie Ihre Dokumente professionell und effizient
          </p>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 sm:px-6 lg:px-8 py-6">
          <ModernDocumentDashboard 
            showAnalytics={true}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
