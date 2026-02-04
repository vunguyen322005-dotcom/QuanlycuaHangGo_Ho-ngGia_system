import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  Database, 
  Key,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
} from "lucide-react";

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
  const { hasRole, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    todayOrders: 0,
  });
  
  // New user dialog
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'staff' as AppRole,
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (!authLoading && !hasRole('owner')) {
      navigate("/dashboard");
    }
  }, [authLoading, hasRole, navigate]);

  useEffect(() => {
    if (hasRole('owner')) {
      fetchData();
    }
  }, [authLoading]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchStats()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole ? userRole.role as AppRole : null,
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive",
      });
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
      const todayOrders = ordersRes.data?.filter(o => 
        o.created_at.startsWith(today)
      ).length || 0;

      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + (o.final_amount || 0), 0) || 0;

      setStats({
        totalUsers: profilesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalCustomers: customersRes.count || 0,
        totalRevenue,
        todayOrders,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò người dùng",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật vai trò",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.fullName) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      // Create user via Supabase Auth Admin API (requires service role)
      // Since we can't use admin API from client, we'll use signUp
      const { data, error } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            full_name: newUserData.fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Add role for the new user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: newUserData.role });

        if (roleError) throw roleError;
      }

      toast({
        title: "Thành công",
        description: "Đã tạo tài khoản mới. Người dùng cần xác nhận email.",
      });

      setIsNewUserDialogOpen(false);
      setNewUserData({ email: '', password: '', fullName: '', role: 'staff' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo tài khoản",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa tài khoản của chính mình",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete user role first
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Delete profile (cascade will handle related data)
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      
      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa người dùng",
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa người dùng",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: AppRole | null) => {
    switch (role) {
      case 'owner': return 'default';
      case 'manager': return 'secondary';
      case 'staff': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: AppRole | null) => {
    switch (role) {
      case 'owner': return 'Chủ sở hữu';
      case 'manager': return 'Quản lý';
      case 'staff': return 'Nhân viên';
      default: return 'Chưa có vai trò';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Bảng điều khiển Admin
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý toàn bộ hệ thống, người dùng và cài đặt
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Người dùng
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" />
              Hệ thống
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tổng người dùng
                  </CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">tài khoản trong hệ thống</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tổng sản phẩm
                  </CardTitle>
                  <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">sản phẩm trong kho</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Đơn hàng hôm nay
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayOrders}</div>
                  <p className="text-xs text-muted-foreground">đơn trong ngày</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tổng doanh thu
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalRevenue.toLocaleString('vi-VN')} ₫
                  </div>
                  <p className="text-xs text-muted-foreground">từ {stats.totalOrders} đơn hàng</p>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Trạng thái hệ thống
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Database</span>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Hoạt động tốt
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Authentication</span>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Hoạt động tốt
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Storage</span>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Hoạt động tốt
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Hoạt động gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-muted-foreground">{u.email}</span>
                        </div>
                        <Badge variant={getRoleBadgeVariant(u.role)} className="text-xs">
                          {getRoleLabel(u.role)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Quản lý người dùng
                  </CardTitle>
                  <CardDescription>
                    Tạo, chỉnh sửa vai trò và xóa tài khoản người dùng
                  </CardDescription>
                </div>
                <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Thêm người dùng
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tạo tài khoản mới</DialogTitle>
                      <DialogDescription>
                        Tạo tài khoản người dùng mới với vai trò được chỉ định
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                          id="fullName"
                          value={newUserData.fullName}
                          onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                          placeholder="Tối thiểu 6 ký tự"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Vai trò</Label>
                        <Select
                          value={newUserData.role}
                          onValueChange={(value) => setNewUserData({ ...newUserData, role: value as AppRole })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Chủ sở hữu</SelectItem>
                            <SelectItem value="manager">Quản lý</SelectItem>
                            <SelectItem value="staff">Nhân viên</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                        {isCreatingUser ? "Đang tạo..." : "Tạo tài khoản"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(u.role)}>
                            {getRoleLabel(u.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(u.created_at).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select
                              value={u.role || ''}
                              onValueChange={(value) => handleRoleChange(u.id, value as AppRole)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Chọn vai trò" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Chủ sở hữu</SelectItem>
                                <SelectItem value="manager">Quản lý</SelectItem>
                                <SelectItem value="staff">Nhân viên</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  disabled={u.id === user?.id}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa tài khoản "{u.email}"? 
                                    Hành động này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Role Permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Quyền hạn theo vai trò</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Badge>Chủ sở hữu</Badge>
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Toàn quyền: Quản lý người dùng, nhân viên, sản phẩm, đơn hàng, nhà cung cấp, chấm công, cài đặt hệ thống
                  </p>
                </div>
                
                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Badge variant="secondary">Quản lý</Badge>
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Quản lý nhân viên, sản phẩm, đơn hàng, nhà cung cấp, chấm công. Không có quyền quản lý người dùng hệ thống
                  </p>
                </div>
                
                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Badge variant="outline">Nhân viên</Badge>
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Xem sản phẩm, khách hàng, đơn hàng. Quản lý kho hàng
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    Thông tin hệ thống
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Phiên bản</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Database</span>
                    <span className="font-medium">Supabase PostgreSQL</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Frontend</span>
                    <span className="font-medium">React + Vite</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">{new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Cài đặt bảo mật
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Row Level Security</p>
                      <p className="text-sm text-muted-foreground">Bảo vệ dữ liệu theo vai trò</p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      Đã bật
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Xác thực email</p>
                      <p className="text-sm text-muted-foreground">Yêu cầu xác nhận email</p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      Đã bật
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Phân quyền</p>
                      <p className="text-sm text-muted-foreground">3 cấp: Owner, Manager, Staff</p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      Đã cấu hình
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Khu vực nguy hiểm
                  </CardTitle>
                  <CardDescription>
                    Các thao tác dưới đây có thể ảnh hưởng đến toàn bộ hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
                    <div>
                      <p className="font-medium">Xóa cache hệ thống</p>
                      <p className="text-sm text-muted-foreground">Làm mới toàn bộ dữ liệu cache</p>
                    </div>
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Xóa cache
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
                    <div>
                      <p className="font-medium">Sao lưu dữ liệu</p>
                      <p className="text-sm text-muted-foreground">Tải xuống bản sao lưu toàn bộ database</p>
                    </div>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Sao lưu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
