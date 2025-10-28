import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Ma'lumotlarni olish
  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, stuRes, grpRes] = await Promise.all([
        api.get("/payments"),
        api.get("/users"),
        api.get("/groups"),
      ]);
      setPayments(payRes.data);
      setStudents(stuRes.data.filter((u) => u.role === "student"));
      setGroups(grpRes.data);
    } catch (err) {
      toast.error("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 O‘quvchi nomini olish
  const getStudentName = (row) => {
    if (row?.student?.full_name) return row.student.full_name;
    if (row?.student?.username) return row.student.username;
    if (row?.student_id) {
      const s = students.find((x) => x.id === row.student_id);
      return s ? s.full_name || s.username : "—";
    }
    return "—";
  };

  // 🔹 Guruh nomini olish
  const getGroupName = (row) => {
    if (row?.group?.name) return row.group.name;
    if (row?.group_id) {
      const g = groups.find((x) => x.id === row.group_id);
      return g ? g.name : "—";
    }
    return "—";
  };

  // 🔹 Jadval ustunlari
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "student",
      headerName: "O‘quvchi",
      flex: 1.2,
      valueGetter: (params) => getStudentName(params.row),
    },
    {
      field: "group",
      headerName: "Guruh",
      flex: 1,
      valueGetter: (params) => getGroupName(params.row),
    },
    {
      field: "amount",
      headerName: "To‘langan (so‘m)",
      flex: 1,
      valueFormatter: (p) => (p?.value ? p.value.toLocaleString("uz-UZ") : "0"),
    },
    {
      field: "debt_amount",
      headerName: "Qarzdorlik (so‘m)",
      flex: 1,
      valueFormatter: (p) => (p?.value ? p.value.toLocaleString("uz-UZ") : "0"),
    },
    {
      field: "month",
      headerName: "Oy",
      flex: 0.8,
      valueGetter: (p) => p?.row?.month || "—",
    },
    {
      field: "status",
      headerName: "Holat",
      flex: 0.8,
      renderCell: (params) => {
        const val = params?.row?.status || "unpaid";
        const color =
          val === "paid"
            ? "#2e7d32"
            : val === "partial"
            ? "#ed6c02"
            : "#d32f2f";
        const text =
          val === "paid"
            ? "To‘langan"
            : val === "partial"
            ? "Qisman"
            : "To‘lanmagan";
        return <span style={{ color, fontWeight: 600 }}>{text}</span>;
      },
    },
    {
      field: "actions",
      headerName: "Amal",
      flex: 0.8,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={() => toast(`To‘lov ID: ${params?.row?.id}`)}
        >
          💵 TO‘LOV
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        💳 To‘lovlar ro‘yxati
      </Typography>

      {loading ? (
        <Box textAlign="center" mt={6}>
          <CircularProgress />
          <Typography mt={1}>Yuklanmoqda...</Typography>
        </Box>
      ) : (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <DataGrid
            rows={payments}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            getRowId={(row) => row.id}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f5f5f5",
                fontWeight: "bold",
              },
              "& .MuiDataGrid-cell": { fontSize: 14 },
              border: "none",
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default Payments;
