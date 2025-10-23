// src/pages/Payroll.jsx
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
  CircularProgress,
  Stack,
  Paper,
  Select,
  MenuItem,
} from "@mui/material";
import { api } from "../services/api";
import toast from "react-hot-toast";

const Payroll = () => {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchRows();
    fetchSettings();
  }, [month]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payroll?month=${month}`);
      setRows(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch payroll");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/payroll/salary/settings");
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      await api.post(`/payroll/calculate?month=${month}`);
      toast.success("Payroll calculated");
      fetchRows();
    } catch (err) {
      console.error(err);
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id) => {
    try {
      await api.post(`/payroll/${id}/pay`);
      toast.success("Paid");
      fetchRows();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Pay failed");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h5" gutterBottom>
        Payroll / Salary Management
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            label="Month (YYYY-MM)"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Calculate Payroll"}
          </Button>
          <Button variant="outlined" onClick={fetchRows}>
            Refresh
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Earned</TableCell>
              <TableCell>Deductions</TableCell>
              <TableCell>Net</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No rows
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.user_name || r.user_id}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell>
                  {r.earned?.toLocaleString?.() ?? r.earned}
                </TableCell>
                <TableCell>
                  {r.deductions?.toLocaleString?.() ?? r.deductions}
                </TableCell>
                <TableCell>{r.net?.toLocaleString?.() ?? r.net}</TableCell>
                <TableCell>
                  {r.status}
                  {r.paid_at
                    ? ` (${new Date(r.paid_at).toLocaleString()})`
                    : ""}
                </TableCell>
                <TableCell>
                  <pre style={{ whiteSpace: "pre-wrap", maxWidth: 300 }}>
                    {JSON.stringify(r.details, null, 2)}
                  </pre>
                </TableCell>
                <TableCell>
                  {r.status === "pending" ? (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handlePay(r.id)}
                    >
                      Pay
                    </Button>
                  ) : (
                    <Button size="small" disabled>
                      Paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Payroll;
