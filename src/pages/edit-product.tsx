import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { debounce } from 'lodash';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Save, Database } from "lucide-react";
import { productSchema, ProductFormValues } from "@/lib/validations/product-schema";
import ReactMarkdown from 'react-markdown';
import { UploadButton } from "@/components/upload/uploadthing";
import { useProducts } from '@/hooks/use-products';
import { ProductInput } from '@/store/use-product-store';
import { AdminLayout } from '@/components/admin-layout';
import { ArrowLeft } from 'lucide-react';
import SimpleMarkdownEditor from '@/components/editor/simple-markdown-editor';
import { ImageUploader } from '@/components/ui/image-uploader';

interface ProductType {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const { products, productTypes, editingProduct, setEditingProduct, getEditingProduct, isLoading, updateProduct, fetchProductTypes } = useProducts();
  const [loading, setLoading] = useState(isLoading);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formInitialized, setFormInitialized] = useState(false);
  

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      longDescription: "",
      unitPrice: 0,
      unit: "",
      photoUrl: "",
      productTypeId: "",
      instructions: "",
      nutritionDetails: "",
    },
  });

  // Ensure we have the product ID and retrieve the editing product
  useEffect(() => {
    if (!id) {
      toast.error("Product ID is required");
      navigate("/products");
      return;
    }
    
    // Always retrieve the editing product from the store using the ID
    const storedEditingProduct = getEditingProduct(id);
    if (storedEditingProduct) {
      setEditingProduct(storedEditingProduct);
    }
  }, [id, navigate, getEditingProduct, setEditingProduct]);
  
  // Fetch product types if they haven't been loaded yet
  useEffect(() => {
    if (productTypes.length === 0) {
      fetchProductTypes();
    }
  }, [productTypes, fetchProductTypes]);
  
  // Initialize form with product data when editingProduct changes
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setLoading(true);
        
        if (id && editingProduct?.input) {
          // Initialize form with values from editingProduct.input
          form.reset({
            name: editingProduct.input.name || "",
            shortDescription: editingProduct.input.short_description || "",
            longDescription: editingProduct.input.long_description || "",
            unitPrice: editingProduct.input.unit_price || 0,
            unit: editingProduct.input.unit || "",
            photoUrl: editingProduct.input.photo_url || "",
            productTypeId: editingProduct.input.product_type_id || "",
            instructions: editingProduct.input.instructions || "",
            nutritionDetails: editingProduct.input.nutrition_details || "",
          });
          
          // Set image URL for the image uploader
          setImageUrl(editingProduct.input.photo_url || null);
        }
      } catch (error) {
        console.error('Error initializing form data:', error);
        toast.error('Failed to initialize form data');
      } finally {
        setLoading(false);
      }
    };
    
    initializeForm();
    setFormInitialized(true);
  }, [id, editingProduct, form]);

  // Create a debounced version of the editingProduct update to prevent excessive re-renders
  const debouncedUpdateEditingProduct = useRef(
    debounce((value: any) => {
      if (!id || !editingProduct) return;
      
      // Only update if we have valid data
      if (value.name) {
        // Convert form values to ProductInput
        const updatedInput = productFormValuesToProductInput(value as ProductFormValues);
        
        // Update the editingProduct with the new input values and mark as dirty
        setEditingProduct({
          input: updatedInput,
          product: editingProduct.product,
          is_dirty: true
        });
      }
    }, 300)
  ).current;
  
  // Watch for form changes and update the editingProduct with debouncing
  useEffect(() => {
    if (!formInitialized || !id || !editingProduct) return;

    // Subscribe to form changes
    const subscription = form.watch((value) => {
      debouncedUpdateEditingProduct(value);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
      debouncedUpdateEditingProduct.cancel();
    };
  }, [form, id, editingProduct, formInitialized, debouncedUpdateEditingProduct]);

  const productFormValuesToProductInput = (data: ProductFormValues): ProductInput => {
    return {
      product_type_id: data.productTypeId,
      name: data.name,
      short_description: data.shortDescription,
      long_description: data.longDescription,
      nutrition_details: data.nutritionDetails,
      unit_price: data.unitPrice,
      photo_url: data.photoUrl,
      unit: data.unit,
      instructions: data.instructions,
      data: {},
      stripe_product_id: "",
    };
  };

  // Function to temporarily save the form data without updating the database
  async function onSave(data: ProductFormValues) {
    setLoading(true);
    try {
      if (!id) {
        toast.error("Product ID is required");
        return;
      }
      
      // Save to the store but mark as NOT dirty since we're explicitly saving
      setEditingProduct({
        input: productFormValuesToProductInput(data),
        product: editingProduct?.product,
        is_dirty: false // Set to false after saving
      });
      
      toast.success("Product saved temporarily");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  // Function to update the product in the database
  async function onUpdate(data: ProductFormValues) {
    setLoading(true);
    try {
      if (!id) {
        toast.error("Product ID is required");
        return;
      }
      
      const productInput = productFormValuesToProductInput(data);
      
      // Update the product in the database
      const updatedProduct = await updateProduct(id, productInput);
      
      if (updatedProduct) {
        setEditingProduct({
          input: productInput,
          product: updatedProduct,
          is_dirty: true
        });
        toast.success("Product updated successfully");
        navigate("/products");
      } else {
        toast.error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  // Original submit function now calls save
  async function onSubmit(data: ProductFormValues) {
    await onSave(data);
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/products")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Products</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2 ml-auto">
            {editingProduct?.is_dirty && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Unsaved Changes
              </Badge>
            )}
            
            {!editingProduct?.is_dirty && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Save className="h-3 w-3" />
                Changes Saved
              </Badge>
            )}
            
            {editingProduct?.product.id && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Saved to Database
              </Badge>
            )}
          </div>
        </div>
        
        {/* Dirty warning alert */}
        {editingProduct?.is_dirty && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have unsaved changes. Click "Save" to store them temporarily or "Update Product" to save to the database.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Photo Image Input moved to the top */}
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                    {/* Hidden input for form value */}
                    <div className="space-y-4">
                      <Input
                        placeholder="Image URL"
                        disabled={loading}
                        {...field}
                        className="hidden"
                      />
                      
                      {/* Display current image if available */}
                      {imageUrl && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">Current Image:</p>
                          <div className="relative border rounded-md overflow-hidden" style={{ maxWidth: '300px' }}>
                            <img
                              src={imageUrl}
                              alt="Current product"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        </div>
                      )}
                      
                      <ImageUploader
                        initialImageUrl={imageUrl || ""}
                        onImageUploaded={useCallback((url) => {
                          form.setValue("photoUrl", url);
                          setImageUrl(url);
                          
                          // Update the editingProduct with the new image URL and mark as dirty
                          // For image upload, we can update immediately without debouncing
                          if (id && editingProduct) {
                            const updatedInput = { ...editingProduct.input, photo_url: url };
                            setEditingProduct({
                              input: updatedInput,
                              product: editingProduct.product,
                              is_dirty: true
                            });
                          }
                          
                          toast.success("Upload Completed");
                        }, [form, setImageUrl, id, editingProduct, setEditingProduct])}
                        bucketName="product-images"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Name input */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Type dropdown moved up */}
            <FormField
              control={form.control}
              name="productTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <FormControl>
                    <select className="border rounded px-3 py-2 w-full" disabled={loading} {...field}>
                      <option value="">Select a product type</option>
                      {productTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Short Description as textarea instead of markdown */}
            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a short description"
                      disabled={loading}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit Price and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        disabled={loading}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., lb, oz, each" disabled={loading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tabbed interface for markdown editors */}
            <FormItem className="space-y-2">
              <FormLabel>Detailed Information</FormLabel>
              <Tabs defaultValue="longDescription" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="longDescription">Long Description</TabsTrigger>
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="nutritionDetails">Nutrition Details</TabsTrigger>
                </TabsList>
                
                {/* Long Description Tab */}
                <TabsContent value="longDescription" className="border rounded-md p-4">
                  <FormField
                    control={form.control}
                    name="longDescription"
                    render={({ field }) => (
                      <FormControl>
                        <SimpleMarkdownEditor
                          markdown={field.value}
                          onChange={useCallback((value) => {
                            field.onChange(value);
                            
                            // Use the debounced update for markdown changes
                            debouncedUpdateEditingProduct({
                              ...form.getValues(),
                              longDescription: value
                            });
                          }, [field, form, debouncedUpdateEditingProduct])}
                          label="Long Description"
                          className="min-h-[300px]"
                        />
                      </FormControl>
                    )}
                  />
                </TabsContent>
                
                {/* Instructions Tab */}
                <TabsContent value="instructions" className="border rounded-md p-4">
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormControl>
                        <SimpleMarkdownEditor
                          markdown={field.value}
                          onChange={useCallback((value) => {
                            field.onChange(value);
                            
                            // Use the debounced update for markdown changes
                            debouncedUpdateEditingProduct({
                              ...form.getValues(),
                              instructions: value
                            });
                          }, [field, form, debouncedUpdateEditingProduct])}
                          label="Instructions"
                          className="min-h-[300px]"
                        />
                      </FormControl>
                    )}
                  />
                </TabsContent>
                
                {/* Nutrition Details Tab */}
                <TabsContent value="nutritionDetails" className="border rounded-md p-4">
                  <FormField
                    control={form.control}
                    name="nutritionDetails"
                    render={({ field }) => (
                      <FormControl>
                        <SimpleMarkdownEditor
                          markdown={field.value}
                          onChange={useCallback((value) => {
                            field.onChange(value);
                            
                            // Use the debounced update for markdown changes
                            debouncedUpdateEditingProduct({
                              ...form.getValues(),
                              nutritionDetails: value
                            });
                          }, [field, form, debouncedUpdateEditingProduct])}
                          label="Nutrition Details"
                          className="min-h-[300px]"
                        />
                      </FormControl>
                    )}
                  />
                </TabsContent>
              </Tabs>
              <FormMessage />
            </FormItem>

          {/* Bottom action buttons are now in a fixed bar */}
        </form>
        </Form>
      </div>

      {/* Fixed bottom bar with Save and Update buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end gap-4 z-10">
        <Button
          variant="outline"
          onClick={form.handleSubmit(onSave)}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={form.handleSubmit(onUpdate)}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Product"}
        </Button>
      </div>
    </AdminLayout>
  );
}
