import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.email?.split('@')[0] || "Người dùng";
  
  // Authentication is now handled by ProtectedRoute in App.tsx

  const stats = [
    {
      title: "Doanh thu hôm nay",
      value: "45,200,000 ₫",
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Đơn hàng hôm nay",
      value: "23",
      icon: ShoppingCart,
      trend: "+8.2%",
      trendUp: true,
    },
    {
      title: "Sản phẩm trong kho",
      value: "1,247",
      icon: Package,
      trend: "-3 sản phẩm",
      trendUp: false,
    },
    {
      title: "Khách hàng mới",
      value: "8",
      icon: Users,
      trend: "+2 hôm nay",
      trendUp: true,
    },
  ];

  const alerts = [
    {
      id: 1,
      message: "5 sản phẩm sắp hết hàng trong kho",
      type: "warning",
    },
    {
      id: 2,
      message: "3 đơn hàng đang chờ xử lý",
      type: "info",
    },
    {
      id: 3,
      message: "Cần kiểm tra hàng nhập mới từ NCC Thanh Tâm",
      type: "warning",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-primary-foreground shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Chào mừng trở lại, {userName}!</h1>
          <p className="text-primary-foreground/90">
            Đây là tổng quan hoạt động kinh doanh của cửa hàng Hoàng Gia hôm nay
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div
                  className={`flex items-center text-sm ${
                    stat.trendUp ? "text-success" : "text-warning"
                  }`}
                >
                  <TrendingUp
                    className={`h-4 w-4 mr-1 ${!stat.trendUp && "rotate-180"}`}
                  />
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-warning" />
              Thông báo & Cảnh báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                    alert.type === "warning"
                      ? "bg-warning/10 border-warning/30"
                      : "bg-primary/10 border-primary/30"
                  }`}
                >
                  <p className="text-sm text-foreground">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Doanh thu 7 ngày gần nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Biểu đồ doanh thu sẽ được hiển thị tại đây
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top 5 sản phẩm bán chạy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Bàn ăn gỗ hương 6 ghế", sales: 15 },
                  { name: "Tủ rượu gỗ gụ cao cấp", sales: 12 },
                  { name: "Bàn thờ gỗ mun 3 tầng", sales: 10 },
                  { name: "Ghế sofa gỗ trắc", sales: 8 },
                  { name: "Bàn trà gỗ hương", sales: 7 },
                ].map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{product.name}</span>
                    <span className="text-sm font-semibold text-primary">
                      {product.sales} sản phẩm
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
