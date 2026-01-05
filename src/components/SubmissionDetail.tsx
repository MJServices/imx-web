'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Phone, Mail, Calendar, Car, FileText, Image } from 'lucide-react';

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
}

interface QuestionnaireAnswer {
  question_id: string;
  question_text: string;
  selected_answer: string;
}

interface Photo {
  id: string;
  photo_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  url: string;
}

interface SubmissionDetailProps {
  submission: Submission;
  onBack: () => void;
}

export default function SubmissionDetail({ submission, onBack }: SubmissionDetailProps) {
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubmissionDetails();
  }, [submission.submission_id]);

  const loadSubmissionDetails = async () => {
    setIsLoading(true);
    try {
      // Load questionnaire answers
      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('vehicle_questionnaire')
        .select('*')
        .eq('submission_id', submission.submission_id)
        .order('question_id');

      if (!questionnaireError && questionnaireData) {
        setQuestionnaireAnswers(questionnaireData);
      }

      // Load photos
      const { data: photosData, error: photosError } = await supabase
        .from('intake_photos')
        .select('*')
        .eq('submission_id', submission.submission_id)
        .order('uploaded_at');

      if (!photosError && photosData) {
        const photosWithUrls = photosData.map(photo => {
          const { data: urlData } = supabase.storage
            .from('intake-photos')
            .getPublicUrl(photo.file_path);

          return {
            id: photo.id,
            photo_type: photo.photo_type,
            file_name: photo.file_name,
            file_path: photo.file_path,
            file_size: photo.file_size || 0,
            url: urlData.publicUrl
          };
        });

        setPhotos(photosWithUrls);
      }
    } catch (error) {
      console.error('Error loading submission details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleDownloadPhoto = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSubmission = () => {
    const submissionData = {
      'Submission Details': {
        'ID': submission.submission_id,
        'Customer Name': `${submission.first_name} ${submission.last_name}`,
        'Phone Number': submission.phone_number,
        'Vehicle': `${submission.vehicle_year} ${submission.make} ${submission.model}`,
        'Ownership': submission.ownership,
        'Status': submission.status,
        'Created': formatDate(submission.created_at),
        'Updated': formatDate(submission.updated_at)
      },
      'Questionnaire Answers': questionnaireAnswers.reduce((acc, answer) => {
        acc[answer.question_text] = answer.selected_answer;
        return acc;
      }, {} as Record<string, string>),
      'Photos': photos.map(photo => ({
        'Type': photo.photo_type,
        'File Name': photo.file_name,
        'Size': formatFileSize(photo.file_size),
        'URL': photo.url
      }))
    };

    const jsonContent = JSON.stringify(submissionData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-${submission.submission_id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imx-red mx-auto"></div>
          <p className="mt-2 text-imx-gray-600">Loading submission details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </Button>
          <Button
            onClick={handleExportSubmission}
            className="bg-imx-red text-white hover:bg-red-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Submission
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-2xl font-bold text-imx-black mb-2">
              {submission.first_name} {submission.last_name}
            </h1>
            <p className="text-imx-gray-600 mb-4">Submission ID: {submission.submission_id}</p>
            <div className="flex items-center space-x-4">
              {getStatusBadge(submission.status)}
              <span className="text-sm text-imx-gray-500">
                Created {formatDate(submission.created_at)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-imx-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              {submission.phone_number}
            </div>
            <div className="flex items-center text-imx-gray-600">
              <Car className="w-4 h-4 mr-2" />
              {submission.vehicle_year} {submission.make} {submission.model}
            </div>
            <div className="flex items-center text-imx-gray-600">
              <FileText className="w-4 h-4 mr-2" />
              {submission.ownership}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
        <h2 className="text-lg font-semibold text-imx-black mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-imx-gray-600">First Name</label>
            <p className="text-imx-black">{submission.first_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-imx-gray-600">Last Name</label>
            <p className="text-imx-black">{submission.last_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-imx-gray-600">Phone Number</label>
            <p className="text-imx-black">{submission.phone_number}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
        <h2 className="text-lg font-semibold text-imx-black mb-4">Vehicle Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-imx-gray-600">Year</label>
            <p className="text-imx-black">{submission.vehicle_year}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-imx-gray-600">Make</label>
            <p className="text-imx-black">{submission.make}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-imx-gray-600">Model</label>
            <p className="text-imx-black">{submission.model}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-imx-gray-600">Ownership</label>
            <p className="text-imx-black">{submission.ownership}</p>
          </div>
        </div>
      </div>

      {/* Questionnaire Answers */}
      <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
        <h2 className="text-lg font-semibold text-imx-black mb-4">
          Questionnaire Answers
          {questionnaireAnswers.length > 0 && (
            <Badge className="ml-2 bg-green-100 text-green-800">
              {questionnaireAnswers.length} Completed
            </Badge>
          )}
        </h2>
        {questionnaireAnswers.length === 0 ? (
          <p className="text-imx-gray-500">No questionnaire answers available.</p>
        ) : (
          <div className="space-y-4">
            {questionnaireAnswers.map((answer, index) => (
              <div key={answer.question_id} className="border-b border-imx-gray-100 pb-4 last:border-b-0">
                <p className="text-sm font-medium text-imx-gray-600 mb-1">
                  Q{index + 1}: {answer.question_text}
                </p>
                <p className="text-imx-black">{answer.selected_answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
        <h2 className="text-lg font-semibold text-imx-black mb-4">
          Photo Gallery
          {photos.length > 0 && (
            <Badge className="ml-2 bg-blue-100 text-blue-800">
              {photos.length} Photos
            </Badge>
          )}
        </h2>
        {photos.length === 0 ? (
          <p className="text-imx-gray-500">No photos uploaded.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="border border-imx-gray-200 rounded-lg overflow-hidden">
                <div className="aspect-video bg-imx-gray-100 flex items-center justify-center">
                  <img
                    src={photo.url}
                    alt={photo.photo_type}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden flex-col items-center text-imx-gray-400">
                    <Image className="w-8 h-8 mb-2" />
                    <span className="text-sm">Image not available</span>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-imx-black capitalize mb-1">
                    {photo.photo_type.replace('_', ' ')}
                  </h4>
                  <p className="text-xs text-imx-gray-500 mb-2">
                    {formatFileSize(photo.file_size)}
                  </p>
                  <Button
                    onClick={() => handleDownloadPhoto(photo)}
                    variant="outline"
                    size="sm"
                    className="w-full border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}