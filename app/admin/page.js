'use client';

import { useState, useEffect } from 'react';
import WidgetGenerator from './widget/page';
import BotManagement from './bots/page';
import HumanFallbackDashboard from './fallback/page';
import { 
  Search, 
  Plus, 
  Upload, 
  Globe, 
  FileText, 
  MessageSquare, 
  Database, 
  Settings,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  X,
  Code,
  Bot,
  Users
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('knowledge');
  const [knowledgeEntries, setKnowledgeEntries] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalConversations: 0,
    lastUpdated: null
  });
  
  // Settings tab state
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showManualEntryForm, setShowManualEntryForm] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    id: '',
    title: '',
    content: '',
    category: '',
    subcategory: '',
    tags: '',
    priority: 'medium'
  });

  // Load initial data
  useEffect(() => {
    loadKnowledgeBase();
    loadConversations();
    loadStats();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/knowledge', {
        method: 'GET'
      });
      const data = await response.json();
      if (data.success) {
        setKnowledgeEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/admin/conversations', {
        method: 'GET'
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        method: 'GET'
      });
      const data = await response.json();
      if (data.success && data.stats) {
        setStats({
          totalEntries: data.stats.totalEntries || 0,
          totalConversations: data.stats.totalConversations || 0,
          lastUpdated: data.stats.lastUpdated || new Date().toISOString(),
          ...data.stats
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  // Connection test function
  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/admin/test-connection');
      const result = await response.json();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        overall_status: 'error',
        error: error.message
      });
    } finally {
      setTestingConnection(false);
    }
  };
  
  // Manual entry submission
  const submitManualEntry = async (e) => {
    e.preventDefault();
    try {
      const entryData = {
        ...manualEntryData,
        id: manualEntryData.id || `manual_${Date.now()}`,
        tags: manualEntryData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      const response = await fetch('/api/admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Entry added successfully!');
        setManualEntryData({
          id: '',
          title: '',
          content: '',
          category: '',
          subcategory: '',
          tags: '',
          priority: 'medium'
        });
        setShowManualEntryForm(false);
        loadKnowledgeBase(); // Refresh the list
      } else {
        alert('Failed to add entry: ' + result.error);
      }
    } catch (error) {
      alert('Error adding entry: ' + error.message);
    }
  };

  const filteredEntries = knowledgeEntries.filter(entry =>
    entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.response?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MEENA Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Knowledge Base & Conversation Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadStats}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Knowledge Entries</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.totalEntries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
                <p className="text-2xl font-bold text-green-600">{stats.totalConversations}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <RefreshCw className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Last Updated</h3>
                <p className="text-sm text-purple-600">
                  {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'knowledge', label: 'Knowledge Base', icon: Database },
                { id: 'conversations', label: 'Conversations', icon: MessageSquare },
                { id: 'fallback', label: 'Human Fallback', icon: Users },
                { id: 'add-content', label: 'Add Content', icon: Plus },
                { id: 'widget', label: 'Widget Generator', icon: Code },
                { id: 'bots', label: 'Bot Management', icon: Bot },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Search Bar */}
            {(activeTab === 'knowledge' || activeTab === 'conversations') && (
              <div className="mb-6">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Knowledge Base Tab */}
            {activeTab === 'knowledge' && (
              <KnowledgeBaseTab 
                entries={filteredEntries} 
                loading={loading}
                onRefresh={loadKnowledgeBase}
              />
            )}

            {/* Conversations Tab */}
            {activeTab === 'conversations' && (
              <ConversationsTab 
                conversations={filteredConversations} 
                loading={loading}
                onRefresh={loadConversations}
              />
            )}

            {/* Human Fallback Tab */}
            {activeTab === 'fallback' && (
              <HumanFallbackDashboard />
            )}

            {/* Add Content Tab */}
            {activeTab === 'add-content' && (
              <AddContentTab onSuccess={loadKnowledgeBase} />
            )}

            {/* Widget Generator Tab */}
            {activeTab === 'widget' && (
              <WidgetGenerator />
            )}

            {/* Bot Management Tab */}
            {activeTab === 'bots' && (
              <BotManagement />
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <SettingsTab 
                connectionStatus={connectionStatus}
                testingConnection={testingConnection}
                testConnection={testConnection}
                showManualEntryForm={showManualEntryForm}
                setShowManualEntryForm={setShowManualEntryForm}
                manualEntryData={manualEntryData}
                setManualEntryData={setManualEntryData}
                submitManualEntry={submitManualEntry}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Knowledge Base Tab Component
function KnowledgeBaseTab({ entries, loading, onRefresh }) {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Delete entry function
  const handleDelete = async (entry) => {
    if (!confirm(`Are you sure you want to delete "${entry.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(entry.id);
    try {
      console.log('🗑️ Deleting entry:', entry.id);
      
      const response = await fetch(`/api/admin/knowledge?id=${entry.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Entry deleted successfully');
        alert('Entry deleted successfully!');
        onRefresh(); // Refresh the list
      } else {
        console.error('❌ Delete failed:', result.error);
        alert('Failed to delete entry: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      alert('Error deleting entry: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // View entry function
  const handleView = (entry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  // Edit entry function
  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    setShowEditModal(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading knowledge base...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Base Entries ({entries.length})</h2>
        <button
          onClick={onRefresh}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6">
        {entries.map((entry, index) => (
          <div key={entry.id || index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow hover:border-gray-300">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-2">{entry.title}</h3>
                <p className="text-sm font-medium text-gray-800 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">Category: {entry.category}</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Tags: {Array.isArray(entry.tags) ? entry.tags.join(', ') : entry.tags || 'None'}</span>
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {entry.content?.substring(0, 200)}...
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleView(entry)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View entry"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(entry)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Edit entry"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(entry)}
                  disabled={deletingId === entry.id}
                  className={`p-2 rounded transition-colors ${
                    deletingId === entry.id 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title="Delete entry"
                >
                  {deletingId === entry.id ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No knowledge entries found</h3>
          <p className="text-gray-600">Add some entries to get started with your knowledge base.</p>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                View Knowledge Entry
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEntry(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-900">{selectedEntry.title}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border min-h-[200px]">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedEntry.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">{selectedEntry.category || 'Uncategorized'}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">
                      {Array.isArray(selectedEntry.tags) 
                        ? selectedEntry.tags.join(', ') 
                        : selectedEntry.tags || 'No tags'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">
                      {selectedEntry.createdAt 
                        ? new Date(selectedEntry.createdAt).toLocaleString()
                        : 'Unknown'
                      }
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Updated
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">
                      {selectedEntry.updatedAt 
                        ? new Date(selectedEntry.updatedAt).toLocaleString()
                        : 'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-8">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedEntry);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-3"
              >
                Edit Entry
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEntry(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Knowledge Entry
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEntry(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              // TODO: Implement update functionality
              alert('Update functionality will be implemented next');
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedEntry.title}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    defaultValue={selectedEntry.content}
                    rows="10"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter content"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedEntry.category}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      defaultValue={
                        Array.isArray(selectedEntry.tags) 
                          ? selectedEntry.tags.join(', ')
                          : selectedEntry.tags
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-8 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEntry(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Conversations Tab Component
function ConversationsTab({ conversations, loading, onRefresh }) {
  if (loading) {
    return <div className="text-center py-8">Loading conversations...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Conversations ({conversations.length})</h2>
        <button
          onClick={onRefresh}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {conversations.map((conv, index) => (
          <div key={index} className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-medium text-gray-700">
                {new Date(conv.timestamp).toLocaleString()}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                {conv.language || 'English'}
              </span>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <strong className="text-blue-900">User:</strong> 
                <span className="text-gray-800 ml-1">{conv.message}</span>
              </div>
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <strong className="text-green-900">MEENA:</strong> 
                <span className="text-gray-800 ml-1">{conv.response}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {conversations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No conversations found.</p>
          <p className="text-gray-500 text-sm mt-1">Conversations will appear here as users interact with MEENA.</p>
        </div>
      )}
    </div>
  );
}

// Add Content Tab Component
function AddContentTab({ onSuccess }) {
  const [activeMethod, setActiveMethod] = useState('text');
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Content</h2>
      
      {/* Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { id: 'text', label: 'Manual Entry', icon: FileText },
          { id: 'file', label: 'File Upload', icon: Upload },
          { id: 'pdf', label: 'PDF Upload', icon: FileText },
          { id: 'scrape', label: 'Web Scraping', icon: Globe }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveMethod(id)}
            className={`
              flex items-center justify-center p-4 rounded-lg border-2 transition-all font-medium
              ${activeMethod === id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 text-gray-900 bg-white hover:bg-gray-50'
              }
            `}
          >
            <Icon className="w-6 h-6 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Content based on selected method */}
      {activeMethod === 'text' && <ManualEntryForm onSuccess={onSuccess} />}
      {activeMethod === 'file' && <FileUploadForm onSuccess={onSuccess} />}
      {activeMethod === 'pdf' && <PDFUploadForm onSuccess={onSuccess} />}
      {activeMethod === 'scrape' && <WebScrapingForm onSuccess={onSuccess} />}
    </div>
  );
}

// Manual Entry Form
function ManualEntryForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    subcategory: '',
    tags: '',
    source: 'manual',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()),
          id: `manual_${Date.now()}`
        })
      });
      
      if (response.ok) {
        alert('Knowledge entry added successfully!');
        setFormData({
          title: '',
          content: '',
          category: '',
          subcategory: '',
          tags: '',
          source: 'manual',
          priority: 'medium'
        });
        onSuccess();
      }
    } catch (error) {
      alert('Error adding entry: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            required
          >
            <option value="">Select category</option>
            <option value="institutional">Institutional</option>
            <option value="academics">Academics</option>
            <option value="admissions">Admissions</option>
            <option value="departments">Departments</option>
            <option value="facilities">Facilities</option>
            <option value="student_services">Student Services</option>
            <option value="research">Research</option>
            <option value="policies">Policies</option>
            <option value="contact">Contact</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
          rows={6}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
            placeholder="tag1, tag2, tag3"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value})}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
      >
        {loading ? 'Adding...' : 'Add Entry'}
      </button>
    </form>
  );
}

// File Upload Form
function FileUploadForm({ onSuccess }) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
      <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <p className="text-gray-900 font-medium">Drag and drop files here, or click to browse</p>
      <p className="text-sm text-gray-700 mt-2">Supports: .txt, .md, .json</p>
      <input type="file" className="hidden" multiple accept=".txt,.md,.json" />
    </div>
  );
}

// PDF Upload Form
function PDFUploadForm({ onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [options, setOptions] = useState({
    maxChunkSize: 1000,
    overlapSize: 200,
    storeInKnowledge: true
  });

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setResults(null);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setResults(null);
  };

  const processPDF = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('maxChunkSize', options.maxChunkSize.toString());
      formData.append('overlapSize', options.overlapSize.toString());
      formData.append('storeInKnowledge', options.storeInKnowledge.toString());

      console.log('Starting PDF processing for:', selectedFile.name);
      console.log('Options:', options);

      const response = await fetch('/api/admin/pdf', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(result);
        const chunksStored = result.data.storage?.stored_chunks || 0;
        if (chunksStored > 0) {
          alert(`✅ PDF processed successfully! Created ${chunksStored} knowledge entries from "${selectedFile.name}".`);
          onSuccess(); // Refresh the knowledge base
        } else {
          alert(`✅ PDF processed successfully! ${result.data.chunks} chunks created (not stored in knowledge base).`);
        }
        
        // Clear file on success
        setSelectedFile(null);
      } else {
        alert(`❌ PDF processing failed: ${result.error}`);
        setResults(result);
      }
      
    } catch (error) {
      console.error('PDF processing error:', error);
      alert(`❌ Error during PDF processing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">PDF Document Processing</h3>
        <p className="text-sm text-gray-700 mb-4">
          Upload PDF files to extract text content and automatically add to the knowledge base with intelligent chunking.
        </p>
      </div>

      {/* File Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : selectedFile 
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <FileText className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <p className="text-gray-900 font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={removeFile}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <FileText className="w-12 h-12 text-gray-600 mx-auto" />
            <div>
              <p className="text-gray-900 font-medium">Drop PDF file here or click to browse</p>
              <p className="text-sm text-gray-600 mt-1">Maximum file size: 50MB</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer font-medium transition-colors"
            >
              Select PDF File
            </label>
          </div>
        )}
      </div>

      {/* Processing Options */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Processing Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Max Chunk Size</label>
            <input
              type="number"
              value={options.maxChunkSize}
              onChange={(e) => setOptions({...options, maxChunkSize: parseInt(e.target.value)})}
              min="500"
              max="2000"
              step="100"
              className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-600 mt-1">Characters per chunk (500-2000)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Overlap Size</label>
            <input
              type="number"
              value={options.overlapSize}
              onChange={(e) => setOptions({...options, overlapSize: parseInt(e.target.value)})}
              min="0"
              max="500"
              step="50"
              className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-600 mt-1">Character overlap between chunks (0-500)</p>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.storeInKnowledge}
                onChange={(e) => setOptions({...options, storeInKnowledge: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-800">Store in Knowledge Base</span>
            </label>
            <p className="text-xs text-gray-600 mt-1">Add processed chunks to searchable knowledge</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={processPDF}
        disabled={loading || !selectedFile}
        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing PDF...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Process PDF {selectedFile ? `(${selectedFile.name})` : ''}
          </>
        )}
      </button>

      {/* Results Display */}
      {results && (
        <div className={`p-4 rounded-lg border ${
          results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h4 className={`font-bold mb-2 ${
            results.success ? 'text-green-800' : 'text-red-800'
          }`}>
            PDF Processing Results
          </h4>
          
          {results.success && results.data && (
            <div className="text-sm space-y-2">
              <div className="grid grid-cols-2 gap-4 text-gray-800">
                <div><strong>File:</strong> {results.data.filename}</div>
                <div><strong>File Size:</strong> {formatFileSize(results.data.fileSize)}</div>
                <div><strong>Pages:</strong> {results.data.pages}</div>
                <div><strong>Text Length:</strong> {results.data.textLength.toLocaleString()} characters</div>
                <div><strong>Chunks Created:</strong> {results.data.chunks}</div>
                <div><strong>Stored in KB:</strong> {results.data.storage?.stored_chunks || 0}</div>
              </div>
              
              {results.data.chunks_data && results.data.chunks_data.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-gray-800 mb-2">Sample Chunks:</h5>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {results.data.chunks_data.slice(0, 3).map((chunk, index) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        <div className="font-medium">Chunk {chunk.metadata.chunk_index + 1}: {chunk.length} chars</div>
                        <div className="text-gray-600 mt-1">{chunk.text}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          Category: {chunk.metadata.primary_category} | 
                          Page: {chunk.metadata.page_number || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!results.success && (
            <div className="text-red-700">
              <div className="font-medium">Error: {results.error}</div>
              {results.details && (
                <div className="text-sm mt-1">Details: {results.details}</div>
              )}
              {results.suggestion && (
                <div className="text-sm mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  💡 Suggestion: {results.suggestion}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-bold text-blue-800 mb-2">📄 PDF Processing Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Only text-based PDFs are supported (not scanned images)</li>
          <li>• Smaller chunk sizes work better for specific queries</li>
          <li>• Add overlap to maintain context between chunks</li>
          <li>• Files are automatically categorized based on filename content</li>
          <li>• Academic documents are tagged with appropriate categories</li>
          <li>• Processing preserves document structure and metadata</li>
        </ul>
      </div>
    </div>
  );
}

// Web Scraping Form
function WebScrapingForm({ onSuccess }) {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [options, setOptions] = useState({
    render: false,
    chunkSize: 1000,
    overlap: 200,
    country_code: 'us'
  });

  const addUrl = () => setUrls([...urls, '']);
  
  const updateUrl = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const removeUrl = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  const startScraping = async () => {
    const validUrls = urls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      alert('Please enter at least one valid URL');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      console.log('Starting scraping for URLs:', validUrls);
      console.log('Options:', options);

      const response = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urls: validUrls,
          options: options
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(result);
        alert(`✅ Scraping completed! Created ${result.summary.total_chunks_created} knowledge entries from ${result.summary.successful_urls} URLs.`);
        onSuccess(); // Refresh the knowledge base
        
        // Clear URLs on success
        setUrls(['']);
      } else {
        alert(`❌ Scraping failed: ${result.error}`);
        setResults(result);
      }
      
    } catch (error) {
      console.error('Scraping error:', error);
      alert(`❌ Error during scraping: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Web Scraping with ScraperAPI</h3>
        <p className="text-sm text-gray-700 mb-4">
          Add URLs to scrape content and automatically add to the knowledge base with intelligent chunking.
        </p>
      </div>

      {/* URLs Input */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-900">URLs to Scrape</label>
        {urls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(index, e.target.value)}
              placeholder="https://example.com/page-to-scrape"
              className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
            />
            {index === urls.length - 1 ? (
              <button
                type="button"
                onClick={addUrl}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors"
                title="Add another URL"
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => removeUrl(index)}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                title="Remove this URL"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Scraping Options */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Scraping Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.render}
                onChange={(e) => setOptions({...options, render: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-800">Enable JavaScript Rendering</span>
            </label>
            <p className="text-xs text-gray-600 mt-1">Required for dynamic content</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Country Code</label>
            <select
              value={options.country_code}
              onChange={(e) => setOptions({...options, country_code: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
            >
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="de">Germany</option>
              <option value="fr">France</option>
              <option value="ca">Canada</option>
              <option value="au">Australia</option>
              <option value="jp">Japan</option>
              <option value="in">India</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Chunk Size</label>
            <input
              type="number"
              value={options.chunkSize}
              onChange={(e) => setOptions({...options, chunkSize: parseInt(e.target.value)})}
              min="500"
              max="2000"
              step="100"
              className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-600 mt-1">Characters per chunk (500-2000)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Overlap</label>
            <input
              type="number"
              value={options.overlap}
              onChange={(e) => setOptions({...options, overlap: parseInt(e.target.value)})}
              min="0"
              max="500"
              step="50"
              className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-600 mt-1">Character overlap between chunks (0-500)</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={startScraping}
        disabled={loading || urls.filter(u => u.trim()).length === 0}
        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Scraping in Progress...
          </>
        ) : (
          <>
            <Globe className="w-5 h-5 mr-2" />
            Start Scraping ({urls.filter(u => u.trim()).length} URLs)
          </>
        )}
      </button>

      {/* Results Display */}
      {results && (
        <div className={`p-4 rounded-lg border ${
          results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h4 className={`font-bold mb-2 ${
            results.success ? 'text-green-800' : 'text-red-800'
          }`}>
            Scraping Results
          </h4>
          
          {results.summary && (
            <div className="text-sm space-y-1 mb-3">
              <p className="text-gray-800">
                <strong>Total URLs:</strong> {results.summary.total_urls} | 
                <strong> Successful:</strong> {results.summary.successful_urls} | 
                <strong> Failed:</strong> {results.summary.failed_urls}
              </p>
              <p className="text-gray-800">
                <strong>Total Chunks Created:</strong> {results.summary.total_chunks_created}
              </p>
              <p className="text-gray-800">
                <strong>Scraper Type:</strong> {results.summary.scraper_type}
              </p>
            </div>
          )}
          
          {results.results && results.results.length > 0 && (
            <div className="space-y-2">
              {results.results.map((result, index) => (
                <div key={index} className={`text-sm p-2 rounded ${
                  result.success ? 'bg-white text-green-800' : 'bg-white text-red-800'
                }`}>
                  <div className="font-medium">{result.url}</div>
                  {result.success ? (
                    <div className="text-gray-700">
                      ✅ Created {result.chunks_created} chunks | {result.total_characters} characters
                    </div>
                  ) : (
                    <div className="text-red-600">❌ {result.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-bold text-blue-800 mb-2">💡 Scraping Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use JavaScript rendering for dynamic content (slower but more accurate)</li>
          <li>• Smaller chunk sizes work better for specific queries</li>
          <li>• Add overlap to maintain context between chunks</li>
          <li>• Educational sites (.edu) are automatically tagged as &quot;education&quot;</li>
          <li>• ScraperAPI handles captchas and rate limiting automatically</li>
        </ul>
      </div>
    </div>
  );
}

// Settings Tab
function SettingsTab({ 
  connectionStatus, 
  testingConnection, 
  testConnection, 
  showManualEntryForm, 
  setShowManualEntryForm, 
  manualEntryData, 
  setManualEntryData, 
  submitManualEntry 
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Settings & Configuration</h2>
        <button
          onClick={() => setShowManualEntryForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Manual Entry
        </button>
      </div>
      
      <div className="grid gap-6">
        {/* ChromaDB Connection Test */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ChromaDB Connection Test</h3>
              <p className="text-sm text-gray-700 mb-4">Test the connection to ChromaDB and verify system health</p>
            </div>
            <button 
              onClick={testConnection}
              disabled={testingConnection}
              className={`px-4 py-2 rounded-lg text-white flex items-center ${
                testingConnection 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {testingConnection ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>
          </div>
          
          {connectionStatus && (
            <div className={`p-4 rounded-lg border ${
              connectionStatus.overall_status === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : connectionStatus.overall_status === 'warning'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-3">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  connectionStatus.overall_status === 'healthy' ? 'bg-green-500' :
                  connectionStatus.overall_status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className={`font-medium ${
                  connectionStatus.overall_status === 'healthy' ? 'text-green-800' :
                  connectionStatus.overall_status === 'warning' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  Status: {connectionStatus.overall_status.toUpperCase()}
                </span>
              </div>
              
              {connectionStatus.tests && (
                <div className="space-y-2">
                  {connectionStatus.tests.map((test, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        test.status === 'passed' ? 'bg-green-500' :
                        test.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium text-gray-800 mr-2">{test.name}:</span>
                      <span className="text-gray-700">{test.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Export/Import Tools */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Data Management</h3>
          <p className="text-sm text-gray-700 mb-4">Export knowledge base or import from files</p>
          <div className="flex flex-wrap gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Knowledge Base
            </button>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Web Scraping Tool
            </button>
          </div>
        </div>
        
        {/* System Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">ChromaDB Status:</span>
              <span className="ml-2 text-gray-900">Connected (ChromaDB Cloud)</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Embedding Model:</span>
              <span className="ml-2 text-gray-900">gemini-embedding-001</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Vector Dimensions:</span>
              <span className="ml-2 text-gray-900">768</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-900">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Manual Entry Modal */}
      {showManualEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add Manual Knowledge Entry</h3>
              <button
                onClick={() => setShowManualEntryForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={submitManualEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">ID (optional)</label>
                  <input
                    type="text"
                    value={manualEntryData.id}
                    onChange={(e) => setManualEntryData({...manualEntryData, id: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Priority</label>
                  <select
                    value={manualEntryData.priority}
                    onChange={(e) => setManualEntryData({...manualEntryData, priority: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Title *</label>
                <input
                  type="text"
                  value={manualEntryData.title}
                  onChange={(e) => setManualEntryData({...manualEntryData, title: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
                  placeholder="Enter entry title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Content *</label>
                <textarea
                  value={manualEntryData.content}
                  onChange={(e) => setManualEntryData({...manualEntryData, content: e.target.value})}
                  rows="6"
                  className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
                  placeholder="Enter detailed content for this knowledge entry"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Category *</label>
                  <input
                    type="text"
                    value={manualEntryData.category}
                    onChange={(e) => setManualEntryData({...manualEntryData, category: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
                    placeholder="e.g., academics, admissions, facilities"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Subcategory</label>
                  <input
                    type="text"
                    value={manualEntryData.subcategory}
                    onChange={(e) => setManualEntryData({...manualEntryData, subcategory: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
                    placeholder="More specific category"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Tags</label>
                <input
                  type="text"
                  value={manualEntryData.tags}
                  onChange={(e) => setManualEntryData({...manualEntryData, tags: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-600"
                  placeholder="Enter tags separated by commas"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas (e.g., admission, deadline, important)</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualEntryForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}