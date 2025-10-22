// src/pages/Users.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 🔹 Foydalanuvchilarni olish
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/users`);
        setUsers(res.data);
        setFilteredUsers(res.data);
      } catch (err) {
        toast.error("❌ Foydalanuvchilarni olishda xato!");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 🔹 Qidiruv va rol bo‘yicha filter
  useEffect(() => {
    const lower = search.toLowerCase();
    let filtered = users.filter(
      (u) =>
        u.username?.toLowerCase().includes(lower) ||
        u.full_name?.toLowerCase().includes(lower)
    );
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    setFilteredUsers(filtered);
  }, [search, users, roleFilter]);

  const columns = [
    { field: "id", headerName: "ID", width: 60 },
    { field: "username", headerName: "Foydalanuvchi nomi", flex: 1 },
    { field: "full_name", headerName: "To‘liq ism", flex: 1 },
    { field: "role", headerName: "Rol", flex: 1 },
    { field: "phone", headerName: "Telefon", flex: 1 },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f9fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        👥 Foydalanuvchilar ro‘yxati
      </Typography>

      {/* 🔍 Qidiruv va filter panel */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          fullWidth
          label="Qidiruv (ism yoki username)"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Rol bo‘yicha filter</InputLabel>
          <Select
            value={roleFilter}
            label="Rol bo‘yicha filter"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">Hammasi</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="teacher">Teacher</MenuItem>
            <MenuItem value="student">Student</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* 🔹 Jadval */}
      {loading ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          sx={{
            width: "100%",
            height: 520,
            p: 1,
            borderRadius: 3,
            boxShadow: 2,
          }}
        >
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            pageSize={isMobile ? 5 : 10}
            rowsPerPageOptions={[5, 10, 20]}
            onRowClick={(params) => setSelectedUser(params.row)}
            disableSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f0f4ff",
                fontWeight: "bold",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f5f9ff",
                cursor: "pointer",
              },
            }}
          />
        </Paper>
      )}

      {/* 🔸 Modal (Dialog) */}
      <Dialog
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          🧾 Foydalanuvchi ma’lumotlari
        </DialogTitle>

        <DialogContent dividers>
          {selectedUser && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography>
                <b>ID:</b> {selectedUser.id}
              </Typography>
              <Typography>
                <b>Username:</b> {selectedUser.username}
              </Typography>
              <Typography>
                <b>To‘liq ism:</b> {selectedUser.full_name || "—"}
              </Typography>
              <Typography>
                <b>Rol:</b>{" "}
                <span style={{ textTransform: "capitalize" }}>
                  {selectedUser.role}
                </span>
              </Typography>
              <Typography>
                <b>Telefon:</b> {selectedUser.phone || "—"}
              </Typography>
              <Typography>
                <b>Manzil:</b> {selectedUser.address || "—"}
              </Typography>
              <Typography>
                <b>Yosh:</b> {selectedUser.age || "—"}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setSelectedUser(null)}>
            Yopish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
