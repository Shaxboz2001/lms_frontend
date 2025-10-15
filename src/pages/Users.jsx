// frontend/src/pages/Foydalanuvchilar.js
import React, { useEffect, useState } from "react";
import axios from "axios";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../services/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/users`);
        setUsers(res.data);
        setFilteredUsers(res.data);
      } catch (err) {
        console.error("Foydalanuvchilarni olishda xato:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 🔍 Search funksiyasi
  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredUsers(
      users.filter(
        (u) =>
          u.username.toLowerCase().includes(lower) ||
          u.full_name?.toLowerCase().includes(lower)
      )
    );
  }, [search, users]);

  const handleRowClick = (params) => {
    setSelectedUser(params.row);
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "username", headerName: "Foydalanuvchi nomi", flex: 1 },
    { field: "full_name", headerName: "To‘liq ism", flex: 1 },
    { field: "role", headerName: "Rol", flex: 1 },
    { field: "phone", headerName: "Telefon", flex: 1 },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        👥 Foydalanuvchilar ro‘yxati
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Foydalanuvchini qidiring (ism yoki familiya)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ height: 500, width: "100%", overflow: "hidden" }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            onRowClick={handleRowClick}
            sx={{
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f0f7ff",
                cursor: "pointer",
              },
            }}
          />
        </Paper>
      )}

      {/* 🪟 Modal — foydalanuvchi tafsilotlari */}
      <Dialog
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Foydalanuvchi ma’lumotlari</DialogTitle>
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
                <b>Rol:</b> {selectedUser.role}
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
          <Button onClick={() => setSelectedUser(null)}>Yopish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
