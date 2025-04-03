import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "@/components/ui/image-uploader";
import SimpleMarkdownEditor from "@/components/editor/simple-markdown-editor";
import { ProductFormValues, productSchema } from "@/lib/validations/product-schema";
import { toast } from "sonner";
import { Product, ProductType } from "@/store/use-product-store";
import { ChevronLeft, Save, Menu, FileText, CookingPot, Apple } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductEditorProps {
  product?: Product;
  productTypes: ProductType[];
  onSave: (data: ProductFormValues) => Promise<void>;
  onSaveField?: (field: keyof ProductFormValues, value: string) => Promise<void>;
}

type EditorView = "general" | "description" | "instructions" | "nutrition";

export function ProductEditor({
  product,
  productTypes,
  onSave,
  onSaveField
}: ProductEditorProps) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<EditorView>("general");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
    }
  }, [product, form]);

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      await onSave(data);
      toast.success(`Product ${product ? 'updated' : 'created'} successfully!`);
      navigate("/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("An error occurred while saving the product");
    }
  };

  // Handle saving individual fields
  const handleSaveField = async (field: keyof ProductFormValues, value: string) => {
    try {
      form.setValue(field, value);
      
      if (onSaveField) {
        await onSaveField(field, value);
      } else {
        // If no specific field save handler is provided, save the entire form
        const formData = form.getValues();
        await onSave(formData);
      }
      
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      toast.error(`Failed to save ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    }
  };

  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setSidebarCollapsed(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "border-r bg-muted/10 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64 md:w-64"
      )}>
        <div className="p-4 border-b flex items-center justify-between">
          {!sidebarCollapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1" 
              onClick={() => navigate("/products")}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="md:inline hidden">Back</span>
            </Button>
          )}
          {sidebarCollapsed && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/products")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Button 
            variant={activeView === "general" ? "default" : "ghost"} 
            className={cn("w-full", sidebarCollapsed ? "justify-center px-2" : "justify-start")}
            onClick={() => setActiveView("general")}
          >
            <Menu className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && <span>General</span>}
          </Button>
          <Button 
            variant={activeView === "description" ? "default" : "ghost"} 
            className={cn("w-full", sidebarCollapsed ? "justify-center px-2" : "justify-start")}
            onClick={() => setActiveView("description")}
          >
            <FileText className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && <span>Long Description</span>}
          </Button>
          <Button 
            variant={activeView === "instructions" ? "default" : "ghost"} 
            className={cn("w-full", sidebarCollapsed ? "justify-center px-2" : "justify-start")}
            onClick={() => setActiveView("instructions")}
          >
            <CookingPot className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && <span>Instructions</span>}
          </Button>
          <Button 
            variant={activeView === "nutrition" ? "default" : "ghost"} 
            className={cn("w-full", sidebarCollapsed ? "justify-center px-2" : "justify-start")}
            onClick={() => setActiveView("nutrition")}
          >
            <Apple className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && <span>Nutrition</span>}
          </Button>
        </nav>
        
        <div className="p-4 border-t">
          <Button 
            className="w-full gap-1"
            onClick={form.handleSubmit(handleSubmit)}
          >
            <Save className="h-4 w-4" />
            {!sidebarCollapsed && <span>Save All</span>}
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Form {...form}>
          <form className="h-full">
            {/* General View */}
            {activeView === "general" && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">
                    {product ? 'Edit Product' : 'Create Product'}
                  </h1>
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(handleSubmit)}
                    className="gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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
                  </div>
                  
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
                </div>
              </div>
            )}
            
            {/* Long Description View */}
            {activeView === "description" && (
              <div className="h-full flex flex-col">
                <div className="p-6 flex items-center justify-between border-b sticky top-0 z-20 bg-background">
                  <h1 className="text-2xl font-bold">Long Description</h1>
                  <Button 
                    type="button" 
                    onClick={() => {
                      const value = form.getValues("longDescription");
                      handleSaveField("longDescription", value);
                    }}
                    className="gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
                
                <div className="flex-1 p-6 h-full">
                  <FormField
                    control={form.control}
                    name="longDescription"
                    render={({ field }) => (
                      <FormItem className="h-full">
                        <FormControl>
                          <SimpleMarkdownEditor 
                            markdown={field.value || '# Long Description\n\nEnter the detailed description of your product here.'} 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            onSave={(value) => handleSaveField('longDescription', value)}
                            className="h-full"
                            label="Long Description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Instructions View */}
            {activeView === "instructions" && (
              <div className="h-full flex flex-col">
                <div className="p-6 flex items-center justify-between border-b sticky top-0 z-20 bg-background">
                  <h1 className="text-2xl font-bold">Cooking Instructions</h1>
                  <Button 
                    type="button" 
                    onClick={() => {
                      const value = form.getValues("instructions");
                      handleSaveField("instructions", value);
                    }}
                    className="gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
                
                <div className="flex-1 p-6 h-full">
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem className="h-full">
                        <FormControl>
                          <SimpleMarkdownEditor 
                            markdown={field.value || '# Cooking Instructions\n\nProvide step-by-step cooking instructions here.'} 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            onSave={(value) => handleSaveField('instructions', value)}
                            className="h-full"
                            label="Cooking Instructions"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* Nutrition View */}
            {activeView === "nutrition" && (
              <div className="h-full flex flex-col">
                <div className="p-6 flex items-center justify-between border-b sticky top-0 z-20 bg-background">
                  <h1 className="text-2xl font-bold">Nutrition Details</h1>
                  <Button 
                    type="button" 
                    onClick={() => {
                      const value = form.getValues("nutritionDetails");
                      handleSaveField("nutritionDetails", value);
                    }}
                    className="gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
                
                <div className="flex-1 p-6 h-full">
                  <FormField
                    control={form.control}
                    name="nutritionDetails"
                    render={({ field }) => (
                      <FormItem className="h-full">
                        <FormControl>
                          <SimpleMarkdownEditor 
                            markdown={field.value || '# Nutrition Details\n\nProvide nutritional information for this product here.'} 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            onSave={(value) => handleSaveField('nutritionDetails', value)}
                            className="h-full"
                            label="Nutrition Details"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
