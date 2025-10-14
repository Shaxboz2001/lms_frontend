// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { Routes, Route, useNavigate } from "react-router-dom";
import { api } from "../services/api";

import Register from "./Register";
import Users from "./Users";
import Groups from "./Groups";
import Payments from "./Payments";
import Students from "./Students";
import Attendance from "./Attendance";
import Test from "./Test";
import Courses from "./Course";
import MyProfile from "./MyProfile";
import TeacherGroups from "./TeacherGroups";

const Dashboard = ({ role }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState(null);

  // Role-based pages
  const pagesByRole = {
    admin: [
      {
        name: "Foydalanuvchilar",
        path: "foydalanuvchilar",
        component: <Users />,
      },
      { name: "Guruhlar", path: "guruhlar", component: <Groups /> },
      { name: "To‘lovlar", path: "tolovlar", component: <Payments /> },
      { name: "Hisobotlar", path: "hisobotlar", component: <Register /> },
      {
        name: "Ro‘yxatdan o‘tkazish",
        path: "register",
        component: <Register />,
      },
    ],
    manager: [
      { name: "Guruhlar", path: "guruhlar", component: <Groups /> },
      { name: "O‘quvchilar", path: "oquvchilar", component: <Students /> },
      { name: "To‘lovlar", path: "tolovlar", component: <Payments /> },
      { name: "Kurslar", path: "kurslar", component: <Courses /> },
    ],
    teacher: [
      { name: "Guruhlarim", path: "guruhlarim", component: <TeacherGroups /> },
      { name: "Yo‘qlama", path: "yoqlama", component: <Attendance /> },
      {
        name: "Testlar",
        path: "testlar",
        component: <Test role={"teacher"} />,
      },
    ],
    student: [
      { name: "Kurslarim", path: "kurslarim", component: <Courses /> },
      { name: "Baholar", path: "baholar", component: <Register /> },
      {
        name: "Testlar",
        path: "testlar",
        component: <Test role={"student"} />,
      },
    ],
  };

  const pages = pagesByRole[role] || [];

  useEffect(() => {
    api
      .get(`/users/me`)
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // statistikani olish
    api
      .get(`/dashboard/stats`)
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // Dialog ochish
  const openStatsDialog = (title, content) => {
    setDialogContent({ title, content });
    setOpenDialog(true);
  };

  const closeDialog = () => setOpenDialog(false);

  return (
    <Box sx={{ display: "flex" }}>
      {/* ✅ AppBar */}
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            LMS Dashboard ({role})
          </Typography>
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : user ? (
            <>
              <IconButton onClick={handleMenu}>
                <Avatar
                  src={user.avatar_url || "/default-avatar.png"}
                  alt={user.full_name}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem
                  onClick={() => {
                    navigate("/dashboard/myprofile");
                    handleClose();
                  }}
                >
                  My Profile
                </MenuItem>
                <MenuItem onClick={logout}>Logout</MenuItem>
              </Menu>
            </>
          ) : null}
        </Toolbar>
      </AppBar>

      {/* ✅ Yon menyu */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          [`& .MuiDrawer-paper`]: {
            width: 240,
            boxSizing: "border-box",
            mt: 8,
          },
        }}
      >
        <List>
          {pages.map((page, i) => (
            <ListItem
              button
              key={i}
              onClick={() => navigate(`/dashboard/${page.path}`)}
            >
              <ListItemText primary={page.name} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* ✅ Asosiy kontent */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Routes>
          {pages.map((page, i) => (
            <Route
              key={i}
              path={page.path}
              element={<div>{page.component}</div>}
            />
          ))}
          <Route path="myprofile" element={<MyProfile />} />

          {/* Dashboard Home */}
          <Route
            path="/"
            element={
              <Box>
                <Typography variant="h5" gutterBottom>
                  Asosiy Statistik Ma’lumotlar
                </Typography>
                <Grid container spacing={2}>
                  {role === "admin" || role === "manager" ? (
                    <>
                      <Grid item xs={12} md={3}>
                        <Card
                          onClick={() =>
                            openStatsDialog("O‘quvchilar", stats.students)
                          }
                        >
                          <CardContent>
                            <Typography variant="h6">O‘quvchilar</Typography>
                            <Typography variant="h4">
                              {stats.students?.total || 0}
                            </Typography>
                            <Typography variant="body2">
                              Qiziqqan: {stats.students?.interested || 0} |
                              O‘qiyotgan: {stats.students?.studying || 0}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Card
                          onClick={() =>
                            openStatsDialog("Guruhlar", stats.groups)
                          }
                        >
                          <CardContent>
                            <Typography variant="h6">Guruhlar</Typography>
                            <Typography variant="h4">
                              {stats.groups?.count || 0}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Card
                          onClick={() =>
                            openStatsDialog("To‘lovlar", stats.payments)
                          }
                        >
                          <CardContent>
                            <Typography variant="h6">To‘lovlar</Typography>
                            <Typography variant="h4">
                              {stats.payments?.total || 0} so‘m
                            </Typography>
                            <Typography variant="body2">
                              Bugun: {stats.payments?.today || 0} so‘m
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  ) : role === "student" ? (
                    <>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">Test baholari</Typography>
                            <Typography variant="h4">
                              {stats.tests?.average || "N/A"}
                            </Typography>
                            <Typography variant="body2">
                              Oxirgi test: {stats.tests?.last || "-"}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">
                              Dars qatnashuvi
                            </Typography>
                            <Typography variant="h4">
                              {stats.attendance?.attended || 0}/
                              {stats.attendance?.total || 0}
                            </Typography>
                            <Typography variant="body2">
                              Qatnashmagan: {stats.attendance?.missed || 0}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Card onClick={() => navigate("/dashboard/myprofile")}>
                          <CardContent>
                            <Typography variant="h6">
                              Profil ma’lumotlari
                            </Typography>
                            <Typography variant="body2">
                              {user?.full_name}
                            </Typography>
                            <Typography variant="body2">
                              {user?.phone}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  ) : role === "teacher" ? (
                    <>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">
                              O‘quvchilar soni
                            </Typography>
                            <Typography variant="h4">
                              {stats.students_count || 0}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">Bitirganlar</Typography>
                            <Typography variant="h4">
                              {stats.graduated || 0}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card onClick={() => navigate("/dashboard/myprofile")}>
                          <CardContent>
                            <Typography variant="h6">O‘zim haqimda</Typography>
                            <Typography variant="body2">
                              {user?.full_name}
                            </Typography>
                            <Typography variant="body2">
                              {user?.phone}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  ) : null}
                </Grid>

                {/* Modal dialog */}
                <Dialog
                  open={openDialog}
                  onClose={closeDialog}
                  maxWidth="sm"
                  fullWidth
                >
                  <DialogTitle>{dialogContent?.title}</DialogTitle>
                  <DialogContent>
                    <pre>{JSON.stringify(dialogContent?.content, null, 2)}</pre>
                  </DialogContent>
                </Dialog>
              </Box>
            }
          />
        </Routes>
      </Box>
    </Box>
  );
};

export default Dashboard;
