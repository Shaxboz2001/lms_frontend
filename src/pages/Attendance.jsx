import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

const monthNames = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

export default function Attendance() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loadingReport, setLoadingReport] = useState(false);

  // 🔹 Guruhlarni yuklash
  useEffect(() => {
    api
      .get(`/teacher/groups/`)
      .then((res) => setGroups(res.data))
      .catch((err) => toast.error("Guruhlarni olishda xato!"));
  }, []);

  // 🔹 Guruhdagi o‘quvchilarni yuklash
  const loadStudents = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}/students/`);
      setStudents(res.data);
      const initial = {};
      res.data.forEach((s) => (initial[s.id] = true));
      setAttendance(initial);
      toast.success("O‘quvchilar ro‘yxati yuklandi!");
    } catch (err) {
      toast.error("O‘quvchilarni olishda xato!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Checkbox toggle
  const handleToggle = (id) => {
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 🔹 Yo‘qlama saqlash
  const handleSubmit = async () => {
    if (!selectedGroup) return toast.error("Iltimos guruhni tanlang!");
    if (students.length === 0) return toast.error("Guruhda o‘quvchi yo‘q!");

    const records = students.map((s) => ({
      student_id: s.id,
      is_present: attendance[s.id],
    }));

    try {
      await api.post(`/attendance/`, {
        group_id: selectedGroup,
        records,
        date_: selectedDate,
      });
      toast.success("✅ Yo‘qlama saqlandi!");
      loadReport();
    } catch (err) {
      toast.error("❌ Bu kunga allaqachon yo‘qlama kiritilgan!");
    }
  };

  // 🔹 Hisobot yuklash
  const loadReport = async () => {
    if (!selectedGroup) return toast.error("Iltimos guruhni tanlang!");
    setLoadingReport(true);
    try {
      const res = await api.get(`/attendance/report/${selectedGroup}`, {
        params: { month: selectedMonth },
      });
      setReportData(res.data);
    } catch {
      toast.error("Hisobotni olishda xato!");
    } finally {
      setLoadingReport(false);
    }
  };

  // 🔹 DataGrid ustunlar
  const columns = reportData?.day_list
    ? [
        { field: "id", headerName: "№", width: 60 },
        { field: "fullname", headerName: "O‘quvchi", width: 200 },
        ...reportData.day_list.map((day) => ({
          field: day,
          headerName: day,
          width: 80,
          headerAlign: "center",
          align: "center",
        })),
      ]
    : [];

  // 🔹 DataGrid qatorlar
  const rows = reportData?.rows
    ? reportData.rows.map((r, idx) => ({ id: idx + 1, ...r }))
    : [];

  return (
    <Box sx={{ p: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📋 Yo‘qlama tizimi
      </Typography>

      {/* Guruh tanlash */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Guruhni tanlang</InputLabel>
          <Select
            value={selectedGroup}
            label="Guruhni tanlang"
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              loadStudents(e.target.value);
            }}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sana tanlash */}
        <TextField
          type="date"
          label="Sana"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          sx={{ mb: 3 }}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        {/* O‘quvchilar ro‘yxati */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress />
          </Box>
        ) : students.length > 0 ? (
          <Box sx={{ maxHeight: 300, overflowY: "auto", mb: 2 }}>
            {students.map((s, idx) => (
              <Card key={s.id} sx={{ mb: 1, borderRadius: 2 }}>
                <CardContent
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography>
                    {idx + 1}. {s.full_name}
                  </Typography>
                  <Checkbox
                    checked={attendance[s.id] || false}
                    onChange={() => handleToggle(s.id)}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">
            O‘quvchilar hali yuklanmagan.
          </Typography>
        )}

        {students.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ height: 50, fontWeight: 600 }}
            onClick={handleSubmit}
          >
            💾 Saqlash
          </Button>
        )}
      </Paper>

      {/* Hisobot va oy tanlash */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          color="secondary"
          onClick={loadReport}
          sx={{ height: 45 }}
        >
          📊 Hisobot
        </Button>
        <FormControl sx={{ width: 180 }}>
          <InputLabel>Oy</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            label="Oy"
          >
            {monthNames.map((name, i) => (
              <MenuItem key={i} value={i + 1}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Hisobot jadvali */}
      {loadingReport ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      ) : reportData && reportData.rows?.length > 0 ? (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📅 {monthNames[selectedMonth - 1]} hisobot
          </Typography>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 20, 50]}
            disableSelectionOnClick
            autoHeight
          />
        </Paper>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Hozircha hisobot ma’lumotlari yo‘q.
        </Typography>
      )}
    </Box>
  );
}
