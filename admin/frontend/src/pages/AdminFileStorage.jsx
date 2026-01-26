import React, { useState } from 'react';
import {
    File,
    User,
    HardDrive,
    Calendar,
    Search,
    ChevronUp,
    ChevronDown,
    Eye,
    Trash2,
    Edit,
    Download,
    BarChart2,
    PieChart,
} from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// Mock file data (replace with backend API call)
const initialFiles = [
    {
        id: '1',
        fileName: 'project_proposal.pdf',
        owner: 'John Doe',
        size: 2048, // Size in KB
        uploadDate: '2025-06-10',
        status: 'Public',
    },
    {
        id: '2',
        fileName: 'marketing_plan.docx',
        owner: 'Jane Smith',
        size: 512,
        uploadDate: '2025-06-12',
        status: 'Private',
    },
    {
        id: '3',
        fileName: 'website_mockup.png',
        owner: 'Alice Johnson',
        size: 1024,
        uploadDate: '2025-06-15',
        status: 'Public',
    },
    {
        id: '4',
        fileName: 'data_analysis.csv',
        owner: 'Bob Wilson',
        size: 256,
        uploadDate: '2025-06-17',
        status: 'Private',
    },
];

// Mock storage quota data (replace with backend API call)
const storageQuota = {
    total: 10485760, // 10 GB in KB
    used: 3840, // Sum of file sizes in KB
    perUserQuota: 2097152, // 2 GB in KB
    userUsage: [
        { user: 'John Doe', used: 2048 },
        { user: 'Jane Smith', used: 512 },
        { user: 'Alice Johnson', used: 1024 },
        { user: 'Bob Wilson', used: 256 },
    ],
};

// Mock chart data
const storageUsageData = {
    labels: storageQuota.userUsage.map((u) => u.user),
    datasets: [
        {
            label: 'Storage Used (MB)',
            data: storageQuota.userUsage.map((u) => (u.used / 1024).toFixed(2)),
            backgroundColor: '#00CED1',
        },
    ],
};

const fileTypeData = {
    labels: ['PDF', 'DOCX', 'PNG', 'CSV'],
    datasets: [
        {
            data: [1, 1, 1, 1], // Mock counts
            backgroundColor: ['#00CED1', '#1E90FF', '#FFD700', '#FF6347'],
            borderColor: '#FFFFFF',
            borderWidth: 2,
        },
    ],
};

// Mock available filters
const availableOwners = ['All Owners', 'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson'];
const availableStatuses = ['All Statuses', 'Public', 'Private'];

const AdminFileStorage = () => {
    const [files, setFiles] = useState(initialFiles);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOwner, setFilterOwner] = useState('All Owners');
    const [filterStatus, setFilterStatus] = useState('All Statuses');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const filesPerPage = 5;

    // Chart options
    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#2D3748' },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
        },
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#2D3748' },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
        },
        scales: {
            x: { ticks: { color: '#2D3748' } },
            y: {
                ticks: { color: '#2D3748' },
                title: {
                    display: true,
                    text: 'Storage (MB)',
                    color: '#2D3748',
                },
            },
        },
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedFiles = [...files].sort((a, b) => {
            if (key === 'size') {
                return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
            }
            return direction === 'asc'
                ? a[key].localeCompare(b[key])
                : b[key].localeCompare(a[key]);
        });
        setFiles(sortedFiles);
    };

    // Handle search and filters
    const filteredFiles = files.filter(
        (file) =>
            (file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                file.owner.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterOwner !== 'All Owners' ? file.owner === filterOwner : true) &&
            (filterStatus !== 'All Statuses' ? file.status === filterStatus : true)
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
    const paginatedFiles = filteredFiles.slice(
        (currentPage - 1) * filesPerPage,
        currentPage * filesPerPage
    );

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedFiles(paginatedFiles.map((file) => file.id));
        } else {
            setSelectedFiles([]);
        }
    };

    const handleSelectFile = (id) => {
        setSelectedFiles((prev) =>
            prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
        );
    };

    // Handle bulk actions
    const handleBulkAction = (action, value) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        setTimeout(() => {
            if (selectedFiles.length === 0) {
                setError('No files selected.');
                setIsLoading(false);
                return;
            }
            if (action === 'updateStatus') {
                setFiles((prev) =>
                    prev.map((file) =>
                        selectedFiles.includes(file.id) ? { ...file, status: value } : file
                    )
                );
                setSuccess(`Updated status to ${value} for selected files successfully!`);
            } else if (action === 'delete') {
                setFiles((prev) => prev.filter((file) => !selectedFiles.includes(file.id)));
                setSuccess('Selected files deleted successfully!');
            }
            setSelectedFiles([]);
            setIsLoading(false);
        }, 1000);
    };

    // Handle individual actions
    const handleView = (file) => {
        console.log(`Viewing file: ${file.fileName}`); // Replace with file viewer logic
        setSuccess(`Initiated view for ${file.fileName}!`);
    };

    const handleUpdate = (file) => {
        console.log(`Updating file: ${file.fileName}`); // Replace with update logic
        setSuccess(`Initiated update for ${file.fileName}!`);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            setIsLoading(true);
            setTimeout(() => {
                setFiles((prev) => prev.filter((file) => file.id !== id));
                setSuccess('File deleted successfully!');
                setIsLoading(false);
            }, 1000);
        }
    };

    // Handle export
    const handleExport = (format) => {
        if (filteredFiles.length === 0) {
            setError('No files to export.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            if (format === 'csv') {
                const csvHeaders = ['fileName', 'owner', 'size', 'uploadDate', 'status'];
                const csvRows = filteredFiles.map((file) =>
                    csvHeaders.map((header) => `"${file[header]}"`).join(',')
                );
                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `file_storage_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                console.log('PDF export initiated'); // Replace with PDF generation logic (e.g., jsPDF)
                setSuccess('PDF export initiated! (Placeholder)');
            }
            setSuccess(`Files exported as ${format.toUpperCase()} successfully!`);
            setIsLoading(false);
        }, 1000);
    };

    // Calculate storage usage percentage
    const totalUsagePercent = ((storageQuota.used / storageQuota.total) * 100).toFixed(2);

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">File Storage</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                        aria-label="Search files"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                </div>
            </div>

            {/* Storage Quota Display */}
            <div className="mb-8 bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-in">
                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                    <HardDrive className="w-5 h-5 mr-2" />
                    Storage Quota Overview
                </h3>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <p className="text-gray-700 mb-2">
                            Total Storage: {(storageQuota.total / 1048576).toFixed(2)} GB
                        </p>
                        <p className="text-gray-700 mb-2">
                            Used: {(storageQuota.used / 1048576).toFixed(2)} GB ({totalUsagePercent}%)
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-300 ${totalUsagePercent > 80 ? 'bg-red-600' : 'bg-teal-600'
                                    }`}
                                style={{ width: `${totalUsagePercent}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-gray-700 mb-2">Per-User Quota: {(storageQuota.perUserQuota / 1048576).toFixed(2)} GB</p>
                        {storageQuota.userUsage.map((user) => {
                            const userUsagePercent = ((user.used / storageQuota.perUserQuota) * 100).toFixed(2);
                            return (
                                <div key={user.user} className="mb-2">
                                    <p className="text-sm text-gray-600">
                                        {user.user}: {(user.used / 1024).toFixed(2)} MB ({userUsagePercent}%)
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-300 ${userUsagePercent > 80 ? 'bg-red-600' : 'bg-blue-600'
                                                }`}
                                            style={{ width: `${userUsagePercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <select
                    value={filterOwner}
                    onChange={(e) => setFilterOwner(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by owner"
                >
                    {availableOwners.map((owner) => (
                        <option key={owner} value={owner}>
                            {owner}
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <BarChart2 className="w-5 h-5 mr-2" />
                        Storage Usage by User
                    </h3>
                    <div className="h-64">
                        <Bar data={storageUsageData} options={barChartOptions} />
                    </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <PieChart className="w-5 h-5 mr-2" />
                        File Type Distribution
                    </h3>
                    <div className="h-64 flex justify-center">
                        <Pie data={fileTypeData} options={pieChartOptions} />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-slide-in">
                    <select
                        onChange={(e) => handleBulkAction('updateStatus', e.target.value)}
                        className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                        aria-label="Update status of selected files"
                        disabled={isLoading}
                    >
                        <option value="">Update Status</option>
                        <option value="Public">Public</option>
                        <option value="Private">Private</option>
                    </select>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Delete selected files"
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

            {/* File Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.length === paginatedFiles.length && paginatedFiles.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all files"
                                />
                            </th>
                            {['fileName', 'owner', 'size', 'uploadDate', 'status'].map((key) => (
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
                        {paginatedFiles.map((file) => (
                            <tr
                                key={file.id}
                                className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file.id)}
                                        onChange={() => handleSelectFile(file.id)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label={`Select ${file.fileName}`}
                                    />
                                </td>
                                <td className="p-3 text-gray-700">{file.fileName}</td>
                                <td className="p-3 text-gray-700">{file.owner}</td>
                                <td className="p-3 text-gray-700">{(file.size / 1024).toFixed(2)} MB</td>
                                <td className="p-3 text-gray-700">{file.uploadDate}</td>
                                <td className="p-3 text-gray-700">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${file.status === 'Public' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        {file.status}
                                    </span>
                                </td>
                                <td className="p-3 flex space-x-2">
                                    <button
                                        onClick={() => handleView(file)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`View ${file.fileName}`}
                                        disabled={isLoading}
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleUpdate(file)}
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                        aria-label={`Update ${file.fileName}`}
                                        disabled={isLoading}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                        aria-label={`Delete ${file.fileName}`}
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
                    Showing {(currentPage - 1) * filesPerPage + 1} to{' '}
                    {Math.min(currentPage * filesPerPage, filteredFiles.length)} of {filteredFiles.length}{' '}
                    files
                </p>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-colors duration-300"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-colors duration-300"
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

export default AdminFileStorage;