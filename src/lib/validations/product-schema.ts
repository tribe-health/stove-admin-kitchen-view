
import * as z from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, { message: "Product name is required." }),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  unitPrice: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  unit: z.string().optional(),
  photoUrl: z.string().optional(),
  productTypeId: z.string().optional(),
  instructions: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
