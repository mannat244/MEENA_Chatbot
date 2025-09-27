'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Send,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function HumanFallbackDashboard() {
  const [fallbackRequests, setFallbackRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const priorityColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600'
  };

  const categoryIcons = {
    academic: '📚',
    admission: '🎓',
    hostel: '🏠',
    fees: '💰',
    placement: '💼',
    general: '❓',
    technical: '⚙️'
  };

  const fetchFallbackRequests = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        status: filters.status,
        category: filters.category,
        page: pagination.currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/human-fallback?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setFallbackRequests(data.data.requests);
        setStats(data.data.stats);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching fallback requests:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  useEffect(() => {
    fetchFallbackRequests();
  }, [fetchFallbackRequests]);

  useEffect(() => {
    fetchFallbackRequests();
  }, [fetchFallbackRequests]);

  const saveResponse = async () => {
    if (!selectedRequest || !responseText.trim()) return;

    try {
      setSendingResponse(true);
      const response = await fetch('/api/human-fallback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest._id,
          adminResponse: responseText,
          status: 'resolved',
          respondedBy: 'Admin'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedRequest(null);
        setResponseText('');
        fetchFallbackRequests();
        alert('✅ Response saved successfully! Use Telegram to contact the user.');
      } else {
        alert('Failed to save response: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save response');
    } finally {
      setSendingResponse(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Human Fallback Dashboard</h1>
          <p className="text-gray-600">Manage user queries that require human assistance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
                <p className="text-2xl font-bold text-gray-900">{stats['in-progress'] || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Closed</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.closed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Status */}
        {stats.mongodb && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-blue-900">💾 Dual Storage Status</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Local: {stats.local?.total || 0} active requests | 
                  MongoDB: {stats.mongodb?.total || 0} permanently stored
                  {stats.mongodb?.connection === 'Connected' ? ' ✅' : ' ⚠️'}
                </p>
              </div>
              <div className="text-xs text-blue-600">
                {stats.mongodb?.connection === 'Connected' ? 'All data backed up' : 'Local storage only'}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
              >
                <option value="all" className="text-gray-900 bg-white">All Status</option>
                <option value="pending" className="text-gray-900 bg-white">Pending</option>
                <option value="in-progress" className="text-gray-900 bg-white">In Progress</option>
                <option value="resolved" className="text-gray-900 bg-white">Resolved</option>
                <option value="closed" className="text-gray-900 bg-white">Closed</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
              >
                <option value="all" className="text-gray-900 bg-white">All Categories</option>
                <option value="academic" className="text-gray-900 bg-white">📚 Academic</option>
                <option value="admission" className="text-gray-900 bg-white">🎓 Admission</option>
                <option value="hostel" className="text-gray-900 bg-white">🏠 Hostel</option>
                <option value="fees" className="text-gray-900 bg-white">💰 Fees</option>
                <option value="placement" className="text-gray-900 bg-white">💼 Placement</option>
                <option value="general" className="text-gray-900 bg-white">❓ General</option>
                <option value="technical" className="text-gray-900 bg-white">⚙️ Technical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Fallback Requests</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading requests...</p>
            </div>
          ) : fallbackRequests.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No fallback requests found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {fallbackRequests.map((request) => (
                  <div key={request._id || request.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{categoryIcons[request.category]}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[request.status]}`}>
                            {request.status}
                          </span>
                          <span className={`text-sm font-medium ${priorityColors[request.priority]}`}>
                            {request.priority} priority
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.query}</h3>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{request.userContact.name || 'Anonymous'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone size={14} />
                            <span>{request.userContact.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="bg-red-50 p-4 rounded-lg mb-3 border border-red-200">
                          <p className="text-sm text-gray-800 font-medium">
                            <strong className="text-red-700">❌ Original AI Response:</strong> {request.originalResponse}
                          </p>
                        </div>
                        
                        {request.adminResponse?.content && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-800 font-medium">
                              <strong className="text-green-700">✅ Admin Response:</strong> {request.adminResponse.content}
                            </p>
                            <p className="text-xs text-gray-600 mt-2 font-medium">
                              📝 Responded by {request.adminResponse.respondedBy} on {formatDate(request.adminResponse.respondedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                          disabled={request.status === 'resolved' || request.status === 'closed'}
                        >
                          <Send size={14} />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} results
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={!pagination.hasPrev}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={!pagination.hasNext}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Reply to User Query</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">User Query:</h3>
                <p className="text-gray-800 bg-blue-50 p-4 rounded-lg font-medium border border-blue-200">{selectedRequest.query}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Contact Info:</h3>
                <div className="flex gap-4 text-sm text-gray-800 font-medium">
                  <span className="bg-green-100 px-3 py-1 rounded-full border border-green-300">📱 {selectedRequest.userContact.phone}</span>
                  <span className="bg-blue-100 px-3 py-1 rounded-full border border-blue-300">👤 {selectedRequest.userContact.name || 'Anonymous'}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Your Response:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                  placeholder={`Type your detailed response to help the user...`}
                />
              </div>
            </div>
            
            {/* Contact via Telegram */}
            {responseText.trim() && (
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">📱 Contact User:</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRequest.userContact.name || 'User'}: <strong>{selectedRequest.userContact.phone}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const telegramUrl = `https://t.me/+${selectedRequest.userContact.phone.replace(/[^0-9]/g, '')}`;
                      window.open(telegramUrl, '_blank');
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <MessageSquare size={16} />
                    Open Telegram
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Click &quot;Open Telegram&quot; to message <strong>{selectedRequest.userContact.phone}</strong> directly and send your response.
                  </p>
                </div>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setResponseText('');
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={saveResponse}
                  disabled={!responseText.trim() || sendingResponse}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
                >
                  {sendingResponse ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Save Response
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}