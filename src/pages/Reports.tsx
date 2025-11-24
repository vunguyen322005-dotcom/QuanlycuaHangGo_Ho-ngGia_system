import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, TrendingUp, DollarSign, ShoppingCart, Package } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";

interface OrderData {
  id: string;
  code: string;
  total_amount: number;
  final_amount: number;
  discount: number;
  created_at: string;
  status: string;
}

interface OrderItemData {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports = () => {
  const [periodType, setPeriodType] = useState<string>("month");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  // Fetch orders
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-report", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59")
        .eq("status", "completed")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as OrderData[];
    },
  });

  // Fetch order items
  const { data: orderItems } = useQuery({
    queryKey: ["order-items-report", orders],
    queryFn: async () => {
      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map(o => o.id);
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (error) throw error;
      return data as OrderItemData[];
    },
    enabled: !!orders && orders.length > 0,
  });

  // Calculate statistics
  const totalRevenue = orders?.reduce((sum, order) => sum + order.final_amount, 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalDiscount = orders?.reduce((sum, order) => sum + order.discount, 0) || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Revenue by day/month
  const revenueByPeriod = orders?.reduce((acc: any[], order) => {
    const date = format(new Date(order.created_at), periodType === "day" ? "dd/MM/yyyy" : "MM/yyyy");
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.revenue += order.final_amount;
      existing.orders += 1;
    } else {
      acc.push({
        date,
        revenue: order.final_amount,
        orders: 1,
      });
    }
    
    return acc;
  }, []) || [];

  // Top selling products
  const productStats = orderItems?.reduce((acc: any[], item) => {
    const existing = acc.find(p => p.product_id === item.product_id);
    
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += item.total_price;
      existing.orders += 1;
    } else {
      acc.push({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        revenue: item.total_price,
        orders: 1,
      });
    }
    
    return acc;
  }, []) || [];

  const topProducts = [...productStats].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Category distribution (simplified - using product names)
  const categoryData = topProducts.slice(0, 5).map(product => ({
    name: product.product_name,
    value: product.revenue,
  }));

  const handlePeriodChange = (value: string) => {
    setPeriodType(value);
    const now = new Date();
    
    switch (value) {
      case "week":
        setStartDate(format(subDays(now, 7), "yyyy-MM-dd"));
        setEndDate(format(now, "yyyy-MM-dd"));
        break;
      case "month":
        setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "year":
        setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
        setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
        break;
    }
  };

  const exportToExcel = () => {
    // Prepare revenue data
    const revenueSheet = revenueByPeriod.map(item => ({
      "Ngày": item.date,
      "Doanh thu": item.revenue,
      "Số đơn": item.orders,
    }));

    // Prepare top products data
    const productsSheet = topProducts.map((item, index) => ({
      "Thứ hạng": index + 1,
      "Sản phẩm": item.product_name,
      "Số lượng bán": item.quantity,
      "Doanh thu": item.revenue,
      "Số đơn hàng": item.orders,
    }));

    // Prepare summary data
    const summarySheet = [
      { "Chỉ số": "Tổng doanh thu", "Giá trị": totalRevenue },
      { "Chỉ số": "Tổng đơn hàng", "Giá trị": totalOrders },
      { "Chỉ số": "Giá trị đơn TB", "Giá trị": averageOrderValue },
      { "Chỉ số": "Tổng giảm giá", "Giá trị": totalDiscount },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.json_to_sheet(summarySheet);
    XLSX.utils.book_append_sheet(wb, ws1, "Tổng quan");
    
    const ws2 = XLSX.utils.json_to_sheet(revenueSheet);
    XLSX.utils.book_append_sheet(wb, ws2, "Doanh thu theo thời gian");
    
    const ws3 = XLSX.utils.json_to_sheet(productsSheet);
    XLSX.utils.book_append_sheet(wb, ws3, "Sản phẩm bán chạy");

    // Export
    const fileName = `BaoCaoDoanhThu_${format(new Date(), "ddMMyyyy_HHmmss")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Báo cáo doanh thu</h1>
            <p className="text-muted-foreground">Thống kê và phân tích doanh thu</p>
          </div>
          <Button onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Khoảng thời gian</Label>
            <Select value={periodType} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 ngày qua</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="year">Năm này</SelectItem>
                <SelectItem value="custom">Tùy chỉnh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Từ ngày</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Đến ngày</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giá trị đơn TB</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(averageOrderValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sản phẩm bán</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Doanh thu theo thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center items-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(value)
                      }
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Số đơn hàng theo thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center items-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Số đơn" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Phân bổ doanh thu theo sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center items-center h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(value)
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm bán chạy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thứ hạng</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>SL</TableHead>
                      <TableHead>Doanh thu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product, index) => (
                      <TableRow key={product.product_id}>
                        <TableCell className="font-bold">#{index + 1}</TableCell>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(product.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
