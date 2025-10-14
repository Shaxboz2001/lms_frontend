import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import { api, BASE_URL, config } from "../services/api";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "manager",
    full_name: "",
    phone: "",
    address: "",
    subject: "",
    fee: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/auth/register`, form);
      setMessage("✅ Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tdi!");
      setForm({
        username: "",
        password: "",
        role: "manager",
        full_name: "",
        phone: "",
        address: "",
        subject: "",
        fee: "",
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMessage(
        "❌ Xatolik! Foydalanuvchi mavjud yoki server bilan aloqa yo‘q."
      );
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" sx={{ mb: 2 }}>
          Yangi foydalanuvchini ro‘yxatdan o‘tkazish
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="To‘liq ism"
              name="full_name"
              fullWidth
              value={form.full_name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Telefon raqam"
              name="phone"
              fullWidth
              value={form.phone}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Manzil"
              name="address"
              fullWidth
              value={form.address}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Fan nomi"
              name="subject"
              fullWidth
              value={form.subject}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Oylik to‘lov"
              name="fee"
              type="number"
              fullWidth
              value={form.fee}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Foydalanuvchi nomi"
              name="username"
              fullWidth
              value={form.username}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Parol"
              name="password"
              type="password"
              fullWidth
              value={form.password}
              onChange={handleChange}
            />
          </Grid>

          {/* 🔽 Rol select (dropdown) */}
          <Grid item xs={12}>
            <TextField
              select
              label="Rolni tanlang"
              name="role"
              fullWidth
              value={form.role}
              onChange={handleChange}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="student">Student</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {message && (
          <Typography align="center" color="primary" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3 }}
          onClick={handleSubmit}
        >
          Saqlash
        </Button>
      </Paper>
    </Container>
  );
};

export default Register;
