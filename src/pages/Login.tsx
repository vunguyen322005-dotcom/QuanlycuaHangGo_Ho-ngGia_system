import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/hoang-gia-logo.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login - In production, this would call an API
    setTimeout(() => {
      if (username && password) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", "owner"); // Default to owner for now
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn đến với hệ thống quản lý Hoàng Gia",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Đăng nhập thất bại",
          description: "Vui lòng kiểm tra lại tên đăng nhập và mật khẩu",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Hoàng Gia Logo" className="w-24 h-24 mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Hoàng Gia</h1>
            <p className="text-muted-foreground text-center">
              Hệ thống quản lý cửa hàng nội thất
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="transition-all duration-300 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-300 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm cursor-pointer text-muted-foreground"
                >
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <a
                href="#"
                className="text-sm text-primary hover:text-accent transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>© 2024 Hoàng Gia. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
