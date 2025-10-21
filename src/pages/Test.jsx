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
} from "@mui/material";
import { api } from "../services/api";

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

  const userRole = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  useEffect(() => setRole(userRole), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (role === "teacher") {
          const resGroups = await api.get(`/groups/`);
          setGroups(resGroups.data);
        }
        const resTests = await api.get(`/tests`);
        setTests(resTests.data);
      } catch (err) {
        console.error("Xato:", err);
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
    try {
      const payload = { ...newTest, questions };
      await api.post(`/tests/`, payload);
      alert("✅ Test yaratildi!");
      setNewTest({ title: "", description: "", group_id: "" });
      setQuestions([{ text: "", options: [{ text: "", is_correct: 0 }] }]);
      const res = await api.get(`/tests`);
      setTests(res.data);
    } catch (err) {
      alert("❌ Xatolik test yaratishda!");
    }
  };

  const handleSelectTest = async (testId) => {
    const res = await api.get(`/tests/${testId}`);
    setSelectedTest(res.data);
    setSubmitted(false);
    setResult(null);
  };

  const handleViewResults = async (testId) => {
    try {
      const res = await api.get(`/tests/${testId}/results`);
      setTestTitle(res.data.test_name);
      setTestResults(res.data.results || []);
      setSelectedTest({ id: testId });
    } catch (err) {
      console.error("Natijalarni olishda xato:", err);
      alert("❌ Natijalarni olishda xatolik!");
    }
  };

  // 🆕 Batafsil natijani olish
  const handleViewDetailed = async (testId, studentId) => {
    try {
      const res = await api.get(
        `/tests/${testId}/detailed_result/${studentId}`
      );
      setDetailedResult(res.data);
      setDetailOpen(true);
    } catch (err) {
      console.error("Batafsil natijani olishda xato:", err);
      alert("❌ Batafsil natijani olishda xatolik!");
    }
  };

  const handleAnswerChange = (qId, optId) => {
    setAnswers({ ...answers, [qId]: optId });
  };

  const submitTest = async () => {
    const payload = {
      answers: Object.keys(answers).map((qId) => ({
        question_id: parseInt(qId),
        option_id: parseInt(answers[qId]),
      })),
    };

    const res = await api.post(`/tests/${selectedTest.id}/submit`, payload);
    setResult(res.data);
    setSubmitted(true);
  };

  // ===============================
  // 🧑‍🏫 TEACHER QISMI
  // ===============================
  if (role === "teacher") {
    return (
      <Box p={4} sx={{ bgcolor: "#fafafa", minHeight: "100vh" }}>
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
              transition: "0.3s",
              "&:hover": { boxShadow: 3 },
            }}
            onClick={() => handleViewResults(t.id)}
          >
            <CardContent>
              <Typography variant="h6">{t.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t.description}
              </Typography>
            </CardContent>
          </Card>
        ))}

        {testResults.length > 0 && (
          <Box mt={5}>
            <Typography variant="h5" gutterBottom>
              📊 {testTitle} natijalari
            </Typography>
            {testResults
              .sort((a, b) => b.score - a.score)
              .map((r, i) => (
                <Card
                  key={i}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderLeft: "6px solid #1976d2",
                    bgcolor: "#fdfdfd",
                  }}
                >
                  <Typography fontWeight="bold">
                    {i + 1}. {r.student_name} ({r.group_name})
                  </Typography>
                  <Typography>
                    Ball: <b>{r.score}</b> / {r.total}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(r.score / r.total) * 100}
                    sx={{ mt: 1, borderRadius: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    🕒 {new Date(r.submitted_at).toLocaleString()}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() =>
                      handleViewDetailed(
                        selectedTest.id || r.test_id,
                        r.student_id
                      )
                    }
                  >
                    👁 Batafsil ko‘rish
                  </Button>
                </Card>
              ))}
          </Box>
        )}

        {/* 🆕 Batafsil natijalar oynasi */}
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

  // ===============================
  // 👨‍🎓 STUDENT QISMI
  // ===============================
  return (
    <Box p={4} sx={{ bgcolor: "#f9f9f9", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📚 Mavjud Testlar
      </Typography>

      {!selectedTest ? (
        <Box>
          {tests.map((t) => (
            <Card
              key={t.id}
              sx={{
                mb: 2,
                p: 2,
                cursor: "pointer",
                "&:hover": { boxShadow: 3 },
              }}
            >
              <CardContent>
                <Typography variant="h6">{t.title}</Typography>
                <Typography color="text.secondary">{t.description}</Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => handleSelectTest(t.id)}
                >
                  Boshlash
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
            {selectedTest.title}
          </Typography>
          {selectedTest.questions.map((q) => (
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
          <Button variant="contained" onClick={submitTest}>
            Yuborish
          </Button>

          {submitted && result && (
            <Paper
              sx={{
                mt: 4,
                p: 3,
                borderLeft: "6px solid green",
                bgcolor: "#f0fff0",
              }}
            >
              <Typography variant="h6">
                ✅ {result.student_name}, sizning natijangiz:
              </Typography>
              <Typography>
                <b>{result.score}</b> / {result.total} to‘g‘ri javob.
              </Typography>
              <Button
                sx={{ mt: 2 }}
                variant="outlined"
                onClick={() =>
                  handleViewDetailed(selectedTest.id, parseInt(userId))
                }
              >
                👁 Batafsil ko‘rish
              </Button>
            </Paper>
          )}
        </Paper>
      )}

      {/* Batafsil oynasi student uchun ham */}
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
