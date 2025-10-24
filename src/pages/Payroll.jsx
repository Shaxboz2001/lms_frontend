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
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

export default function Payroll() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);

  // Modallar
  const [openSettings, setOpenSettings] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [openEditPercent, setOpenEditPercent] = useState(false);

  // Tanlangan qiymatlar
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [teacherPercent, setTeacherPercent] = useState("");

  // ----------------- Fetch Data -----------------
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

  // ----------------- Actions -----------------
  const handleCalculate = async () => {
    setLoading(true);
    try {
      await api.post(`/payroll/calculate?month=${month}`);
      toast.success("Payroll calculated ✅");
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error calculating payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPay = async () => {
    if (!paidAmount) return toast.error("Enter paid amount!");
    try {
      await api.post(`/payroll/${selectedRow.id}/pay`, {
        paid_amount: Number(paidAmount),
      });
      toast.success("Marked as paid 💰");
      setOpenPay(false);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Payment error");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put("/payroll/salary/settings", {
        teacher_percent: Number(settings.teacher_percent),
        manager_active_percent: Number(settings.manager_active_percent),
        manager_new_percent: Number(settings.manager_new_percent),
      });
      toast.success("Settings updated ✅");
      setOpenSettings(false);
      fetchSettings();
    } catch (err) {
      toast.error("Error saving settings");
    }
  };

  const handleUpdateTeacherPercent = async () => {
    if (!teacherPercent || !selectedRow) return;
    try {
      await api.put(`/payroll/teacher-percent/${selectedRow.user_id}`, {
        teacher_percent: Number(teacherPercent),
      });
      toast.success("Teacher % updated ✅");
      setOpenEditPercent(false);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update error");
    }
  };

  // ----------------- UI -----------------
  return (
    <Box sx={{ p: 3 }}>
      <Toaster position="top-right" />
      <Typography variant="h5" mb={2} fontWeight={600}>
        Payroll Management
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Month (YYYY-MM)"
            size="small"
            fullWidth
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </Grid>
        <Grid item xs="auto">
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleCalculate}
          >
            {loading ? <CircularProgress size={22} /> : "Calculate Payroll"}
          </Button>
        </Grid>
        <Grid item xs="auto">
          <Button variant="outlined" onClick={fetchRows}>
            Refresh
          </Button>
        </Grid>
        <Grid item xs="auto">
          <Button variant="outlined" onClick={() => setOpenSettings(true)}>
            Salary Settings ⚙️
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2, overflowX: "auto" }}>
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
                <b>Net</b>
              </TableCell>
              <TableCell>
                <b>Status</b>
              </TableCell>
              <TableCell>
                <b>Paid At</b>
              </TableCell>
              <TableCell align="center">
                <b>Actions</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No payroll found
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.user_name}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>
                  {r.role}
                </TableCell>
                <TableCell>{r.earned?.toLocaleString()}</TableCell>
                <TableCell>
                  <b>{r.net?.toLocaleString()}</b>
                </TableCell>
                <TableCell
                  sx={{ color: r.status === "paid" ? "green" : "orange" }}
                >
                  {r.status}
                </TableCell>
                <TableCell>
                  {r.paid_at ? new Date(r.paid_at).toLocaleString() : "-"}
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
                      Details
                    </Button>

                    {r.role === "teacher" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        onClick={() => {
                          setSelectedRow(r);
                          setTeacherPercent("");
                          setOpenEditPercent(true);
                        }}
                      >
                        Edit %
                      </Button>
                    )}

                    {r.status === "pending" ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setSelectedRow(r);
                          setPaidAmount(r.net || "");
                          setOpenPay(true);
                        }}
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
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ---------------- MODALS ---------------- */}

      {/* Details Modal */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        fullWidth
      >
        <DialogTitle>Payroll Details</DialogTitle>
        <DialogContent>
          {selectedDetails ? (
            <Box sx={{ mt: 1 }}>
              {Object.entries(selectedDetails).map(([k, v]) => (
                <Box
                  key={k}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #eee",
                    py: 0.7,
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>{k}</Typography>
                  <Typography>{String(v)}</Typography>
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

      {/* Pay Modal */}
      <Dialog open={openPay} onClose={() => setOpenPay(false)} fullWidth>
        <DialogTitle>Mark as Paid 💵</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" fontWeight={600}>
            {selectedRow?.user_name}
          </Typography>
          <Typography color="text.secondary" mb={1}>
            Role: {selectedRow?.role}
          </Typography>

          <TextField
            label="Paid Amount"
            fullWidth
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPay(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmPay}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Salary Settings Modal */}
      <Dialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        fullWidth
      >
        <DialogTitle>Salary Settings ⚙️</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Default Teacher %"
              value={settings.teacher_percent || ""}
              onChange={(e) =>
                setSettings({ ...settings, teacher_percent: e.target.value })
              }
            />
            <TextField
              label="Manager Active %"
              value={settings.manager_active_percent || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  manager_active_percent: e.target.value,
                })
              }
            />
            <TextField
              label="Manager New Student %"
              value={settings.manager_new_percent || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  manager_new_percent: e.target.value,
                })
              }
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

      {/* Edit Teacher Percent */}
      <Dialog
        open={openEditPercent}
        onClose={() => setOpenEditPercent(false)}
        fullWidth
      >
        <DialogTitle>Update Teacher Percent</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedRow?.user_name} ({selectedRow?.role})
          </Typography>
          <TextField
            label="Teacher Percent"
            fullWidth
            type="number"
            value={teacherPercent}
            onChange={(e) => setTeacherPercent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditPercent(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateTeacherPercent}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
