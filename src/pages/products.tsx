import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Search, MoreHorizontal, Plus, Package, Edit, Eye } from "lucide-react";
import { Product } from "@/store/use-product-store";
import { useProducts } from "@/hooks/use-products";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  const navigate = useNavigate();
  const { products, isLoading } = useProducts();

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

  // Navigate to create product page
  const handleAddProduct = () => {
    navigate("/products/create");
  };

  // Navigate to edit product page
  const handleEditProduct = (product: Product) => {
    navigate(`/products/edit/${product.id}`);
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
  }, [products, searchTerm, typeFilter]);

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
        
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
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
              <TableRow 
                key={product.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleEditProduct(product)}
              >
                <TableCell className="font-medium" onClick={(e) => e.stopPropagation()}>
                  {product.photo_url ? (
                    <img 
                      alt={product.name} 
                      src={product.photo_url} 
                      className="h-10 w-10 object-cover rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(product);
                      }}
                    />
                  ) : (
                    <div 
                      className="h-10 w-10 bg-muted rounded-md flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(product);
                      }}
                    >
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
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Product
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
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
