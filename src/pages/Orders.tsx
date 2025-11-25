import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Plus, Minus, Printer, ShoppingCart } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface Product {
  id: string;
  code: string;
  name: string;
  selling_price: number;
  quantity: number;
  category: string;
}

interface Customer {
  id: string;
  code: string;
  full_name: string;
  phone: string;
}

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export default function Orders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const { data: products } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: async () => {
      let query = supabase.from('products').select('*').gt('quantity', 0);
      
      if (searchTerm) {
        query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name').limit(10);
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Customer[];
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          code: `DH${Date.now()}`,
          customer_id: orderData.customer_id || null,
          total_amount: orderData.total_amount,
          discount: orderData.discount,
          final_amount: orderData.final_amount,
          payment_method: orderData.payment_method,
          status: 'completed',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = orderData.items.map((item: CartItem) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      for (const item of orderData.items) {
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

      const transactions = orderData.items.map((item: CartItem) => ({
        code: `XT${Date.now()}_${item.product_id.slice(0, 8)}`,
        type: 'out',
        product_id: item.product_id,
        order_id: order.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      await supabase.from('inventory_transactions').insert(transactions);

      return order;
    },
    onSuccess: (order) => {
      toast({
        title: 'Đơn hàng đã được tạo',
        description: `Mã đơn: ${order.code}`,
      });
      setCurrentOrder(order);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast({
          title: 'Không đủ hàng',
          description: 'Số lượng trong kho không đủ',
          variant: 'destructive',
        });
        return;
      }
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: product.selling_price,
          quantity: 1,
          total_price: product.selling_price,
        },
      ]);
    }
    setSearchTerm('');
  };

  const updateQuantity = (product_id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product_id === product_id) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            return {
              ...item,
              quantity: newQuantity,
              total_price: newQuantity * item.unit_price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (product_id: string) => {
    setCart(cart.filter((item) => item.product_id !== product_id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.total_price, 0);
  const finalAmount = totalAmount - discount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Giỏ hàng trống',
        description: 'Vui lòng thêm sản phẩm vào giỏ hàng',
        variant: 'destructive',
      });
      return;
    }

    createOrderMutation.mutate({
      customer_id: selectedCustomer || null,
      items: cart,
      total_amount: totalAmount,
      discount: discount,
      final_amount: finalAmount,
      payment_method: paymentMethod,
    });

    setCart([]);
    setDiscount(0);
    setSelectedCustomer('');
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bán hàng (POS)</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tìm kiếm sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên hoặc mã sản phẩm (hỗ trợ quét mã)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm && products && products.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Mã: {product.code}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tồn: {product.quantity}
                            </p>
                          </div>
                          <p className="font-bold text-primary">
                            {product.selling_price.toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Giỏ hàng ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="p-2 border rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product_id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product_id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-bold text-sm">
                          {item.total_price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Khách hàng (tùy chọn)
                    </label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
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
                    <label className="text-sm font-medium mb-1 block">
                      Phương thức thanh toán
                    </label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                    <label className="text-sm font-medium mb-1 block">
                      Giảm giá (đ)
                    </label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      min="0"
                      max={totalAmount}
                    />
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Tổng tiền:</span>
                      <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Giảm giá:</span>
                      <span>-{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Thành tiền:</span>
                      <span className="text-primary">
                        {finalAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {currentOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full m-4">
              <CardHeader>
                <CardTitle>Hóa đơn đã tạo thành công!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div ref={invoiceRef} className="p-8 bg-white">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">CỬA HÀNG GỖ HOÀNG GIA</h2>
                    <p className="text-sm">HÓA ĐƠN BÁN HÀNG</p>
                    <p className="text-sm">Mã đơn: {currentOrder.code}</p>
                    <p className="text-sm">
                      Ngày: {new Date(currentOrder.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">SL</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.unit_price.toLocaleString('vi-VN')}đ
                          </TableCell>
                          <TableCell className="text-right">
                            {item.total_price.toLocaleString('vi-VN')}đ
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 space-y-2 text-right">
                    <p>Tổng tiền: {currentOrder.total_amount.toLocaleString('vi-VN')}đ</p>
                    <p>Giảm giá: {currentOrder.discount.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xl font-bold">
                      Thành tiền: {currentOrder.final_amount.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-sm">
                      Thanh toán:{' '}
                      {paymentMethod === 'cash'
                        ? 'Tiền mặt'
                        : paymentMethod === 'bank_transfer'
                        ? 'Chuyển khoản'
                        : 'Thẻ'}
                    </p>
                  </div>

                  <div className="mt-8 text-center text-sm">
                    <p>Cảm ơn quý khách!</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handlePrint} className="flex-1">
                    <Printer className="mr-2 h-4 w-4" />
                    In hóa đơn
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentOrder(null)}
                    className="flex-1"
                  >
                    Đóng
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
