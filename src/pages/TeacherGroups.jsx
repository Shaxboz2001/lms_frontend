// src/pages/TeacherGroups.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  IconButton,
  Skeleton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

export default function TeacherGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // 🔹 O‘qituvchining guruhlarini olish
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get(`/teacher/groups/`);
        setGroups(res.data);
      } catch (err) {
        console.error(err);
        toast.error("❌ Guruhlarni olishda xatolik!");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // 🔹 Guruh ustiga bosilganda studentlarni yuklash
  const handleGroupClick = async (group) => {
    setSelectedGroup(group);
    setStudents([]);
    setOpen(true);
    setStudentLoading(true);
    try {
      const res = await api.get(`/groups/${group.id}/students/`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      toast.error("❌ Studentlarni olishda xatolik!");
    } finally {
      setStudentLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedGroup(null);
    setStudents([]);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f9fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        👨‍🏫 Mening Guruhlarim
      </Typography>

      {loading ? (
        <Grid container spacing={3}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton
                variant="rectangular"
                height={120}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : !groups.length ? (
        <Typography variant="h6" sx={{ mt: 4 }}>
          Sizda hali guruhlar mavjud emas.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  p: 1,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  bgcolor: "#fff",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 5,
                    borderLeft: "6px solid #1976d2",
                  },
                }}
                onClick={() => handleGroupClick(group)}
              >
                <CardContent>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {group.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Kurs: {group.course?.title || "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    O‘qituvchi: {group.teacher?.full_name || "—"}
                  </Typography>
                  {group.description && (
                    <Typography sx={{ mt: 1 }}>{group.description}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 🔹 Modal: Guruhdagi studentlar */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "bold",
          }}
        >
          {selectedGroup
            ? `${selectedGroup.name} guruhidagi talabalar`
            : "Talabalar"}
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
          {studentLoading ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : students.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Ism Familiya</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell>Manzil</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.full_name || s.username}</TableCell>
                    <TableCell>{s.phone || "—"}</TableCell>
                    <TableCell>{s.address || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              Bu guruhda hali studentlar yo‘q.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
