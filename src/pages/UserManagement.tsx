import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield } from "lucide-react";

type AppRole = 'owner' | 'manager' | 'staff';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: AppRole | null;
  created_at: string;
}

const UserManagement = () => {
  const { hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !hasRole('owner')) {
      navigate("/dashboard");
    }
  }, [authLoading, hasRole, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
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
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
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

  const getRoleBadgeVariant = (role: AppRole | null) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'staff':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: AppRole | null) => {
    switch (role) {
      case 'owner':
        return 'Chủ sở hữu';
      case 'manager':
        return 'Quản lý';
      case 'staff':
        return 'Nhân viên';
      default:
        return 'Chưa có vai trò';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Quản lý Người dùng & Phân quyền
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý vai trò và quyền truy cập của người dùng trong hệ thống
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Danh sách người dùng
            </CardTitle>
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || ''}
                        onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Chủ sở hữu</SelectItem>
                          <SelectItem value="manager">Quản lý</SelectItem>
                          <SelectItem value="staff">Nhân viên</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                Toàn quyền truy cập: Quản lý người dùng, nhân viên, sản phẩm, đơn hàng, nhà cung cấp, chấm công
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
                Xem danh sách sản phẩm, khách hàng, đơn hàng. Tạo đơn hàng mới và quản lý kho
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
