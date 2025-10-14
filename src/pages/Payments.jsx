// frontend/src/pages/Payments.js
import React, { useEffect, useState } from "react";
import axios from "axios";
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
} from "@mui/material";
import { api, BASE_URL } from "../services/api"; // BASE_URL import qilamiz

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
  ); // YYYY-MM

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

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
      console.error(
        "Payment fetch error:",
        error.response?.data || error.message
      );
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/users`);
      setStudents(response.data.filter((u) => u.role === "student"));
    } catch (error) {
      console.error(
        "Students fetch error:",
        error.response?.data || error.message
      );
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get(`/groups`);
      setGroups(response.data);
    } catch (error) {
      console.error(
        "Groups fetch error:",
        error.response?.data || error.message
      );
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
      setSelectedMonth(new Date().toISOString().slice(0, 7));
      fetchPayments();
    } catch (error) {
      console.error(
        "Payment add error:",
        error.response?.data || error.message
      );
    }
  };

  const getStudentName = (id) =>
    students.find((s) => s.id === id)?.username || "-";
  const getGroupName = (id) => groups.find((g) => g.id === id)?.name || "-";

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        To'lovlar
      </Typography>

      {(role === "teacher" || role === "manager" || role === "admin") && (
        <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            label="Miqdor"
            value={amount}
            type="number"
            onChange={(e) => setAmount(e.target.value)}
          />
          <TextField
            label="Tavsif"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Student</InputLabel>
            <Select
              value={selectedStudent}
              label="Student"
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
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
            label="Oy (YYYY-MM)"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />

          <Button variant="contained" onClick={addPayment}>
            Qo'shish
          </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Miqdor</TableCell>
              <TableCell>Tavsif</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Guruh</TableCell>
              <TableCell>Oy</TableCell>
              <TableCell>Vaqt</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.amount}</TableCell>
                <TableCell>{p.description || "-"}</TableCell>
                <TableCell>{getStudentName(p.student_id)}</TableCell>
                <TableCell>{getGroupName(p.group_id)}</TableCell>
                <TableCell>{p.month || "-"}</TableCell>
                <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Payments;
