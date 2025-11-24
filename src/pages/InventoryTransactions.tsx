import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  code: string;
  type: string;
  quantity: number;
  unit_price: number | null;
  notes: string | null;
  created_at: string;
  product_id: string | null;
  supplier_id: string | null;
  order_id: string | null;
}

interface Product {
  id: string;
  code: string;
  name: string;
  quantity: number;
  category: string;
}

interface Supplier {
  id: string;
  code: string;
  company_name: string;
}

const InventoryTransactions = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [formData, setFormData] = useState({
    product_id: "",
    supplier_id: "",
    quantity: "",
    unit_price: "",
    notes: "",
  });

  const canManage = hasRole(['owner', 'manager', 'staff']);

  // Fetch transactions
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ["inventory-transactions", filterType],
    queryFn: async () => {
      let query = supabase
        .from("inventory_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, quantity, category")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, code, company_name")
        .order("company_name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  // Low stock products (less than 10 items)
  const lowStockProducts = products?.filter(p => p.quantity < 10) || [];

  // Create IN transaction
  const createTransaction = useMutation({
    mutationFn: async (data: typeof formData) => {
      const product = products?.find(p => p.id === data.product_id);
      if (!product) throw new Error("Product not found");

      const transactionCode = `IN-${Date.now()}`;
      
      // Create transaction
      const { error: txError } = await supabase
        .from("inventory_transactions")
        .insert({
          code: transactionCode,
          type: "in",
          product_id: data.product_id,
          supplier_id: data.supplier_id || null,
          quantity: parseInt(data.quantity),
          unit_price: parseFloat(data.unit_price) || null,
          notes: data.notes || null,
          created_by: user?.id,
        });

      if (txError) throw txError;

      // Update product quantity
      const { error: productError } = await supabase
        .from("products")
        .update({ quantity: product.quantity + parseInt(data.quantity) })
        .eq("id", data.product_id);

      if (productError) throw productError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Thành công",
        description: "Đã tạo phiếu nhập kho",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      product_id: "",
      supplier_id: "",
      quantity: "",
      unit_price: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }
    createTransaction.mutate(formData);
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return "N/A";
    const product = products?.find(p => p.id === productId);
    return product ? `${product.code} - ${product.name}` : "N/A";
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return "N/A";
    const supplier = suppliers?.find(s => s.id === supplierId);
    return supplier ? supplier.company_name : "N/A";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý nhập/xuất kho</h1>
            <p className="text-muted-foreground">Theo dõi lịch sử giao dịch và tồn kho</p>
          </div>
          {canManage && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nhập kho
            </Button>
          )}
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Cảnh báo: {lowStockProducts.length} sản phẩm sắp hết hàng</div>
              <div className="space-y-1">
                {lowStockProducts.slice(0, 5).map(product => (
                  <div key={product.id} className="text-sm">
                    {product.code} - {product.name}: <span className="font-semibold">{product.quantity} sản phẩm</span>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <div className="text-sm font-medium">và {lowStockProducts.length - 5} sản phẩm khác...</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Stock Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-foreground">{products?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng tồn kho</p>
                <p className="text-2xl font-bold text-foreground">
                  {products?.reduce((sum, p) => sum + p.quantity, 0) || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Sắp hết hàng</p>
                <p className="text-2xl font-bold text-foreground">{lowStockProducts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Giao dịch hôm nay</p>
                <p className="text-2xl font-bold text-foreground">
                  {transactions?.filter(t => 
                    format(new Date(t.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                  ).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Loại giao dịch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="in">Nhập kho</SelectItem>
              <SelectItem value="out">Xuất kho</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        <div className="bg-card rounded-lg border border-border">
          {loadingTransactions ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.code}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "in" ? "default" : "secondary"}>
                        {transaction.type === "in" ? "Nhập" : "Xuất"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getProductName(transaction.product_id)}</TableCell>
                    <TableCell>{getSupplierName(transaction.supplier_id)}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>
                      {transaction.unit_price 
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(transaction.unit_price)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {transaction.unit_price 
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(transaction.unit_price * transaction.quantity)
                        : "N/A"}
                    </TableCell>
                    <TableCell>{format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Create Transaction Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo phiếu nhập kho</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Sản phẩm *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, product_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.code} - {product.name} (Tồn: {product.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Nhà cung cấp</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.code} - {supplier.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Đơn giá nhập</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.unit_price}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_price: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={createTransaction.isPending}>
                  {createTransaction.isPending ? "Đang xử lý..." : "Tạo phiếu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default InventoryTransactions;
