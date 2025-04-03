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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Filter, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/use-orders";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Order } from "@/store/use-order-store";

import { OrderStatus } from "@/store/use-order-store";

export default function Orders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { orders, removeOrder, formatOrderDate, formatCurrency } = useOrders();
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(searchTerm, status);
  };

  useEffect(() => {
    // Only apply filters if orders array exists and has items
    if (orders && orders.length >= 0) {
      applyFilters(searchTerm, statusFilter);
    }
  }, [orders, searchTerm, statusFilter]);

  const applyFilters = (term: string, status: string) => {
    // Check if orders exist before trying to filter them
    if (!orders || orders.length === 0) {
      setFilteredOrders([]);
      return;
    }
    
    let result = [...orders];

    if (term) {
      result = result.filter(order =>
        order.user?.first_name?.toLowerCase().includes(term.toLowerCase()) ||
        order.user?.last_name?.toLowerCase().includes(term.toLowerCase()) ||
        order.id.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (status && status !== 'all') {
      result = result.filter(order => order.order_status === status);
    }

    setFilteredOrders(result);
  };

  const handleDeleteOrder = async (id: string) => {
    setIsDeleting(true);
    const success = await removeOrder(id);
    if (success) {
      setOrderToDelete(null);
    }
    setIsDeleting(false);
  };

  const handleViewOrder = (id: string) => {
    navigate(`/orders/${id}`);
  };

  const handleEditOrder = (id: string) => {
    navigate(`/orders/edit/${id}`);
  };

  const getStatusBadge = (status: OrderStatus) => {
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
          <Button>Export Orders</Button>
        </div>
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

      {filteredOrders.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all'
              ? "No orders match your current filters. Try adjusting your search criteria."
              : "There are no orders in the system yet."}
          </p>
        </div>
      ) : (
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
                  <TableCell>{formatOrderDate(order.created_at)}</TableCell>
                  <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Order
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              setOrderToDelete(order.id);
                            }}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Order
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the order and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setOrderToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      ) : (
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
                <TableCell>{formatOrderDate(order.created_at)}</TableCell>
                <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Order
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault();
                            setOrderToDelete(order.id);
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Order
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the order and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setOrderToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
