import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Employee = {
  id: string;
  code: string;
  full_name: string;
  position: string;
  phone: string | null;
  email: string | null;
  base_salary: number;
  start_date: string;
  birth_year: number | null;
  id_number: string | null;
  hometown: string | null;
  current_address: string | null;
};

export default function Employees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    full_name: '',
    position: '',
    phone: '',
    email: '',
    base_salary: 0,
    start_date: '',
    birth_year: '',
    id_number: '',
    hometown: '',
    current_address: '',
  });

  const canManage = hasRole(['owner', 'manager']);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Employee[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('employees').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Thêm nhân viên thành công' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Lỗi khi thêm nhân viên', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('employees').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Cập nhật nhân viên thành công' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Lỗi khi cập nhật nhân viên', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Xóa nhân viên thành công' });
    },
    onError: () => {
      toast({ title: 'Lỗi khi xóa nhân viên', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      full_name: '',
      position: '',
      phone: '',
      email: '',
      base_salary: 0,
      start_date: '',
      birth_year: '',
      id_number: '',
      hometown: '',
      current_address: '',
    });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
    };
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      code: employee.code,
      full_name: employee.full_name,
      position: employee.position,
      phone: employee.phone || '',
      email: employee.email || '',
      base_salary: employee.base_salary,
      start_date: employee.start_date,
      birth_year: employee.birth_year?.toString() || '',
      id_number: employee.id_number || '',
      hometown: employee.hometown || '',
      current_address: employee.current_address || '',
    });
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEmployee ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Mã nhân viên</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">Họ và tên</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Chức vụ</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="birth_year">Năm sinh</Label>
                      <Input
                        id="birth_year"
                        type="number"
                        value={formData.birth_year}
                        onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="id_number">CMND/CCCD</Label>
                      <Input
                        id="id_number"
                        value={formData.id_number}
                        onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="base_salary">Lương cơ bản</Label>
                      <Input
                        id="base_salary"
                        type="number"
                        value={formData.base_salary}
                        onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_date">Ngày bắt đầu</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hometown">Quê quán</Label>
                      <Input
                        id="hometown"
                        value={formData.hometown}
                        onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="current_address">Địa chỉ hiện tại</Label>
                      <Input
                        id="current_address"
                        value={formData.current_address}
                        onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingEmployee ? 'Cập nhật' : 'Thêm'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Lương</TableHead>
                  {canManage && <TableHead>Thao tác</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.code}</TableCell>
                    <TableCell>{employee.full_name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.base_salary.toLocaleString()} đ</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
