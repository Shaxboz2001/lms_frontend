// frontend/src/pages/MyProfile.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
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
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <Card sx={{ p: 3, boxShadow: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 64, height: 64 }}>
              {user.full_name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{user.full_name}</Typography>
              <Typography color="text.secondary">{user.email}</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography>
            <strong>Role:</strong> {user.role}
          </Typography>
          <Typography>
            <strong>Username:</strong> {user.username}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
