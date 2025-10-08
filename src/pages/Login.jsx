// src/pages/Login.js
import React, { useState } from "react";
import { Container, TextField, Button, Typography, Paper } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../services/api"; // BASE_URL import qilamiz

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError(""); // eski errorni tozalash
    try {
      console.log(BASE_URL);
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        username,
        password,
      });

      // Token va role ni saqlaymiz
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);

      // Dashboardga redirect
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Login yoki parol xato!");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Kirish
        </Typography>
        <TextField
          label="Foydalanuvchi nomi"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Parol"
          fullWidth
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <Typography color="error" align="center" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Kirish
        </Button>
      </Paper>
    </Container>
  );
};

export default Login;
