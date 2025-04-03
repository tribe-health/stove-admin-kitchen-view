import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Label } from "@/components/ui/label";
import { useProductStore, Product } from "@/store/use-product-store";
import { productSchema, ProductFormValues } from "@/lib/validations/product-schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SimpleMarkdownEditor from "@/components/editor/simple-markdown-editor";

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateProduct, fetchProductById, fetchProductTypes } = useProductStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

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

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const productData = await fetchProductById(id);
        if (productData) {
          setProduct(productData);
          
          form.reset({
            name: productData.name,
            unit: productData.unit || "",
            shortDescription: productData.short_description || "",
            longDescription: productData.long_description || "",
            nutritionDetails: productData.nutrition_details || "",
            instructions: productData.instructions || "",
            unitPrice: productData.unit_price,
            photoUrl: productData.photo_url || "",
            productTypeId: productData.product_type_id || "",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Product not found",
            description: "The requested product could not be found.",
          });
          navigate("/products");
        }

        const types = await fetchProductTypes();
        setProductTypes(types);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "There was an error loading the product data. Please try again.",
        });
      } finally {
        setIsLoadingProduct(false);
        setIsLoadingTypes(false);
      }
    };

    loadData();
  }, [id, fetchProductById, fetchProductTypes, form, navigate, toast]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!id) return;
    
    setIsLoading(true);
    
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
      };

      const result = await updateProduct(id, productData);
      
      if (result) {
        toast({
          title: "Product updated",
          description: `${result.name} has been updated successfully.`,
        });
        navigate("/products");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        variant: "destructive",
        title: "Error updating product",
        description: `There was an error updating the product: ${(error as Error).message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Edit Product: {product?.name}</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update the basic details for the product.</CardDescription>
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
                          value={field.value || ""}
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
                          <Input placeholder="e.g., lb, oz, each" {...field} value={field.value || ""} />
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
                          value={field.value || ""}
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

            <Card>
              <CardHeader>
                <CardTitle>Images & Media</CardTitle>
                <CardDescription>Update photos for the product.</CardDescription>
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

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Detailed Description</CardTitle>
                <CardDescription>Update comprehensive details about the product.</CardDescription>
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

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Nutrition Information</CardTitle>
                <CardDescription>Update nutrition details and cooking instructions.</CardDescription>
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
              Update Product
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
