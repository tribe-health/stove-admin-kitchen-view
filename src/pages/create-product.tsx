import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { useForm } from "react-hook-form";
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
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Save, Database, ArrowLeft } from "lucide-react";
import { productSchema, ProductFormValues } from "@/lib/validations/product-schema";
import SimpleMarkdownEditor from "@/components/editor/simple-markdown-editor";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useProductStore } from "@/store/use-product-store";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { createProduct, fetchProductTypes, setCreateInput, createInput } = useProductStore();
  const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savedToDatabase, setSavedToDatabase] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      unit: "",
      shortDescription: "",
      longDescription: "",
      nutritionDetails: "",
      instructions: "",
      unitPrice: 0,
      photoUrl: "",
      productTypeId: "",
    },
  });

  // Initialize createInput if it doesn't exist
  useEffect(() => {
    setIsDirty(false); // Reset dirty state on initial load
    if (!createInput) {
      // Create a new empty product input instance
      const newProductInput = {
        product_type_id: "",
        name: "",
        short_description: "",
        long_description: "",
        instructions: "",
        nutrition_details: "",
        unit_price: 0,
        photo_url: "",
        unit: "",
        data: {},
        stripe_product_id: null,
      };
      setCreateInput(newProductInput);
    }
  }, [createInput, setCreateInput]);

  // Initialize form with createInput values when available
  useEffect(() => {
    setIsDirty(false); // Reset dirty state when loading from store
    if (createInput) {
      form.reset({
        name: createInput.name || "",
        shortDescription: createInput.short_description || "",
        longDescription: createInput.long_description || "",
        unitPrice: createInput.unit_price || 0,
        unit: createInput.unit || "",
        photoUrl: createInput.photo_url || "",
        productTypeId: createInput.product_type_id || "",
        instructions: createInput.instructions || "",
        nutritionDetails: createInput.nutrition_details || "",
      });
      
      // Set image URL for the image uploader
      setImageUrl(createInput.photo_url || null);
    }
  }, [createInput, form]);

  // Load product types on component mount
  useEffect(() => {
    const loadProductTypes = async () => {
      try {
        setIsLoadingTypes(true);
        const types = await fetchProductTypes();
        setProductTypes(types);
      } catch (error) {
        console.error("Failed to load product types:", error);
        toast({
          variant: "destructive",
          title: "Failed to load product types",
          description: "There was an error loading product types. Please try again.",
        });
      } finally {
        setIsLoadingTypes(false);
      }
    };

    loadProductTypes();
  }, [fetchProductTypes]);

  const productFormValuesToProductInput = (data: ProductFormValues) => {
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
      stripe_product_id: null,
    };
  };

  // Create a debounced version of setIsDirty to prevent excessive re-renders
  const debouncedSetDirty = useRef(
    debounce(() => {
      setIsDirty(true);
    }, 300)
  ).current;
  
  // Watch for form changes to set dirty state, with debouncing
  useEffect(() => {
    const subscription = form.watch(() => {
      if (createInput) {
        debouncedSetDirty();
      }
    });
    
    return () => {
      subscription.unsubscribe();
      debouncedSetDirty.cancel();
    };
  }, [form, createInput, debouncedSetDirty]);

  // Function to temporarily save the form data without creating in the database
  async function onSave(data: ProductFormValues) {
    setLoading(true);
    try {
      // Update the createInput in the store
      const productInput = productFormValuesToProductInput(data);
      setCreateInput(productInput);
      setIsDirty(false); // Reset dirty state after saving
      toast({
        title: "Product saved temporarily",
      });
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        variant: "destructive",
        title: "Failed to save product",
      });
    } finally {
      setLoading(false);
    }
  }

  // Function to create the product in the database
  async function onCreate(data: ProductFormValues) {
    setLoading(true);
    try {
      const productData = {
        name: data.name,
        unit: data.unit || null,
        short_description: data.shortDescription || null,
        long_description: data.longDescription || null,
        nutrition_details: data.nutritionDetails || null,
        instructions: data.instructions || null,
        unit_price: data.unitPrice,
        photo_url: data.photoUrl || null,
        product_type_id: data.productTypeId || null,
        data: null,
        stripe_product_id: null
      };

      const result = await createProduct(productData);
      
      if (result) {
        // Clear the createInput after successful creation
        setSavedToDatabase(true);
        setIsDirty(false);
        setCreateInput(null);
        
        toast({
          title: "Product created successfully!",
          description: "Your product has been created and is now available.",
        });
        navigate("/products"); // Redirect to products page after successful creation
      } else {
        throw new Error("Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        variant: "destructive",
        title: "Error creating product",
        description: `There was an error creating the product: ${(error as Error).message}`,
      });
    } finally {
      setLoading(false);
    }
  }

  // Original submit function now calls save
  async function onSubmit(data: ProductFormValues) {
    await onSave(data);
  }

  return (
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
        <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
        
        {/* Status indicators */}
        <div className="flex items-center gap-2 ml-auto">
          {isDirty && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
          
          {!isDirty && createInput && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Save className="h-3 w-3" />
              Changes Saved
            </Badge>
          )}
          
          {savedToDatabase && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Saved to Database
            </Badge>
          )}
        </div>
      </div>
      
      {/* Dirty warning alert */}
      {isDirty && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>
            You have unsaved changes. Click "Save" to store them temporarily or "Create Product" to save to the database.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Photo Image Input at the top */}
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
                        setIsDirty(true); // For image upload, we can set dirty immediately
                        
                        // Update the createInput in the store with the new image URL
                        if (createInput) {
                          const updatedInput = { ...createInput, photo_url: url };
                          setCreateInput(updatedInput);
                        }
                        
                        toast({
                          title: "Upload Completed",
                        });
                      }, [form, setImageUrl, setIsDirty, createInput, setCreateInput])}
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

          {/* Short Description as textarea */}
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
                          debouncedSetDirty(); // Debounced dirty flag update
                        }, [field, debouncedSetDirty])}
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
                          debouncedSetDirty(); // Debounced dirty flag update
                        }, [field, debouncedSetDirty])}
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
                          debouncedSetDirty(); // Debounced dirty flag update
                        }, [field, debouncedSetDirty])}
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
        </form>
      </Form>

      {/* Fixed bottom bar with Save and Create buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end gap-4 z-10">
        <Button
          variant="outline"
          onClick={form.handleSubmit(onSave)}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={form.handleSubmit(onCreate)}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
