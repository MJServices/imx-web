'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { supabase, type IntakeFormData } from '@/lib/supabase';
import { personalInfoSchema, vehicleInfoSchema, type PersonalInfoFormData, type VehicleInfoFormData } from '@/lib/validations';
import { useSubmissionId } from '@/hooks/useSubmissionId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Header from '@/components/Header';

export default function IntakeQuestions() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { submissionId } = useSubmissionId();

  const vehicleYears = Array.from({ length: 30 }, (_, i) => (2024 - i).toString());
  
  const vehicleMakes = [
    'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 
    'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 
    'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 
    'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
  ];

  const vehicleModels: Record<string, string[]> = {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Tacoma', 'Tundra', '4Runner', 'Sienna', 'Avalon'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'HR-V', 'Passport', 'Insight'],
    'Ford': ['F-150', 'Escape', 'Explorer', 'Mustang', 'Focus', 'Edge', 'Expedition', 'Ranger', 'Bronco'],
    'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Camaro', 'Tahoe', 'Suburban', 'Colorado', 'Blazer'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'X1', '7 Series', 'X7', '4 Series', 'Z4'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class', 'S-Class', 'GLS', 'CLA', 'GLB'],
    'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A3', 'Q3', 'Q8', 'A8', 'e-tron'],
    'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Frontier', 'Titan', 'Murano', 'Armada', 'Leaf'],
    'Acura': ['TLX', 'MDX', 'RDX', 'ILX', 'NSX', 'TLX Type S'],
    'Buick': ['Encore', 'Envision', 'Enclave', 'Regal'],
    'Cadillac': ['Escalade', 'XT5', 'CT5', 'XT6', 'CT4'],
    'Chrysler': ['Pacifica', '300', 'Voyager'],
    'Dodge': ['Charger', 'Challenger', 'Durango', 'Journey'],
    'GMC': ['Sierra', 'Terrain', 'Acadia', 'Yukon', 'Canyon'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona'],
    'Infiniti': ['Q50', 'QX60', 'QX80', 'Q60', 'QX50'],
    'Jeep': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator'],
    'Kia': ['Forte', 'Optima', 'Sorento', 'Sportage', 'Telluride', 'Soul'],
    'Lexus': ['ES', 'RX', 'NX', 'GX', 'LX', 'IS', 'LS'],
    'Lincoln': ['Navigator', 'Aviator', 'Corsair', 'Nautilus'],
    'Mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'CX-30', 'MX-5 Miata'],
    'Mitsubishi': ['Outlander', 'Eclipse Cross', 'Mirage', 'Outlander Sport'],
    'Ram': ['1500', '2500', '3500', 'ProMaster'],
    'Subaru': ['Outback', 'Forester', 'Impreza', 'Legacy', 'Ascent', 'Crosstrek'],
    'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
    'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'ID.4'],
    'Volvo': ['XC90', 'XC60', 'S60', 'V60', 'XC40', 'S90']
  };

  const ownershipOptions = ['Leased', 'Financed', 'Paid Off'];

  // Personal Info Form
  const personalForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: ''
    }
  });

  // Vehicle Info Form
  const vehicleForm = useForm<VehicleInfoFormData>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: {
      vehicleYear: '',
      make: '',
      model: '',
      ownership: ''
    }
  });

  // Watch the make field to update models (after form initialization)
  const selectedMake = vehicleForm.watch('make');
  const availableModels = selectedMake ? vehicleModels[selectedMake] || [] : [];

  // Load existing data on page load
  useEffect(() => {
    const loadExistingData = async () => {
      if (!submissionId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('intake_forms')
          .select('*')
          .eq('submission_id', submissionId)
          .single();

        if (data && !error) {
          // Prefill forms with existing data
          personalForm.reset({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phoneNumber: data.phone_number || ''
          });

          vehicleForm.reset({
            vehicleYear: data.vehicle_year || '',
            make: data.make || '',
            model: data.model || '',
            ownership: data.ownership || ''
          });
        }
      } catch (error) {
        console.error('Error loading existing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [submissionId, personalForm, vehicleForm]);

  // Save data to Supabase instantly on change
  const saveToSupabase = async (data: Partial<IntakeFormData>) => {
    if (!submissionId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('intake_forms')
        .upsert({
          submission_id: submissionId,
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'submission_id'
        });

      if (error) {
        console.error('Error saving to Supabase:', error);
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle personal info changes
  const handlePersonalInfoChange = (field: keyof PersonalInfoFormData, value: string) => {
    personalForm.setValue(field, value);
    
    // Save to Supabase instantly
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      phoneNumber: 'phone_number'
    };
    
    saveToSupabase({
      [fieldMap[field]]: value
    });
  };

  // Handle vehicle info changes
  const handleVehicleInfoChange = (field: keyof VehicleInfoFormData, value: string) => {
    vehicleForm.setValue(field, value);
    
    // Reset model if make changes
    if (field === 'make') {
      vehicleForm.setValue('model', '');
      vehicleForm.clearErrors('model'); // Clear any validation errors
    }
    
    // Save to Supabase instantly
    const fieldMap = {
      vehicleYear: 'vehicle_year',
      make: 'make',
      model: 'model',
      ownership: 'ownership'
    };
    
    const updateData: Partial<IntakeFormData> = {
      [fieldMap[field]]: value
    };
    
    // Clear model in database if make changes
    if (field === 'make') {
      updateData.model = '';
    }
    
    saveToSupabase(updateData);
  };

  // Check if current step is valid
  const isStepValid = () => {
    if (currentStep === 1) {
      return personalForm.formState.isValid;
    } else {
      return vehicleForm.formState.isValid;
    }
  };

  const nextStep = () => {
    if (currentStep < 2 && isStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (isStepValid()) {
      router.push('/intake/questionnaire');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-imx-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imx-red mx-auto"></div>
            <p className="mt-4 text-imx-gray-600">Loading your information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-imx-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-imx-gray-700">Step 1 of 3</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-imx-gray-500">
                  {currentStep === 1 ? 'Personal Information' : 'Vehicle Information'}
                </span>
                {isSaving && (
                  <div className="flex items-center text-xs text-imx-red">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-imx-red mr-1"></div>
                    Saving...
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-imx-gray-200 rounded-full h-2">
              <div 
                className="bg-imx-red h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 33.33}%` }}
              ></div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-imx-black mb-6">
            {currentStep === 1 ? 'Personal Information' : 'Vehicle Information'}
          </h1>

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Form {...personalForm}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={personalForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="Enter your first name"
                            onChange={(e) => {
                              field.onChange(e);
                              handlePersonalInfoChange('firstName', e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={personalForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="Enter your last name"
                            onChange={(e) => {
                              field.onChange(e);
                              handlePersonalInfoChange('lastName', e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={personalForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="tel"
                          placeholder="(555) 123-4567"
                          onChange={(e) => {
                            field.onChange(e);
                            handlePersonalInfoChange('phoneNumber', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          )}

          {/* Step 2: Vehicle Information */}
          {currentStep === 2 && (
            <Form {...vehicleForm}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={vehicleForm.control}
                    name="vehicleYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Year *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleVehicleInfoChange('vehicleYear', value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicleYears.map(year => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vehicleForm.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleVehicleInfoChange('make', value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Make" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicleMakes.map(make => (
                              <SelectItem key={make} value={make}>{make}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={vehicleForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleVehicleInfoChange('model', value);
                          }}
                          value={field.value}
                          disabled={!selectedMake}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedMake ? "Select Model" : "Select Make First"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableModels.map(model => (
                              <SelectItem key={model} value={model}>{model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={vehicleForm.control}
                    name="ownership"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ownership *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleVehicleInfoChange('ownership', value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Ownership" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ownershipOptions.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Form>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
            >
              Previous
            </Button>

            {currentStep === 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="bg-imx-red text-white hover:bg-red-700 disabled:bg-imx-gray-300"
              >
                Next: Vehicle Info
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isStepValid()}
                className="bg-imx-red text-white hover:bg-red-700 disabled:bg-imx-gray-300"
              >
                Continue to Questionnaire
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}