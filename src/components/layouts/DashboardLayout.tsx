import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Package,
  Users,
  UserCog,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Truck,
  ClipboardList,
  Shield,
  Package2,
} from "lucide-react";
import logo from "@/assets/hoang-gia-logo.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { signOut, user, userRole, hasRole } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Trang chủ", path: "/dashboard", roles: ['owner', 'manager', 'staff'] },
    { icon: Shield, label: "Quản lý người dùng", path: "/users", roles: ['owner'] },
    { icon: Package, label: "Sản phẩm", path: "/products", roles: ['owner', 'manager', 'staff'] },
    { icon: Package2, label: "Nhập/Xuất kho", path: "/inventory", roles: ['owner', 'manager', 'staff'] },
    { icon: Truck, label: "Nhà cung cấp", path: "/suppliers", roles: ['owner', 'manager'] },
    { icon: UserCog, label: "Nhân viên", path: "/employees", roles: ['owner', 'manager'] },
    { icon: Users, label: "Khách hàng", path: "/customers", roles: ['owner', 'manager', 'staff'] },
    { icon: ShoppingCart, label: "Bán hàng", path: "/sales", roles: ['owner', 'manager', 'staff'] },
    { icon: ClipboardList, label: "Đơn hàng", path: "/orders", roles: ['owner', 'manager', 'staff'] },
    { icon: BarChart3, label: "Báo cáo", path: "/reports", roles: ['owner', 'manager'] },
    { icon: Settings, label: "Cài đặt", path: "/settings", roles: ['owner', 'manager', 'staff'] },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    !item.roles || hasRole(item.roles as any)
  );

  const getRoleLabel = () => {
    switch (userRole) {
      case 'owner':
        return 'Chủ sở hữu';
      case 'manager':
        return 'Quản lý';
      case 'staff':
        return 'Nhân viên';
      default:
        return 'Người dùng';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-sidebar border-r border-sidebar-border`}
        style={{ width: "280px" }}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
            <img src={logo} alt="Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">Hoàng Gia</h1>
              <p className="text-xs text-sidebar-foreground/70">Quản lý nội thất</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4">
            <ul className="space-y-2">
              {visibleMenuItems.map((item, index) => (
                <li key={index}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-[280px]" : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-foreground hover:bg-secondary"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
