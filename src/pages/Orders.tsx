import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Printer, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReactToPrint } from 'react-to-print';

type Order = {
  id: string;
  code: string;
  status: string;
  payment_method: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  notes: string | null;
  created_at: string;
  customer_id: string | null;
  employee_id: string | null;
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type Product = {
  id: string;
  code: string;
  name: string;
  selling_price: number;
  quantity: number;
};

type Customer = {
  id: string;
  code: string;
  full_name: string;
  phone: string;
};

type OrderFormData = {
  code: string;
  customer_id: string;
  payment_method: string;
  discount: number;
  notes: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
};

export default function Orders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewingOrder, setViewingOrder] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<OrderFormData>({
    code: '',
    customer_id: '',
    payment_method: 'cash',
    discount: 0,
    notes: '',
    items: [],
  });

  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);

  const canManage = hasRole(['owner', 'manager']);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, code, name, selling_price, quantity')
        .gt('quantity', 0);
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-for-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, code, full_name, phone');
      if (error) throw error;
      return data as Customer[];
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const finalAmount = totalAmount - data.discount;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          code: data.code,
          customer_id: data.customer_id || null,
          employee_id: user?.id || null,
          payment_method: data.payment_method,
          status: 'pending',
          total_amount: totalAmount,
          discount: data.discount,
          final_amount: finalAmount,
          notes: data.notes,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = data.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create inventory transactions for each item
      for (const item of data.items) {
        await supabase.from('inventory_transactions').insert({
          code: `OUT-${order.code}-${item.product_id.slice(0, 8)}`,
          type: 'out',
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          order_id: order.id,
          created_by: user?.id,
          notes: `Xuất kho cho đơn hàng ${order.code}`,
        });

        // Update product quantity
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ quantity: product.quantity - item.quantity })
            .eq('id', item.product_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products-for-orders'] });
      toast({ title: 'Tạo đơn hàng thành công' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Lỗi khi tạo đơn hàng', variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Cập nhật trạng thái thành công' });
    },
    onError: () => {
      toast({ title: 'Lỗi khi cập nhật trạng thái', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      customer_id: '',
      payment_method: 'cash',
      discount: 0,
      notes: '',
      items: [],
    });
    setSelectedProduct('');
    setProductQuantity(1);
  };

  const addProductToOrder = () => {
    if (!selectedProduct) return;
    
    const product = products?.find(p => p.id === selectedProduct);
    if (!product) return;

    if (productQuantity > product.quantity) {
      toast({ title: 'Số lượng vượt quá tồn kho', variant: 'destructive' });
      return;
    }

    const existingItem = formData.items.find(item => item.product_id === selectedProduct);
    if (existingItem) {
      setFormData({
        ...formData,
        items: formData.items.map(item =>
          item.product_id === selectedProduct
            ? { ...item, quantity: item.quantity + productQuantity }
            : item
        ),
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            product_id: product.id,
            product_name: product.name,
            quantity: productQuantity,
            unit_price: product.selling_price,
          },
        ],
      });
    }

    setSelectedProduct('');
    setProductQuantity(1);
  };

  const removeProductFromOrder = (productId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.product_id !== productId),
    });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const finalAmount = totalAmount - formData.discount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({ title: 'Vui lòng thêm sản phẩm vào đơn hàng', variant: 'destructive' });
      return;
    }
    createOrderMutation.mutate(formData);
  };

  const viewOrderDetails = async (orderId: string) => {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (order && items) {
      setViewingOrder({ order, items });
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      processing: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Quản lý đơn hàng</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tạo đơn hàng
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo đơn hàng mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Mã đơn hàng</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer">Khách hàng</Label>
                    <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Phương thức thanh toán</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tiền mặt</SelectItem>
                        <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                        <SelectItem value="card">Thẻ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount">Giảm giá</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Thêm sản phẩm</Label>
                  <div className="flex gap-2">
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.selling_price.toLocaleString()}đ (Kho: {product.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                      className="w-24"
                      placeholder="SL"
                    />
                    <Button type="button" onClick={addProductToOrder}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {formData.items.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Số lượng</TableHead>
                          <TableHead>Đơn giá</TableHead>
                          <TableHead>Thành tiền</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item) => (
                          <TableRow key={item.product_id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit_price.toLocaleString()}đ</TableCell>
                            <TableCell>{(item.quantity * item.unit_price).toLocaleString()}đ</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProductFromOrder(item.product_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tổng tiền:</span>
                        <span className="font-medium">{totalAmount.toLocaleString()}đ</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Giảm giá:</span>
                        <span className="font-medium">-{formData.discount.toLocaleString()}đ</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Thành tiền:</span>
                        <span className="text-primary">{finalAmount.toLocaleString()}đ</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">Tạo đơn hàng</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('all')}
          >
            Tất cả
          </Button>
          <Button
            variant={selectedStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('pending')}
          >
            Chờ xử lý
          </Button>
          <Button
            variant={selectedStatus === 'processing' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('processing')}
          >
            Đang xử lý
          </Button>
          <Button
            variant={selectedStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('completed')}
          >
            Hoàn thành
          </Button>
          <Button
            variant={selectedStatus === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('cancelled')}
          >
            Đã hủy
          </Button>
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
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.code}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.total_amount.toLocaleString()}đ</TableCell>
                    <TableCell>{order.discount.toLocaleString()}đ</TableCell>
                    <TableCell className="font-bold">{order.final_amount.toLocaleString()}đ</TableCell>
                    <TableCell>{order.payment_method}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewOrderDetails(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && order.status !== 'completed' && (
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ xử lý</SelectItem>
                              <SelectItem value="processing">Đang xử lý</SelectItem>
                              <SelectItem value="completed">Hoàn thành</SelectItem>
                              <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Chi tiết đơn hàng {viewingOrder?.order.code}</span>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                In hóa đơn
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div ref={printRef} className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">HÓA ĐƠN BÁN HÀNG</h2>
              <p className="text-sm text-muted-foreground">Mã đơn: {viewingOrder?.order.code}</p>
              <p className="text-sm text-muted-foreground">
                Ngày: {viewingOrder?.order.created_at && new Date(viewingOrder.order.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Trạng thái:</p>
                <p>{viewingOrder?.order.status}</p>
              </div>
              <div>
                <p className="font-semibold">Phương thức thanh toán:</p>
                <p>{viewingOrder?.order.payment_method}</p>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingOrder?.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit_price.toLocaleString()}đ</TableCell>
                      <TableCell>{item.total_price.toLocaleString()}đ</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Tổng tiền:</span>
                <span className="font-medium">{viewingOrder?.order.total_amount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Giảm giá:</span>
                <span className="font-medium">-{viewingOrder?.order.discount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Thành tiền:</span>
                <span className="text-primary">{viewingOrder?.order.final_amount.toLocaleString()}đ</span>
              </div>
            </div>

            {viewingOrder?.order.notes && (
              <div>
                <p className="font-semibold mb-1">Ghi chú:</p>
                <p className="text-sm text-muted-foreground">{viewingOrder.order.notes}</p>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground pt-6 print:block hidden">
              <p>Cảm ơn quý khách đã mua hàng!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
