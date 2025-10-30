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

  // 🔹 Guruhlarni olish
  useEffect(() => {
    api
      .get(`/teacher/groups/`)
      .then((res) => setGroups(res.data))
      .catch(() => toast.error("Guruhlarni olishda xato!"));
  }, []);

  // 🔹 O‘quvchilarni yuklash
  const loadStudents = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}/students/`);
      setStudents(res.data);
      const initAttendance = {},
        initReasons = {};
      res.data.forEach((s) => {
        initAttendance[s.id] = "present";
        initReasons[s.id] = "";
      });
      setAttendance(initAttendance);
      setReasons(initReasons);
      toast.success("O‘quvchilar ro‘yxati yuklandi!");
    } catch {
      toast.error("O‘quvchilarni olishda xato!");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id, value) =>
    setAttendance((p) => ({ ...p, [id]: value }));
  const handleReasonChange = (id, value) =>
    setReasons((p) => ({ ...p, [id]: value }));

  // 🔹 Yo‘qlama saqlash
  const handleSubmit = async () => {
    if (!selectedGroup) return toast.error("Iltimos, guruhni tanlang!");
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

  // 🔹 Hisobot
  const loadReport = async () => {
    if (!selectedGroup) return toast.error("Iltimos, guruhni tanlang!");
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

  const columns = reportData?.day_list
    ? [
        { field: "id", headerName: "№", width: 60 },
        { field: "fullname", headerName: "O‘quvchi", flex: 1 },
        ...reportData.day_list.map((day) => ({
          field: day,
          headerName: day,
          width: 80,
          align: "center",
          headerAlign: "center",
        })),
      ]
    : [];

  const rows = reportData?.rows
    ? reportData.rows.map((r, idx) => ({ id: idx + 1, ...r }))
    : [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f9fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={700} mb={3}>
        📋 Yo‘qlama tizimi
      </Typography>

      {/* 🔹 Guruh va sana tanlash */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
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
              fullWidth
              size="small"
              type="date"
              label="Sana"
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Grid>
        </Grid>

        {/* 🔹 O‘quvchilar ro‘yxati */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : students.length > 0 ? (
          <Box sx={{ mt: 3, maxHeight: "60vh", overflowY: "auto" }}>
            {students.map((s, idx) => (
              <Card
                key={s.id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  boxShadow: 1,
                  p: { xs: 1, sm: 1.5 },
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ flex: "1 1 100px" }}>
                    {idx + 1}. {s.full_name}
                  </Typography>

                  <FormControl sx={{ flex: "1 1 150px" }} size="small">
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
                    <FormControl sx={{ flex: "1 1 150px" }} size="small">
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
          <Typography sx={{ mt: 2 }} color="text.secondary">
            O‘quvchilar hali yuklanmagan.
          </Typography>
        )}

        {students.length > 0 && (
          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              py: 1.3,
              fontWeight: 600,
              fontSize: "1rem",
            }}
            onClick={handleSubmit}
          >
            💾 Saqlash
          </Button>
        )}
      </Paper>

      {/* 🔹 Hisobot */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          alignItems: "center",
        }}
      >
        <FormControl sx={{ width: { xs: "100%", sm: 200 } }} size="small">
          <InputLabel>Oy</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            label="Oy"
          >
            {monthNames.map((m, i) => (
              <MenuItem key={i} value={i + 1}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          onClick={loadReport}
          sx={{ height: 40, px: 3 }}
        >
          📊 Hisobotni ko‘rish
        </Button>
      </Box>

      {/* 🔹 Hisobot jadvali */}
      {loadingReport ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : reportData && reportData.rows?.length > 0 ? (
        <Paper sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3 }}>
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
            sx={{
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f3f4f6" },
            }}
          />
        </Paper>
      ) : (
        <Typography color="text.secondary">Hisobot topilmadi.</Typography>
      )}
    </Box>
  );
}
