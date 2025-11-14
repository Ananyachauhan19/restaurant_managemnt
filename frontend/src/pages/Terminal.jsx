import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const Terminal = () => {
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const socketUrl = apiUrl.replace('/api', '');
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to terminal');
      console.log('Connected to WebSocket');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from terminal');
      console.log('Disconnected from WebSocket');
    });

    socketRef.current.on('query-executed', (data) => {
      console.log('Query executed:', data);
      setQueryHistory(prev => [...prev, {
        type: 'success',
        query: data.query,
        results: data.results,
        rowCount: data.rowCount,
        timestamp: data.timestamp
      }]);
      toast.success(`Query executed: ${data.rowCount} rows returned`);
    });

    socketRef.current.on('query-error', (data) => {
      console.log('Query error:', data);
      setQueryHistory(prev => [...prev, {
        type: 'error',
        query: data.query,
        error: data.error,
        timestamp: data.timestamp
      }]);
      toast.error(`Query failed: ${data.error}`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new query is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [queryHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    try {
      // Send query via WebSocket
      if (socketRef.current && isConnected) {
        socketRef.current.emit('execute-query', { query });
        setQuery('');
      } else {
        toast.error('Not connected to server');
      }
    } catch (error) {
      toast.error('Failed to execute query');
      console.error('Query execution error:', error);
    }
  };

  const clearHistory = () => {
    setQueryHistory([]);
    toast.success('History cleared');
  };

  const renderResults = (item) => {
    if (item.type === 'error') {
      return (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{item.error}</p>
        </div>
      );
    }

    if (!item.results || item.results.length === 0) {
      return (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-gray-600">
          <p className="text-sm">Query executed successfully. No rows returned.</p>
        </div>
      );
    }

    return (
      <div className="mt-2 overflow-x-auto">
        <p className="text-sm text-gray-600 mb-2">{item.rowCount} rows returned</p>
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(item.results[0]).map((key) => (
                <th
                  key={key}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {item.results.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {Object.values(row).map((value, vidx) => (
                  <td key={vidx} className="px-4 py-2 whitespace-nowrap border-r text-gray-900">
                    {value === null ? (
                      <span className="text-gray-400 italic">NULL</span>
                    ) : typeof value === 'object' ? (
                      JSON.stringify(value)
                    ) : (
                      String(value)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SQL Terminal</h1>
          <p className="text-gray-600 mt-1">Execute SQL queries and see results in real-time</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {queryHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Query Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter SQL query (e.g., SELECT * FROM Customers LIMIT 10)"
            className="flex-1 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            rows="3"
          />
          <button
            type="submit"
            disabled={!isConnected}
            className={`px-6 py-3 rounded font-semibold ${
              isConnected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Execute
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Examples: <code className="bg-gray-100 px-2 py-1 rounded">SELECT * FROM Orders</code>,{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">SELECT * FROM MenuItems</code>,{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">SELECT * FROM Customers</code>
        </p>
      </form>

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-[600px] overflow-y-auto"
      >
        {queryHistory.length === 0 ? (
          <p className="text-gray-500">No queries executed yet. Enter a query above to get started.</p>
        ) : (
          queryHistory.map((item, idx) => (
            <div key={idx} className="mb-6 pb-6 border-b border-gray-700 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400">$ {item.query}</span>
                <span className="text-gray-500 text-xs">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-800 rounded p-3">
                {renderResults(item)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Terminal;
