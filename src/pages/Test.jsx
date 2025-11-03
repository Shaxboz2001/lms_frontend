// src/pages/TestPage.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import HistoryIcon from "@mui/icons-material/History";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";

export default function TestPage() {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [tests, setTests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    group_id: "",
  });
  const [questions, setQuestions] = useState([
    { text: "", options: [{ text: "", is_correct: 0 }] },
  ]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailedResult, setDetailedResult] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [results, setResults] = useState([]);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (role === "teacher") {
          const resGroups = await api.get(`/groups/`);
          setGroups(resGroups.data);
        }
        const resTests = await api.get(`/tests`);
        setTests(resTests.data);
      } catch {
        toast.error("❌ Ma’lumotlarni yuklashda xato!");
      }
    };
    fetchData();
  }, [role]);

  const addQuestion = () =>
    setQuestions([
      ...questions,
      { text: "", options: [{ text: "", is_correct: 0 }] },
    ]);

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push({ text: "", is_correct: 0 });
    setQuestions(updated);
  };

  const createTest = async () => {
    if (!newTest.title || !newTest.group_id) {
      toast.error("Iltimos, test nomi va guruhni tanlang!");
      return;
    }
    try {
      await api.post(`/tests/`, { ...newTest, questions });
      toast.success("✅ Test yaratildi!");
      setNewTest({ title: "", description: "", group_id: "" });
      setQuestions([{ text: "", options: [{ text: "", is_correct: 0 }] }]);
      const res = await api.get(`/tests`);
      setTests(res.data);
    } catch {
      toast.error("❌ Test yaratishda xatolik!");
    }
  };

  const handleSelectTest = async (testId) => {
    try {
      const res = await api.get(`/tests/${testId}`);
      setSelectedTest(res.data);
      setResult(null);
      setAnswers({});
    } catch {
      toast.error("Testni yuklashda xato!");
    }
  };

  // ✅ Student attempts (to‘g‘rilandi)
  const handleViewAttempts = async (testId) => {
    setLoadingAttempts(true);
    try {
      const res = await api.get(`/tests/${testId}/my_attempts`);
      // 🔥 test_id endi API dan qaytadi
      const data = res.data;
      setAttempts(
        (data.attempts || []).map((a) => ({ ...a, test_id: data.test_id }))
      );
      setAttemptsOpen(true);
    } catch {
      toast.error("Avvalgi natijalarni olishda xatolik!");
    } finally {
      setLoadingAttempts(false);
    }
  };

  // ✅ Batafsil natija
  const handleViewDetailed = async (testId, studentId, submitted_at = null) => {
    if (!testId || !studentId) {
      return toast.error("Test yoki student aniqlanmadi!");
    }
    try {
      let url = `/tests/${testId}/detailed_result/${studentId}`;
      if (submitted_at)
        url += `?submitted_at=${encodeURIComponent(submitted_at)}`;
      const res = await api.get(url);
      setDetailedResult(res.data);
      setDetailOpen(true);
    } catch {
      toast.error("❌ Batafsil natijani olishda xatolik!");
    }
  };

  const handleViewResults = async (testId) => {
    try {
      const res = await api.get(`/tests/${testId}/results`);
      setResults(res.data.results || []);
      setResultsOpen(true);
    } catch {
      toast.error("❌ Natijalarni olishda xatolik!");
    }
  };

  const handleAnswerChange = (qId, optId) =>
    setAnswers({ ...answers, [qId]: optId });

  const submitTest = async () => {
    const payload = {
      answers: Object.keys(answers).map((qId) => ({
        question_id: parseInt(qId),
        option_id: parseInt(answers[qId]),
      })),
    };
    try {
      const res = await api.post(`/tests/${selectedTest.id}/submit`, payload);
      setResult(res.data);
      toast.success("✅ Test yuborildi!");
      setSelectedTest(null);
    } catch {
      toast.error("❌ Testni yuborishda xatolik!");
    }
  };

  // 🧑‍🏫 TEACHER INTERFACE
  if (role === "teacher") {
    return (
      <Box p={{ xs: 2, md: 4 }} sx={{ bgcolor: "#fafafa", minHeight: "100vh" }}>
        <Toaster position="top-right" />
        <Typography variant="h4" gutterBottom fontWeight="bold">
          🧑‍🏫 Testlar
        </Typography>

        {/* Test yaratish */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <TextField
            label="Test nomi"
            fullWidth
            margin="normal"
            value={newTest.title}
            onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
          />
          <TextField
            label="Izoh"
            fullWidth
            margin="normal"
            value={newTest.description}
            onChange={(e) =>
              setNewTest({ ...newTest, description: e.target.value })
            }
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Guruh</InputLabel>
            <Select
              value={newTest.group_id}
              onChange={(e) =>
                setNewTest({ ...newTest, group_id: e.target.value })
              }
            >
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {questions.map((q, qIndex) => (
            <Box
              key={qIndex}
              sx={{
                border: "1px solid #ddd",
                borderRadius: 2,
                p: 2,
                mt: 2,
                bgcolor: "#fff",
              }}
            >
              <TextField
                fullWidth
                label={`Savol ${qIndex + 1}`}
                value={q.text}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[qIndex].text = e.target.value;
                  setQuestions(updated);
                }}
              />
              {q.options.map((opt, oIndex) => (
                <Box key={oIndex} sx={{ display: "flex", gap: 2, mt: 1 }}>
                  <TextField
                    label={`Variant ${oIndex + 1}`}
                    value={opt.text}
                    fullWidth
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].options[oIndex].text = e.target.value;
                      setQuestions(updated);
                    }}
                  />
                  <Select
                    value={opt.is_correct}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].options[oIndex].is_correct = parseInt(
                        e.target.value
                      );
                      setQuestions(updated);
                    }}
                  >
                    <MenuItem value={0}>❌ Noto‘g‘ri</MenuItem>
                    <MenuItem value={1}>✅ To‘g‘ri</MenuItem>
                  </Select>
                </Box>
              ))}
              <Button onClick={() => addOption(qIndex)} sx={{ mt: 1 }}>
                ➕ Variant qo‘shish
              </Button>
            </Box>
          ))}

          <Button sx={{ mt: 2 }} variant="outlined" onClick={addQuestion}>
            ➕ Savol qo‘shish
          </Button>
          <Button
            sx={{ mt: 2, ml: 2 }}
            variant="contained"
            onClick={createTest}
          >
            💾 Saqlash
          </Button>
        </Paper>

        {/* Test ro‘yxati */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h5" gutterBottom>
          📋 Yaratilgan testlar
        </Typography>

        {tests.map((t) => (
          <Card key={t.id} sx={{ mb: 2, p: 2 }}>
            <CardContent>
              <Typography variant="h6">{t.title}</Typography>
              <Typography color="text.secondary">{t.description}</Typography>
              <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<LeaderboardIcon />}
                  onClick={() => handleViewResults(t.id)}
                >
                  Natijalarni ko‘rish
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Natijalar modal */}
        <Dialog
          open={resultsOpen}
          onClose={() => setResultsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>📊 Test natijalari</DialogTitle>
          <DialogContent dividers>
            {results.length === 0 ? (
              <Typography color="text.secondary">
                Hozircha hech kim testni topshirmagan
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>O‘quvchi</TableCell>
                      <TableCell>Guruh</TableCell>
                      <TableCell align="right">Ball</TableCell>
                      <TableCell align="right">Foiz</TableCell>
                      <TableCell>📅 Sana</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow
                        key={i}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          handleViewDetailed(
                            r.test_id,
                            r.student_id,
                            r.submitted_at
                          )
                        }
                      >
                        <TableCell>{r.student_name}</TableCell>
                        <TableCell>{r.group_name}</TableCell>
                        <TableCell align="right">
                          {r.score} / {r.total}
                        </TableCell>
                        <TableCell align="right">{r.percentage}%</TableCell>
                        <TableCell>{r.submitted_at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResultsOpen(false)}>Yopish</Button>
          </DialogActions>
        </Dialog>

        {/* Batafsil natija */}
        <Dialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            🧾 {detailedResult?.test_name} — {detailedResult?.student_name}
          </DialogTitle>
          <DialogContent dividers>
            {detailedResult?.details?.map((q, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Typography fontWeight="bold">
                  {i + 1}. {q.question_text}
                </Typography>
                {q.options.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.text}
                    color={
                      o.is_correct
                        ? "success"
                        : o.is_selected
                        ? "error"
                        : "default"
                    }
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailOpen(false)}>Yopish</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // 👨‍🎓 STUDENT UI
  return (
    <Box p={{ xs: 2, md: 3 }} sx={{ bgcolor: "#f9f9f9", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📚 Mavjud Testlar
      </Typography>

      {!selectedTest ? (
        <>
          {tests.length === 0 ? (
            <Typography color="text.secondary">
              Hozircha testlar mavjud emas
            </Typography>
          ) : (
            tests.map((t) => (
              <Card key={t.id} sx={{ mb: 2, p: 2 }}>
                <CardContent>
                  <Typography variant="h6">{t.title}</Typography>
                  <Typography color="text.secondary">
                    {t.description}
                  </Typography>
                  <Box
                    sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => handleSelectTest(t.id)}
                    >
                      Testni boshlash
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<HistoryIcon />}
                      onClick={() => handleViewAttempts(t.id)}
                    >
                      Avvalgi natijalar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </>
      ) : (
        // Test yechish
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
            {selectedTest.title}
          </Typography>
          {selectedTest.questions?.map((q) => (
            <Box key={q.id} sx={{ mb: 3 }}>
              <Typography sx={{ mb: 1 }}>{q.text}</Typography>
              <RadioGroup
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              >
                {q.options.map((opt) => (
                  <FormControlLabel
                    key={opt.id}
                    value={opt.id.toString()}
                    control={<Radio />}
                    label={opt.text}
                  />
                ))}
              </RadioGroup>
            </Box>
          ))}
          <Button variant="contained" onClick={() => setConfirmSubmit(true)}>
            Yuborish
          </Button>
          <Button
            sx={{ ml: 2 }}
            variant="outlined"
            onClick={() => setSelectedTest(null)}
          >
            Ortga
          </Button>
        </Paper>
      )}

      {/* 🧾 Avvalgi natijalar */}
      <Dialog
        open={attemptsOpen}
        onClose={() => setAttemptsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📜 Avvalgi natijalar</DialogTitle>
        <DialogContent dividers>
          {loadingAttempts ? (
            <Typography>Yuklanmoqda...</Typography>
          ) : attempts.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Siz hali bu testni yechmagansiz
            </Typography>
          ) : (
            attempts.map((a, i) => {
              const percentage = Math.round((a.score / a.total) * 100);
              return (
                <Card
                  key={i}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    cursor: "pointer",
                    "&:hover": { boxShadow: 4 },
                  }}
                  onClick={() => {
                    handleViewDetailed(
                      a.test_id,
                      parseInt(userId),
                      a.submitted_at
                    );
                    setAttemptsOpen(false);
                  }}
                >
                  <Typography fontWeight="bold">🧮 Urinish {i + 1}</Typography>
                  <Typography sx={{ mt: 0.5 }}>
                    Ball: <b>{a.score}</b> / {a.total} ({percentage}%)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{ mt: 1, height: 8, borderRadius: 2 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    📅 {a.submitted_at}
                  </Typography>
                </Card>
              );
            })
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttemptsOpen(false)}>Yopish</Button>
        </DialogActions>
      </Dialog>

      {/* 🧾 Batafsil natija modal */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🧾 {detailedResult?.test_name} — {detailedResult?.student_name}
        </DialogTitle>
        <DialogContent dividers>
          {detailedResult?.details?.map((q, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography fontWeight="bold">
                {i + 1}. {q.question_text}
              </Typography>
              {q.options.map((o) => (
                <Chip
                  key={o.id}
                  label={o.text}
                  color={
                    o.is_correct
                      ? "success"
                      : o.is_selected
                      ? "error"
                      : "default"
                  }
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Yopish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
