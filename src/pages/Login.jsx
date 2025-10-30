// src/pages/Login.js
import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  CircularProgress,
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    const { username, password } = form;
    if (!username || !password) {
      toast.error("Iltimos, login va parolni kiriting!");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });

      // 🔑 Token va foydalanuvchi ma’lumotlarini saqlash
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userid);

      toast.success("✅ Muvaffaqiyatli kirdingiz!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      toast.error(err.response?.data?.detail || "❌ Login yoki parol xato!");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        mt: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Toaster position="top-right" />
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          boxShadow: 6,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold">
          🔐 Tizimga kirish
        </Typography>

        <TextField
          label="Foydalanuvchi nomi"
          name="username"
          fullWidth
          margin="normal"
          value={form.username}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          autoFocus
        />

        <TextField
          label="Parol"
          name="password"
          fullWidth
          type="password"
          margin="normal"
          value={form.password}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
        />

        <Box sx={{ mt: 3, position: "relative" }}>
          <Button
            variant="contained"
            fullWidth
            disabled={loading}
            onClick={handleLogin}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              py: 1.3,
              fontSize: "16px",
            }}
          >
            {loading ? "Kirish..." : "Kirish"}
          </Button>

          {loading && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                mt: "-12px",
                ml: "-12px",
              }}
            />
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, fontStyle: "italic" }}
        >
          Foydalanuvchi nomi va parolingizni kiriting
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;
