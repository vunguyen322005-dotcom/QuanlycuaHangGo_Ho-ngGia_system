import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  todayOrders: number;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'manager' | 'staff' | null;
  created_at: string;
}

interface AdminOverviewProps {
  stats: SystemStats;
  users: UserWithRole[];
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
}) => (
  <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs text-success">
          <TrendingUp className="h-3 w-3" />
          <span>{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const getRoleLabel = (role: string | null) => {
  switch (role) {
    case 'owner': return 'Chủ sở hữu';
    case 'manager': return 'Quản lý';
    case 'staff': return 'Nhân viên';
    default: return 'Chưa phân quyền';
  }
};

const getRoleBadgeVariant = (role: string | null): "default" | "secondary" | "outline" => {
  switch (role) {
    case 'owner': return 'default';
    case 'manager': return 'secondary';
    default: return 'outline';
  }
};

export default function AdminOverview({ stats, users }: AdminOverviewProps) {
  const systemServices = [
    { name: "Database", status: "online" },
    { name: "Authentication", status: "online" },
    { name: "Storage", status: "online" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Người dùng"
          value={stats.totalUsers}
          subtitle="tài khoản hoạt động"
          icon={Users}
        />
        <StatCard
          title="Sản phẩm"
          value={stats.totalProducts}
          subtitle="trong kho hàng"
          icon={Package}
        />
        <StatCard
          title="Đơn hôm nay"
          value={stats.todayOrders}
          subtitle={`tổng ${stats.totalOrders} đơn`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Doanh thu"
          value={`${stats.totalRevenue.toLocaleString('vi-VN')} ₫`}
          subtitle={`từ ${stats.totalOrders} đơn hàng`}
          icon={DollarSign}
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Trạng thái hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemServices.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                  <span className="font-medium text-sm">{service.name}</span>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                  Hoạt động
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Người dùng gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {u.full_name?.charAt(0)?.toUpperCase() || u.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{u.full_name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{u.email}</p>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(u.role)} className="text-xs">
                  {getRoleLabel(u.role)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
