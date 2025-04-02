
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Plus, Package } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ProductFormValues, productSchema } from "@/lib/validations/product-schema";
import { toast } from "sonner";
import { Product } from "@/store/use-product-store";
import { useProducts } from "@/hooks/use-products";
import { set } from "date-fns";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { products, isLoading, addProduct } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      unitPrice: 0,
      unit: "",
      productTypeId: "",
    },
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, typeFilter);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    applyFilters(searchTerm, type);
  };

  const applyFilters = (term: string, type: string) => {
    let result = [...products];

    if (term) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.id.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (type && type !== "all") {
      result = result.filter(product => 
        product.product_type && product.product_type.key === type
      );
    }

    setFilteredProducts(result);
  };

  const onSubmit = async (data: ProductFormValues) => {
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
        data: {},
        stripe_product_id: null
      };
      
      const result = await addProduct(productInput);
      
      if (result) {
        toast.success("Product added successfully!");
        setShowAddDialog(false);
        form.reset();
      } else {
        toast.error("Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("An error occurred while adding the product");
    }
  };

  // Extract unique product types properly
  const productTypes = Array.from(
    new Map(
      products
        .filter(product => product.product_type) // Ensure product_type exists
        .map(product => [product.product_type.id, product.product_type])
    ).values()
  );

  // Apply filters when products, searchTerm, or typeFilter changes
  useEffect(() => {
    if (products.length > 0) {
      applyFilters(searchTerm, typeFilter);
    }
  }, [products, searchTerm, typeFilter, applyFilters]);

  // Initialize filteredProducts when products change
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your menu items and food products.</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="longDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed description" {...field} />
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
                <DialogFooter>
                  <Button type="submit">Save Product</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full md:w-auto flex-1"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {productTypes.map(type => (
                <SelectItem key={type.id} value={type.key}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex justify-center items-center h-40 border rounded-md">
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.photo_url ? (
                    <img 
                      alt={product.name} 
                      src={product.photo_url} 
                      className="h-10 w-10 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.product_type?.name || "Unknown"}</TableCell>
                <TableCell>${product.unit_price.toFixed(2)}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>
                  {new Date(product.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Product</DropdownMenuItem>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Manage Inventory</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
