
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

interface Order {
  id: string;
  customer: string;
  date: string;
  status: 'placed' | 'in_progress' | 'made' | 'out_for_delivery' | 'delivered' | 'canceled' | 'error';
  total: string;
  items: number;
}

const mockOrders: Order[] = [
  { id: 'ORD-1234', customer: 'John Smith', date: '2023-04-25 10:30 AM', status: 'delivered', total: '$65.99', items: 3 },
  { id: 'ORD-1233', customer: 'Sarah Johnson', date: '2023-04-25 09:15 AM', status: 'out_for_delivery', total: '$42.50', items: 2 },
  { id: 'ORD-1232', customer: 'Michael Brown', date: '2023-04-24 03:45 PM', status: 'made', total: '$89.95', items: 4 },
  { id: 'ORD-1231', customer: 'Emma Davis', date: '2023-04-24 01:20 PM', status: 'in_progress', total: '$34.99', items: 1 },
  { id: 'ORD-1230', customer: 'Robert Wilson', date: '2023-04-24 11:10 AM', status: 'placed', total: '$76.25', items: 3 },
  { id: 'ORD-1229', customer: 'Jennifer Lee', date: '2023-04-23 04:30 PM', status: 'canceled', total: '$52.75', items: 2 },
  { id: 'ORD-1228', customer: 'David Taylor', date: '2023-04-23 02:15 PM', status: 'error', total: '$28.50', items: 1 },
  { id: 'ORD-1227', customer: 'Linda Anderson', date: '2023-04-23 10:45 AM', status: 'delivered', total: '$104.99', items: 5 },
  { id: 'ORD-1226', customer: 'James Martin', date: '2023-04-22 03:30 PM', status: 'delivered', total: '$47.25', items: 2 },
  { id: 'ORD-1225', customer: 'Patricia White', date: '2023-04-22 01:15 PM', status: 'delivered', total: '$63.75', items: 3 },
];

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (term: string, status: string) => {
    let result = mockOrders;

    if (term) {
      result = result.filter(order => 
        order.id.toLowerCase().includes(term.toLowerCase()) ||
        order.customer.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (status) {
      result = result.filter(order => order.status === status);
    }

    setFilteredOrders(result);
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig: Record<Order['status'], { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
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
              <TableHead>Customer</TableHead>
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
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{order.total}</TableCell>
                <TableCell>{order.items}</TableCell>
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
