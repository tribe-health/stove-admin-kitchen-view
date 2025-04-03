import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrders } from "@/hooks/use-orders";
import { Order, OrderStatus } from "@/store/use-order-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ViewOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getOrderById, formatOrderDate, formatCurrency } = useOrders();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const orderData = await getOrderById(id);
        
        // Only update state if we have valid order data
        if (orderData) {
          setOrder(orderData);
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
  }, [id, navigate, toast]);

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
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.id.substring(0, 8)}</h1>
          {getStatusBadge(order.order_status)}
        </div>
        <Button onClick={() => navigate(`/orders/edit/${order.id}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>View order information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p className="text-sm font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                <p className="text-sm font-medium">{formatOrderDate(order.created_at)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Order Status</p>
              <div className="mt-1">{getStatusBadge(order.order_status)}</div>
            </div>
            
            {order.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm mt-1">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Customer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm font-medium">{order.user.first_name} {order.user.last_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{order.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{order.user.phone_number || "N/A"}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Location Name</p>
                  <p className="text-sm font-medium">{order.delivery_location.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">
                    {order.delivery_location.address.address1}<br />
                    {order.delivery_location.address.city}, {order.delivery_location.address.state} {order.delivery_location.address.zip}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Time</p>
                    <p className="text-sm font-medium">{order.delivery_location.start_open_time}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Close Time</p>
                    <p className="text-sm font-medium">{order.delivery_location.end_open_time}</p>
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