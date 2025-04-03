import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import {
  createProductSchema,
  CreateProductValues,
  ProductType
} from "@/lib/validations/product-schema";
import ReactMarkdown from 'react-markdown';
import { useDropzone } from 'react-dropzone';

export default function CreateProductPage() {
  const [loading, setLoading] = useState(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CreateProductValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      productTypeId: "",
      available: true,
    },
  });

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        setLoading(true);
        const productTypes = await api.get('/product-types');
        setProductTypes(productTypes as ProductType[]);
      } catch (error) {
        console.error('Error fetching product types:', error);
        toast.error('Failed to fetch product types');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductTypes();
  }, [toast]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    onDrop: (acceptedFiles) => {
      setImages(acceptedFiles);
    },
  });

  async function onSubmit(data: CreateProductValues) {
    setLoading(true);
    try {
      // Placeholder for API integration to create a product
      console.log("Form data submitted:", data);
      toast.success("Product created successfully!");
      navigate("/products"); // Redirect to products page after successful creation
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error("Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Product</h1>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Enter the details for the new product.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Name" {...field} disabled={loading} />
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
                      <Textarea
                        placeholder="Product Description"
                        className="resize-none"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setDescription(e.target.value);
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle>Description Preview</CardTitle>
                  <CardDescription>This is how the description will appear.</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <ReactMarkdown>{description}</ReactMarkdown>
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} disabled={loading} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel>Available</FormLabel>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-2">
                <FormLabel>Images</FormLabel>
                <div {...getRootProps()} className="border-dashed border-2 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer">
                  <input {...getInputProps()} disabled={loading} />
                  {images.length === 0 ? (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload or drag and drop images</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{images.length} images selected</p>
                  )}
                </div>
                {images.length > 0 && (
                  <div className="flex space-x-2">
                    {images.map((file, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Product"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
