'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Check } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface VehiclePhotoUploadProps {
  submissionId: string;
  photoType: string;
  title: string;
  description: string;
  exampleImage?: string;
  onUploadComplete?: (photoData: UploadedPhotoData) => void;
  existingPhoto?: UploadedPhotoData | null;
}

interface UploadedPhotoData {
  id?: string;
  photoType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  url: string;
}

export default function VehiclePhotoUpload({
  submissionId,
  photoType,
  title,
  description,
  exampleImage,
  onUploadComplete,
  existingPhoto
}: VehiclePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadedPhotoData | null>(existingPhoto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true,
      fileType: 'image/jpeg' as const,
      quality: 0.8 // Image quality (0.1 to 1)
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file; // Return original file if compression fails
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!submissionId) {
      alert('Please complete the previous steps first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress the image
      setUploadProgress(20);
      const compressedFile = await compressImage(file);
      
      // Create standardized filename
      const fileExtension = 'jpg'; // Always use jpg after compression
      const fileName = `${photoType}.${fileExtension}`;
      const filePath = `submissions/${submissionId}/${fileName}`;

      setUploadProgress(40);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('intake-photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('Bucket not found')) {
          alert('Storage bucket not found. Please create the "intake-photos" bucket in your Supabase dashboard first.');
        } else {
          alert(`Failed to upload ${title}: ${uploadError.message}`);
        }
        return;
      }

      setUploadProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('intake-photos')
        .getPublicUrl(filePath);

      // Save file info to database
      const { data: dbData, error: dbError } = await supabase
        .from('intake_photos')
        .upsert({
          submission_id: submissionId,
          photo_type: photoType,
          file_name: fileName,
          file_path: filePath,
          file_size: compressedFile.size,
          mime_type: compressedFile.type
        }, {
          onConflict: 'submission_id,photo_type'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('intake-photos').remove([filePath]);
        alert(`Failed to save ${title} info: ${dbError.message}`);
        return;
      }

      setUploadProgress(100);

      const photoData: UploadedPhotoData = {
        id: dbData.id,
        photoType: photoType,
        fileName: fileName,
        filePath: filePath,
        fileSize: compressedFile.size,
        url: urlData.publicUrl
      };

      setUploadedPhoto(photoData);

      if (onUploadComplete) {
        onUploadComplete(photoData);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload ${title}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      handleFileSelect(file);
    }
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleUploadPhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = async () => {
    if (!uploadedPhoto) return;

    try {
      // Remove from storage
      await supabase.storage.from('intake-photos').remove([uploadedPhoto.filePath]);
      
      // Remove from database
      await supabase.from('intake_photos')
        .delete()
        .eq('submission_id', submissionId)
        .eq('photo_type', photoType);
      
      setUploadedPhoto(null);
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Failed to remove photo');
    }
  };

  return (
    <div className="border border-imx-gray-200 rounded-lg p-4 bg-white">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-imx-black">{title}</h3>
        {uploadedPhoto && (
          <div className="flex items-center text-green-600">
            <Check className="w-4 h-4 mr-1" />
            <span className="text-xs">Uploaded</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-imx-gray-600 mb-4">{description}</p>

      {/* Example Image (if provided) */}
      {exampleImage && (
        <div className="mb-4">
          <img
            src={exampleImage}
            alt={`${title} example`}
            className="w-full h-24 object-cover rounded-md border border-imx-gray-200"
          />
          <p className="text-xs text-imx-gray-500 mt-1">Example reference</p>
        </div>
      )}

      {/* Upload Area */}
      {!uploadedPhoto ? (
        <div className="space-y-3">
          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-imx-gray-600">Uploading...</span>
                <span className="text-imx-red">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-imx-gray-200 rounded-full h-2">
                <div
                  className="bg-imx-red h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTakePhoto}
              disabled={isUploading}
              className="flex items-center justify-center space-x-2 border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
            >
              <Camera className="w-4 h-4" />
              <span className="text-xs">Take Photo</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleUploadPhoto}
              disabled={isUploading}
              className="flex items-center justify-center space-x-2 border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
            >
              <Upload className="w-4 h-4" />
              <span className="text-xs">Upload</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Preview */
        <div className="space-y-3">
          <div className="relative">
            <img
              src={uploadedPhoto.url}
              alt={title}
              className="w-full h-32 object-cover rounded-md border border-imx-gray-200"
            />
            <button
              onClick={handleRemovePhoto}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <div className="text-xs text-imx-gray-500">
            <p>Size: {(uploadedPhoto.fileSize / 1024).toFixed(1)} KB</p>
          </div>

          {/* Replace Photo Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadPhoto}
            className="w-full text-xs border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
          >
            Replace Photo
          </Button>
        </div>
      )}
    </div>
  );
}