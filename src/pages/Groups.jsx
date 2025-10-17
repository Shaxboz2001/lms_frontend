import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";

const BASE_URL = "http://localhost:8000"; // o‘zingning backend adresingni yoz

export default function Groups() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [studentIds, setStudentIds] = useState([]);

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  // 🔹 Ma’lumotlarni olish
  useEffect(() => {
    fetchCourses();
    fetchTeachers();
    fetchStudents();
  }, []);

  const fetchCourses = async () => {
    const res = await axios.get(`${BASE_URL}/courses`);
    setCourses(res.data);
  };

  const fetchTeachers = async () => {
    const res = await axios.get(`${BASE_URL}/users?role=teacher`);
    setTeachers(res.data);
  };

  const fetchStudents = async () => {
    const res = await axios.get(`${BASE_URL}/users?role=student`);
    setStudents(res.data);
  };

  // 🔹 Yangi guruh yaratish
  const handleSubmit = async () => {
    try {
      const payload = {
        name,
        description,
        course_id: Number(courseId),
        teacher_id: Number(teacherId),
        student_ids: studentIds.map(Number),
      };

      console.log("Yuborilayotgan:", payload);

      const res = await axios.post(`${BASE_URL}/groups/`, payload);
      alert("Guruh muvaffaqiyatli yaratildi!");
      console.log(res.data);
    } catch (error) {
      console.error("Xato:", error.response?.data || error.message);
      alert("Xatolik yuz berdi!");
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Guruh yaratish
      </Typography>

      <TextField
        label="Guruh nomi"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Tavsif"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        margin="normal"
      />

      {/* Kurs tanlash */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Kurs</InputLabel>
        <Select
          value={courseId}
          label="Kurs"
          onChange={(e) => setCourseId(e.target.value)}
        >
          {courses.map((course) => (
            <MenuItem key={course.id} value={course.id}>
              {course.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Ustoz tanlash */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Ustoz</InputLabel>
        <Select
          value={teacherId}
          label="Ustoz"
          onChange={(e) => setTeacherId(e.target.value)}
        >
          {teachers.map((teacher) => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.full_name || teacher.username}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* O‘quvchilar tanlash */}
      <FormControl fullWidth margin="normal">
        <InputLabel>O‘quvchilar</InputLabel>
        <Select
          multiple
          value={studentIds}
          label="O‘quvchilar"
          onChange={(e) => setStudentIds(e.target.value)}
        >
          {students.map((student) => (
            <MenuItem key={student.id} value={student.id}>
              {student.full_name || student.username}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: 2 }}
      >
        Yaratish
      </Button>
    </Box>
  );
}
