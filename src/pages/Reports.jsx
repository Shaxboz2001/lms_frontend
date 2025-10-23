import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { FileDownload } from "@mui/icons-material";
import fileDownload from "js-file-download";
import { useTheme } from "@mui/material/styles";

const Reports = () => {
  const [period, setPeriod] = useState("daily");
  const [report, setReport] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/summary?period=${period}`);
      setReport(res.data);

      const trendRes = await api.get(`/reports/trend`);
      setTrend(trendRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Hisobotni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Faylni token bilan yuklash
  const handleDownload = async (format) => {
    setDownloading(true);
    try {
      const response = await api.get(
        `/reports/export?period=${period}&format=${format}`,
        { responseType: "blob" }
      );
      const filename = `report_${period}.${
        format === "excel" ? "xlsx" : "pdf"
      }`;
      fileDownload(response.data, filename);
      toast.success(`${format.toUpperCase()} fayl yuklandi!`);
    } catch (error) {
      console.error(error);
      toast.error("Faylni yuklashda xatolik!");
    } finally {
      setDownloading(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  if (!report)
    return (
      <Typography align="center" sx={{ mt: 5 }}>
        Hisobot maʼlumotlari topilmadi.
      </Typography>
    );

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />

      {/* 🔹 Title + Buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          📊 Hisobotlar paneli ({period})
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDownload />}
            fullWidth={isSmall}
            onClick={() => handleDownload("excel")}
            disabled={downloading}
          >
            {downloading ? "Yuklanmoqda..." : "Excel yuklash"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FileDownload />}
            fullWidth={isSmall}
            onClick={() => handleDownload("pdf")}
            disabled={downloading}
          >
            {downloading ? "Yuklanmoqda..." : "PDF yuklash"}
          </Button>
        </Stack>
      </Box>

      {/* 🔹 Davr tanlash */}
      <FormControl sx={{ minWidth: 180, mb: 3 }}>
        <InputLabel>Davr</InputLabel>
        <Select
          value={period}
          label="Davr"
          onChange={(e) => setPeriod(e.target.value)}
        >
          <MenuItem value="daily">Kunlik</MenuItem>
          <MenuItem value="weekly">Haftalik</MenuItem>
          <MenuItem value="monthly">Oylik</MenuItem>
        </Select>
      </FormControl>

      {/* 🔹 Statistika */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="👥 O‘quvchilar"
            value={report.students.total}
            sub={`Yangi: ${report.students.new}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="🎓 Konversiya"
            value={`${report.students.conversion_rate}%`}
            sub={`Leads: ${report.students.leads}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="📅 Qatnashuv"
            value={`${report.attendance.attendance_rate}%`}
            sub={`Jami: ${report.attendance.total_records}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="💰 To‘lovlar"
            value={`${report.payments.total_amount.toLocaleString()} so‘m`}
            sub={`O‘rtacha: ${report.payments.average_payment.toLocaleString()} so‘m`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="💸 Qarzdorlar"
            value={report.payments.debtor_count}
            sub="To‘lov qilmaganlar"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="🏫 Guruhlar"
            value={report.groups.active_groups}
            sub={`Yangi boshlangan: ${report.groups.new_started}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="📚 Kurslar"
            value={report.courses.active}
            sub={`Kutilayotgan: ${report.courses.upcoming}`}
          />
        </Grid>
      </Grid>

      {/* 🔹 To‘lovlar trendi */}
      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        📈 Oxirgi 7 kunlik to‘lovlar
      </Typography>

      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          boxShadow: 2,
          overflowX: "auto",
        }}
      >
        <Box sx={{ width: "100%", height: 300, minWidth: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#1976d2" name="To‘lovlar (so‘m)" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* 🔹 O‘quvchilar tahlili */}
      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        👩‍🎓 O‘quvchilar tahlili
      </Typography>

      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          boxShadow: 2,
          overflowX: "auto",
        }}
      >
        <Box sx={{ width: "100%", height: 300, minWidth: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={[
                { name: "Leads", count: report.students.leads },
                { name: "O‘qiyotgan", count: report.students.studying },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

// 🔹 StatCard komponenti
const StatCard = ({ title, value, sub }) => (
  <Card
    sx={{
      borderRadius: 3,
      boxShadow: 3,
      p: 1,
      height: "100%",
      textAlign: "center",
      transition: "0.3s",
      "&:hover": { boxShadow: 6, transform: "scale(1.02)" },
    }}
  >
    <CardContent>
      <Typography variant="h6" sx={{ fontSize: { xs: "1rem", md: "1.1rem" } }}>
        {title}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#1976d2",
          mt: 1,
          fontSize: { xs: "1.2rem", md: "1.5rem" },
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: { xs: "0.8rem", md: "0.9rem" } }}
      >
        {sub}
      </Typography>
    </CardContent>
  </Card>
);

export default Reports;
