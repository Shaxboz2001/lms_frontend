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
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { api } from "../services/api";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [search, setSearch] = useState("");

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchGroups();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get(`/payments`);
      setPayments(response.data);
    } catch (error) {
      console.error("Payment fetch error:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/users`);
      setStudents(res.data.filter((u) => u.role === "student"));
    } catch (err) {
      console.error("Students fetch error:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get(`/groups`);
      setGroups(res.data);
    } catch (err) {
      console.error("Groups fetch error:", err);
    }
  };

  const addPayment = async () => {
    try {
      await api.post(`/payments`, {
        amount: parseFloat(amount),
        description,
        student_id: selectedStudent ? parseInt(selectedStudent) : null,
        group_id: selectedGroup ? parseInt(selectedGroup) : null,
        teacher_id: role === "teacher" ? parseInt(userId) : null,
        month: selectedMonth,
      });

      setAmount("");
      setDescription("");
      setSelectedStudent("");
      setSelectedGroup("");
      fetchPayments();
    } catch (err) {
      console.error("Add payment error:", err);
    }
  };

  const getStudentName = (id) =>
    students.find((s) => s.id === id)?.username || "-";
  const getGroupName = (id) => groups.find((g) => g.id === id)?.name || "-";

  const filteredPayments = payments.filter(
    (p) =>
      getStudentName(p.student_id)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      getGroupName(p.group_id).toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const renderStatus = (status, isOverdue) => {
    if (status === "paid")
      return <Chip label="To‘langan" color="success" size="small" />;
    if (status === "partial")
      return <Chip label="Qisman" color="warning" size="small" />;
    if (isOverdue) return <Chip label="Kechikkan" color="error" size="small" />;
    return <Chip label="To‘lanmagan" variant="outlined" size="small" />;
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        💳 To‘lovlar bo‘limi
      </Typography>

      {(role === "teacher" || role === "manager" || role === "admin") && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TextField
            label="Miqdor (so‘m)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          />
          <TextField
            label="Tavsif"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Talaba</InputLabel>
            <Select
              value={selectedStudent}
              label="Talaba"
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Guruh</InputLabel>
            <Select
              value={selectedGroup}
              label="Guruh"
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Oy"
            type="month"
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <Button variant="contained" onClick={addPayment}>
            Qo‘shish
          </Button>
        </Paper>
      )}

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          label="Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: isMobile ? "100%" : "300px" }}
        />
        <Typography variant="body2" color="text.secondary">
          Jami: {filteredPayments.length} ta to‘lov
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          overflowX: "auto",
          borderRadius: 3,
          maxHeight: isMobile ? "70vh" : "80vh",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Miqdor</TableCell>
              <TableCell>Talaba</TableCell>
              <TableCell>Guruh</TableCell>
              <TableCell>Oy</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Qarzdorlik</TableCell>
              <TableCell>Tavsif</TableCell>
              <TableCell>Sana</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.amount.toLocaleString()} so‘m</TableCell>
                <TableCell>{getStudentName(p.student_id)}</TableCell>
                <TableCell>{getGroupName(p.group_id)}</TableCell>
                <TableCell>{p.month || "-"}</TableCell>
                <TableCell>{renderStatus(p.status, p.is_overdue)}</TableCell>
                <TableCell>
                  {p.debt_amount > 0 ? (
                    <Typography color="error">
                      -{p.debt_amount.toLocaleString()} so‘m
                    </Typography>
                  ) : (
                    <Typography color="success.main">0</Typography>
                  )}
                </TableCell>
                <TableCell>{p.description || "-"}</TableCell>
                <TableCell>
                  {new Date(p.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Payments;
