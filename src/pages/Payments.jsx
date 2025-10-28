import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Modal,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { api } from "../services/api";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openPayModal, setOpenPayModal] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  const [availableGroups, setAvailableGroups] = useState([]);
  const [form, setForm] = useState({
    student_id: "",
    group_id: "",
    amount: "",
    description: "",
    month: "",
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [historyData, setHistoryData] = useState(null);

  // utility: format 'YYYY-MM' -> 'October 2025' localized
  const formatMonthName = (yyyyMm) => {
    if (!yyyyMm) return "-";
    try {
      // create date at first day of month
      const d = new Date(`${yyyyMm}-01T00:00:00`);
      return new Intl.DateTimeFormat("uz-UZ", {
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return yyyyMm;
    }
  };

  // utility: format datetime ISO -> locale string with time
  const formatDateTime = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat("uz-UZ", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return iso;
    }
  };

  // Fetch functions
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Toʻlovlarni olishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(
        Array.isArray(res.data)
          ? res.data.filter((u) => u.role === "student")
          : []
      );
    } catch (err) {
      console.error(err);
      toast.error("Oʻquvchilarni olishda xatolik!");
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Guruhlarni olishda xatolik!");
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchGroups();
  }, []);

  // filtered by selectedMonth (YYYY-MM)
  const filteredPayments = selectedMonth
    ? payments.filter((p) => p.month === selectedMonth)
    : payments;

  // When student selected -> populate availableGroups and autofill if single group
  useEffect(() => {
    if (!form.student_id) {
      setAvailableGroups([]);
      setForm((s) => ({ ...s, group_id: "" }));
      return;
    }
    const studentIdNum = Number(form.student_id);
    const groupsForStudent = groups.filter((g) =>
      Array.isArray(g.students)
        ? g.students.some((st) => st.id === studentIdNum)
        : false
    );
    setAvailableGroups(groupsForStudent);

    if (groupsForStudent.length === 1) {
      const g = groupsForStudent[0];
      setForm((prev) => ({
        ...prev,
        group_id: g.id,
        amount: g.course?.price || prev.amount,
        description: g.course?.title || prev.description,
      }));
    }
  }, [form.student_id, groups]);

  // Add payment (creates backend record). If month empty => set current month automatically.
  const handleAddPayment = async () => {
    // default month if empty
    const monthToSend = form.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    if (!form.student_id || !form.group_id || !form.amount) {
      toast.error("Student, guruh va summa majburiy!");
      return;
    }
    try {
      await api.post("/payments", {
        student_id: parseInt(form.student_id),
        group_id: parseInt(form.group_id),
        amount: parseFloat(form.amount),
        description: form.description,
        month: monthToSend,
      });
      toast.success("Toʻlov qoʻshildi");
      setOpenAdd(false);
      setForm({
        student_id: "",
        group_id: "",
        amount: "",
        description: "",
        month: "",
      });
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Toʻlov qoʻshishda xatolik");
    }
  };

  // Mark payment as paid (partial/full) using backend endpoint
  const handleMarkPaid = async () => {
    if (!selectedPayment?.id || !payAmount) {
      toast.error("Summani kiriting!");
      return;
    }
    try {
      await api.put(`/payments/mark-paid/${selectedPayment.id}`, {
        amount: parseFloat(payAmount),
      });
      toast.success("Toʻlov yangilandi");
      setOpenPayModal(false);
      setSelectedPayment(null);
      setPayAmount("");
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Toʻlovni yangilashda xatolik");
    }
  };

  // Generate monthly debts
  const handleGenerateDebts = async () => {
    try {
      const res = await api.post("/payments/generate-debts");
      toast.success(res.data?.message || "Yaratildi");
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Qarz yozishda xatolik");
    }
  };

  // Fetch history
  const fetchHistory = async (studentId) => {
    try {
      const res = await api.get(`/payments/student/${studentId}/history`);
      setHistoryData(res.data);
      setOpenHistory(true);
    } catch (err) {
      console.error(err);
      toast.error("Tarix topilmadi");
    }
  };

  // Export to excel
  const handleExportExcel = () => {
    if (!filteredPayments.length) {
      toast.error("Ma'lumot yo'q");
      return;
    }
    const data = filteredPayments.map((p) => ({
      ID: p.id,
      Oquvchi: p.student?.full_name || p.student?.username || "-",
      Kurs: p.group?.course?.title || "-",
      Guruh: p.group?.name || "-",
      Oy: formatMonthName(p.month),
      "To'langan summa": `${p.amount?.toLocaleString() || 0} so'm`,
      Qarzdorlik: `${p.debt_amount?.toLocaleString() || 0} so'm`,
      Yaratilgan: formatDateTime(p.created_at),
      Izoh: p.description || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "To'lovlar");
    XLSX.writeFile(
      wb,
      `Tolovlar_${selectedMonth || "barcha"}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  // Columns: all valueGetter and formatters use optional chaining
  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    {
      field: "student_name",
      headerName: "O'quvchi",
      width: 220,
      valueGetter: (params) =>
        params?.row?.student?.full_name ||
        params?.row?.student?.username ||
        "-",
    },
    {
      field: "course",
      headerName: "Kurs",
      width: 220,
      valueGetter: (params) => params?.row?.group?.course?.title || "-",
    },
    {
      field: "group",
      headerName: "Guruh",
      width: 200,
      valueGetter: (params) => params?.row?.group?.name || "-",
    },
    {
      field: "month",
      headerName: "Oy",
      width: 180,
      valueGetter: (params) => formatMonthName(params?.row?.month),
    },
    {
      field: "amount",
      headerName: "To'langan",
      width: 140,
      valueFormatter: (params) =>
        `${Number(params?.value || 0).toLocaleString()} so'm`,
    },
    {
      field: "debt_amount",
      headerName: "Qarzdorlik",
      width: 140,
      valueFormatter: (params) =>
        `${Number(params?.value || 0).toLocaleString()} so'm`,
    },
    {
      field: "created_at",
      headerName: "Vaqti",
      width: 180,
      valueGetter: (params) => formatDateTime(params?.row?.created_at),
    },
    {
      field: "status",
      headerName: "Holat",
      width: 120,
      renderCell: (params) => {
        const v = params?.value;
        return (
          <span
            style={{
              color:
                v === "paid" ? "green" : v === "partial" ? "orange" : "red",
              fontWeight: 600,
            }}
          >
            {v === "paid"
              ? "To'langan"
              : v === "partial"
              ? "Qisman"
              : "To'lanmagan"}
          </span>
        );
      },
    },
    {
      field: "actions",
      headerName: "Amallar",
      width: 260,
      renderCell: (params) => {
        const row = params?.row;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            {row?.student_id && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => fetchHistory(row.student_id)}
              >
                Tarix
              </Button>
            )}
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => {
                setSelectedPayment(row);
                setOpenPayModal(true);
              }}
            >
              To'landi
            </Button>
          </Box>
        );
      },
    },
  ];
  console.log("API RESPONSE:", payments);
  console.log("FILTERED PAYMENTS:", filteredPayments);
  console.log("FIRST ROW:", payments[0]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar boshqaruvi
      </Typography>

      {/* FILTER + ACTIONS */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
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

        <Grid item xs={12} sm={8} textAlign="right">
          <Button
            variant="outlined"
            color="secondary"
            sx={{ mr: 2 }}
            onClick={handleExportExcel}
          >
            📊 Excel'ga eksport
          </Button>
          <Button
            variant="contained"
            color="success"
            sx={{ mr: 2 }}
            onClick={handleGenerateDebts}
          >
            ⚙️ Qarz yozish
          </Button>
          <Button variant="contained" onClick={() => setOpenAdd(true)}>
            ➕ To‘lov qo‘shish
          </Button>
        </Grid>
      </Grid>

      {/* DATAGRID */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{ height: 640, width: "100%", bgcolor: "white", borderRadius: 2 }}
        >
          <DataGrid
            rows={Array.isArray(filteredPayments) ? filteredPayments : []}
            columns={columns}
            getRowId={(r) => r.id || r.created_at || Math.random()}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        </Box>
      )}

      {/* ADD PAYMENT MODAL */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 420,
            mx: "auto",
            mt: 10,
          }}
        >
          <Typography variant="h6" mb={2}>
            ➕ To'lov qo'shish
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>O'quvchi</InputLabel>
            <Select
              value={form.student_id}
              label="O'quvchi"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, student_id: e.target.value }))
              }
            >
              <MenuItem value="">— Tanlang —</MenuItem>
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name || s.username} {s.phone ? `(${s.phone})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Guruh (kurs)</InputLabel>
            <Select
              value={form.group_id}
              label="Guruh"
              onChange={(e) => {
                const g = availableGroups.find(
                  (gr) => gr.id === e.target.value
                );
                setForm((prev) => ({
                  ...prev,
                  group_id: e.target.value,
                  amount: g?.course?.price || prev.amount,
                  description: g?.course?.title || prev.description,
                }));
              }}
            >
              <MenuItem value="">— Tanlang —</MenuItem>
              {availableGroups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.course?.title || "-"} — {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Oy (YYYY-MM)"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            placeholder={new Date().toISOString().slice(0, 7)}
            value={form.month}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, month: e.target.value }))
            }
          />

          <TextField
            label="Summa"
            fullWidth
            size="small"
            type="number"
            sx={{ mb: 2 }}
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
          />

          <TextField
            label="Izoh"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <Button fullWidth variant="contained" onClick={handleAddPayment}>
            Saqlash
          </Button>
        </Box>
      </Modal>

      {/* MARK AS PAID MODAL */}
      <Modal open={openPayModal} onClose={() => setOpenPayModal(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 420,
            mx: "auto",
            mt: 10,
          }}
        >
          <Typography variant="h6" mb={2}>
            💰 To'lovni belgilash
          </Typography>
          <Typography mb={1}>
            O'quvchi:{" "}
            <strong>
              {selectedPayment?.student?.full_name ||
                selectedPayment?.student?.username ||
                "-"}
            </strong>
          </Typography>
          <Typography mb={2}>
            Kurs:{" "}
            <strong>{selectedPayment?.group?.course?.title || "-"}</strong>
          </Typography>
          <TextField
            label="To'lov summasi (so'm)"
            type="number"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <Button fullWidth variant="contained" onClick={handleMarkPaid}>
            Tasdiqlash
          </Button>
        </Box>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal open={openHistory} onClose={() => setOpenHistory(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: { xs: "90%", md: 640 },
            mx: "auto",
            mt: 8,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={2}>
            📜 {historyData?.student_name || ""} to'lov tarixi
          </Typography>
          {historyData ? (
            <>
              <Typography>
                Jami to'langan:{" "}
                <strong>
                  {historyData.total_paid?.toLocaleString() || 0} so'm
                </strong>
              </Typography>
              <Typography mb={2}>
                Qarzdorlik:{" "}
                <strong>
                  {historyData.total_debt?.toLocaleString() || 0} so'm
                </strong>
              </Typography>
              {historyData.history.map((h, i) => (
                <Box
                  key={i}
                  sx={{ borderBottom: "1px solid #eee", py: 1, mb: 1 }}
                >
                  <Typography variant="body2">
                    <b>{formatMonthName(h.month)}</b> — {h.course_name || "-"} /{" "}
                    {h.group_name || "-"}
                  </Typography>
                  <Typography variant="body2">
                    To'langan: {Number(h.amount || 0).toLocaleString()} so'm
                  </Typography>
                  <Typography variant="body2">
                    Qarzdorlik: {Number(h.debt_amount || 0).toLocaleString()}{" "}
                    so'm
                  </Typography>
                  <Typography
                    variant="body2"
                    color={
                      h.status === "paid"
                        ? "green"
                        : h.status === "partial"
                        ? "orange"
                        : "red"
                    }
                  >
                    Holat: {h.status}
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            <Typography>Ma'lumot yo'q</Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Payments;
