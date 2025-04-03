import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductEditor } from "@/components/product/product-editor";
import { useProducts } from "@/hooks/use-products";
import { ProductFormValues } from "@/lib/validations/product-schema";
import { ProductType } from "@/store/use-product-store";
import { toast } from "sonner";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { products, isLoading, addProduct } = useProducts();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  
  useEffect(() => {
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
  }, [products]);
  
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
      
      // Create new product
      const result = await addProduct(productInput);
      
      if (result) {
        toast.success("Product added successfully!");
        navigate("/products");
      } else {
        toast.error("Failed to add product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("An error occurred while saving the product");
    }
  };
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading product data...</div>;
  }
  
  return (
    <ProductEditor 
      productTypes={productTypes}
      onSave={handleSave}
    />
  );
}
