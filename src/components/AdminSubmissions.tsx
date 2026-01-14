'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import SubmissionDetailView from '@/components/SubmissionDetailView';
import { Eye, Download, Filter, Search, Calendar } from 'lucide-react';

interface Submission {
  submission_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  vehicle_year: string;
  make: string;
  model: string;
  ownership: string;
  status: string;
  created_at: string;
  updated_at: string;
  photos_count: number;
  questionnaire_completed: boolean;
  current_mileage?: string;
  comments?: string;
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [makeFilter, setMakeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Load submissions on component mount
  useEffect(() => {
    loadSubmissions();
  }, []);

  // Apply filters when filter states change
  useEffect(() => {
    applyFilters();
  }, [submissions, searchTerm, statusFilter, makeFilter, dateFilter]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      // Get all submissions with related data
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('intake_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error loading submissions:', submissionsError);
        return;
      }

      // Get photo counts for each submission
      const { data: photosData, error: photosError } = await supabase
        .from('intake_photos')
        .select('submission_id, id');

      const photoCounts: Record<string, number> = {};
      if (photosData && !photosError) {
        photosData.forEach(photo => {
          photoCounts[photo.submission_id] = (photoCounts[photo.submission_id] || 0) + 1;
        });
      }

      // Get questionnaire completion status
      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('vehicle_questionnaire')
        .select('submission_id');

      const questionnaireCompleted = new Set();
      if (questionnaireData && !questionnaireError) {
        questionnaireData.forEach(q => questionnaireCompleted.add(q.submission_id));
      }

      // Combine data
      const enrichedSubmissions: Submission[] = submissionsData.map(submission => ({
        ...submission,
        photos_count: photoCounts[submission.submission_id] || 0,
        questionnaire_completed: questionnaireCompleted.has(submission.submission_id),
        status: submission.status || 'in_progress',
        current_mileage: submission.current_mileage,
        comments: submission.comments
      }));

      setSubmissions(enrichedSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        `${submission.first_name} ${submission.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.phone_number.includes(searchTerm) ||
        submission.submission_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    // Make filter
    if (makeFilter !== 'all') {
      filtered = filtered.filter(submission => submission.make === makeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (dateFilter !== 'all') {
        filtered = filtered.filter(submission =>
          new Date(submission.created_at) >= filterDate
        );
      }
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUniqueValues = (key: keyof Submission) => {
    return [...new Set(submissions.map(s => s[key]).filter(Boolean))];
  };

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const handleExportData = () => {
    // Create CSV data
    const csvData = filteredSubmissions.map(submission => ({
      'Submission ID': submission.submission_id,
      'Customer Name': `${submission.first_name} ${submission.last_name}`,
      'Phone': submission.phone_number,
      'Vehicle': `${submission.vehicle_year} ${submission.make} ${submission.model}`,
      'Ownership': submission.ownership,
      'Status': submission.status,
      'Photos': submission.photos_count,
      'Questionnaire': submission.questionnaire_completed ? 'Yes' : 'No',
      'Created': formatDate(submission.created_at)
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (selectedSubmission) {
    return (
      <SubmissionDetailView
        submission={selectedSubmission}
        onBack={() => setSelectedSubmission(null)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-imx-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-imx-black">Vehicle Submissions</h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              onClick={handleExportData}
              className="bg-imx-red text-white hover:bg-red-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-imx-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, phone, or submission ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-imx-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-imx-gray-700 mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-imx-gray-700 mb-2">Vehicle Make</label>
              <Select value={makeFilter} onValueChange={setMakeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Makes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Makes</SelectItem>
                  {getUniqueValues('make').map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-imx-gray-700 mb-2">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imx-red mx-auto"></div>
            <p className="mt-2 text-imx-gray-600">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-imx-gray-600">No submissions found matching your criteria.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-imx-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-imx-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-imx-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-imx-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-imx-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-imx-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-imx-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-imx-gray-200">
              {filteredSubmissions.map((submission) => (
                <tr key={submission.submission_id} className="hover:bg-imx-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-imx-black">
                        {submission.first_name} {submission.last_name}
                      </div>
                      <div className="text-sm text-imx-gray-500">{submission.phone_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-imx-black">
                      {submission.vehicle_year} {submission.make} {submission.model}
                    </div>
                    <div className="text-sm text-imx-gray-500">{submission.ownership}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-imx-gray-500">
                    {formatDate(submission.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(submission.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-imx-gray-500">
                    <div className="flex items-center space-x-2">
                      <span>{submission.photos_count} photos</span>
                      <span>•</span>
                      <span>{submission.questionnaire_completed ? 'Q✓' : 'Q✗'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmission(submission)}
                      className="border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!isLoading && (
        <div className="px-6 py-3 bg-imx-gray-50 border-t border-imx-gray-200">
          <p className="text-sm text-imx-gray-600">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </p>
        </div>
      )}
    </div>
  );
}