import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
} from "@mui/material";
import * as XLSX from "xlsx";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

// === Helperlar ===
const formatMonthName = (yyyyMm) => {
  if (!yyyyMm) return "-";
  const [y, m] = yyyyMm.split("-");
  const d = new Date(`${y}-${m}-01`);
  return d.toLocaleDateString("uz-UZ", { year: "numeric", month: "long" });
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("To‘lovlarni olishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = selectedMonth
    ? payments.filter((p) => p.month === selectedMonth)
    : payments;

  const summary = filteredPayments.reduce(
    (acc, p) => {
      acc.total += p.amount || 0;
      acc.count += 1;
      return acc;
    },
    { total: 0, count: 0 }
  );

  // ====== Export to Excel ======
  const handleExportExcel = () => {
    if (!filteredPayments.length) {
      toast.error("Ma’lumot yo‘q!");
      return;
    }
    const data = filteredPayments.map((p) => ({
      ID: p.id,
      "O'quvchi": p.student?.full_name || p.student?.username || "-",
      Kurs: p.group?.course?.title || "-",
      Guruh: p.group?.name || "-",
      Oy: formatMonthName(p.month),
      "To‘langan summa": `${(p.amount || 0).toLocaleString()} so‘m`,
      Izoh: p.description || "-",
      "Yaratilgan sana": formatDateTime(p.created_at),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "To‘lovlar");
    XLSX.writeFile(wb, `Tolovlar_${selectedMonth || "barcha"}.xlsx`);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#fafafa", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar boshqaruvi
      </Typography>

      {/* SUMMARY */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          bgcolor: "white",
          p: 2,
          borderRadius: 2,
          mb: 3,
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        <Typography>
          Jami yozuvlar: <b>{summary.count}</b>
        </Typography>
        <Typography>
          Umumiy to‘langan summa: <b>{summary.total.toLocaleString()} so‘m</b>
        </Typography>
      </Box>

      {/* FILTER va BUTTONLAR */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Oy bo‘yicha filter"
            fullWidth
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <MenuItem value="">Barcha oylar</MenuItem>
            {[...new Set(payments.map((p) => p.month))].map((m) => (
              <MenuItem key={m} value={m}>
                {formatMonthName(m)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} textAlign="right">
          <Button
            variant="outlined"
            color="secondary"
            sx={{ mr: 2 }}
            onClick={handleExportExcel}
          >
            📊 Excel’ga eksport
          </Button>
          <Button variant="contained" color="success" onClick={fetchPayments}>
            🔄 Yangilash
          </Button>
        </Grid>
      </Grid>

      {/* TABLE */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : filteredPayments.length ? (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                <TableCell>
                  <b>ID</b>
                </TableCell>
                <TableCell>
                  <b>O‘quvchi</b>
                </TableCell>
                <TableCell>
                  <b>Kurs</b>
                </TableCell>
                <TableCell>
                  <b>Guruh</b>
                </TableCell>
                <TableCell>
                  <b>Oy</b>
                </TableCell>
                <TableCell>
                  <b>To‘langan summa</b>
                </TableCell>
                <TableCell>
                  <b>Izoh</b>
                </TableCell>
                <TableCell>
                  <b>Yaratilgan sana</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow
                  key={p.id}
                  sx={{
                    "&:hover": { bgcolor: "#f9f9f9" },
                    transition: "0.2s",
                  }}
                >
                  <TableCell>{p.id}</TableCell>
                  <TableCell>
                    {p.student?.full_name || p.student?.username || "-"}
                  </TableCell>
                  <TableCell>{p.group?.course?.title || "-"}</TableCell>
                  <TableCell>{p.group?.name || "-"}</TableCell>
                  <TableCell>{formatMonthName(p.month)}</TableCell>
                  <TableCell>
                    <b>{(p.amount || 0).toLocaleString()}</b> so‘m
                  </TableCell>
                  <TableCell>{p.description || "-"}</TableCell>
                  <TableCell>{formatDateTime(p.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography textAlign="center" mt={4} color="gray">
          Ma’lumot topilmadi ☹️
        </Typography>
      )}
    </Box>
  );
};

export default Payments;
