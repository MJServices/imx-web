'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Phone, Mail, Calendar, Car, FileText, Camera, User } from 'lucide-react';

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
  current_mileage?: string;
  comments?: string;
  vin_number?: string;
  created_at: string;
  updated_at: string;
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

interface SubmissionDetailViewProps {
  submission: Submission;
  onBack: () => void;
}

export default function SubmissionDetailView({ submission, onBack }: SubmissionDetailViewProps) {
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

      if (questionnaireData && !questionnaireError) {
        setQuestionnaireAnswers(questionnaireData);
      }

      // Load photos
      const { data: photosData, error: photosError } = await supabase
        .from('intake_photos')
        .select('*')
        .eq('submission_id', submission.submission_id)
        .order('uploaded_at');

      if (photosData && !photosError) {
        const photosWithUrls = photosData.map(photo => {
          const { data: urlData } = supabase.storage
            .from('intake-photos')
            .getPublicUrl(photo.file_path);

          return {
            ...photo,
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPhoto = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.file_name;
    link.target = '_blank';
    link.click();
  };

  const handleExportSubmission = () => {
    const exportData = {
      submission: {
        id: submission.submission_id,
        customer: {
          name: `${submission.first_name} ${submission.last_name}`,
          phone: submission.phone_number
        },
        vehicle: {
          year: submission.vehicle_year,
          make: submission.make,
          model: submission.model,
          ownership: submission.ownership,
          vin: submission.vin_number,
          mileage: submission.current_mileage,
          comments: submission.comments
        },
        status: submission.status,
        dates: {
          created: submission.created_at,
          updated: submission.updated_at
        }
      },
      questionnaire: questionnaireAnswers.map(qa => ({
        question: qa.question_text,
        answer: qa.selected_answer
      })),
      photos: photos.map(photo => ({
        type: photo.photo_type,
        filename: photo.file_name,
        size: photo.file_size
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission_${submission.submission_id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imx-red"></div>
          <span className="ml-3 text-imx-gray-600">Loading submission details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack} className="border-imx-gray-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-imx-black">
                {submission.first_name} {submission.last_name}
              </h1>
              <p className="text-imx-gray-600">Submission ID: {submission.submission_id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(submission.status)}
            <Button onClick={handleExportSubmission} className="bg-imx-red text-white hover:bg-red-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-imx-red" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-imx-gray-600">First Name</label>
                <p className="text-imx-black">{submission.first_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-imx-gray-600">Last Name</label>
                <p className="text-imx-black">{submission.last_name}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-imx-gray-600">Phone Number</label>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-imx-gray-400" />
                <p className="text-imx-black">{submission.phone_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-imx-gray-600">Created</label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-imx-gray-400" />
                  <p className="text-imx-black text-sm">{formatDate(submission.created_at)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-imx-gray-600">Last Updated</label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-imx-gray-400" />
                  <p className="text-imx-black text-sm">{formatDate(submission.updated_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="w-5 h-5 mr-2 text-imx-red" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-imx-gray-600">Year</label>
                <p className="text-imx-black">{submission.vehicle_year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-imx-gray-600">Make</label>
                <p className="text-imx-black">{submission.make}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-imx-gray-600">Model</label>
                <p className="text-imx-black">{submission.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-imx-gray-600">Ownership</label>
                <p className="text-imx-black">{submission.ownership}</p>
              </div>
            </div>
            {submission.vin_number && (
              <div>
                <label className="text-sm font-medium text-imx-gray-600">VIN</label>
                <p className="text-imx-black font-mono">{submission.vin_number}</p>
              </div>
            )}
            {submission.current_mileage && (
              <div>
                <label className="text-sm font-medium text-imx-gray-600">Current Mileage</label>
                <p className="text-imx-black font-semibold">{submission.current_mileage}</p>
              </div>
            )}
            <div className="p-4 bg-imx-gray-50 rounded-lg">
              <p className="text-lg font-medium text-imx-black">
                {submission.vehicle_year} {submission.make} {submission.model}
              </p>
              <p className="text-sm text-imx-gray-600">{submission.ownership}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments */}
      {submission.comments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-imx-red" />
              Additional Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-imx-gray-50 rounded-lg">
              <p className="text-imx-black whitespace-pre-wrap">{submission.comments}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questionnaire Answers */}
      {questionnaireAnswers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-imx-red" />
              Questionnaire Answers ({questionnaireAnswers.length} questions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questionnaireAnswers.map((qa, index) => (
                <div key={qa.question_id} className="border-l-4 border-imx-red pl-4">
                  <p className="text-sm font-medium text-imx-gray-600 mb-1">
                    Q{index + 1}: {qa.question_text}
                  </p>
                  <p className="text-imx-black">{qa.selected_answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2 text-imx-red" />
              Photo Gallery ({photos.length} photos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="border border-imx-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-imx-gray-100 flex items-center justify-center">
                    {photo.photo_type === 'profile' || photo.file_name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img
                        src={photo.url}
                        alt={photo.photo_type}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-imx-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-imx-gray-600">Document</p>
                      </div>
                    )}
                    <div className="hidden text-center">
                      <FileText className="w-8 h-8 text-imx-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-imx-gray-600">File</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-imx-black capitalize">
                      {photo.photo_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-imx-gray-500">
                      {(photo.file_size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPhoto(photo)}
                      className="w-full mt-2 text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {questionnaireAnswers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 text-imx-gray-300 mx-auto mb-4" />
            <p className="text-imx-gray-600">No questionnaire answers found</p>
          </CardContent>
        </Card>
      )}

      {photos.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Camera className="w-12 h-12 text-imx-gray-300 mx-auto mb-4" />
            <p className="text-imx-gray-600">No photos uploaded</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}