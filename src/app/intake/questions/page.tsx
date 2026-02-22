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

  // VIN decode state
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinDecodeStatus, setVinDecodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [vinDecodedFields, setVinDecodedFields] = useState<{ year?: string; make?: string; model?: string }>({});

  const vehicleYears = Array.from({ length: 30 }, (_, i) => (2024 - i).toString());

  const vehicleMakes = [
    'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
    'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Ford', 'Genesis',
    'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Lamborghini',
    'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati', 'Mazda',
    'McLaren', 'Mercedes-Benz', 'MINI', 'Mitsubishi', 'Nissan', 'Pontiac',
    'Porsche', 'Ram', 'Rivian', 'Rolls-Royce', 'Subaru', 'Tesla', 'Toyota',
    'Volkswagen', 'Volvo'
  ];

  const vehicleModels: Record<string, string[]> = {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Prius Prime', 'Tacoma', 'Tundra', '4Runner', 'Sienna', 'Avalon', 'Venza', 'C-HR', 'GR86', 'GR Supra', 'Sequoia', 'Crown', 'bZ4X'],
    'Honda': ['Civic', 'Civic Type R', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'HR-V', 'Passport', 'Insight', 'Prologue'],
    'Ford': ['F-150', 'F-150 Raptor', 'F-150 Lightning', 'Escape', 'Explorer', 'Mustang', 'Mustang Mach-E', 'Mustang Dark Horse', 'Edge', 'Expedition', 'Ranger', 'Bronco', 'Bronco Sport', 'Maverick'],
    'Chevrolet': ['Silverado', 'Silverado EV', 'Equinox', 'Equinox EV', 'Malibu', 'Traverse', 'Camaro', 'Camaro ZL1', 'Corvette', 'Corvette Z06', 'Corvette E-Ray', 'Corvette ZR1', 'Tahoe', 'Suburban', 'Colorado', 'Blazer', 'Blazer EV', 'Trax', 'TrailBlazer'],
    'BMW': [
      '2 Series', '3 Series', '3 Series xDrive', '4 Series', '4 Series Gran Coupe', '5 Series', '7 Series', '8 Series', '8 Series Gran Coupe', '8 Series Coupe', '8 Series Convertible',
      'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7',
      'M2', 'M3', 'M3 Competition', 'M4', 'M4 Competition', 'M4 CSL', 'M5', 'M5 Competition', 'M5 CS', 'M8', 'M8 Gran Coupe',
      'X3 M', 'X4 M', 'X5 M', 'X6 M',
      'i4', 'i5', 'i7', 'iX', 'iX3',
      'Z4'
    ],
    'Mercedes-Benz': [
      'A-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class',
      'AMG A 35', 'AMG C 43', 'AMG C 63', 'AMG C 63 S E Performance', 'AMG E 53', 'AMG E 63 S', 'AMG GT 43', 'AMG GT 53', 'AMG GT 63',
      'AMG GLC 43', 'AMG GLC 63', 'AMG GLE 53', 'AMG GLE 63 S', 'AMG GLS 63', 'AMG G 63', 'AMG SL 43', 'AMG SL 55', 'AMG SL 63',
      'EQB', 'EQE', 'EQS', 'EQS SUV', 'EQE SUV',
      'SL-Class', 'SLK-Class'
    ],
    'Audi': [
      'A3', 'A3 Sportback', 'A4', 'A4 Allroad', 'A5', 'A5 Sportback', 'A6', 'A6 Allroad', 'A7', 'A8',
      'S3', 'S4', 'S5', 'S5 Sportback', 'S6', 'S7', 'S8',
      'RS3', 'RS4', 'RS5', 'RS5 Sportback', 'RS6 Avant', 'RS7', 'RS Q3', 'RS Q8',
      'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q5 Sportback', 'Q7', 'Q8', 'SQ5', 'SQ7', 'SQ8',
      'e-tron', 'e-tron GT', 'RS e-tron GT',
      'TT', 'TTS', 'TT RS', 'R8', 'R8 Spyder'
    ],
    'Nissan': ['Altima', 'Sentra', 'Rogue', 'Rogue Sport', 'Pathfinder', 'Frontier', 'Titan', 'Murano', 'Armada', 'Leaf', 'Ariya', 'Z', 'GT-R', 'Kicks', 'Maxima'],
    'Acura': ['TLX', 'TLX Type S', 'MDX', 'MDX Type S', 'RDX', 'RDX A-Spec', 'ILX', 'NSX', 'NSX Type S', 'Integra', 'Integra Type S', 'ZDX'],
    'Buick': ['Encore', 'Encore GX', 'Envision', 'Envista', 'Enclave'],
    'Cadillac': ['Escalade', 'Escalade ESV', 'XT4', 'XT5', 'XT6', 'CT4', 'CT4-V', 'CT4-V Blackwing', 'CT5', 'CT5-V', 'CT5-V Blackwing', 'LYRIQ', 'OPTIQ', 'CELESTIQ'],
    'Chrysler': ['Pacifica', 'Pacifica Hybrid', '300', 'Voyager'],
    'Dodge': ['Charger', 'Charger Daytona', 'Challenger', 'Challenger SRT Hellcat', 'Challenger SRT Demon', 'Durango', 'Durango SRT Hellcat', 'Journey', 'Viper'],
    'GMC': ['Sierra', 'Sierra EV', 'Terrain', 'Acadia', 'Yukon', 'Yukon XL', 'Canyon', 'Envoy', 'Hummer EV'],
    'Hyundai': ['Elantra', 'Elantra N', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Kona Electric', 'Ioniq 5', 'Ioniq 6', 'Ioniq 5 N', 'NEXO', 'Venue'],
    'Infiniti': ['Q50', 'Q50 Red Sport', 'Q60', 'Q60 Red Sport', 'QX50', 'QX55', 'QX60', 'QX80'],
    'Jeep': ['Wrangler', 'Wrangler Rubicon', '4xe Wrangler', 'Grand Cherokee', 'Grand Cherokee L', 'Grand Cherokee 4xe', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Gladiator Mojave'],
    'Kia': ['Forte', 'Forte GT', 'K5', 'Sportage', 'Sorento', 'Telluride', 'Carnival', 'Soul', 'EV6', 'EV9', 'Stinger', 'Niro'],
    'Lexus': ['IS', 'IS 350 F Sport', 'IS 500 F Sport Performance', 'ES', 'GS', 'LS', 'RC', 'RC F', 'LC 500', 'LC 500h', 'UX', 'NX', 'RX', 'RX 500h F Sport', 'GX', 'LX', 'RZ'],
    'Lincoln': ['Navigator', 'Navigator L', 'Aviator', 'Aviator Grand Touring', 'Corsair', 'Nautilus'],
    'Mazda': ['Mazda3', 'Mazda3 Turbo', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-70', 'CX-90', 'MX-5 Miata', 'MX-5 RF'],
    'Mitsubishi': ['Outlander', 'Outlander PHEV', 'Outlander Sport', 'Eclipse Cross', 'Mirage', 'Galant'],
    'Ram': ['1500', '1500 TRX', '2500', '3500', 'ProMaster', 'ProMaster City'],
    'Subaru': ['Impreza', 'WRX', 'WRX STI', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent', 'BRZ', 'Solterra'],
    'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model S Plaid', 'Model X', 'Model X Plaid', 'Cybertruck', 'Roadster'],
    'Volkswagen': ['Jetta', 'Jetta GLI', 'Passat', 'Arteon', 'Tiguan', 'Atlas', 'Atlas Cross Sport', 'Golf', 'Golf GTI', 'Golf R', 'ID.4', 'ID Buzz'],
    'Volvo': ['S60', 'S60 Recharge', 'S90', 'V60', 'V60 Cross Country', 'V90', 'XC40', 'XC40 Recharge', 'XC60', 'XC60 Recharge', 'XC90', 'XC90 Recharge', 'C40 Recharge'],
    'Porsche': ['911', '911 Carrera', '911 Carrera S', '911 Carrera 4S', '911 Targa', '911 GT3', '911 GT3 RS', '911 Turbo', '911 Turbo S', 'Cayenne', 'Cayenne Coupe', 'Cayenne Turbo GT', 'Macan', 'Macan EV', 'Panamera', 'Panamera Turbo S', '718 Boxster', '718 Cayman', '718 Spyder', 'Taycan', 'Taycan Turbo S'],
    'Land Rover': ['Discovery', 'Discovery Sport', 'Defender 90', 'Defender 110', 'Defender 130', 'Range Rover', 'Range Rover Sport', 'Range Rover Sport SVR', 'Range Rover Velar', 'Range Rover Evoque'],
    'Genesis': ['G70', 'G70 Sport', 'G80', 'G80 Sport', 'G80 Electrified', 'G90', 'GV70', 'GV70 Sport', 'GV70 Electrified', 'GV80', 'GV60'],
    'Alfa Romeo': ['Giulia', 'Giulia Quadrifoglio', 'Stelvio', 'Stelvio Quadrifoglio', 'Tonale', 'GTV', '4C Spider'],
    'Maserati': ['Ghibli', 'Ghibli Trofeo', 'Quattroporte', 'Quattroporte Trofeo', 'Levante', 'Levante Trofeo', 'Grecale', 'GranTurismo', 'MC20'],
    'MINI': ['Cooper', 'Cooper S', 'Cooper JCW', 'Countryman', 'Countryman S', 'Countryman JCW', 'Paceman', 'Clubman'],
    'Pontiac': ['Firebird', 'Trans Am', 'GTO', 'Grand Prix', 'Bonneville', 'G8', 'Solstice'],
    'Rivian': ['R1T', 'R1S', 'R2', 'R3'],
    'Rolls-Royce': ['Ghost', 'Ghost Series II', 'Phantom', 'Phantom Extended', 'Wraith', 'Dawn', 'Cullinan', 'Spectre'],
    'Bentley': ['Continental GT', 'Continental GT Speed', 'Continental GTC', 'Flying Spur', 'Flying Spur Speed', 'Bentayga', 'Bentayga Speed', 'Mulliner'],
    'Ferrari': ['Roma', 'Roma Spider', 'Portofino M', 'SF90 Stradale', 'SF90 Spider', '296 GTB', '296 GTS', 'F8 Tributo', 'F8 Spider', '812 Superfast', '812 GTS', 'Purosangue', 'LaFerrari'],
    'Lamborghini': ['Huracan', 'Huracan Evo', 'Huracan STO', 'Huracan Tecnica', 'Urus', 'Urus Performante', 'Revuelto', 'Countach'],
    'McLaren': ['Artura', 'GT', '570S', '600LT', '720S', '750S', '765LT', 'Senna', 'Elva'],
    'Aston Martin': ['Vantage', 'Vantage F1 Edition', 'DB11', 'DB12', 'DBS', 'DBS Superleggera', 'DBX', 'DBX707', 'Valkyrie'],
    'Lotus': ['Emira', 'Evija', 'Eletre'],
  };

  const ownershipOptions = ['Leased', 'Financed', 'Paid Off'];

  // ── VIN Decode ──────────────────────────────────────────────────────────────
  const decodeVin = async (vin: string) => {
    setIsDecodingVin(true);
    setVinDecodeStatus('idle');
    setVinDecodedFields({});

    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
      );
      const json = await res.json();

      // NHTSA returns an array of Results; pull the key fields
      const results: { Variable: string; Value: string | null }[] = json.Results ?? [];
      const get = (key: string) =>
        results.find((r) => r.Variable === key)?.Value?.trim() ?? '';

      const decodedYear = get('Model Year');
      const decodedMake = get('Make');   // e.g. "HONDA"
      const decodedModel = get('Model');  // e.g. "Accord"

      // Validate that we actually got real data (NHTSA returns empty/null for bad VINs)
      if (!decodedYear || !decodedMake || !decodedModel) {
        setVinDecodeStatus('error');
        return;
      }

      // ── Match make (case-insensitive) ────────────────────────────────────────
      const matchedMake =
        vehicleMakes.find(
          (m) => m.toLowerCase() === decodedMake.toLowerCase()
        ) ??
        vehicleMakes.find((m) =>
          m.toLowerCase().includes(decodedMake.toLowerCase()) ||
          decodedMake.toLowerCase().includes(m.toLowerCase())
        ) ??
        decodedMake; // fall back to raw decoded make

      // ── Match model (case-insensitive) inside that make's list ────────────────
      const modelsForMake = vehicleModels[matchedMake] ?? [];
      const matchedModel =
        modelsForMake.find(
          (m) => m.toLowerCase() === decodedModel.toLowerCase()
        ) ??
        modelsForMake.find((m) =>
          m.toLowerCase().includes(decodedModel.toLowerCase()) ||
          decodedModel.toLowerCase().includes(m.toLowerCase())
        ) ??
        decodedModel; // fall back to raw decoded model

      // ── Match year from our year list ─────────────────────────────────────────
      const matchedYear = vehicleYears.includes(decodedYear)
        ? decodedYear
        : vehicleYears[0]; // nearest year if out of range

      // ── Apply to form ─────────────────────────────────────────────────────────
      vehicleForm.setValue('vehicleYear', matchedYear);
      vehicleForm.setValue('make', matchedMake);
      vehicleForm.setValue('model', matchedModel);

      // Save corrected values to Supabase
      await saveToSupabase({
        vehicle_year: matchedYear,
        make: matchedMake,
        model: matchedModel,
      });

      setVinDecodedFields({ year: matchedYear, make: matchedMake, model: matchedModel });
      setVinDecodeStatus('success');
    } catch {
      setVinDecodeStatus('error');
    } finally {
      setIsDecodingVin(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

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
      ownership: '',
      vinNumber: ''
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
            ownership: data.ownership || '',
            vinNumber: data.vin_number || ''
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
      ownership: 'ownership',
      vinNumber: 'vin_number'
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
                        <div className="flex items-center gap-2">
                          <FormLabel>Vehicle Year *</FormLabel>
                          {vinDecodedFields.year && (
                            <span className="text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5">
                              ✓ VIN Corrected
                            </span>
                          )}
                        </div>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleVehicleInfoChange('vehicleYear', value);
                            // Clear the VIN-corrected badge if user manually changes
                            setVinDecodedFields((prev) => ({ ...prev, year: undefined }));
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className={vinDecodedFields.year ? 'border-amber-400 ring-1 ring-amber-300' : ''}>
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
                        <div className="flex items-center gap-2">
                          <FormLabel>Make *</FormLabel>
                          {vinDecodedFields.make && (
                            <span className="text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5">
                              ✓ VIN Corrected
                            </span>
                          )}
                        </div>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleVehicleInfoChange('make', value);
                            setVinDecodedFields((prev) => ({ ...prev, make: undefined, model: undefined }));
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className={vinDecodedFields.make ? 'border-amber-400 ring-1 ring-amber-300' : ''}>
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
                        <div className="flex items-center gap-2">
                          <FormLabel>Model *</FormLabel>
                          {vinDecodedFields.model && (
                            <span className="text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5">
                              ✓ VIN Corrected
                            </span>
                          )}
                        </div>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleVehicleInfoChange('model', value);
                            setVinDecodedFields((prev) => ({ ...prev, model: undefined }));
                          }}
                          value={field.value}
                          disabled={!selectedMake}
                        >
                          <FormControl>
                            <SelectTrigger className={vinDecodedFields.model ? 'border-amber-400 ring-1 ring-amber-300' : ''}>
                              <SelectValue placeholder={selectedMake ? "Select Model" : "Select Make First"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Always include the VIN-decoded model even if not in our list */}
                            {availableModels.map(model => (
                              <SelectItem key={model} value={model}>{model}</SelectItem>
                            ))}
                            {field.value && !availableModels.includes(field.value) && (
                              <SelectItem key={field.value} value={field.value}>{field.value}</SelectItem>
                            )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={vehicleForm.control}
                    name="vinNumber"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>VIN (Vehicle Identification Number) *</FormLabel>
                          {isDecodingVin && (
                            <div className="flex items-center gap-1 text-xs text-imx-red">
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-imx-red" />
                              Decoding VIN...
                            </div>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter 17-character VIN — fields will auto-correct"
                            maxLength={17}
                            className="font-mono tracking-widest uppercase"
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                              field.onChange(val);
                              if (val.length === 17) {
                                handleVehicleInfoChange('vinNumber', val);
                                decodeVin(val);
                              } else {
                                // Clear decode status when VIN is edited below 17 chars
                                setVinDecodeStatus('idle');
                                setVinDecodedFields({});
                              }
                            }}
                          />
                        </FormControl>

                        {/* VIN decode success / error banner */}
                        {vinDecodeStatus === 'success' && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>
                              <strong>VIN decoded successfully.</strong> Year, Make &amp; Model have been updated to match your VIN.
                            </span>
                          </div>
                        )}
                        {vinDecodeStatus === 'error' && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>
                              <strong>VIN could not be decoded.</strong> Please verify the VIN and check your Year, Make &amp; Model selections manually.
                            </span>
                          </div>
                        )}

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