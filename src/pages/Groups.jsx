// src/pages/Guruhlar.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";

// Import BASE_URL va config
import { api, BASE_URL, config } from "../services/api";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);

  // -------------------
  // Fetch all users
  // -------------------
  const fetchUsers = async () => {
    try {
      const res = await api.get(`/users/`);
      setAllStudents(res.data.filter((u) => u.role === "student"));
      setAllTeachers(res.data.filter((u) => u.role === "teacher"));
    } catch (err) {
      console.error("Users fetch error:", err.response?.data || err.message);
    }
  };

  // -------------------
  // Fetch all groups
  // -------------------
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/groups/`);
      setGroups(res.data);
    } catch (err) {
      console.error("Groups fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  // -------------------
  // Create new group
  // -------------------
  const handleCreate = async () => {
    try {
      await api.post(`/groups/`, {
        name,
        description,
        student_ids: selectedStudents,
        teacher_ids: selectedTeachers,
      });
      setName("");
      setDescription("");
      setSelectedStudents([]);
      setSelectedTeachers([]);
      fetchGroups();
    } catch (err) {
      console.error("Create group error:", err.response?.data || err.message);
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  // -------------------
  // Delete group
  // -------------------
  const handleDelete = async (id) => {
    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (err) {
      console.error("Delete group error:", err.response?.data || err.message);
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  if (loading) return <Typography>Yuklanmoqda...</Typography>;

  // -------------------
  // Helper functions
  // -------------------
  const getStudentNames = (ids) =>
    ids
      .map((id) => allStudents.find((s) => s.id === id)?.username)
      .filter(Boolean)
      .join(", ");

  const getTeacherNames = (ids) =>
    ids
      .map((id) => allTeachers.find((t) => t.id === id)?.username)
      .filter(Boolean)
      .join(", ");

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Guruhlar Admin paneli
      </Typography>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography sx={{ mb: 1 }}>Yangi guruh yaratish:</Typography>
        <TextField
          label="Nomi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mr: 2 }}
        />
        <TextField
          label="Tavsif"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mr: 2 }}
        />

        <FormControl sx={{ mr: 2, minWidth: 200 }}>
          <InputLabel>Studentlar</InputLabel>
          <Select
            multiple
            value={selectedStudents}
            onChange={(e) => setSelectedStudents(e.target.value)}
          >
            {allStudents.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ mr: 2, minWidth: 200 }}>
          <InputLabel>Teacherlar</InputLabel>
          <Select
            multiple
            value={selectedTeachers}
            onChange={(e) => setSelectedTeachers(e.target.value)}
          >
            {allTeachers.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleCreate}>
          Yaratish
        </Button>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nomi</TableCell>
              <TableCell>Tavsif</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Teachers</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{g.id}</TableCell>
                <TableCell>{g.name}</TableCell>
                <TableCell>{g.description}</TableCell>
                <TableCell>{getStudentNames(g.student_ids)}</TableCell>
                <TableCell>{getTeacherNames(g.teacher_ids)}</TableCell>
                <TableCell>{new Date(g.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Button color="error" onClick={() => handleDelete(g.id)}>
                    O‘chirish
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Groups;
