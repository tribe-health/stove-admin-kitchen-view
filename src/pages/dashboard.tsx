import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Package, MapPin, ArrowRight } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@/store/use-order-store";
import { Product } from "@/store/use-product-store";

export default function Dashboard() {
  const navigate = useNavigate();
  const { orders, formatOrderDate, formatCurrency } = useOrders();
  const { products } = useProducts();
  
  // Placeholder for sites and users since hooks aren't implemented yet
  const sites = [];
  const users = [];
  
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [popularProducts, setPopularProducts] = useState<{id: string, name: string, price: number, orders: number}[]>([]);
  
  useEffect(() => {
    // Get the 5 most recent orders
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRecentOrders(sortedOrders.slice(0, 5));
    
    // Calculate popular products based on order items
    if (orders.length > 0 && products.length > 0) {
      const productOrderCounts: Record<string, number> = {};
      
      // Count orders for each product
      orders.forEach(order => {
        order.order_items.forEach(item => {
          if (productOrderCounts[item.product_id]) {
            productOrderCounts[item.product_id] += item.quantity;
          } else {
            productOrderCounts[item.product_id] = item.quantity;
          }
        });
      });
      
      // Create array of products with order counts
      const productPopularity = Object.entries(productOrderCounts).map(([productId, count]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product ? product.name : 'Unknown Product',
          price: product ? product.unit_price : 0,
          orders: count
        };
      });
      
      // Sort by order count and take top 3
      const topProducts = productPopularity
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 3);
      
      setPopularProducts(topProducts);
    }
  }, [orders, products]);
  
  const getStatusBadge = (status: OrderStatus) => {
    const statusVariants: Record<OrderStatus, string> = {
      placed: "outline",
      in_progress: "secondary",
      made: "secondary",
      out_for_delivery: "secondary",
      delivered: "default",
      canceled: "destructive",
      error: "destructive",
    };
    
    return <Badge variant={statusVariants[status] as any}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the FoodOnTheStove admin portal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {orders.length > 0 ? `Latest: ${formatOrderDate(orders[0].created_at).split(',')[0]}` : 'No orders yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Available products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sites.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active locations
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between border-b pb-4 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Order #{order.id.substring(0, 8)}</p>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.user.first_name} {order.user.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground">{formatOrderDate(order.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No orders found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Popular Products</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularProducts.length > 0 ? (
                popularProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                    onClick={() => navigate(`/products/edit/${product.id}`)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(product.price)} - {product.orders} orders
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No product data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
