'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X, Upload, FileImage, File } from 'lucide-react';

interface PhotoUploadProps {
  submissionId: string;
  photoType: 'profile' | 'document';
  title: string;
  description: string;
  acceptedTypes: string;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
}

interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export default function PhotoUpload({
  submissionId,
  photoType,
  title,
  description,
  acceptedTypes,
  maxFiles = 5,
  onUploadComplete
}: PhotoUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!submissionId) {
      alert('Please complete the previous steps first');
      return;
    }

    setUploading(true);
    const newUploadedFiles: UploadedFile[] = [];

    for (const file of acceptedFiles) {
      try {
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${submissionId}_${photoType}_${Date.now()}.${fileExt}`;
        const filePath = `${submissionId}/${fileName}`;

        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('intake-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          if (uploadError.message.includes('Bucket not found')) {
            alert(`Storage bucket not found. Please create the "intake-photos" bucket in your Supabase dashboard first.`);
          } else {
            alert(`Failed to upload ${file.name}: ${uploadError.message}`);
          }
          continue;
        }

        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('intake-photos')
          .getPublicUrl(filePath);

        // Save file info to database
        const { data: dbData, error: dbError } = await supabase
          .from('intake_photos')
          .insert({
            submission_id: submissionId,
            photo_type: photoType,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          // Clean up uploaded file if database insert fails
          await supabase.storage.from('intake-photos').remove([filePath]);
          alert(`Failed to save ${file.name} info: ${dbError.message}`);
          continue;
        }

        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        const uploadedFile: UploadedFile = {
          id: dbData.id,
          fileName: file.name,
          filePath: filePath,
          fileSize: file.size,
          mimeType: file.type,
          url: urlData.publicUrl
        };

        newUploadedFiles.push(uploadedFile);

      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    setUploading(false);
    setUploadProgress({});

    if (onUploadComplete && newUploadedFiles.length > 0) {
      onUploadComplete(newUploadedFiles);
    }
  }, [submissionId, photoType, onUploadComplete]);

  const removeFile = async (fileId: string, filePath: string) => {
    try {
      // Remove from storage
      await supabase.storage.from('intake-photos').remove([filePath]);
      
      // Remove from database
      await supabase.from('intake_photos').delete().eq('id', fileId);
      
      // Remove from state
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error removing file:', error);
      alert('Failed to remove file');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: photoType === 'profile' 
      ? { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }
      : { 
          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
    maxFiles: maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {title}
        </label>
        
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : uploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="text-gray-500">
            {photoType === 'profile' ? (
              <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            ) : (
              <File className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            )}
            
            {uploading ? (
              <div>
                <Upload className="animate-spin mx-auto h-6 w-6 text-blue-500 mb-2" />
                <p className="text-sm">Uploading files...</p>
              </div>
            ) : isDragActive ? (
              <p className="text-sm">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-sm mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate">{fileName}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                {file.mimeType.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.fileName}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <File className="w-10 h-10 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id, file.filePath)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}