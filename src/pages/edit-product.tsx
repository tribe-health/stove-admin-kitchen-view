import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProductEditor } from "@/components/product/product-editor";
import { useProducts } from "@/hooks/use-products";
import { ProductFormValues } from "@/lib/validations/product-schema";
import { Product, ProductType } from "@/store/use-product-store";
import { toast } from "sonner";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, isLoading, addProduct, updateProduct } = useProducts();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  
  useEffect(() => {
    // If we have an ID, find the product
    if (id && products.length > 0) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        toast.error("Product not found");
        navigate("/products");
      }
    }
    
    // Extract unique product types
    if (products.length > 0) {
      const types = Array.from(
        new Map(
          products
            .filter(product => product.product_type) // Ensure product_type exists
            .map(product => [product.product_type.id, product.product_type])
        ).values()
      );
      setProductTypes(types);
    }
  }, [id, products, navigate]);
  
  const handleSave = async (data: ProductFormValues) => {
    try {
      // Transform form data to match API expectations
      const productInput = {
        product_type_id: data.productTypeId || '',
        name: data.name,
        short_description: data.shortDescription || null,
        long_description: data.longDescription || null,
        unit_price: data.unitPrice,
        photo_url: data.photoUrl || null,
        unit: data.unit || null,
        data: {
          instructions: data.instructions || null,
          nutrition_details: data.nutritionDetails || null
        },
        stripe_product_id: null
      };
      
      let result;
      
      if (id && product) {
        // Update existing product
        result = await updateProduct(id, productInput);
        if (result) {
          toast.success("Product updated successfully!");
        } else {
          toast.error("Failed to update product");
        }
      } else {
        // Create new product
        result = await addProduct(productInput);
        if (result) {
          toast.success("Product added successfully!");
        } else {
          toast.error("Failed to add product");
        }
      }
      
      navigate("/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("An error occurred while saving the product");
    }
  };
  
  // Handle saving individual fields
  const handleSaveField = async (field: keyof ProductFormValues, value: string) => {
    if (!id || !product) {
      toast.error("Cannot save field: Product not found");
      return;
    }
    
    try {
      // Get current product data
      const currentData = {
        product_type_id: product.product_type_id,
        name: product.name,
        short_description: product.short_description,
        long_description: product.long_description,
        unit_price: product.unit_price,
        photo_url: product.photo_url,
        unit: product.unit,
        data: {
          ...product.data,
        },
        stripe_product_id: product.stripe_product_id
      };
      
      // Update the specific field
      if (field === 'longDescription') {
        currentData.long_description = value;
      } else if (field === 'instructions') {
        currentData.data = {
          ...currentData.data,
          instructions: value
        };
      } else if (field === 'nutritionDetails') {
        currentData.data = {
          ...currentData.data,
          nutrition_details: value
        };
      }
      
      // Save the updated product
      const result = await updateProduct(id, currentData);
      
      if (!result) {
        throw new Error("Failed to update product");
      }
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      throw error;
    }
  };
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading product data...</div>;
  }
  
  return (
    <ProductEditor 
      product={product}
      productTypes={productTypes}
      onSave={handleSave}
      onSaveField={handleSaveField}
    />
  );
}
