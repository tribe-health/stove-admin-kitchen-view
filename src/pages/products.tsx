
import { useState } from "react";
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

interface Product {
  id: string;
  name: string;
  type: string;
  price: string;
  inventory: number | string;
  created: string;
}

const mockProducts: Product[] = [
  { id: 'PROD-001', name: 'Grilled Chicken Salad', type: 'Salad', price: '$12.99', inventory: 25, created: '2023-03-15' },
  { id: 'PROD-002', name: 'Veggie Power Bowl', type: 'Bowl', price: '$14.50', inventory: 18, created: '2023-03-18' },
  { id: 'PROD-003', name: 'Protein Smoothie', type: 'Drink', price: '$8.95', inventory: 30, created: '2023-03-20' },
  { id: 'PROD-004', name: 'Salmon Plate', type: 'Entree', price: '$16.95', inventory: 12, created: '2023-03-25' },
  { id: 'PROD-005', name: 'Turkey Sandwich', type: 'Sandwich', price: '$10.50', inventory: 20, created: '2023-04-02' },
  { id: 'PROD-006', name: 'Fresh Fruit Cup', type: 'Side', price: '$4.95', inventory: 40, created: '2023-04-05' },
  { id: 'PROD-007', name: 'Vegetable Soup', type: 'Soup', price: '$6.75', inventory: 15, created: '2023-04-10' },
  { id: 'PROD-008', name: 'Chocolate Protein Bar', type: 'Snack', price: '$3.95', inventory: 50, created: '2023-04-12' },
  { id: 'PROD-009', name: 'Green Tea', type: 'Drink', price: '$2.95', inventory: 35, created: '2023-04-15' },
  { id: 'PROD-010', name: 'Quinoa Breakfast Bowl', type: 'Breakfast', price: '$9.95', inventory: 'Out of Stock', created: '2023-04-18' },
];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
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
    let result = mockProducts;

    if (term) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.id.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (type) {
      result = result.filter(product => product.type === type);
    }

    setFilteredProducts(result);
  };

  const onSubmit = (data: ProductFormValues) => {
    // In a real app, this would be an API call
    console.log(data);
    toast.success("Product added successfully!");
    setShowAddDialog(false);
    form.reset();
  };

  const productTypes = [...new Set(mockProducts.map(product => product.type))];

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
                            <SelectItem key={type} value={type}>{type}</SelectItem>
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
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.inventory}</TableCell>
                <TableCell>{product.created}</TableCell>
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
    </div>
  );
}
