
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Label } from "@/components/ui/label";
import { useProductStore } from "@/store/use-product-store";
import { productSchema, ProductFormValues } from "@/lib/validations/product-schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleMarkdownEditor } from "@/components/editor/simple-markdown-editor";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createProduct, fetchProductTypes } = useProductStore();
  const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Initialize the form with validation schema
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

  // Load product types on component mount
  React.useEffect(() => {
    const loadProductTypes = async () => {
      try {
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
  }, [fetchProductTypes, toast]);

  // Form submission handler
  const onSubmit = async (data: ProductFormValues) => {
    setIsLoading(true);
    
    try {
      // Convert form data to the format expected by the API
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
      };

      const result = await createProduct(productData);
      
      if (result) {
        toast({
          title: "Product created",
          description: `${result.name} has been created successfully.`,
        });
        navigate("/products");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        variant: "destructive",
        title: "Error creating product",
        description: `There was an error creating the product: ${(error as Error).message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create New Product</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the basic details for the product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the product"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A concise summary of the product that will appear in lists and cards.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">$</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., lb, oz, each" {...field} />
                        </FormControl>
                        <FormDescription>
                          The unit of measurement for this product.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productTypeId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Product Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingTypes ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              productTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Images and Media */}
            <Card>
              <CardHeader>
                <CardTitle>Images & Media</CardTitle>
                <CardDescription>Add photos for the product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photo">Product Photo</Label>
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUploader
                            initialImageUrl={field.value}
                            onImageUploaded={(url) => {
                              field.onChange(url);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Detailed Description */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Detailed Description</CardTitle>
                <CardDescription>Provide comprehensive details about the product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="longDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <SimpleMarkdownEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed information about the product. Supports markdown formatting.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Nutrition Details */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Nutrition Information</CardTitle>
                <CardDescription>Add nutrition details and cooking instructions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nutritionDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nutrition Details</FormLabel>
                      <FormControl>
                        <SimpleMarkdownEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Information about nutritional content, allergens, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cooking Instructions</FormLabel>
                      <FormControl>
                        <SimpleMarkdownEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Preparation or cooking instructions for the product.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/products")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
