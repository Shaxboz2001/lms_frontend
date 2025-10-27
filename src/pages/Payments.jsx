import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [p, d, g, u] = await Promise.all([
        api.get("/payments"),
        api.get("/payments/debts"),
        api.get("/groups"),
        api.get("/users"),
      ]);
      setPayments(p.data);
      setDebts(d.data);
      setGroups(g.data);
      setStudents(u.data.filter((u) => u.role === "student"));
      setTeachers(u.data.filter((u) => u.role === "teacher"));
    } catch {
      toast.error("Ma’lumotlarni yuklashda xatolik!");
    }
  };

  const getGroupName = (id) => groups.find((g) => g.id === id)?.name || "-";
  const getStudentName = (id) =>
    students.find((s) => s.id === id)?.username || "-";

  const handleMarkPaid = async (id) => {
    try {
      const res = await api.put(`/payments/mark-paid/${id}`);
      toast.success(res.data.message);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xatolik yuz berdi!");
    }
  };

  const generateDebts = async () => {
    try {
      const res = await api.post("/payments/generate-debts");
      toast.success(res.data.message);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Qarz yozishda xatolik!");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        💳 To‘lovlar va Qarzdorliklar
      </Typography>

      {(role === "admin" || role === "manager") && (
        <Box sx={{ mb: 3, textAlign: "right" }}>
          <Button variant="contained" color="secondary" onClick={generateDebts}>
            💼 Oylik qarzlarni generatsiya qilish
          </Button>
        </Box>
      )}

      {/* Qarzdorlar jadvali */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        ⚠️ Qarzdorlar ro‘yxati
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, overflowX: "auto" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>O‘quvchi</TableCell>
              <TableCell>Guruh</TableCell>
              <TableCell>Qarzdorlik</TableCell>
              <TableCell>Muddat</TableCell>
              <TableCell>Holat</TableCell>
              {(role === "manager" || role === "admin") && (
                <TableCell>Amal</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {debts.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{getStudentName(d.student_id)}</TableCell>
                <TableCell>{getGroupName(d.group_id)}</TableCell>
                <TableCell>
                  <Chip label={`${d.debt_amount || 0} so‘m`} color="warning" />
                </TableCell>
                <TableCell>{d.due_date || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={d.is_overdue ? "Muddat o‘tgan" : "To‘lanmagan"}
                    color={d.is_overdue ? "error" : "default"}
                  />
                </TableCell>
                {(role === "manager" || role === "admin") && (
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleMarkPaid(d.id)}
                    >
                      To‘landi
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Payments;
