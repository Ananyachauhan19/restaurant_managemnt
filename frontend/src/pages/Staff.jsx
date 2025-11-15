import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';
import toast from 'react-hot-toast';

// Icons
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DollarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  async function loadStaff() {
    try {
      setLoading(true);
      const [staffData, statsData] = await Promise.all([
        api.getStaff(),
        api.getStaffStats()
      ]);
      const staffArray = Array.isArray(staffData) ? staffData : (staffData.data?.staff || staffData.staff || staffData.data || []);
      setStaff(staffArray);
      setFilteredStaff(staffArray);
      setStats(statsData.data || statsData);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  }

  // Filter staff based on search term and position
  useEffect(() => {
    if (!Array.isArray(staff)) return;
    
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (positionFilter) {
      filtered = filtered.filter(member => member.role === positionFilter);
    }

    setFilteredStaff(filtered);
  }, [searchTerm, positionFilter, staff]);

  useEffect(() => {
    if (user) {
      loadStaff();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getPositionColor = (role) => {
    const colors = {
      'chef': 'bg-red-100 text-red-800',
      'cook': 'bg-orange-100 text-orange-800',
      'waiter': 'bg-blue-100 text-blue-800',
      'manager': 'bg-purple-100 text-purple-800',
      'cashier': 'bg-green-100 text-green-800',
      'cleaner': 'bg-gray-100 text-gray-800',
      'security': 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getPositionIcon = (role) => {
    const icons = {
      'chef': '👨‍🍳',
      'cook': '👩‍🍳',
      'waiter': '🍽️',
      'manager': '👔',
      'cashier': '💰',
      'cleaner': '🧹',
      'security': '🛡️'
    };
    return icons[role] || '👤';
  };

  const uniquePositions = [...new Set((staff || []).map(member => member.role))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-purple-600 mx-auto mb-3"></div>
          <p className="text-purple-600 font-medium text-sm">Loading Staff Data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">👥</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Staff Management</h2>
          <p className="text-gray-600 text-sm mb-4">Please log in to manage staff</p>
          <a 
            href="/login" 
            className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-md"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <span>👥</span>
            <span>Staff Management</span>
          </h1>
          <p className="text-purple-100">Manage your restaurant team and track performance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <UserIcon />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStaff || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <BriefcaseIcon />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chefs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.roleStats?.find(r => r.role === 'chef')?.count || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BriefcaseIcon />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Waiters</p>
                <p className="text-3xl font-bold text-gray-900">{stats.roleStats?.find(r => r.role === 'waiter')?.count || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarIcon />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Experience</p>
                <p className="text-3xl font-bold text-gray-900">{Number(stats.experienceStats?.avgExperience || 0).toFixed(1)} years</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search staff by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
              />
            </div>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
            >
              <option value="">All Positions</option>
              {uniquePositions.map(position => (
                <option key={position} value={position}>{position.charAt(0).toUpperCase() + position.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStaff.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || positionFilter ? 'No staff found' : 'No staff members yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || positionFilter ? 'Try adjusting your search criteria' : 'Staff members will appear here once added'}
              </p>
            </div>
          ) : (
            filteredStaff.map(member => (
              <div key={member.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 group">
                {/* Staff Avatar */}
                <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {getPositionIcon(member.role)}
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {member.name}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPositionColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-gray-600">
                      <PhoneIcon />
                      <span className="text-sm">{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <BriefcaseIcon />
                      <span className="text-sm">Experience: {member.experience} years</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CalendarIcon />
                      <span className="text-sm">Joined: {new Date(member.dateOfJoining).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <DollarIcon />
                      <span className="text-sm font-semibold text-green-600">₹{member.salary}/month</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {member.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}