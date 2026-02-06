import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Server, Lock, AlertCircle, RefreshCw, Download, Database, Shield,
} from "lucide-react";

export default function AdminSystem() {
  const systemInfo = [
    { label: "Phiên bản", value: "1.0.0" },
    { label: "Database", value: "Supabase PostgreSQL" },
    { label: "Frontend", value: "React + Vite + TypeScript" },
    { label: "Cập nhật", value: new Date().toLocaleDateString('vi-VN') },
  ];

  const securityItems = [
    { label: "Row Level Security", desc: "Bảo vệ dữ liệu theo vai trò", enabled: true },
    { label: "Xác thực email", desc: "Yêu cầu xác nhận email", enabled: true },
    { label: "Phân quyền 3 cấp", desc: "Owner, Manager, Staff", enabled: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5 text-primary" />
              Thông tin hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {systemInfo.map((item) => (
                <div key={item.label} className="flex justify-between py-3">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              Bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Đã bật
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertCircle className="h-5 w-5" />
            Khu vực nguy hiểm
          </CardTitle>
          <CardDescription>Các thao tác có thể ảnh hưởng đến toàn bộ hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="text-sm font-medium">Xóa cache hệ thống</p>
              <p className="text-xs text-muted-foreground">Làm mới toàn bộ dữ liệu cache</p>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Xóa cache
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium">Sao lưu dữ liệu</p>
              <p className="text-xs text-muted-foreground">Tải xuống bản sao lưu database</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Sao lưu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
