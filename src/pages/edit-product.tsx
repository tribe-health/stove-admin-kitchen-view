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
import { api } from "@/lib/api";
import { ProductSchema, ProductValues } from "@/lib/validations/product-schema";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import { UploadButton } from "@/utils/uploadthing";

interface ProductType {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const [loading, setLoading] = useState(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const form = useForm<ProductValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      productTypeId: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (!id) {
      toast.error("Product ID is required");
      navigate("/products");
      return;
    }
  }, [id, navigate]);
  
  // Update the setProductTypes to handle proper typing
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        setLoading(true);
        const productTypes = await api.get('/product-types');
        setProductTypes(productTypes as ProductType[]);
        
        if (id) {
          const product = await api.get(`/products/${id}`);
          form.reset({
            name: product.name,
            description: product.description,
            price: product.price,
            productTypeId: product.productTypeId,
            imageUrl: product.imageUrl,
          });
          setImageUrl(product.imageUrl);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductTypes();
  }, [id, navigate, toast]);

  async function onSubmit(data: ProductValues) {
    setLoading(true);
    try {
      if (!id) {
        toast.error("Product ID is required");
        return;
      }
      await api.put(`/products/${id}`, data);
      toast.success("Product updated successfully");
      navigate("/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  }

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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
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
              {form.getValues("description")}
            </ReactMarkdown>
          </div>

          <FormField
            control={form.control}
            name="price"
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
            name="imageUrl"
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
            <div>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) {
                    form.setValue("imageUrl", res[0].url);
                    setImageUrl(res[0].url);
                    toast.success("Upload Completed");
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`ERROR! ${error.message}`);
                }}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Product"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
