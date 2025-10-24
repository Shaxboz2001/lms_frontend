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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

export default function Payroll() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [openPayModal, setOpenPayModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");

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

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography
        variant={isMobile ? "h6" : "h5"}
        fontWeight={600}
        mb={isMobile ? 1.5 : 2}
        textAlign={isMobile ? "center" : "left"}
      >
        Payroll Management
      </Typography>

      {/* FILTERS & ACTIONS */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid
          container
          spacing={isMobile ? 1.5 : 2}
          alignItems="center"
          justifyContent={isMobile ? "center" : "flex-start"}
        >
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              label="Month (YYYY-MM)"
              fullWidth
              size="small"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm="auto">
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={isMobile ? 1 : 2}
              width="100%"
            >
              <Button
                fullWidth={isMobile}
                variant="contained"
                onClick={handleCalculate}
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} /> : "Calculate Payroll"}
              </Button>

              <Button
                fullWidth={isMobile}
                variant="outlined"
                onClick={fetchRows}
              >
                Refresh
              </Button>

              <Button
                fullWidth={isMobile}
                variant="outlined"
                onClick={() => setOpenSettings(true)}
              >
                Salary Settings ⚙️
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLE */}
      <Paper
        sx={{
          p: { xs: 1, md: 2 },
          overflowX: "auto",
          width: "100%",
          borderRadius: 3,
        }}
      >
        <Table size="small" stickyHeader>
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
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No payroll data
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
                  sx={{
                    color: r.status === "paid" ? "green" : "orange",
                    fontWeight: 600,
                  }}
                >
                  {r.status}
                </TableCell>
                <TableCell>
                  {r.paid_at ? new Date(r.paid_at).toLocaleString() : "-"}
                </TableCell>
                <TableCell align="center">
                  <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={1}
                    alignItems="center"
                    justifyContent="center"
                  >
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
                        onClick={() => {
                          setSelectedPayroll(r);
                          setPaidAmount(r.net || "");
                          setOpenPayModal(true);
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

      {/* DETAILS MODAL */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        fullWidth
        maxWidth={isMobile ? "xs" : "sm"}
      >
        <DialogTitle textAlign="center">Payroll Details</DialogTitle>
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
                  <Typography variant="body2" fontWeight={500}>
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

      {/* PAY MODAL */}
      <Dialog
        open={openPayModal}
        onClose={() => setOpenPayModal(false)}
        fullWidth
        maxWidth={isMobile ? "xs" : "sm"}
      >
        <DialogTitle textAlign="center">💵 Mark as Paid</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" fontWeight={600} textAlign="center">
            {selectedPayroll?.user_name}
          </Typography>
          <TextField
            label="Paid Amount (UZS)"
            type="number"
            fullWidth
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmPay}
            disabled={!paidAmount}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* SETTINGS MODAL */}
      <Dialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        fullWidth
        maxWidth={isMobile ? "xs" : "sm"}
      >
        <DialogTitle textAlign="center">Salary Settings ⚙️</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Teacher %"
              type="number"
              value={settings.teacher_percent}
              onChange={(e) =>
                setSettings({ ...settings, teacher_percent: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Manager Active %"
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
              label="Manager New Student %"
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
    </Box>
  );
}
