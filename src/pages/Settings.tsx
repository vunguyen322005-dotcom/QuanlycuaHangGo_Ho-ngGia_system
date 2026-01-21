import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Building2, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Save,
  Store,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  
  // Store settings
  const [storeName, setStoreName] = useState("Hoàng Gia");
  const [storePhone, setStorePhone] = useState("0123 456 789");
  const [storeEmail, setStoreEmail] = useState("contact@hoanggia.com");
  const [storeAddress, setStoreAddress] = useState("123 Nguyễn Văn A, Quận 1, TP.HCM");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [orderNotifications, setOrderNotifications] = useState(true);
  
  // Display settings
  const [language, setLanguage] = useState("vi");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [currency, setCurrency] = useState("VND");
  const [itemsPerPage, setItemsPerPage] = useState("20");

  const handleSaveStoreSettings = () => {
    toast({
      title: "Đã lưu cài đặt",
      description: "Thông tin cửa hàng đã được cập nhật thành công.",
    });
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Đã lưu cài đặt",
      description: "Cài đặt thông báo đã được cập nhật thành công.",
    });
  };

  const handleSaveDisplaySettings = () => {
    toast({
      title: "Đã lưu cài đặt",
      description: "Cài đặt hiển thị đã được cập nhật thành công.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Cài đặt</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý cài đặt hệ thống và cửa hàng
          </p>
        </div>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="store" className="gap-2">
              <Store className="h-4 w-4" />
              Cửa hàng
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-2">
              <Palette className="h-4 w-4" />
              Hiển thị
            </TabsTrigger>
            {userRole === 'owner' && (
              <TabsTrigger value="system" className="gap-2">
                <Database className="h-4 w-4" />
                Hệ thống
              </TabsTrigger>
            )}
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Thông tin cửa hàng
                </CardTitle>
                <CardDescription>
                  Cập nhật thông tin cơ bản của cửa hàng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Tên cửa hàng
                    </Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Nhập tên cửa hàng"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Số điện thoại
                    </Label>
                    <Input
                      id="storePhone"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      placeholder="Nhập email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeAddress" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Địa chỉ
                    </Label>
                    <Input
                      id="storeAddress"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveStoreSettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Cài đặt thông báo
                </CardTitle>
                <CardDescription>
                  Quản lý cách bạn nhận thông báo từ hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Thông báo qua email</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo quan trọng qua email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cảnh báo hàng tồn kho thấp</Label>
                      <p className="text-sm text-muted-foreground">
                        Thông báo khi số lượng sản phẩm dưới ngưỡng
                      </p>
                    </div>
                    <Switch
                      checked={lowStockAlert}
                      onCheckedChange={setLowStockAlert}
                    />
                  </div>
                  {lowStockAlert && (
                    <div className="ml-4 space-y-2">
                      <Label>Ngưỡng cảnh báo (số lượng)</Label>
                      <Input
                        type="number"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                        className="w-32"
                        min="1"
                      />
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Thông báo đơn hàng mới</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo khi có đơn hàng mới
                      </p>
                    </div>
                    <Switch
                      checked={orderNotifications}
                      onCheckedChange={setOrderNotifications}
                    />
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveNotificationSettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Cài đặt hiển thị
                </CardTitle>
                <CardDescription>
                  Tùy chỉnh cách hiển thị giao diện
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ngôn ngữ</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Định dạng ngày</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Đơn vị tiền tệ</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VND">VND - Việt Nam Đồng</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Số dòng mỗi trang</Label>
                    <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 dòng</SelectItem>
                        <SelectItem value="20">20 dòng</SelectItem>
                        <SelectItem value="50">50 dòng</SelectItem>
                        <SelectItem value="100">100 dòng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveDisplaySettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings - Owner only */}
          {userRole === 'owner' && (
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Cài đặt hệ thống
                  </CardTitle>
                  <CardDescription>
                    Cài đặt nâng cao dành cho quản trị viên
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold mb-2">Thông tin hệ thống</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phiên bản:</span>
                          <span className="font-medium">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cơ sở dữ liệu:</span>
                          <span className="font-medium text-green-600">Đang kết nối</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lần cập nhật cuối:</span>
                          <span className="font-medium">{new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                      <h3 className="font-semibold text-destructive mb-2">Vùng nguy hiểm</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Các thao tác dưới đây có thể ảnh hưởng đến dữ liệu hệ thống
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                          Xóa cache
                        </Button>
                        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                          Sao lưu dữ liệu
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
