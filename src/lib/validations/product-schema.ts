
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  unit: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  longDescription: z.string().optional().nullable(),
  nutritionDetails: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  unitPrice: z.number()
    .positive("Price must be greater than 0")
    .refine(val => !isNaN(val), "Price must be a valid number"),
  photoUrl: z.string().optional().nullable()
    .refine(val => !val || val.trim() !== "", "Photo URL cannot be empty if provided"),
  productTypeId: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
