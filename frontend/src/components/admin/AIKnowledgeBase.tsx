import React, { useState } from 'react';
import { useAIHealth, useIngestDocument, useUploadFile, useAISources, useDeleteSource } from '../../hooks/useAIChat';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Database, Server, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AIKnowledgeBaseProps {
    className?: string;
}

export const AIKnowledgeBase: React.FC<AIKnowledgeBaseProps> = ({ className = '' }) => {
    const [textInput, setTextInput] = useState('');
    const [textSource, setTextSource] = useState('');
    const [sourceType, setSourceType] = useState<'docs' | 'schema' | 'entity'>('docs');

    const healthMutation = useAIHealth();
    const ingestMutation = useIngestDocument();
    const uploadMutation = useUploadFile();
    const sourcesMutation = useAISources();
    const deleteMutation = useDeleteSource();

    const handleCheckHealth = async () => {
        try {
            const result = await healthMutation.mutateAsync();
            if (result.qdrant && result.ollama && result.collection_exists) {
                toast.success(`System healthy! ${result.tenant_chunk_count} chunks indexed.`);
            } else {
                toast.error('System health check failed. Please check Ollama and Qdrant.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Health check failed');
        }
    };

    const handleIngestText = async () => {
        if (!textInput.trim() || !textSource.trim()) {
            toast.error('Please provide both source name and content');
            return;
        }

        try {
            const result = await ingestMutation.mutateAsync({
                source: textSource,
                content: textInput,
                source_type: sourceType,
                metadata: { ingested_at: new Date().toISOString() },
            });

            toast.success(`Ingested ${result.chunk_count} chunks from "${result.source}"`);
            setTextInput('');
            setTextSource('');

            // Refresh sources list
            sourcesMutation.mutate();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Ingestion failed');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await uploadMutation.mutateAsync({ file, sourceType });
            toast.success(`Uploaded "${result.source}" with ${result.chunk_count} chunks`);

            // Refresh sources list
            sourcesMutation.mutate();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Upload failed');
        }
    };

    const handleListSources = async () => {
        try {
            await sourcesMutation.mutateAsync();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to list sources');
        }
    };

    const handleDeleteSource = async (source: string) => {
        if (!confirm(`Are you sure you want to delete "${source}"?`)) return;

        try {
            const result = await deleteMutation.mutateAsync(source);
            toast.success(`Deleted ${result.deleted_count} chunks from "${source}"`);

            // Refresh sources list
            sourcesMutation.mutate();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Delete failed');
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Knowledge Base</h2>
                <p className="text-gray-600">
                    Upload documents and text to the RAG (Retrieval-Augmented Generation) system for AI-powered search and chat.
                </p>
            </div>

            {/* Health Check */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">System Health</span>
                    </div>
                    <button
                        onClick={handleCheckHealth}
                        disabled={healthMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {healthMutation.isPending ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Check Health
                            </>
                        )}
                    </button>
                </div>
                {healthMutation.data && (
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                        <div className={`p-2 rounded ${healthMutation.data.qdrant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <Database className="w-4 h-4 inline mr-1" />
                            Qdrant: {healthMutation.data.qdrant ? 'Online' : 'Offline'}
                        </div>
                        <div className={`p-2 rounded ${healthMutation.data.ollama ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <Server className="w-4 h-4 inline mr-1" />
                            Ollama: {healthMutation.data.ollama ? 'Online' : 'Offline'}
                        </div>
                        <div className="p-2 rounded bg-blue-100 text-blue-800">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Chunks: {healthMutation.data.tenant_chunk_count}
                        </div>
                    </div>
                )}
            </div>

            {/* Source Type Selector */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Type</label>
                <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="docs">Documentation</option>
                    <option value="schema">Schema/API</option>
                    <option value="entity">Entity Data</option>
                </select>
            </div>

            {/* File Upload */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">
                            {uploadMutation.isPending ? 'Uploading...' : 'Choose file to upload'}
                        </span>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploadMutation.isPending}
                            className="hidden"
                            accept=".txt,.md,.pdf,.doc,.docx"
                        />
                    </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    Supported formats: .txt, .md, .pdf, .doc, .docx
                </p>
            </div>

            {/* Text Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Or Paste Text</label>
                <input
                    type="text"
                    value={textSource}
                    onChange={(e) => setTextSource(e.target.value)}
                    placeholder="Source name (e.g., 'API Documentation')"
                    disabled={ingestMutation.isPending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your documentation, API specs, or any text content here..."
                    disabled={ingestMutation.isPending}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                    onClick={handleIngestText}
                    disabled={ingestMutation.isPending || !textInput.trim() || !textSource.trim()}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {ingestMutation.isPending ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Ingesting...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Ingest Text
                        </>
                    )}
                </button>
            </div>

            {/* Sources List */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Indexed Sources</h3>
                    <button
                        onClick={handleListSources}
                        disabled={sourcesMutation.isPending}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        {sourcesMutation.isPending ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {sourcesMutation.data && sourcesMutation.data.length > 0 ? (
                    <div className="space-y-2">
                        {sourcesMutation.data.map((source: any, index: number) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">{source.source}</span>
                                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                            {source.source_type}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {source.chunk_count} chunks • Added {new Date(source.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteSource(source.source)}
                                    disabled={deleteMutation.isPending}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete source"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No sources indexed yet. Upload documents to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIKnowledgeBase;
