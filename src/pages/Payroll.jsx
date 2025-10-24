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
  IconButton,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { Edit, Search } from "@mui/icons-material";
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

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Modals
  const [openSettings, setOpenSettings] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openPay, setOpenPay] = useState(false);

  // Tanlangan
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [editPercent, setEditPercent] = useState(null);

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
    } catch {
      toast.error("Error saving settings");
    }
  };

  const handleUpdatePercent = async (teacherId, percent) => {
    try {
      await api.put(`/payroll/teacher-percent/${teacherId}`, {
        teacher_percent: Number(percent),
      });
      toast.success("Teacher % updated ✅");
      setEditPercent(null);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update error");
    }
  };

  // Filter & Search
  const filteredRows = rows.filter((r) => {
    const matchesSearch = r.user_name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesRole =
      filterRole === "all" ? true : r.role === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" mb={2} fontWeight={600}>
        Payroll Management
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Month (YYYY-MM)"
            size="small"
            fullWidth
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            label="Search by Name"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            label="Filter by Role"
            size="small"
            select
            fullWidth
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="teacher">Teacher</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
          </TextField>
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
                <b>Teacher %</b>
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
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No data found
                </TableCell>
              </TableRow>
            )}
            {filteredRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.user_name}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>
                  {r.role}
                </TableCell>

                {/* Teacher Percent Column */}
                <TableCell>
                  {r.role === "teacher" ? (
                    editPercent === r.user_id ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          size="small"
                          type="number"
                          value={r.temp_percent ?? ""}
                          onChange={(e) => {
                            setRows((prev) =>
                              prev.map((x) =>
                                x.user_id === r.user_id
                                  ? { ...x, temp_percent: e.target.value }
                                  : x
                              )
                            );
                          }}
                          sx={{ width: 70 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            handleUpdatePercent(
                              r.user_id,
                              r.temp_percent || r.details?.teacher_percent_used
                            )
                          }
                        >
                          Save
                        </Button>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>
                          {r.details?.teacher_percent_used || "-"}
                        </Typography>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setEditPercent(r.user_id)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Stack>
                    )
                  ) : (
                    "-"
                  )}
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
          <TextField
            label="Paid Amount"
            fullWidth
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPay(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmPay}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Salary Settings */}
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
    </Box>
  );
}
