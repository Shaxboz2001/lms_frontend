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
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import HistoryIcon from "@mui/icons-material/History";

export default function TestPage() {
  const [role, setRole] = useState("");
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
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [testTitle, setTestTitle] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailedResult, setDetailedResult] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // new states for student attempts
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const userRole = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  useEffect(() => setRole(userRole), []);

  // 🔹 Ma'lumotlarni yuklash
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
        toast.error("Ma’lumotlarni olishda xatolik!");
      }
    };
    fetchData();
  }, [role]);

  // ✅ Savol va variant qo‘shish
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

  // ✅ Test yaratish (teacher)
  const createTest = async () => {
    try {
      const payload = { ...newTest, questions };
      await api.post(`/tests/`, payload);
      toast.success("✅ Test yaratildi!");
      setNewTest({ title: "", description: "", group_id: "" });
      setQuestions([{ text: "", options: [{ text: "", is_correct: 0 }] }]);
      const res = await api.get(`/tests`);
      setTests(res.data);
    } catch {
      toast.error("❌ Test yaratishda xatolik!");
    }
  };

  // ✅ Testni tanlash (student)
  const handleSelectTest = async (testId) => {
    try {
      const res = await api.get(`/tests/${testId}`);
      setSelectedTest(res.data);
      setSubmitted(false);
      setResult(null);
    } catch {
      toast.error("Testni yuklashda xato!");
    }
  };

  // ✅ Natijalarni ko‘rish (teacher)
  const handleViewResults = async (testId) => {
    try {
      const res = await api.get(`/tests/${testId}/results`);
      setTestTitle(res.data.test_name);
      setTestResults(res.data.results || []);
      setSelectedTest({ id: testId });
    } catch {
      toast.error("Natijalarni olishda xatolik!");
    }
  };

  // ✅ Batafsil natijani olish
  const handleViewDetailed = async (testId, studentId, submitted_at = null) => {
    try {
      let url = `/tests/${testId}/detailed_result/${studentId}`;
      if (submitted_at) {
        url += `?submitted_at=${encodeURIComponent(submitted_at)}`;
      }
      const res = await api.get(url);
      setDetailedResult(res.data);
      setDetailOpen(true);
    } catch {
      toast.error("Batafsil natijani olishda xatolik!");
    }
  };

  // ✅ Avvalgi urinishlarni olish
  const handleViewAttempts = async (testId) => {
    setLoadingAttempts(true);
    try {
      const res = await api.get(`/tests/${testId}/my_attempts`);
      setAttempts(res.data.attempts || []);
      setAttemptsOpen(true);
    } catch {
      toast.error("Avvalgi natijalarni olishda xatolik!");
    } finally {
      setLoadingAttempts(false);
    }
  };

  // ✅ Javobni tanlash
  const handleAnswerChange = (qId, optId) => {
    setAnswers({ ...answers, [qId]: optId });
  };

  // ✅ Testni yuborish
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
      setSubmitted(true);
      toast.success("✅ Test yuborildi!");
    } catch {
      toast.error("❌ Testni yuborishda xatolik!");
    }
  };

  // ===============================
  // 🧑‍🏫 TEACHER QISMI
  // ===============================
  if (role === "teacher") {
    return (
      <Box p={4} sx={{ bgcolor: "#fafafa", minHeight: "100vh" }}>
        <Toaster position="top-right" />
        <Typography variant="h4" gutterBottom fontWeight="bold">
          🧑‍🏫 Test Yaratish
        </Typography>

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
                <Box key={oIndex} sx={{ display: "flex", mt: 1, gap: 2 }}>
                  <TextField
                    label={`Variant ${oIndex + 1}`}
                    value={opt.text}
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

        <Divider sx={{ my: 3 }} />
        <Typography variant="h5" gutterBottom>
          📋 Yaratilgan testlar
        </Typography>

        {tests.map((t) => (
          <Card
            key={t.id}
            sx={{
              border: "1px solid #ddd",
              borderRadius: 2,
              mb: 2,
              cursor: "pointer",
              "&:hover": { boxShadow: 3 },
            }}
            onClick={() => handleViewResults(t.id)}
          >
            <CardContent>
              <Typography variant="h6">{t.title}</Typography>
              <Typography color="text.secondary">{t.description}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // ===============================
  // 👨‍🎓 STUDENT QISMI
  // ===============================
  return (
    <Box p={3} sx={{ bgcolor: "#f9f9f9", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📚 Mavjud Testlar
      </Typography>

      {!selectedTest ? (
        <Box>
          {tests.length === 0 ? (
            <Typography color="text.secondary">
              Hozircha testlar mavjud emas
            </Typography>
          ) : (
            tests.map((t) => (
              <Card
                key={t.id}
                sx={{ mb: 2, p: 2, "&:hover": { boxShadow: 3 } }}
              >
                <CardContent>
                  <Typography variant="h6">{t.title}</Typography>
                  <Typography color="text.secondary">
                    {t.description}
                  </Typography>
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
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
        </Box>
      ) : (
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

      {/* ✅ Avvalgi natijalar modal */}
      <Dialog
        open={attemptsOpen}
        onClose={() => setAttemptsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.2rem" }}>
          📜 Avvalgi natijalar
        </DialogTitle>
        <DialogContent dividers>
          {loadingAttempts ? (
            <Typography>Yuklanmoqda...</Typography>
          ) : attempts.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              Siz hali bu testni yechmagansiz
            </Typography>
          ) : (
            <Box>
              {attempts.map((a, i) => {
                const percentage = Math.round((a.score / a.total) * 100);
                return (
                  <Card
                    key={i}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "0.3s",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "scale(1.02)",
                        bgcolor: "#f5faff",
                      },
                    }}
                    onClick={() => {
                      handleViewDetailed(
                        tests.find((t) => t.id)?.id,
                        parseInt(userId),
                        a.submitted_at
                      );
                      setAttemptsOpen(false);
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      🧮 Urinish {i + 1}
                    </Typography>
                    <Typography sx={{ mt: 0.5 }}>
                      Ball: <b>{a.score}</b> / {a.total} ({percentage}%)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 1,
                        "& .MuiLinearProgress-bar": {
                          bgcolor:
                            percentage >= 80
                              ? "success.main"
                              : percentage >= 50
                              ? "warning.main"
                              : "error.main",
                        },
                      }}
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
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttemptsOpen(false)}>Yopish</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Batafsil natija modal */}
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

      {/* ✅ Tasdiqlash modal */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Testni yuborish</DialogTitle>
        <DialogContent>
          <Typography>Rostdan ham testni yuborishni xohlaysizmi?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>Bekor qilish</Button>
          <Button
            variant="contained"
            onClick={() => {
              submitTest();
              setConfirmSubmit(false);
            }}
          >
            Tasdiqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
