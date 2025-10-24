import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import { Edit, Save } from "@mui/icons-material";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

export default function Payroll() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState([]);
  const [settings, setSettings] = useState({
    teacher_percent: "",
    manager_active_percent: "",
    manager_new_percent: "",
  });
  const [openSettings, setOpenSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // 💰 Pay modal
  const [openPayModal, setOpenPayModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");

  // 📊 Details modal
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  // ✏️ Inline edit state
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [editingPercent, setEditingPercent] = useState("");

  // -----------------------------
  // Fetch payroll and settings
  // -----------------------------
  useEffect(() => {
    fetchRows();
    fetchSettings();
  }, [month]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payroll?month=${month}`);
      setRows(res.data);
    } catch {
      toast.error("Error fetching payroll data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/payroll/salary/settings");
      setSettings(res.data);
    } catch {
      toast.error("Error fetching salary settings");
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      await api.post(`/payroll/calculate?month=${month}`);
      toast.success("Payroll calculated successfully ✅");
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error calculating payroll");
    } finally {
      setLoading(false);
    }
  };

  const openPayDialog = (row) => {
    setSelectedPayroll(row);
    setPaidAmount(row.net || "");
    setOpenPayModal(true);
  };

  const handleConfirmPay = async () => {
    if (!paidAmount) return toast.error("Enter paid amount!");
    try {
      await api.post(`/payroll/${selectedPayroll.id}/pay`, {
        paid_amount: Number(paidAmount),
      });
      toast.success("Payment marked as paid 💰");
      setOpenPayModal(false);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error processing payment");
    }
  };

  const handleUpdateTeacherPercent = async (teacherId) => {
    if (!editingPercent || isNaN(editingPercent)) {
      toast.error("Enter valid percent!");
      return;
    }
    try {
      await api.put(`/payroll/teacher-percent/${teacherId}`, {
        teacher_percent: Number(editingPercent),
      });
      toast.success("Teacher percent updated ✅");
      setEditingTeacherId(null);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error updating percent");
    }
  };

  // -----------------------------
  // UI Render
  // -----------------------------
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={2}>
        💼 Payroll Management
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Month (YYYY-MM)"
              fullWidth
              size="small"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </Grid>
          <Grid item xs="auto">
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={loading}
            >
              {loading ? <CircularProgress size={22} /> : "Calculate Payroll"}
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button variant="outlined" onClick={fetchRows}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLE */}
      <Paper sx={{ p: { xs: 1, md: 2 }, overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Name</b>
              </TableCell>
              <TableCell>
                <b>Role</b>
              </TableCell>
              <TableCell>
                <b>Earned</b>
              </TableCell>
              <TableCell>
                <b>Percent</b>
              </TableCell>
              <TableCell>
                <b>Net</b>
              </TableCell>
              <TableCell>
                <b>Status</b>
              </TableCell>
              <TableCell align="center">
                <b>Actions</b>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No payroll data available
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.user_name}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {r.role}
                  </TableCell>
                  <TableCell>{r.earned?.toLocaleString()}</TableCell>

                  {/* ✅ Inline Percent Edit */}
                  <TableCell>
                    {r.role === "teacher" ? (
                      editingTeacherId === r.id ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            size="small"
                            type="number"
                            value={editingPercent}
                            onChange={(e) => setEditingPercent(e.target.value)}
                            sx={{ width: 80 }}
                          />
                          <IconButton
                            color="success"
                            onClick={() => handleUpdateTeacherPercent(r.userid)}
                          >
                            <Save />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography>
                            {r.details?.teacher_percent_used || "-"}%
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingTeacherId(r.id);
                              setEditingPercent(
                                r.details?.teacher_percent_used || ""
                              );
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Stack>
                      )
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell>
                    <b>{r.net?.toLocaleString()}</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: r.status === "paid" ? "green" : "orange",
                      fontWeight: 600,
                    }}
                  >
                    {r.status}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedDetails(r.details);
                          setOpenDetails(true);
                        }}
                      >
                        View
                      </Button>
                      {r.status === "pending" ? (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openPayDialog(r)}
                        >
                          Pay
                        </Button>
                      ) : (
                        <Button size="small" color="success" disabled>
                          Paid
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* DETAILS MODAL */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        fullWidth
      >
        <DialogTitle>Payroll Details</DialogTitle>
        <DialogContent>
          {selectedDetails ? (
            <Box sx={{ mt: 1 }}>
              {Object.entries(selectedDetails).map(([key, val]) => (
                <Box
                  key={key}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #eee",
                    py: 0.8,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {key.replace(/_/g, " ")}
                  </Typography>
                  <Typography variant="body2">
                    {typeof val === "number"
                      ? val.toLocaleString()
                      : String(val)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography>No details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
