import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Paper,
  Grid,
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
  const [reasons, setReasons] = useState({});
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
      .catch(() => toast.error("Guruhlarni olishda xato!"));
  }, []);

  // 🔹 Guruhdagi o‘quvchilarni yuklash
  const loadStudents = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}/students/`);
      setStudents(res.data);

      // Har bir o‘quvchini "qatnashgan" deb boshlang‘ich belgilang
      const initial = {};
      const reasonInit = {};
      res.data.forEach((s) => {
        initial[s.id] = "present";
        reasonInit[s.id] = "";
      });
      setAttendance(initial);
      setReasons(reasonInit);
      toast.success("O‘quvchilar ro‘yxati yuklandi!");
    } catch {
      toast.error("O‘quvchilarni olishda xato!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Holatni o‘zgartirish (present / absent_sababli / absent_sababsiz)
  const handleStatusChange = (studentId, value) => {
    setAttendance((prev) => ({ ...prev, [studentId]: value }));
  };

  // 🔹 Sababli sababini tanlash
  const handleReasonChange = (studentId, value) => {
    setReasons((prev) => ({ ...prev, [studentId]: value }));
  };

  // 🔹 Yo‘qlama saqlash
  const handleSubmit = async () => {
    if (!selectedGroup) return toast.error("Iltimos guruhni tanlang!");
    if (students.length === 0) return toast.error("Guruhda o‘quvchi yo‘q!");

    const records = students.map((s) => ({
      student_id: s.id,
      is_present: attendance[s.id] === "present",
      reason:
        attendance[s.id] === "absent_sababli"
          ? reasons[s.id] || "sababli"
          : attendance[s.id] === "absent_sababsiz"
          ? "sababsiz"
          : null,
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
      toast.error(err.response?.data?.detail || "❌ Xatolik yuz berdi!");
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
          width: 100,
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
    <Box sx={{ p: 4, bgcolor: "#f9fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📋 Yo‘qlama tizimi
      </Typography>

      {/* Guruh tanlash qismi */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
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
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              type="date"
              label="Sana"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* O‘quvchilar ro‘yxati */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress />
          </Box>
        ) : students.length > 0 ? (
          <Box sx={{ maxHeight: 400, overflowY: "auto", mt: 2 }}>
            {students.map((s, idx) => (
              <Card key={s.id} sx={{ mb: 1, borderRadius: 2 }}>
                <CardContent
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Typography sx={{ width: "30%" }}>
                    {idx + 1}. {s.full_name}
                  </Typography>

                  <FormControl sx={{ width: "35%" }}>
                    <InputLabel>Holat</InputLabel>
                    <Select
                      value={attendance[s.id] || "present"}
                      label="Holat"
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                    >
                      <MenuItem value="present">✅ Bor</MenuItem>
                      <MenuItem value="absent_sababli">🕒 Sababli</MenuItem>
                      <MenuItem value="absent_sababsiz">❌ Sababsiz</MenuItem>
                    </Select>
                  </FormControl>

                  {attendance[s.id] === "absent_sababli" && (
                    <FormControl sx={{ width: "30%" }}>
                      <InputLabel>Sabab</InputLabel>
                      <Select
                        value={reasons[s.id] || ""}
                        label="Sabab"
                        onChange={(e) =>
                          handleReasonChange(s.id, e.target.value)
                        }
                      >
                        <MenuItem value="kasallik">Kasallik</MenuItem>
                        <MenuItem value="safar">Safar</MenuItem>
                        <MenuItem value="boshqa">Boshqa</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            O‘quvchilar hali yuklanmagan.
          </Typography>
        )}

        {students.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ height: 50, fontWeight: 600, mt: 2 }}
            onClick={handleSubmit}
          >
            💾 Saqlash
          </Button>
        )}
      </Paper>

      {/* Hisobot bo‘limi */}
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
