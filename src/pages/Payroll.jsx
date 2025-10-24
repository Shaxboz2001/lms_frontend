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
} from "@mui/material";
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

  // 🕓 History modal
  const [openHistory, setOpenHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);

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

  // -----------------------------
  // Calculate Payroll
  // -----------------------------
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

  // -----------------------------
  // Pay Salary
  // -----------------------------
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

  // -----------------------------
  // Update Settings
  // -----------------------------
  const handleSaveSettings = async () => {
    try {
      await api.put("/payroll/salary/settings", {
        teacher_percent: Number(settings.teacher_percent),
        manager_active_percent: Number(settings.manager_active_percent),
        manager_new_percent: Number(settings.manager_new_percent),
      });
      toast.success("Settings updated ✅");
      setOpenSettings(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save settings");
    }
  };

  // -----------------------------
  // Fetch Payroll History
  // -----------------------------
  const handleShowHistory = async () => {
    setOpenHistory(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/payroll?month=${selectedMonth}`);
      setHistoryData(res.data);
    } catch {
      toast.error("Error fetching payroll history");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={2}>
        Payroll Management
      </Typography>

      {/* SETTINGS & ACTIONS */}
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

          <Grid item xs={12} sm={6} md="auto">
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={loading}
            >
              {loading ? <CircularProgress size={22} /> : "Calculate Payroll"}
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md="auto">
            <Button variant="outlined" onClick={fetchRows}>
              Refresh
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md="auto">
            <Button variant="outlined" onClick={() => setOpenSettings(true)}>
              Salary Settings ⚙️
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md="auto">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleShowHistory}
            >
              Show History 📅
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
                <b>Deductions</b>
              </TableCell>
              <TableCell>
                <b>Net</b>
              </TableCell>
              <TableCell>
                <b>Status</b>
              </TableCell>
              <TableCell>
                <b>Paid At</b>
              </TableCell>
              <TableCell>
                <b>Details</b>
              </TableCell>
              <TableCell align="center">
                <b>Action</b>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No payroll data available
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.user_name || r.user_id}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>
                  {r.role}
                </TableCell>
                <TableCell>{r.earned?.toLocaleString()}</TableCell>
                <TableCell>{r.deductions?.toLocaleString()}</TableCell>
                <TableCell>{r.net?.toLocaleString()}</TableCell>
                <TableCell
                  sx={{
                    color:
                      r.status === "paid"
                        ? "green"
                        : r.status === "pending"
                        ? "orange"
                        : "inherit",
                    fontWeight: 600,
                  }}
                >
                  {r.status}
                </TableCell>
                <TableCell>
                  {r.paid_at ? new Date(r.paid_at).toLocaleString() : "-"}
                </TableCell>
                <TableCell>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      maxWidth: "220px",
                      fontSize: "12px",
                    }}
                  >
                    {JSON.stringify(r.details, null, 1)}
                  </pre>
                </TableCell>
                <TableCell align="center">
                  {r.status === "pending" ? (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => openPayDialog(r)}
                    >
                      Mark as Paid
                    </Button>
                  ) : (
                    <Button size="small" disabled color="success">
                      Paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* SETTINGS MODAL */}
      <Dialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        fullWidth
      >
        <DialogTitle>Salary Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Teacher Percent (%)"
              type="number"
              value={settings.teacher_percent}
              onChange={(e) =>
                setSettings({ ...settings, teacher_percent: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Manager Active Percent (%)"
              type="number"
              value={settings.manager_active_percent}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  manager_active_percent: e.target.value,
                })
              }
              fullWidth
            />
            <TextField
              label="Manager New Student Percent (%)"
              type="number"
              value={settings.manager_new_percent}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  manager_new_percent: e.target.value,
                })
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSettings}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* PAY MODAL */}
      <Dialog
        open={openPayModal}
        onClose={() => setOpenPayModal(false)}
        fullWidth
      >
        <DialogTitle>Mark as Paid</DialogTitle>
        <DialogContent>
          <Typography mb={1}>
            <b>{selectedPayroll?.user_name}</b> ({selectedPayroll?.role})
          </Typography>
          <TextField
            label="Paid Amount"
            type="number"
            fullWidth
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmPay}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* HISTORY MODAL */}
      <Dialog
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Payroll History</DialogTitle>
        <DialogContent>
          <TextField
            label="Select Month (YYYY-MM)"
            fullWidth
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            size="small"
            sx={{ mb: 2 }}
            onClick={handleShowHistory}
          >
            View
          </Button>

          {historyLoading ? (
            <CircularProgress />
          ) : (
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
                    <b>Net</b>
                  </TableCell>
                  <TableCell>
                    <b>Status</b>
                  </TableCell>
                  <TableCell>
                    <b>Paid At</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No records for this month
                    </TableCell>
                  </TableRow>
                ) : (
                  historyData.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{h.user_name}</TableCell>
                      <TableCell>{h.role}</TableCell>
                      <TableCell>{h.net?.toLocaleString()}</TableCell>
                      <TableCell
                        sx={{
                          color: h.status === "paid" ? "green" : "orange",
                          fontWeight: 600,
                        }}
                      >
                        {h.status}
                      </TableCell>
                      <TableCell>
                        {h.paid_at ? new Date(h.paid_at).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
