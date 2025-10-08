// frontend/src/pages/Register.js
import React, { useState } from "react";
import { Container, TextField, Button, Paper, Typography } from "@mui/material";
import axios from "axios";
import { BASE_URL, config } from "../services/api"; // BASE_URL va JWT config

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "student",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      // Foydalanuvchi yaratish faqat admin/manager uchun JWT kerak
      await axios.post(`${BASE_URL}/auth/register`, form, config);
      setMessage("Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tdi!");
      setForm({ username: "", password: "", role: "student" }); // formni tozalash
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMessage("Xatolik! Foydalanuvchi mavjud yoki server bilan aloqa yo‘q.");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" align="center">
          Ro‘yxatdan o‘tkazish
        </Typography>

        <TextField
          label="Foydalanuvchi nomi"
          name="username"
          fullWidth
          margin="normal"
          value={form.username}
          onChange={handleChange}
        />
        <TextField
          label="Parol"
          name="password"
          fullWidth
          type="password"
          margin="normal"
          value={form.password}
          onChange={handleChange}
        />
        <TextField
          label="Rol (admin, manager, teacher, student)"
          name="role"
          fullWidth
          margin="normal"
          value={form.role}
          onChange={handleChange}
        />

        {message && (
          <Typography align="center" sx={{ mt: 1 }}>
            {message}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleSubmit}
        >
          Saqlash
        </Button>
      </Paper>
    </Container>
  );
};

export default Register;
