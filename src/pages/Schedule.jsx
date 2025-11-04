// src/pages/SchedulePage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";
import { motion } from "framer-motion";

const EN_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const UZ_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];
const DEFAULT_TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export default function SchedulePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [role] = useState(localStorage.getItem("role") || "student");
  const [userId] = useState(Number(localStorage.getItem("userId") || 0));
  const [schedules, setSchedules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    group_id: "",
    day_of_week: "Monday",
    start_time: "08:00",
    end_time: "09:00",
    room: "",
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const gRes = await api.get("/groups");
        setGroups(gRes.data || []);

        let sRes;
        if (role === "teacher") sRes = await api.get("/schedules/my");
        else if (role === "student") sRes = await api.get("/schedules/student");
        else sRes = await api.get("/schedules");

        setSchedules(sRes.data || []);
      } catch {
        toast.error("❌ Jadvalni yuklashda xato");
      }
    };
    fetchAll();
  }, [role]);

  const refresh = async () => {
    try {
      let sRes;
      if (role === "teacher") sRes = await api.get("/schedules/my");
      else if (role === "student") sRes = await api.get("/schedules/student");
      else sRes = await api.get("/schedules");
      setSchedules(sRes.data || []);
    } catch {
      toast.error("Yangilashda xato");
    }
  };

  const findLesson = (day, time) =>
    schedules.find(
      (s) => s.day_of_week === day && s.start_time.startsWith(time)
    );

  const openNew = (day, time) => {
    if (role === "student") return;
    setEditing(null);
    setForm({
      group_id: "",
      day_of_week: day || "Monday",
      start_time: time || "08:00",
      end_time: "09:00",
      room: "",
    });
    setOpen(true);
  };

  const openEdit = (lesson) => {
    if (role === "teacher" && lesson.teacher_id !== userId) {
      return toast.error("Siz faqat o‘z darslaringizni tahrirlashingiz mumkin");
    }
    setEditing(lesson);
    setForm({
      group_id: lesson.group_id,
      day_of_week: lesson.day_of_week,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      room: lesson.room || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.group_id) return toast.error("Guruh tanlanmagan");
    try {
      if (editing) {
        await api.put(`/schedules/${editing.id}`, form);
        toast.success("Jadval yangilandi");
      } else {
        await api.post("/schedules", form);
        toast.success("Dars qo‘shildi");
      }
      setOpen(false);
      refresh();
    } catch {
      toast.error("Saqlashda xato");
    }
  };

  const handleDelete = async (lesson) => {
    if (role === "teacher" && lesson.teacher_id !== userId) {
      return toast.error("Siz faqat o‘z darslaringizni o‘chirishingiz mumkin");
    }
    if (!window.confirm("O‘chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/schedules/${lesson.id}`);
      toast.success("O‘chirildi");
      refresh();
    } catch {
      toast.error("O‘chirishda xato");
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination || role === "student") return;

    const [dayIndex, timeIndex] = result.destination.droppableId.split("-");
    const newDay = EN_DAYS[Number(dayIndex)];
    const newTime = DEFAULT_TIMES[Number(timeIndex)];

    const lessonId = Number(result.draggableId);
    const lesson = schedules.find((s) => s.id === lessonId);
    if (!lesson) return;

    if (role === "teacher" && lesson.teacher_id !== userId) {
      return toast.error("Bu sizning dars emas");
    }

    try {
      await api.put(`/schedules/${lesson.id}`, {
        ...lesson,
        day_of_week: newDay,
        start_time: newTime,
      });
      toast.success("Dars joyi yangilandi");
      refresh();
    } catch {
      toast.error("Joyini o‘zgartirishda xato");
    }
  };

  const renderLessonCard = (lesson) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Box
        sx={{
          bgcolor: "#e3f2fd",
          borderLeft: "5px solid #1976d2",
          borderRadius: 2,
          p: 1,
          boxShadow: 2,
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          {lesson.group_name || `Guruh ${lesson.group_id}`}
        </Typography>
        <Typography variant="caption">
          {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
        </Typography>
        {lesson.room && (
          <Typography variant="caption" display="block">
            Xona: {lesson.room}
          </Typography>
        )}
        {role !== "student" && (
          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
            <Tooltip title="Tahrirlash">
              <IconButton size="small" onClick={() => openEdit(lesson)}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="O‘chirish">
              <IconButton size="small" onClick={() => handleDelete(lesson)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </motion.div>
  );
  return (
    <Box
      p={{ xs: 2, md: 4 }}
      sx={{
        bgcolor: "#f4f8fc",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Toaster position="top-right" />
      <Box
        display="flex"
        justifyContent="space-between"
        flexWrap="wrap"
        mb={2}
        sx={{ width: "90%" }}
      >
        <Typography variant="h5" fontWeight={700}>
          🗓 Dars jadvali
        </Typography>
        {role !== "student" && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openNew("Monday", "08:00")}
          >
            Dars qo‘shish
          </Button>
        )}
      </Box>

      {/* Asosiy jadval konteyneri */}
      <Paper
        sx={{
          width: "90%",
          overflowX: "auto",
          borderRadius: 3,
          p: 2,
          boxShadow: 3,
          bgcolor: "white",
        }}
      >
        {/* 📅 Hafta kunlari header */}
        <Box
          sx={{
            display: "flex",
            borderBottom: "2px solid #1976d2",
            minWidth: 900,
          }}
        >
          <Box
            sx={{
              width: "100px",
              bgcolor: "#f4f6f8",
              borderRight: "1px solid #ddd",
            }}
          />
          {UZ_DAYS.map((d, i) => (
            <Box
              key={d}
              sx={{
                flex: 1,
                textAlign: "center",
                fontWeight: 700,
                fontSize: "1rem",
                p: 1.5,
                bgcolor: "#1976d2",
                color: "white",
                borderRight:
                  i !== UZ_DAYS.length - 1 ? "1px solid #1565c0" : "none",
              }}
            >
              {d}
            </Box>
          ))}
        </Box>

        {/* 🕓 Vaqtlar + Dars gridi */}
        <DragDropContext onDragEnd={handleDragEnd}>
          {DEFAULT_TIMES.map((time, tIndex) => (
            <Box key={time} sx={{ display: "flex", minWidth: 900 }}>
              {/* Chapdagi vaqtlar */}
              <Box
                sx={{
                  width: "100px",
                  textAlign: "center",
                  fontWeight: 600,
                  borderRight: "1px solid #ddd",
                  borderBottom: "1px solid #eee",
                  bgcolor: "#fafafa",
                  p: 1,
                }}
              >
                {time}
              </Box>

              {/* Darslar joyi */}
              {EN_DAYS.map((day, dIndex) => {
                const lesson = findLesson(day, time);
                return (
                  <Droppable
                    droppableId={`${dIndex}-${tIndex}`}
                    key={day + time}
                  >
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          flex: 1,
                          borderRight:
                            dIndex !== EN_DAYS.length - 1
                              ? "1px solid #eee"
                              : "none",
                          borderBottom: "1px solid #eee",
                          minHeight: 100,
                          p: 1,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          bgcolor: lesson ? "#e3f2fd" : "white",
                          "&:hover": {
                            bgcolor:
                              !lesson && role !== "student" ? "#f9f9f9" : "",
                          },
                        }}
                        onDoubleClick={() => !lesson && openNew(day, time)}
                      >
                        {lesson && (
                          <Draggable
                            draggableId={lesson.id.toString()}
                            index={lesson.id}
                          >
                            {(dragProvided) => (
                              <Box
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                sx={{
                                  width: "90%",
                                  bgcolor: "#1976d2",
                                  color: "white",
                                  borderRadius: 2,
                                  p: 1,
                                  textAlign: "center",
                                  boxShadow: 2,
                                }}
                              >
                                <Typography variant="body2" fontWeight={600}>
                                  {lesson.group.name}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {lesson.start_time.slice(0, 5)} -{" "}
                                  {lesson.end_time.slice(0, 5)}
                                </Typography>
                                {lesson.teacher.full_name && (
                                  <Typography variant="caption">
                                    👨‍🏫 {lesson.teacher.full_name}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Draggable>
                        )}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                );
              })}
            </Box>
          ))}
        </DragDropContext>
      </Paper>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>
          {editing ? "Darsni tahrirlash" : "Yangi dars qo‘shish"}
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Guruh</InputLabel>
            <Select
              value={form.group_id}
              onChange={(e) => setForm({ ...form, group_id: e.target.value })}
            >
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Hafta kuni</InputLabel>
            <Select
              value={form.day_of_week}
              onChange={(e) =>
                setForm({ ...form, day_of_week: e.target.value })
              }
            >
              {EN_DAYS.map((d, i) => (
                <MenuItem key={d} value={d}>
                  {UZ_DAYS[i]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <TextField
              label="Boshlanish"
              type="time"
              fullWidth
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <TextField
              label="Tugash"
              type="time"
              fullWidth
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </Box>

          <TextField
            label="Xona (ixtiyoriy)"
            fullWidth
            sx={{ mt: 2 }}
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor</Button>
          <Button variant="contained" onClick={handleSave}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
