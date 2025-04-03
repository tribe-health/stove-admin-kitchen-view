import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrders } from "@/hooks/use-orders";
import { Order, OrderItem, OrderStatus } from "@/store/use-order-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EditOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getOrderById, updateOrderDetails, changeOrderStatus, removeOrder, formatOrderDate, formatCurrency } = useOrders();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<OrderStatus>("placed");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const orderData = await getOrderById(id);
        
        // Only update state if we have valid order data
        if (orderData) {
          setOrder(orderData);
          setNotes(orderData.notes || "");
          setStatus(orderData.order_status);
          setLoading(false);
        } else {
          // Don't set loading to false yet to prevent UI flash
          toast({
            title: "Order not found",
            description: "The requested order could not be found.",
            variant: "destructive",
          });
          // Navigate without updating loading state to prevent UI flash
          navigate("/orders");
        }
      } catch (error) {
        toast({
          title: "Error loading order",
          description: `There was an error loading the order: ${(error as Error).message}`,
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, getOrderById, navigate, toast]);

  const handleSave = async () => {
    if (!order || !id) return;
    
    try {
      setSaving(true);
      const updatedOrder = await updateOrderDetails(id, {
        notes,
        order_status: status,
      });
      
      if (updatedOrder) {
        setOrder(updatedOrder);
        toast({
          title: "Order updated",
          description: "The order has been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error saving order",
        description: `There was an error saving the order: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || !id) return;
    
    try {
      setStatus(newStatus);
      await changeOrderStatus(id, newStatus);
    } catch (error) {
      toast({
        title: "Error changing status",
        description: `There was an error changing the order status: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!order || !id) return;
    
    try {
      setDeleting(true);
      const success = await removeOrder(id);
      
      if (success) {
        navigate("/orders");
      }
    } catch (error) {
      toast({
        title: "Error deleting order",
        description: `There was an error deleting the order: ${(error as Error).message}`,
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  const getStatusBadge = (orderStatus: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
      placed: { variant: "outline", label: "Placed" },
      in_progress: { variant: "secondary", label: "In Progress" },
      made: { variant: "secondary", label: "Made" },
      out_for_delivery: { variant: "secondary", label: "Out For Delivery" },
      delivered: { variant: "default", label: "Delivered" },
      canceled: { variant: "destructive", label: "Canceled" },
      error: { variant: "destructive", label: "Error" },
    };

    const config = statusConfig[orderStatus];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading order...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <p className="text-muted-foreground mb-4">The requested order could not be found.</p>
        <Button onClick={() => navigate("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Order #{order.id.substring(0, 8)}</h1>
          {getStatusBadge(order.order_status)}
        </div>
        <div className="flex space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Order
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the order and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>View and edit order information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order-id">Order ID</Label>
                <Input id="order-id" value={order.id} disabled />
              </div>
              <div>
                <Label htmlFor="order-date">Order Date</Label>
                <Input id="order-date" value={formatOrderDate(order.created_at)} disabled />
              </div>
            </div>
            
            <div>
              <Label htmlFor="order-status">Order Status</Label>
              <Select value={status} onValueChange={(value) => handleStatusChange(value as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
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
            
            <div>
              <Label htmlFor="order-notes">Notes</Label>
              <Textarea 
                id="order-notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this order"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Customer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <div className="text-sm font-medium">{order.user.first_name} {order.user.last_name}</div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="text-sm font-medium">{order.user.email}</div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="text-sm font-medium">{order.user.phone_number || "N/A"}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>Items included in this order</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.order_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_id}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">Total Items: {order.order_items.length}</div>
            <div className="space-y-1 text-right">
              <div className="text-sm text-muted-foreground">Subtotal: {formatCurrency(order.subtotal)}</div>
              <div className="text-sm text-muted-foreground">Tax: {formatCurrency(order.tax)}</div>
              <div className="text-lg font-semibold">Total: {formatCurrency(order.total)}</div>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Location</CardTitle>
            <CardDescription>Where this order will be delivered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.delivery_location ? (
              <>
                <div>
                  <Label>Location Name</Label>
                  <div className="text-sm font-medium">{order.delivery_location.name}</div>
                </div>
                <div>
                  <Label>Address</Label>
                  <div className="text-sm font-medium">
                    {order.delivery_location.address.address1}<br />
                    {order.delivery_location.address.city}, {order.delivery_location.address.state} {order.delivery_location.address.zip}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Open Time</Label>
                    <div className="text-sm font-medium">{order.delivery_location.start_open_time}</div>
                  </div>
                  <div>
                    <Label>Close Time</Label>
                    <div className="text-sm font-medium">{order.delivery_location.end_open_time}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No delivery location specified</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}