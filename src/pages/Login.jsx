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
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Iltimos, login va parolni kiriting!");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userid);

      toast.success("✅ Muvaffaqiyatli kirdingiz!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      toast.error(err.response?.data?.detail || "Login yoki parol xato!");
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
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
        />

        <TextField
          label="Parol"
          fullWidth
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
              py: 1.2,
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
                marginTop: "-12px",
                marginLeft: "-12px",
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
