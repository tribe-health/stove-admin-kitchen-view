
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  nutritionDetails: z.string().optional(),
  instructions: z.string().optional(),
  unitPrice: z.number().positive("Price must be greater than 0"),
  photoUrl: z.string().optional(),
  productTypeId: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
