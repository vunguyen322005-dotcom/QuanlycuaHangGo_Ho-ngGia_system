import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, BarChart3, Users, Settings, RefreshCw } from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminSystem from "@/components/admin/AdminSystem";

type AppRole = 'owner' | 'manager' | 'staff';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: AppRole | null;
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  todayOrders: number;
}

const AdminPanel = () => {
  const { hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0, totalProducts: 0, totalOrders: 0,
    totalCustomers: 0, totalRevenue: 0, todayOrders: 0,
  });

  useEffect(() => {
    if (!authLoading && !hasRole('owner')) navigate("/dashboard");
  }, [authLoading, hasRole, navigate]);

  useEffect(() => {
    if (hasRole('owner')) fetchData();
  }, [authLoading]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchStats()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, created_at'),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      setUsers((profiles || []).map(p => ({
        id: p.id, email: p.email, full_name: p.full_name, created_at: p.created_at,
        role: (roles || []).find(r => r.user_id === p.id)?.role as AppRole | null ?? null,
      })));
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải danh sách người dùng", variant: "destructive" });
    }
  };

  const fetchStats = async () => {
    try {
      const [profilesRes, productsRes, ordersRes, customersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, final_amount, created_at'),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
      ]);
      const today = new Date().toISOString().split('T')[0];
      setStats({
        totalUsers: profilesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalCustomers: customersRes.count || 0,
        totalRevenue: ordersRes.data?.reduce((s, o) => s + (o.final_amount || 0), 0) || 0,
        todayOrders: ordersRes.data?.filter(o => o.created_at.startsWith(today)).length || 0,
      });
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              Bảng điều khiển Admin
            </h1>
            <p className="text-muted-foreground mt-2 ml-14">
              Quản lý toàn bộ hệ thống, người dùng và cài đặt
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              Người dùng
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2 data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" />
              Hệ thống
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview stats={stats} users={users} />
          </TabsContent>

          <TabsContent value="users">
            <AdminUserManagement users={users} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="system">
            <AdminSystem />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
