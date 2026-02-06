import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, UserPlus, Trash2, Shield, UserCog, User, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = 'owner' | 'manager' | 'staff';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: AppRole | null;
  created_at: string;
}

interface Props {
  users: UserWithRole[];
  onRefresh: () => void;
}

const getRoleLabel = (role: AppRole | null) => {
  switch (role) {
    case 'owner': return 'Chủ sở hữu';
    case 'manager': return 'Quản lý';
    case 'staff': return 'Nhân viên';
    default: return 'Chưa phân quyền';
  }
};

const getRoleIcon = (role: AppRole | null) => {
  switch (role) {
    case 'owner': return Shield;
    case 'manager': return UserCog;
    default: return User;
  }
};

const getRoleBadgeVariant = (role: AppRole | null): "default" | "secondary" | "outline" => {
  switch (role) {
    case 'owner': return 'default';
    case 'manager': return 'secondary';
    default: return 'outline';
  }
};

export default function AdminUserManagement({ users, onRefresh }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', role: 'staff' as AppRole,
  });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetUserEmail, setResetUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { full_name: formData.fullName } },
      });
      if (error) throw error;
      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles').insert({ user_id: data.user.id, role: formData.role });
        if (roleError) throw roleError;
      }
      toast({ title: "Thành công", description: "Đã tạo tài khoản mới" });
      setIsDialogOpen(false);
      setFormData({ email: '', password: '', fullName: '', role: 'staff' });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể tạo tài khoản", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).single();
      if (existing) {
        const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
      toast({ title: "Thành công", description: "Đã cập nhật vai trò" });
      onRefresh();
    } catch {
      toast({ title: "Lỗi", description: "Không thể cập nhật vai trò", variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu phải có ít nhất 6 ký tự", variant: "destructive" });
      return;
    }
    setIsResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://tixbvquszwqfewhuknkw.supabase.co/functions/v1/admin-reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId: resetUserId, newPassword }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast({ title: "Thành công", description: `Đã đặt lại mật khẩu cho ${resetUserEmail}` });
      setResetPasswordOpen(false);
      setNewPassword("");
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể đặt lại mật khẩu", variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === user?.id) {
      toast({ title: "Lỗi", description: "Không thể xóa tài khoản của chính mình", variant: "destructive" });
      return;
    }
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      toast({ title: "Thành công", description: "Đã xóa người dùng" });
      onRefresh();
    } catch {
      toast({ title: "Lỗi", description: "Không thể xóa người dùng", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Quản lý người dùng
              </CardTitle>
              <CardDescription className="mt-1">
                {users.length} tài khoản trong hệ thống
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Thêm
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo tài khoản mới</DialogTitle>
                    <DialogDescription>Điền thông tin để tạo tài khoản người dùng</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Họ và tên</Label>
                      <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Nguyễn Văn A" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mật khẩu</Label>
                      <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vai trò</Label>
                      <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as AppRole })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Chủ sở hữu</SelectItem>
                          <SelectItem value="manager">Quản lý</SelectItem>
                          <SelectItem value="staff">Nhân viên</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreate} disabled={isCreating}>
                      {isCreating ? "Đang tạo..." : "Tạo tài khoản"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const RoleIcon = getRoleIcon(u.role);
                  return (
                    <TableRow key={u.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                            {u.full_name?.charAt(0)?.toUpperCase() || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.full_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)} className="gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {getRoleLabel(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Select value={u.role || ''} onValueChange={(v) => handleRoleChange(u.id, v as AppRole)}>
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue placeholder="Chọn" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Chủ sở hữu</SelectItem>
                              <SelectItem value="manager">Quản lý</SelectItem>
                              <SelectItem value="staff">Nhân viên</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setResetUserId(u.id);
                              setResetUserEmail(u.email);
                              setNewPassword("");
                              setResetPasswordOpen(true);
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={u.id === user?.id}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc muốn xóa tài khoản "{u.email}"? Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>Đặt mật khẩu mới cho {resetUserEmail}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mật khẩu mới</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>Hủy</Button>
            <Button onClick={handleResetPassword} disabled={isResetting}>
              {isResetting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Permissions Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phân quyền hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: 'owner' as const, label: 'Chủ sở hữu', desc: 'Toàn quyền quản trị hệ thống, quản lý người dùng và cài đặt', color: 'border-primary bg-primary/5' },
              { role: 'manager' as const, label: 'Quản lý', desc: 'Quản lý nhân viên, sản phẩm, đơn hàng, nhà cung cấp, chấm công', color: 'border-secondary bg-secondary/30' },
              { role: 'staff' as const, label: 'Nhân viên', desc: 'Xem sản phẩm, khách hàng, đơn hàng và quản lý kho hàng', color: 'border-muted bg-muted/30' },
            ].map((item) => {
              const Icon = getRoleIcon(item.role);
              return (
                <div key={item.role} className={`rounded-xl border-2 p-5 ${item.color} transition-all hover:shadow-md`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{item.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
