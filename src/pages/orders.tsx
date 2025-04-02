
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
import { Search, MoreHorizontal, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/use-orders";
import { Order } from "@/store/use-order-store";

type OrderStatus = "placed" | "in_progress" | "made" | "out_for_delivery" | "delivered" | "canceled" | "error";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('placed');
  const { orders } = useOrders();
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (term: string, status: string) => {
    let result = orders;

    if (term) {
      result = result.filter(order => 
        order.user.first_name.toLowerCase().includes(term.toLowerCase()) ||
        order.user.last_name.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (status) {
      result = result.filter(order => order.order_status === status);
    }

    setFilteredOrders(result);
  };

  const getStatusBadge = (status) => {
    const statusConfig: Record<OrderStatus, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
      placed: { variant: "outline", label: "Placed" },
      in_progress: { variant: "secondary", label: "In Progress" },
      made: { variant: "secondary", label: "Made" },
      out_for_delivery: { variant: "secondary", label: "Out For Delivery" },
      delivered: { variant: "default", label: "Delivered" },
      canceled: { variant: "destructive", label: "Canceled" },
      error: { variant: "destructive", label: "Error" },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and view all food orders.</p>
        </div>
        <Button>Export Orders</Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by order ID or customer..." 
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full md:w-auto flex-1"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="made">Made</SelectItem>
              <SelectItem value="out_for_delivery">Out For Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.user.last_name}</TableCell>
                <TableCell>{order.user.first_name}</TableCell>
                <TableCell>{order.created_at}</TableCell>
                <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                <TableCell>{order.total}</TableCell>
                <TableCell>{order.order_items.length}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Update Status</DropdownMenuItem>
                      <DropdownMenuItem>View Customer</DropdownMenuItem>
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
