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
  const [open, setOpen] = useState(false);

  // 🔹 O'qituvchining guruhlarini olish
  useEffect(() => {
    axios
      .get(`${BASE_URL}/teacher/groups/`, config)
      .then((res) => setGroups(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // 🔹 Guruh ustiga bosilganda studentlarni yuklash
  const handleGroupClick = async (group) => {
    setSelectedGroup(group);
    setStudents([]);
    setOpen(true);
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

  const handleClose = () => {
    setOpen(false);
    setSelectedGroup(null);
    setStudents([]);
  };

  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (!groups.length)
    return (
      <Typography variant="h6" sx={{ mt: 4 }}>
        Sizda hali guruhlar yo‘q.
      </Typography>
    );

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Mening Guruhlarim
      </Typography>

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

      {/* 🔹 Modal: Guruhdagi studentlar */}
      <Dialog open={open} onClose={handleClose} fullWidth>
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
          <IconButton onClick={handleClose}>
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
                  <ListItem>
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
    </Box>
  );
}
