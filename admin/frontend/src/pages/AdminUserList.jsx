import React, { useState, useEffect, useCallback } from 'react';
import {
    User,
    Mail,
    Shield,
    Calendar,
    Clock,
    Search,
    ChevronUp,
    ChevronDown,
    Edit,
    Lock,
    Key,
    Trash2,
    Download,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || 'http://localhost:4000';

const AdminUserList = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All Roles');
    const [filterStatus, setFilterStatus] = useState('All Statuses');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const usersPerPage = 10;

    // Available roles and statuses (aligned with backend)
    const availableRoles = ['All Roles', 'Super Admin', 'Manager', 'User'];
    const availableStatuses = ['All Statuses', 'Active', 'Inactive'];

    // Map backend roles to display roles
    const mapRoleToDisplay = (role) => {
        switch (role) {
            case 'super-admin': return 'Super Admin';
            case 'manager': return 'Manager';
            case 'standard': return 'User';
            default: return role;
        }
    };

    // Map display roles to backend roles
    const mapRoleToBackend = (role) => {
        switch (role) {
            case 'Super Admin': return 'super-admin';
            case 'Manager': return 'manager';
            case 'User': return 'standard';
            default: return role;
        }
    };

    // Fetch users from backend
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('Authentication token missing. Please log in again.');
                toast.error('Authentication token missing. Please log in again.');
                onLogout();
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
                        role: mapRoleToDisplay(user.role),
                        registrationDate: new Date(user.createdAt).toISOString().split('T')[0],
                        status: user.isActive ? 'Active' : 'Inactive',
                        lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : 'Never',
                    }))
                );
            } else {
                setError(response.data.message || 'Failed to fetch users.');
                toast.error(response.data.message || 'Failed to fetch users.');
            }
        } catch (err) {
            console.error('Error fetching users:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
            });
            const message = err.response?.status === 403
                ? 'Access denied: Super-admin role required.'
                : err.response?.data?.message || 'Failed to fetch users.';
            setError(message);
            toast.error(message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
                navigate('/admin/login', { replace: true });
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate, onLogout]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedUsers = [...users].sort((a, b) => {
            const aValue = a[key] || '';
            const bValue = b[key] || '';
            return direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });
        setUsers(sortedUsers);
    };

    // Handle search and filters
    const filteredUsers = users.filter(
        (user) =>
            (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterRole !== 'All Roles' ? user.role === 'filterRole' : true) &&
            (filterStatus !== 'All Statuses' ? user.status === 'filterStatus' : true)
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
    const handleBulkAction = async (action, value) => {
        if (selectedUsers.length === 0) {
            setError('No users selected.');
            toast.error('No users selected.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('Authentication token missing. Please log in again.');
                toast.error('Authentication token missing. Please log in again.');
                onLogout();
                navigate('/admin/login', { replace: true });
                return;
            }
            if (action === 'assignRole') {
                await Promise.all(
                    selectedUsers.map((id) =>
                        axios.put(
                            `${API_BASE_URL}/api/admin/user/${id}`,
                            { role: mapRoleToBackend(value) },
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                    )
                );
                setSuccess(`Assigned role ${value} to selected users successfully!`);
                toast.success(`Assigned role ${value} to selected users successfully!`);
            } else if (action === 'deactivate') {
                await Promise.all(
                    selectedUsers.map((id) =>
                        axios.put(
                            `${API_BASE_URL}/api/admin/user/${id}/deactivate`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                    )
                );
                setSuccess('Selected users deactivated successfully!');
                toast.success('Selected users deactivated successfully!');
            } else if (action === 'delete') {
                await Promise.all(
                    selectedUsers.map((id) =>
                        axios.delete(`${API_BASE_URL}/api/admin/user/${id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                    )
                );
                setSuccess('Selected users deleted successfully!');
                toast.success('Selected users deleted successfully!');
            }
            setSelectedUsers([]);
            fetchUsers(); // Refresh user list
        } catch (err) {
            console.error(`Error in bulk ${action}:`, {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
            });
            const message = err.response?.data?.message || `Failed to perform ${action}.`;
            setError(message);
            toast.error(message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
                navigate('/admin/login', { replace: true });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle individual actions
    const handleEdit = async (user) => {
        const newName = prompt('Enter new name:', user.name);
        const newEmail = prompt('Enter new email:', user.email);
        if (!newName || !newEmail) {
            setError('Name and email are required.');
            toast.error('Name and email are required.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${API_BASE_URL}/api/admin/user/${user.id}`,
                { name: newName, email: newEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess(`Updated user ${newName} successfully!`);
            toast.success(`Updated user ${newName} successfully!`);
            fetchUsers();
        } catch (err) {
            console.error('Error editing user:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
            });
            const message = err.response?.data?.message || 'Failed to update user.';
            setError(message);
            toast.error(message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
                navigate('/admin/login', { replace: true });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivate = async (id) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${API_BASE_URL}/api/admin/user/${id}/deactivate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('User deactivated successfully!');
            toast.success('User deactivated successfully!');
            fetchUsers();
        } catch (err) {
            console.error('Error deactivating user:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
            });
            const message = err.response?.data?.message || 'Failed to deactivate user.';
            setError(message);
            toast.error(message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
                navigate('/admin/login', { replace: true });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (email) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${API_BASE_URL}/api/admin/user/reset-password`,
                { email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess(`Password reset initiated for ${email}!`);
            toast.success(`Password reset initiated for ${email}!`);
        } catch (err) {
            console.error('Error resetting password:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
            });
            const message = err.response?.data?.message || 'Failed to initiate password reset.';
            setError(message);
            toast.error(message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
                navigate('/admin/login', { replace: true });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`${API_BASE_URL}/api/admin/user/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess('User deleted successfully!');
            toast.success('User deleted successfully!');
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
            });
            const message = err.response?.data?.message || 'Failed to delete user.';
            setError(message);
            toast.error(message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
                navigate('/admin/login', { replace: true });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle export
    const handleExport = (format) => {
        if (filteredUsers.length === 0) {
            setError('No users to export.');
            toast.error('No users to export.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            if (format === 'csv') {
                const csvHeaders = ['name', 'email', 'role', 'registrationDate', 'status', 'lastLogin'];
                const csvRows = filteredUsers.map((user) =>
                    csvHeaders.map((header) => `"${user[header] || ''}"`).join(',')
                );
                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `user_list_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text('User List', 10, 10);
                doc.setFontSize(10);
                let y = 20;
                filteredUsers.forEach((user, index) => {
                    doc.text(`User ${index + 1}`, 10, y);
                    doc.text(`Name: ${user.name}`, 10, y + 5);
                    doc.text(`Email: ${user.email}`, 10, y + 10);
                    doc.text(`Role: ${user.role}`, 10, y + 15);
                    doc.text(`Registration Date: ${user.registrationDate}`, 10, y + 20);
                    doc.text(`Status: ${user.status}`, 10, y + 25);
                    doc.text(`Last Login: ${user.lastLogin}`, 10, y + 30);
                    y += 40;
                    if (y > 270) {
                        doc.addPage();
                        y = 10;
                    }
                });
                doc.save(`user_list_${Date.now()}.pdf`);
            }
            setSuccess(`Users exported as ${format.toUpperCase()} successfully!`);
            toast.success(`Users exported as ${format.toUpperCase()} successfully!`);
        } catch (err) {
            console.error('Error exporting users:', err);
            setError('Failed to export users.');
            toast.error('Failed to export users.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">User List</h2>
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
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by role"
                >
                    {availableRoles.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by status"
                >
                    {availableStatuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-slide-in">
                    <select
                        onChange={(e) => handleBulkAction('assignRole', e.target.value)}
                        className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                        aria-label="Assign role to selected users"
                        disabled={isLoading}
                    >
                        <option value="">Assign Role</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="User">User</option>
                    </select>
                    <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Deactivate selected users"
                    >
                        Deactivate
                    </button>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Delete selected users"
                    >
                        Delete
                    </button>
                </div>
            )}

            {/* Success/Error Messages */}
            {error && (
                <div className="text-red-500 text-sm text-center animate-shake mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="text-teal-600 text-sm text-center animate-fade-in mb-4">
                    {success}
                </div>
            )}

            {/* Export Options */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as CSV"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export CSV
                </button>
                <button
                    onClick={() => handleExport('pdf')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as PDF"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export PDF
                </button>
            </div>

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
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${user.status === 'Active' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}
                                    >
                                        {user.status}
                                    </span>
                                </td>
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
                                        onClick={() => handleDeactivate(user.id)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Deactivate ${user.name}`}
                                        disabled={isLoading}
                                    >
                                        <Lock size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleResetPassword(user.email)}
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

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default AdminUserList;