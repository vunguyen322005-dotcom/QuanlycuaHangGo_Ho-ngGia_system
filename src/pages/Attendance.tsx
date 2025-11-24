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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Clock, LogIn, LogOut, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  notes: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  code: string;
  full_name: string;
  position: string;
  base_salary: number;
}

const Attendance = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const canManage = hasRole(['owner', 'manager']);

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, code, full_name, position, base_salary")
        .order("full_name");
      if (error) throw error;
      return data as Employee[];
    },
  });

  // Fetch attendance records
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ["attendance", selectedEmployee, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (selectedEmployee) {
        query = query.eq("employee_id", selectedEmployee);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });

  // Get today's attendance for selected employee
  const todayAttendance = attendanceRecords?.find(
    (record) => record.date === format(new Date(), "yyyy-MM-dd")
  );

  // Check in mutation
  const checkIn = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) throw new Error("Please select an employee");

      const today = format(new Date(), "yyyy-MM-dd");
      const now = format(new Date(), "HH:mm:ss");

      // Check if already checked in today
      const { data: existing } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", selectedEmployee)
        .eq("date", today)
        .single();

      if (existing) {
        throw new Error("Already checked in today");
      }

      const { error } = await supabase.from("attendance").insert({
        employee_id: selectedEmployee,
        date: today,
        time_in: now,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({
        title: "Thành công",
        description: "Đã chấm công vào làm",
      });
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check out mutation
  const checkOut = useMutation({
    mutationFn: async () => {
      if (!todayAttendance) throw new Error("No check-in record found");

      const now = format(new Date(), "HH:mm:ss");
      
      // Calculate hours worked
      const timeIn = todayAttendance.time_in;
      if (!timeIn) throw new Error("Invalid check-in time");

      const [inHours, inMinutes] = timeIn.split(":").map(Number);
      const [outHours, outMinutes] = now.split(":").map(Number);
      
      const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
      const totalHours = totalMinutes / 60;

      const { error } = await supabase
        .from("attendance")
        .update({
          time_out: now,
          total_hours: totalHours,
          notes: notes || todayAttendance.notes,
        })
        .eq("id", todayAttendance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({
        title: "Thành công",
        description: "Đã chấm công ra về",
      });
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate statistics
  const selectedEmployeeData = employees?.find((e) => e.id === selectedEmployee);
  const totalDays = attendanceRecords?.length || 0;
  const totalHours = attendanceRecords?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;
  const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
  
  // Calculate salary (base_salary / 26 working days * total days worked)
  const dailySalary = selectedEmployeeData ? selectedEmployeeData.base_salary / 26 : 0;
  const calculatedSalary = dailySalary * totalDays;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find((e) => e.id === employeeId);
    return employee ? `${employee.code} - ${employee.full_name}` : "N/A";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý chấm công</h1>
            <p className="text-muted-foreground">Theo dõi giờ làm và tính lương nhân viên</p>
          </div>
        </div>

        {/* Employee Selection & Check-in/out */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Check-in/out Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Chấm công hôm nay</CardTitle>
              <CardDescription>
                {format(new Date(), "dd/MM/yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chọn nhân viên</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.code} - {employee.full_name} ({employee.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmployee && (
                <>
                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ghi chú về ca làm việc..."
                      rows={2}
                    />
                  </div>

                  {todayAttendance ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Giờ vào</p>
                          <p className="text-lg font-semibold">
                            {todayAttendance.time_in || "N/A"}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Giờ ra</p>
                          <p className="text-lg font-semibold">
                            {todayAttendance.time_out || "Chưa ra"}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Tổng giờ</p>
                          <p className="text-lg font-semibold">
                            {todayAttendance.total_hours 
                              ? `${todayAttendance.total_hours.toFixed(2)}h`
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {!todayAttendance.time_out && (
                        <Button
                          onClick={() => checkOut.mutate()}
                          disabled={checkOut.isPending}
                          className="w-full gap-2"
                          variant="destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          {checkOut.isPending ? "Đang xử lý..." : "Chấm công ra"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => checkIn.mutate()}
                      disabled={checkIn.isPending}
                      className="w-full gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      {checkIn.isPending ? "Đang xử lý..." : "Chấm công vào"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái hiện tại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center p-6">
                <Clock className="h-16 w-16 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {format(new Date(), "HH:mm:ss")}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {todayAttendance
                    ? todayAttendance.time_out
                      ? "Đã chấm công ra"
                      : "Đang làm việc"
                    : "Chưa chấm công"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        {selectedEmployee && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng ngày công</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDays} ngày</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng giờ làm</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TB giờ/ngày</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageHours.toFixed(1)}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lương tạm tính</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    notation: "compact",
                  }).format(calculatedSalary)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nhân viên</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả nhân viên</SelectItem>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.code} - {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Từ ngày</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Đến ngày</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử chấm công</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Giờ vào</TableHead>
                    <TableHead>Giờ ra</TableHead>
                    <TableHead>Tổng giờ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{getEmployeeName(record.employee_id)}</TableCell>
                      <TableCell>{record.time_in || "N/A"}</TableCell>
                      <TableCell>{record.time_out || "Chưa ra"}</TableCell>
                      <TableCell>
                        {record.total_hours ? `${record.total_hours.toFixed(2)}h` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.time_out ? "default" : "secondary"}>
                          {record.time_out ? "Hoàn thành" : "Đang làm"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.notes || ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
