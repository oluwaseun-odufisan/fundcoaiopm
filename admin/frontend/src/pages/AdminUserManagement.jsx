import React, { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Shield,
    Calendar,
    ToggleLeft,
    ToggleRight,
    Key,
    Trash2,
    Edit,
    CheckCircle,
    X,
    Search,
    ChevronUp,
    ChevronDown,
    Plus,
    History,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminUserManagement = ({ onLogout }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [createUser, setCreateUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'standard',
        preferences: { notifications: true },
    });
    const [activityLogs, setActivityLogs] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const usersPerPage = 10;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch all users
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                console.error('No token found in localStorage');
                setError('Authentication token missing. Please log in again.');
                toast.error('Authentication token missing. Please log in again.');
                navigate('/admin/login', { replace: true });
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
            });
            console.log('Fetch users response:', response.data);
            if (response.data.success) {
                setUsers(
                    response.data.users.map((user) => ({
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role === 'standard' ? 'User' : user.role === 'team-lead' ? 'Team Lead' : 'Admin',
                        registrationDate: new Date(user.createdAt).toISOString().split('T')[0],
                        status: user.isActive ? 'Active' : 'Inactive',
                        lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : 'Never',
                        preferences: user.preferences,
                    }))
                );
            } else {
                setError(response.data.message || 'Failed to fetch users.');
                toast.error(response.data.message || 'Failed to fetch users.');
            }
        } catch (err) {
            handleApiError(err, 'Failed to fetch users.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle API errors
    const handleApiError = (err, defaultMessage) => {
        console.error('API error:', err.message, err.response?.data);
        const status = err.response?.status;
        const message = err.response?.data?.message || defaultMessage;
        setError(message);
        toast.error(message);
        if (status === 401) {
            onLogout();
            navigate('/admin/login');
        } else if (status === 403) {
            setError('Access denied: Super-admin role required to manage users.');
            navigate('/admin/dashboard', { replace: true });
        }
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedUsers = [...users].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setUsers(sortedUsers);
    };

    // Handle search and filters
    const filteredUsers = users.filter(
        (user) =>
            (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterRole ? user.role === filterRole : true) &&
            (filterStatus ? user.status === filterStatus : true)
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
    );

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUsers(paginatedUsers.map((user) => user.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
        );
    };

    // Handle bulk actions
    const handleBulkAction = async (action) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            for (const userId of selectedUsers) {
                if (action === 'deactivate') {
                    await axios.put(
                        `${API_BASE_URL}/api/admin/users/${userId}/deactivate`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } else if (action === 'activate') {
                    await axios.put(
                        `${API_BASE_URL}/api/admin/users/${userId}`,
                        { isActive: true },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } else if (action === 'delete') {
                    await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                } else if (action === 'assignRole') {
                    await axios.put(
                        `${API_BASE_URL}/api/admin/users/${userId}/role`,
                        { role: 'team-lead' },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }
            }
            setSuccess(`Bulk ${action} completed successfully!`);
            toast.success(`Bulk ${action} completed!`);
            setSelectedUsers([]);
            fetchUsers();
        } catch (err) {
            handleApiError(err, `Failed to perform bulk ${action}.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle individual actions
    const handleEdit = (user) => {
        setEditUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role === 'User' ? 'standard' : user.role === 'Team Lead' ? 'team-lead' : 'admin',
            preferences: user.preferences,
        });
        setIsEditModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleToggleStatus = async (id, currentStatus) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${API_BASE_URL}/api/admin/users/${id}/${currentStatus === 'Active' ? 'deactivate' : ''}`,
                currentStatus === 'Inactive' ? { isActive: true } : {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess(`User status updated successfully!`);
            toast.success('User status updated!');
            fetchUsers();
        } catch (err) {
            handleApiError(err, 'Failed to update user status.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (id) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const newPassword = `TempPass${Math.random().toString(36).slice(-8)}!`;
            await axios.put(
                `${API_BASE_URL}/api/admin/users/${id}/password`,
                { newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess(`Password reset for user! Temporary password: ${newPassword}`);
            toast.success('Password reset! Check success message for temporary password.');
        } catch (err) {
            handleApiError(err, 'Failed to reset password.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSuccess('User deleted successfully!');
                toast.success('User deleted!');
                fetchUsers();
            } catch (err) {
                handleApiError(err, 'Failed to delete user.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleViewLogs = async (id) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_BASE_URL}/api/admin/users/${id}/activity`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setActivityLogs(response.data.activityLogs);
                setIsLogsModalOpen(true);
            }
        } catch (err) {
            handleApiError(err, 'Failed to fetch activity logs.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle edit form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!editUser.name || editUser.name.length < 2) {
            setError('Name must be at least 2 characters long.');
            setIsLoading(false);
            return;
        }
        if (!editUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUser.email)) {
            setError('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }
        if (!editUser.role) {
            setError('Please select a role.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            // Update profile (name, email, preferences)
            const profileResponse = await axios.put(
                `${API_BASE_URL}/api/admin/users/${editUser.id}`,
                {
                    name: editUser.name,
                    email: editUser.email,
                    preferences: editUser.preferences,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update role if changed
            if (editUser.role !== (users.find((u) => u.id === editUser.id)?.role.toLowerCase() || '')) {
                await axios.put(
                    `${API_BASE_URL}/api/admin/users/${editUser.id}/role`,
                    { role: editUser.role },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            if (profileResponse.data.success) {
                setSuccess('User updated successfully!');
                toast.success('User updated!');
                setIsEditModalOpen(false);
                setEditUser(null);
                fetchUsers();
            }
        } catch (err) {
            handleApiError(err, 'Failed to update user.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle create form submission
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!createUser.name || createUser.name.length < 2) {
            setError('Name must be at least 2 characters long.');
            setIsLoading(false);
            return;
        }
        if (!createUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createUser.email)) {
            setError('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }
        if (!createUser.password || createUser.password.length < 8) {
            setError('Password must be at least 8 characters.');
            setIsLoading(false);
            return;
        }
        if (!createUser.role) {
            setError('Please select a role.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
                `${API_BASE_URL}/api/admin/users`,
                createUser,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setSuccess('User created successfully!');
                toast.success('User created!');
                setIsCreateModalOpen(false);
                setCreateUser({
                    name: '',
                    email: '',
                    password: '',
                    role: 'standard',
                    preferences: { notifications: true },
                });
                fetchUsers();
            }
        } catch (err) {
            handleApiError(err, 'Failed to create user.');
        } finally {
            setIsLoading(false);
        }
    };

    // Render access denied message if error indicates 403
    if (error === 'Access denied: Super-admin role required to manage users.') {
        return (
            <div className="min-h-screen bg-teal-50 flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-700 mb-6">You need super-admin privileges to manage users.</p>
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto relative animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">User Management</h2>
                <div className="flex space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                            aria-label="Search users"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300 flex items-center"
                        aria-label="Create new user"
                    >
                        <Plus size={18} className="mr-2" />
                        New User
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-4 mb-4">
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by role"
                >
                    <option value="">All Roles</option>
                    <option value="User">User</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Admin">Admin</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by status"
                >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            {/* Success/Error Messages */}
            {error && error !== 'Access denied: Super-admin role required to manage users.' && (
                <div className="text-red-500 text-sm text-center animate-shake mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="text-teal-600 text-sm text-center animate-fade-in mb-4">
                    {success}
                </div>
            )}

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="flex space-x-2 mb-4 animate-slide-in">
                    <button
                        onClick={() => handleBulkAction('activate')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Activate
                    </button>
                    <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Deactivate
                    </button>
                    <button
                        onClick={() => handleBulkAction('assignRole')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Assign Team Lead
                    </button>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Delete
                    </button>
                </div>
            )}

            {/* User Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all users"
                                />
                            </th>
                            {['name', 'email', 'role', 'registrationDate', 'status', 'lastLogin'].map((key) => (
                                <th
                                    key={key}
                                    className="p-3 text-left text-teal-700 cursor-pointer hover:text-teal-900 transition-colors"
                                    onClick={() => handleSort(key)}
                                    aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                        {sortConfig.key === key &&
                                            (sortConfig.direction === 'asc' ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            ))}
                                    </div>
                                </th>
                            ))}
                            <th className="p-3 text-left text-teal-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map((user) => (
                            <tr
                                key={user.id}
                                className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleSelectUser(user.id)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label={`Select ${user.name}`}
                                    />
                                </td>
                                <td className="p-3 text-gray-700">{user.name}</td>
                                <td className="p-3 text-gray-700">{user.email}</td>
                                <td className="p-3 text-gray-700">{user.role}</td>
                                <td className="p-3 text-gray-700">{user.registrationDate}</td>
                                <td className="p-3 text-gray-700">{user.status}</td>
                                <td className="p-3 text-gray-700">{user.lastLogin}</td>
                                <td className="p-3 flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Edit ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(user.id, user.status)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`${user.status === 'Active' ? 'Deactivate' : 'Activate'} ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        {user.status === 'Active' ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleResetPassword(user.id)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Reset password for ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        <Key size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                        aria-label={`Delete ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleViewLogs(user.id)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`View activity logs for ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        <History size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * usersPerPage + 1} to{' '}
                    {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}{' '}
                    users
                </p>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Next page"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md transform transition-all duration-500 hover:scale-105">
                        <h3 className="text-xl font-bold text-teal-600 mb-4">Edit User</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="name" className="sr-only">
                                    Name
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <User className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="text"
                                        id="name"
                                        value={editUser.name}
                                        onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                        placeholder="Enter name"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Full name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="email" className="sr-only">
                                    Email
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Mail className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="email"
                                        id="email"
                                        value={editUser.email}
                                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                        placeholder="Enter email"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Email address"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="role" className="sr-only">
                                    Role
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Shield className="w-5 h-5 text-teal-600 ml-3" />
                                    <select
                                        id="role"
                                        value={editUser.role}
                                        onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                        aria-label="Select role"
                                        required
                                    >
                                        <option value="standard">User</option>
                                        <option value="team-lead">Team Lead</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="notifications" className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="notifications"
                                        checked={editUser.preferences.notifications}
                                        onChange={(e) =>
                                            setEditUser({
                                                ...editUser,
                                                preferences: { notifications: e.target.checked },
                                            })
                                        }
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label="Enable notifications"
                                    />
                                    <span className="text-gray-700">Enable Notifications</span>
                                </label>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'}`}
                                    aria-label="Save user"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditUser(null);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                    aria-label="Cancel"
                                >
                                    <X className="w-5 h-5 mr-2 inline" />
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md transform transition-all duration-500 hover:scale-105">
                        <h3 className="text-xl font-bold text-teal-600 mb-4">Create User</h3>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="create-name" className="sr-only">
                                    Name
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <User className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="text"
                                        id="create-name"
                                        value={createUser.name}
                                        onChange={(e) => setCreateUser({ ...createUser, name: e.target.value })}
                                        placeholder="Enter name"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Full name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="create-email" className="sr-only">
                                    Email
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Mail className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="email"
                                        id="create-email"
                                        value={createUser.email}
                                        onChange={(e) => setCreateUser({ ...createUser, email: e.target.value })}
                                        placeholder="Enter email"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Email address"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="create-password" className="sr-only">
                                    Password
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Key className="w-5 h-5 text-teal-600 ml-3" />
                                    <input
                                        type="password"
                                        id="create-password"
                                        value={createUser.password}
                                        onChange={(e) => setCreateUser({ ...createUser, password: e.target.value })}
                                        placeholder="Enter password"
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                        aria-label="Password"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="create-role" className="sr-only">
                                    Role
                                </label>
                                <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                    <Shield className="w-5 h-5 text-teal-600 ml-3" />
                                    <select
                                        id="create-role"
                                        value={createUser.role}
                                        onChange={(e) => setCreateUser({ ...createUser, role: e.target.value })}
                                        className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                        aria-label="Select role"
                                        required
                                    >
                                        <option value="standard">User</option>
                                        <option value="team-lead">Team Lead</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="relative">
                                <label htmlFor="create-notifications" className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="create-notifications"
                                        checked={createUser.preferences.notifications}
                                        onChange={(e) =>
                                            setCreateUser({
                                                ...createUser,
                                                preferences: { notifications: e.target.checked },
                                            })
                                        }
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label="Enable notifications"
                                    />
                                    <span className="text-gray-700">Enable Notifications</span>
                                </label>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'}`}
                                    aria-label="Create user"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                            <span>Creating...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Create
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setCreateUser({
                                            name: '',
                                            email: '',
                                            password: '',
                                            role: 'standard',
                                            preferences: { notifications: true },
                                        });
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                    aria-label="Cancel"
                                >
                                    <X className="w-5 h-5 mr-2 inline" />
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Logs Modal */}
            {isLogsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-2xl transform transition-all duration-500 hover:scale-105">
                        <h3 className="text-xl font-bold text-teal-600 mb-4">Activity Logs</h3>
                        <div className="max-h-96 overflow-y-auto">
                            {activityLogs.length === 0 ? (
                                <p className="text-gray-700">No activity logs available.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {activityLogs.map((log, index) => (
                                        <li key={index} className="p-2 border-b border-teal-100">
                                            <p className="text-gray-700">
                                                <strong>{log.action.toUpperCase()}</strong> at{' '}
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                            {log.details && <p className="text-gray-600 text-sm">{log.details}</p>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setIsLogsModalOpen(false);
                                    setActivityLogs([]);
                                }}
                                className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 mr-2 inline" />
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;