
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { productSchema, ProductFormValues } from "@/lib/validations/product-schema";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import { useProducts } from "@/hooks/use-products";
import { ProductType } from "@/store/use-product-store";

export default function EditProductPage() {
  const [loading, setLoading] = useState(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { products, fetchProducts, updateProduct } = useProducts();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      longDescription: "",
      unitPrice: 0,
      productTypeId: "",
      photoUrl: "",
      instructions: "",
      nutritionDetails: "",
      unit: "",
    },
  });

  useEffect(() => {
    if (!id) {
      toast.error("Product ID is required");
      navigate("/products");
      return;
    }
  }, [id, navigate]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch product types
        setProductTypes([
          { id: '1', name: 'Food', key: 'food', schema: {}, icon_url: '', cover_url: '' },
          { id: '2', name: 'Drink', key: 'drink', schema: {}, icon_url: '', cover_url: '' }
        ]);
        
        // Ensure products are loaded
        if (products.length === 0) {
          await fetchProducts();
        }
        
        // Find the product to edit
        if (id) {
          const product = products.find(p => p.id === id);
          if (product) {
            form.reset({
              name: product.name,
              shortDescription: product.short_description || "",
              longDescription: product.long_description || "",
              unitPrice: product.unit_price,
              productTypeId: product.product_type_id,
              photoUrl: product.photo_url || "",
              instructions: product.instructions || "",
              nutritionDetails: product.nutrition_details || "",
              unit: product.unit || "",
            });
            setImageUrl(product.photo_url || null);
          } else {
            toast.error("Product not found");
            navigate("/products");
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, products, fetchProducts, form, navigate]);

  async function onSubmit(data: ProductFormValues) {
    if (!id) {
      toast.error("Product ID is required");
      return;
    }
    
    setLoading(true);
    try {
      // Prepare product data for update
      const productData = {
        product_type_id: data.productTypeId || '',
        name: data.name,
        short_description: data.shortDescription || null,
        long_description: data.longDescription || null,
        instructions: data.instructions || null,
        nutrition_details: data.nutritionDetails || null,
        unit_price: data.unitPrice,
        photo_url: data.photoUrl || null,
        unit: data.unit || null,
        data: {
          instructions: data.instructions,
          nutrition_details: data.nutritionDetails
        },
        stripe_product_id: null, // We'd get this from the existing product
      };

      const result = await updateProduct(id, productData);
      if (result) {
        toast.success("Product updated successfully");
        navigate("/products");
      } else {
        throw new Error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = (url: string) => {
    form.setValue("photoUrl", url);
    setImageUrl(url);
    toast.success("Image uploaded successfully");
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <Button onClick={() => navigate("/products")}>Back to Products</Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Long Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Product description" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">Description Preview</h3>
            <ReactMarkdown className="prose max-w-none">
              {form.getValues("longDescription")}
            </ReactMarkdown>
          </div>

          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cooking Instructions</FormLabel>
                <FormControl>
                  <Textarea placeholder="Cooking or preparation instructions" disabled={loading} {...field} />
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
                <FormLabel>Nutrition Details</FormLabel>
                <FormControl>
                  <Textarea placeholder="Nutrition information" disabled={loading} {...field} />
                </FormControl>
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
                  <Input type="number" placeholder="Product price" disabled={loading} {...field} />
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
                  <Input placeholder="e.g., per item, per lb" disabled={loading} {...field} />
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

          <FormField
            control={form.control}
            name="photoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="Image URL" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-4">
            {imageUrl && (
              <div>
                <img src={imageUrl} alt="Product Preview" className="max-w-xs rounded-md" />
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Product"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
