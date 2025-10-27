import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Button,
  TableContainer,
} from "@mui/material";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Payment = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 O‘quvchilarni olish
  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(res.data.filter((u) => u.role === "student"));
    } catch {
      toast.error("O‘quvchilarni yuklashda xatolik!");
    }
  };

  // 🔹 O‘quvchining oylik to‘lov tarixini olish
  const fetchFinance = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/payments/student/${studentId}/history`);
      setFinance(res.data);
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "To‘lov ma’lumotlari topilmadi!"
      );
      setFinance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSelect = (id) => {
    setSelectedStudent(id);
    if (id) fetchFinance(id);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar va qarzlar
      </Typography>

      {/* Student tanlash */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>O‘quvchini tanlang</InputLabel>
            <Select
              value={selectedStudent}
              label="O‘quvchi"
              onChange={(e) => handleSelect(e.target.value)}
            >
              <MenuItem value="">Tanlanmagan</MenuItem>
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name || s.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading && (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
          <Typography mt={1}>Yuklanmoqda...</Typography>
        </Box>
      )}

      {/* Agar moliyaviy ma’lumot bo‘lsa */}
      {finance && !loading && (
        <>
          {/* Jami to‘lovlar / qarz kartalari */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#e8fff3", borderRadius: 3 }}>
                <CardContent>
                  <Typography fontWeight={500}>💰 Jami to‘langan</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {finance.total_paid.toLocaleString()} so‘m
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#fff6e6", borderRadius: 3 }}>
                <CardContent>
                  <Typography fontWeight={500}>⚠️ Qarzdorlik</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {finance.total_debt.toLocaleString()} so‘m
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Jadval */}
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              overflowX: "auto",
              "&::-webkit-scrollbar": { height: 6 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#ccc",
                borderRadius: 2,
              },
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Oy</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Kurs</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Guruh</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>To‘langan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Qarzdorlik</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Holat</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Muddati</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {finance.history.map((h, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{h.month}</TableCell>
                    <TableCell>{h.course_name}</TableCell>
                    <TableCell>{h.group_name}</TableCell>
                    <TableCell>{h.amount.toLocaleString()} so‘m</TableCell>
                    <TableCell>{h.debt_amount.toLocaleString()} so‘m</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          h.status === "paid"
                            ? "To‘langan"
                            : h.status === "partial"
                            ? "Qisman"
                            : "To‘lanmagan"
                        }
                        color={
                          h.status === "paid"
                            ? "success"
                            : h.status === "partial"
                            ? "warning"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {h.due_date || "-"} {h.is_overdue && "⚠️"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* To‘lov qo‘shish tugmasi (keyingi bosqich uchun modal ochiladi) */}
          <Box mt={3} textAlign="right">
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedStudent}
              onClick={() =>
                toast("To‘lov qo‘shish modal ochiladi (keyingi bosqich)")
              }
            >
              ➕ To‘lov qo‘shish
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Payment;
