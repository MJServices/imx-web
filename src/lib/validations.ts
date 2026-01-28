import { z } from 'zod'

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
})

export const vehicleInfoSchema = z.object({
  vehicleYear: z.string().min(1, 'Vehicle year is required'),
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().min(1, 'Vehicle model is required'),
  ownership: z.string().min(1, 'Ownership type is required'),
  vinNumber: z.string()
    .min(17, 'VIN must be exactly 17 characters')
    .max(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, 'VIN contains invalid characters (I, O, Q are not allowed)')
    .transform(val => val.toUpperCase())

})

export const fullFormSchema = personalInfoSchema.merge(vehicleInfoSchema)

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type VehicleInfoFormData = z.infer<typeof vehicleInfoSchema>
export type FullFormData = z.infer<typeof fullFormSchema>