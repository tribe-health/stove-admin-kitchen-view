import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import MarkdownEditor from "@/components/editor/markdown-editor";
import { ImageUploader } from "@/components/ui/image-uploader";
import { ProductFormValues, productSchema } from "@/lib/validations/product-schema";
import { toast } from "sonner";
import { Product, ProductType } from "@/store/use-product-store";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  product?: Product;
  productTypes: ProductType[];
  trigger?: React.ReactNode;
  title?: string;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  onSubmit,
  product,
  productTypes,
  trigger,
  title = product ? "Edit Product" : "Add New Product"
}: ProductFormDialogProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      shortDescription: product?.short_description || "",
      longDescription: product?.long_description || "",
      unitPrice: product?.unit_price || 0,
      unit: product?.unit || "",
      photoUrl: product?.photo_url || "",
      productTypeId: product?.product_type_id || "",
      instructions: product?.data?.instructions as string || "",
      nutritionDetails: product?.data?.nutrition_details as string || "",
    },
  });

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        shortDescription: product.short_description || "",
        longDescription: product.long_description || "",
        unitPrice: product.unit_price || 0,
        unit: product.unit || "",
        photoUrl: product.photo_url || "",
        productTypeId: product.product_type_id || "",
        instructions: product.data?.instructions as string || "",
        nutritionDetails: product.data?.nutrition_details as string || "",
      });
    } else {
      form.reset({
        name: "",
        shortDescription: "",
        longDescription: "",
        unitPrice: 0,
        unit: "",
        photoUrl: "",
        productTypeId: "",
        instructions: "",
        nutritionDetails: "",
      });
    }
  }, [product, form]);

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error("An error occurred while saving the product");
    }
  };

  // Handle saving individual markdown fields
  const handleSaveField = (field: keyof ProductFormValues, value: string) => {
    form.setValue(field, value);
    toast.success(`${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} saved successfully`);
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
      {/* Sticky header */}
      <DialogHeader className="p-6 sticky top-0 z-10 bg-background border-b">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Fill in the product details below. Each markdown field can be saved individually.
        </DialogDescription>
      </DialogHeader>
      
      <div className="overflow-y-auto flex-1 p-6">
        <Form {...form}>
          <form id="product-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="productTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productTypes.map(type => (
                        <SelectItem key={type.id} value={type.key}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                    <ImageUploader 
                      initialImageUrl={field.value}
                      onImageUploaded={field.onChange}
                      bucketName="product-images"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-8">
              <FormField
                control={form.control}
                name="longDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MarkdownEditor 
                        label="Long Description"
                        markdown={field.value || ''} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        onSave={(value) => handleSaveField('longDescription', value)}
                        className="h-[300px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nutritionDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MarkdownEditor 
                        label="Nutrition Details"
                        markdown={field.value || ''} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        onSave={(value) => handleSaveField('nutritionDetails', value)}
                        className="h-[300px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MarkdownEditor 
                        label="Cooking Instructions"
                        markdown={field.value || ''} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        onSave={(value) => handleSaveField('instructions', value)}
                        className="h-[300px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., per item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>
      
      {/* Sticky footer */}
      <DialogFooter className="p-6 border-t sticky bottom-0 bg-background z-10 mt-auto">
        <Button type="submit" form="product-form">
          {product ? "Update Product" : "Save Product"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  return trigger ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogContent}
    </Dialog>
  );
}
