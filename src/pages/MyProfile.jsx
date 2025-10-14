import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { api, BASE_URL, config } from "../services/api";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    password: "",
    phone: "",
    address: "",
    age: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/me`);
      setUser(res.data);
      setForm({
        username: res.data.username || "",
        full_name: res.data.full_name || "",
        password: "", // bo'sh holda qoldiramiz
        phone: res.data.phone || "",
        address: res.data.address || "",
        age: res.data.age || "",
      });
    } catch (err) {
      console.error("Profile fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenEdit = () => setEditOpen(true);
  const handleCloseEdit = () => {
    setEditOpen(false);
    // reset password field
    setForm((s) => ({ ...s, password: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Agar password bo'sh bo'lsa, uni payloaddan olib tashlaymiz
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      // Convert age to int if not empty
      if (payload.age === "") delete payload.age;
      else payload.age = parseInt(payload.age, 10);

      await api.put(`/users/${user.id}`, payload);
      await fetchProfile();
      handleCloseEdit();
      alert("Profil muvaffaqiyatli yangilandi");
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      alert(
        "Profilni yangilashda xatolik: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  if (!user) return <Typography color="error">Profil topilmadi</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 6 }}>
      <Card>
        <CardContent sx={{ textAlign: "center" }}>
          <Avatar
            src={user.avatar_url || "/default-avatar.png"}
            sx={{ width: 120, height: 120, mx: "auto", mb: 2 }}
          />
          <Typography variant="h5">
            {user.full_name || user.username}
          </Typography>
          <Typography color="text.secondary">{user.username}</Typography>
          <Typography sx={{ mt: 1 }}>Role: {user.role}</Typography>
          <Typography sx={{ mt: 1 }}>Phone: {user.phone || "-"}</Typography>
          <Typography sx={{ mt: 1 }}>Address: {user.address || "-"}</Typography>
          <Typography sx={{ mt: 1 }}>Age: {user.age ?? "-"}</Typography>

          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={handleOpenEdit}>
              Edit Profile
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Username"
                name="username"
                fullWidth
                value={form.username}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Full name"
                name="full_name"
                fullWidth
                value={form.full_name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Password (yangi parol — agar o'zgartirmoqchi bo'lsangiz)"
                name="password"
                type="password"
                fullWidth
                value={form.password}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                name="phone"
                fullWidth
                value={form.phone}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Age"
                name="age"
                type="number"
                fullWidth
                value={form.age}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Address"
                name="address"
                fullWidth
                value={form.address}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
