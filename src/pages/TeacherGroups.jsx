import React, { useEffect, useState } from "react";
import axios from "axios";
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
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { BASE_URL, config } from "../services/api";

export default function TeacherGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);

  // 🔹 Student profiling uchun
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);

  // 🔹 Guruhlarni olish
  useEffect(() => {
    axios
      .get(`${BASE_URL}/teacher/groups/`, config)
      .then((res) => setGroups(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // 🔹 Guruh bosilganda studentlarni olish
  const handleGroupClick = async (group) => {
    setSelectedGroup(group);
    setStudents([]);
    setOpenGroupDialog(true);
    setStudentLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/groups/${group.id}/students/`,
        config
      );
      setStudents(res.data);
    } catch (err) {
      console.error("Studentlarni olishda xatolik:", err);
    } finally {
      setStudentLoading(false);
    }
  };

  // 🔹 Student ustiga bosilganda uning profilini olish
  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setStudentDetail(null);
    setOpenStudentDialog(true);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${BASE_URL}/users/${student.id}`, config);
      setStudentDetail(res.data);
    } catch (err) {
      console.error("Student ma’lumotlarini olishda xatolik:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Mening Guruhlarim
      </Typography>

      {/* 🔹 Guruhlar ro‘yxati */}
      {loading ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : !groups.length ? (
        <Typography variant="h6" sx={{ mt: 4 }}>
          Sizda hali guruhlar yo‘q.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: 3,
                  cursor: "pointer",
                  transition: "0.3s",
                  "&:hover": { boxShadow: 6, transform: "scale(1.02)" },
                }}
                onClick={() => handleGroupClick(group)}
              >
                <CardContent>
                  <Typography variant="h6">{group.name}</Typography>
                  {group.description && (
                    <Typography color="text.secondary">
                      {group.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 🔹 Guruhdagi studentlar oynasi */}
      <Dialog
        open={openGroupDialog}
        onClose={() => setOpenGroupDialog(false)}
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {selectedGroup
            ? `${selectedGroup.name} guruhidagi talabalar`
            : "Talabalar"}
          <IconButton onClick={() => setOpenGroupDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {studentLoading ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : students.length > 0 ? (
            <List>
              {students.map((student) => (
                <React.Fragment key={student.id}>
                  <ListItem button onClick={() => handleStudentClick(student)}>
                    <ListItemText
                      primary={student.full_name || student.username}
                      secondary={`Tel: ${student.phone || "Noma’lum"}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              Bu guruhda hali studentlar yo‘q.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔹 Student profil oynasi */}
      <Dialog
        open={openStudentDialog}
        onClose={() => setOpenStudentDialog(false)}
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {selectedStudent?.full_name || "Student ma’lumotlari"}
          <IconButton onClick={() => setOpenStudentDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetail ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : studentDetail ? (
            <Box>
              <Typography variant="h6">{studentDetail.full_name}</Typography>
              <Typography color="text.secondary">
                Username: {studentDetail.username}
              </Typography>
              <Typography color="text.secondary">
                Telefon: {studentDetail.phone || "—"}
              </Typography>
              <Typography color="text.secondary">
                Yashash manzili: {studentDetail.address || "—"}
              </Typography>
              <Typography color="text.secondary">
                Yosh: {studentDetail.age || "—"}
              </Typography>
              {/* ✅ Keyinchalik shu joyga test natijalarini ham qo‘shish mumkin */}
            </Box>
          ) : (
            <Typography color="text.secondary">Ma’lumot topilmadi.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
