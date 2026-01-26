"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubmissionId } from "@/hooks/useSubmissionId";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import VehiclePhotoUpload from "@/components/VehiclePhotoUpload";
import Header from "@/components/Header";

interface UploadedPhotoData {
  id?: string;
  photoType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  url: string;
}

interface VehiclePhotoType {
  id: string;
  title: string;
  description: string;
  exampleImage?: string;
  required: boolean;
}

const vehiclePhotoTypes: VehiclePhotoType[] = [
  {
    id: "front_view",
    title: "Front View",
    description: "Clear front view of the entire vehicle",
    exampleImage: "/cars pic/Front View.jpeg",
    required: true,
  },
  {
    id: "exterior_rear_view",
    title: "Exterior Rear View",
    description: "Clear rear view showing license plate area",
    exampleImage: "/cars pic/Exterior_Rear_View.jpeg",
    required: true,
  },
  {
    id: "exterior_left_door_panel",
    title: "Exterior Left Door Panel",
    description: "Full side view from driver's side",
    exampleImage: "/cars pic/Exterior_Left_Door_Panel.jpeg",
    required: true,
  },
  {
    id: "exterior_trunk_cargo_area",
    title: "Exterior Trunk Cargo Area",
    description: "View of the trunk or cargo space",
    exampleImage: "/cars pic/Exterior_Trunk_Cargo_Area.jpeg",
    required: true,
  },
  {
    id: "interior_front_seats",
    title: "Interior - Front Seats",
    description: "Dashboard, front seats, and steering wheel",
    exampleImage: "/cars pic/Interior - Front Seats.jpeg",
    required: true,
  },
  {
    id: "interior_driver_side_dashboard",
    title: "Interior Driver Side Dashboard",
    description: "Close up of the dashboard from driver side",
    exampleImage: "/cars pic/Interior_Driver_Side_Dashboard.jpeg",
    required: true,
  },
  {
    id: "interior_rear_door_open_view",
    title: "Interior Rear Door Open View",
    description: "View with rear door open",
    exampleImage: "/cars pic/Interior_Rear_Door_Open_View.jpeg",
    required: true,
  },
  {
    id: "interior_rear_seat_area",
    title: "Interior Rear Seat Area",
    description: "Rear seating area and space",
    exampleImage: "/cars pic/Interior_Rear_Seat_Area.jpeg",
    required: true,
  },
  {
    id: "odometer_reading",
    title: "Odometer Reading",
    description: "Clear photo of current mileage display",
    exampleImage: "/cars pic/Odometer Reading.jpeg",
    required: true,
  },
  {
    id: "engine_compartment",
    title: "Engine Compartment",
    description: "Open hood showing engine compartment",
    exampleImage: "/cars pic/Engine_Compartment.jpeg",
    required: true,
  },
  {
    id: "wheels_tires",
    title: "Wheels & Tires",
    description: "Close-up of wheels and tire condition",
    exampleImage: "/cars pic/Wheels & Tires.jpeg",
    required: true,
  },
];

export default function IntakePhotos() {
  const [uploadedPhotos, setUploadedPhotos] = useState<
    Record<string, UploadedPhotoData>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { submissionId } = useSubmissionId();

  // Load existing photos on page load
  useEffect(() => {
    const loadExistingPhotos = async () => {
      if (!submissionId) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("intake_photos")
          .select("*")
          .eq("submission_id", submissionId)
          .order("uploaded_at", { ascending: true });

        if (data && !error) {
          const photosMap: Record<string, UploadedPhotoData> = {};

          data.forEach((photo) => {
            const { data: urlData } = supabase.storage
              .from("intake-photos")
              .getPublicUrl(photo.file_path);

            photosMap[photo.photo_type] = {
              id: photo.id,
              photoType: photo.photo_type,
              fileName: photo.file_name,
              filePath: photo.file_path,
              fileSize: photo.file_size || 0,
              url: urlData.publicUrl,
            };
          });

          setUploadedPhotos(photosMap);
        }
      } catch (error) {
        console.error("Error loading photos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingPhotos();
  }, [submissionId]);

  const handlePhotoUpload = (photoData: UploadedPhotoData) => {
    setUploadedPhotos((prev) => ({
      ...prev,
      [photoData.photoType]: photoData,
    }));
  };

  const getRequiredPhotosCount = () => {
    return vehiclePhotoTypes.filter((type) => type.required).length;
  };

  const getUploadedRequiredPhotosCount = () => {
    return vehiclePhotoTypes.filter(
      (type) => type.required && uploadedPhotos[type.id],
    ).length;
  };

  const isAllRequiredPhotosUploaded = () => {
    return vehiclePhotoTypes.every(
      (type) => !type.required || uploadedPhotos[type.id],
    );
  };

  const handleCompleteIntake = async () => {
    if (!submissionId) return;

    setIsSubmitting(true);
    try {
      // Update the intake form status to completed
      const { error } = await supabase
        .from("intake_forms")
        .update({
          updated_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("submission_id", submissionId);

      if (error) {
        console.error("Error completing intake:", error);
        alert("Error completing intake. Please try again.");
        return;
      }

      // Clear the submission ID from localStorage
      localStorage.removeItem("intake_submission_id");

      // Show success message and redirect
      alert(
        "Vehicle intake completed successfully! Thank you for providing all the required information and photos.",
      );
      router.push("/");
    } catch (error) {
      console.error("Error completing intake:", error);
      alert("Error completing intake. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-imx-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imx-red mx-auto"></div>
            <p className="mt-4 text-imx-gray-600">
              Loading photo requirements...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-imx-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-imx-gray-700">
                Step 3 of 3
              </span>
              <span className="text-sm text-imx-gray-500">Vehicle Photos</span>
            </div>
            <div className="w-full bg-imx-gray-200 rounded-full h-2">
              <div className="bg-imx-red h-2 rounded-full w-full"></div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-imx-black mb-2">
              Vehicle Photo Documentation
            </h1>
            <p className="text-imx-gray-600">
              Please upload clear photos of your vehicle from all required
              angles. Photos will be automatically compressed for optimal
              storage.
            </p>
          </div>

          {/* Progress Summary */}
          <div className="mb-8 p-4 bg-imx-gray-50 border border-imx-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-imx-black mb-1">
                  Upload Progress
                </h3>
                <p className="text-sm text-imx-gray-600">
                  {getUploadedRequiredPhotosCount()} of{" "}
                  {getRequiredPhotosCount()} required photos uploaded
                </p>
              </div>
              <div className="w-32 bg-imx-gray-200 rounded-full h-3">
                <div
                  className="bg-imx-red h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(getUploadedRequiredPhotosCount() / getRequiredPhotosCount()) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Photo Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {vehiclePhotoTypes.map((photoType) => (
              <VehiclePhotoUpload
                key={photoType.id}
                submissionId={submissionId}
                photoType={photoType.id}
                title={photoType.title}
                description={photoType.description}
                exampleImage={photoType.exampleImage}
                onUploadComplete={handlePhotoUpload}
                existingPhoto={uploadedPhotos[photoType.id] || null}
              />
            ))}
          </div>

          {/* Instructions */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Photo Guidelines
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Take photos in good lighting conditions</li>
              <li>• Ensure the entire vehicle/area is visible in the frame</li>
              <li>
                • Photos will be automatically compressed to optimize file size
              </li>
              <li>• You can retake any photo if needed</li>
              <li>
                • All {getRequiredPhotosCount()} photos are required to complete
                the intake
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-imx-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/intake/questionnaire")}
              className="border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
            >
              Back to Questionnaire
            </Button>

            <div className="flex items-center space-x-4">
              {!isAllRequiredPhotosUploaded() && (
                <span className="text-sm text-imx-gray-500">
                  Upload all required photos to complete intake
                </span>
              )}
              <Button
                onClick={handleCompleteIntake}
                disabled={!isAllRequiredPhotosUploaded() || isSubmitting}
                className="bg-imx-red text-white hover:bg-red-700 disabled:bg-imx-gray-300"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing Intake...
                  </div>
                ) : (
                  "Complete Vehicle Intake"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
