// frontend/src/pages/MyProfile.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Grid,
} from "@mui/material";
import axios from "axios";
import { BASE_URL, config } from "../services/api";

export default function MyProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/users/me`, config)
      .then((res) => setUser(res.data))
      .catch((err) => console.error("Profilni olishda xato:", err));
  }, []);

  if (!user) return <Typography>Yuklanmoqda...</Typography>;

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 6 }}>
      <Card sx={{ p: 3, boxShadow: 6, borderRadius: "16px" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 80,
                height: 80,
                fontSize: 32,
              }}
            >
              {user.full_name?.[0]?.toUpperCase() ||
                user.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {user.full_name || "Ism kiritilmagan"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Rol:</strong> {user.role}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Yosh:</strong> {user.age || "Ko‘rsatilmagan"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Telefon:</strong> {user.phone || "Ko‘rsatilmagan"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Manzil:</strong> {user.address || "Ko‘rsatilmagan"}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {user.group_id && (
            <Typography color="primary">
              <strong>Guruh ID:</strong> {user.group_id}
            </Typography>
          )}
          {user.subject && (
            <Typography color="primary">
              <strong>Fan:</strong> {user.subject}
            </Typography>
          )}
          {user.fee && (
            <Typography color="primary">
              <strong>To‘lov summasi:</strong> {user.fee} so‘m
            </Typography>
          )}
          {user.status && (
            <Typography color="primary">
              <strong>Status: {user.status}</strong>
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
