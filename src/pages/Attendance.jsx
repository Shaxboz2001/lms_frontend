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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { BASE_URL, config } from "../services/api";

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

  // Guruhlarni yuklash
  useEffect(() => {
    axios
      .get(`${BASE_URL}/teacher/groups/`, config)
      .then((res) => setGroups(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Guruhdagi o‘quvchilarni yuklash
  const loadStudents = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/groups/${groupId}/students/`,
        config
      );
      setStudents(res.data);
      const initial = {};
      res.data.forEach((s) => (initial[s.id] = true));
      setAttendance(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Checkbox toggle
  const handleToggle = (id) => {
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Yo‘qlama saqlash
  const handleSubmit = async () => {
    if (!selectedGroup) {
      alert("❌ Iltimos guruhni tanlang!");
      return;
    }
    const records = students.map((s) => ({
      student_id: s.id,
      is_present: attendance[s.id],
    }));
    try {
      await axios.post(
        `${BASE_URL}/attendance/`,
        { group_id: selectedGroup, records, date_: selectedDate },
        config
      );
      alert("✅ Yo‘qlama saqlandi!");
      loadReport();
    } catch (err) {
      alert("❌ Shu kunga oldin yozilgan yo‘qlama mavjud bo‘lishi mumkin!");
    }
  };

  // Hisobot yuklash
  const loadReport = async () => {
    if (!selectedGroup) return;
    setLoadingReport(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/attendance/report/${selectedGroup}`,
        { params: { month: selectedMonth }, ...config }
      );
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  // DataGrid columns
  const columns = reportData?.day_list
    ? [
        { field: "id", headerName: "№", width: 60 },
        { field: "fullname", headerName: "Fullname", width: 200 },
        ...reportData.day_list.map((day) => ({
          field: day,
          headerName: day,
          width: 100,
          headerAlign: "center",
          align: "center",
        })),
      ]
    : [];

  // DataGrid rows
  const rows = reportData?.rows
    ? reportData.rows.map((r, idx) => ({ id: idx + 1, ...r }))
    : [];

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        📋 Yo‘qlama qilish
      </Typography>

      {/* Guruh tanlash */}
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

      {/* O‘quvchilar ro‘yxati (checkbox) */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        students.map((s, idx) => (
          <Card key={s.id} sx={{ mb: 1 }}>
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
        ))
      )}

      {/* Saqlash */}
      {students.length > 0 && (
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 3, height: 50 }}
          onClick={handleSubmit}
        >
          Saqlash
        </Button>
      )}

      {/* Hisobot va oy select */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          color="secondary"
          sx={{ height: 40 }}
          onClick={loadReport}
        >
          Hisobot
        </Button>
        <FormControl sx={{ width: 150 }}>
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

      {/* DataGrid hisobot */}
      {loadingReport ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      ) : reportData && reportData.message ? (
        <Typography>{reportData.message}</Typography>
      ) : reportData ? (
        <Box sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 20, 50]}
            disableSelectionOnClick
            autoHeight
          />
        </Box>
      ) : null}
    </Box>
  );
}
