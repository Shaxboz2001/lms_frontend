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
  TableRow,
  TableCell,
  TableHead,
  Table,
  TableBody,
  useMediaQuery,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
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
import Reports from "./Reports";
import Payroll from "./Payroll";

const drawerWidth = 240;

const Dashboard = ({ role }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState(null);

  const toggleDrawer = () => setMobileOpen(!mobileOpen);

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
      { name: "Hisobotlar", path: "hisobotlar", component: <Reports /> },
      { name: "Maoshlar", path: "maoshlar", component: <Payroll /> },
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
      { name: "Hisobotlar", path: "hisobotlar", component: <Reports /> },
    ],
    teacher: [
      { name: "Guruhlarim", path: "guruhlarim", component: <TeacherGroups /> },
      { name: "Yo‘qlama", path: "yoqlama", component: <Attendance /> },
      { name: "Testlar", path: "testlar", component: <Test role="teacher" /> },
    ],
    student: [
      { name: "Kurslarim", path: "kurslarim", component: <Courses /> },
      // { name: "Baholar", path: "baholar", component: <Register /> },
      { name: "Testlar", path: "testlar", component: <Test role="student" /> },
    ],
  };

  const pages = pagesByRole[role] || [];

  useEffect(() => {
    api
      .get(`/users/me`)
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

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

  const openStatsDialog = (title, content) => {
    setDialogContent({ title, content });
    setOpenDialog(true);
  };
  const closeDialog = () => setOpenDialog(false);

  // Sidebar content
  const drawerContent = (
    <Box sx={{ mt: 8 }}>
      <List>
        {pages.map((page, i) => (
          <ListItem
            button
            key={i}
            onClick={() => {
              navigate(`/dashboard/${page.path}`);
              if (isMobile) toggleDrawer();
            }}
          >
            <ListItemText primary={page.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* ✅ AppBar */}
      <AppBar
        position="fixed"
        color="primary"
        sx={{ zIndex: theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            LMS Dashboard ({role})
          </Typography>

          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : user ? (
            <>
              <IconButton onClick={handleMenu} sx={{ p: 0 }}>
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

      {/* ✅ Drawer (Sidebar) */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              mt: 8,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* ✅ Asosiy kontent */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          mt: 8,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Routes>
          {pages.map((page, i) => (
            <Route key={i} path={page.path} element={page.component} />
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
                      {[
                        {
                          title: "O‘quvchilar",
                          count: stats.students?.total || 0,
                          extra: `Qiziqqan: ${
                            stats.students?.interested || 0
                          } | O‘qiyotgan: ${stats.students?.studying || 0}`,
                        },
                        {
                          title: "Guruhlar",
                          count: stats.groups?.count || 0,
                        },
                        {
                          title: "To‘lovlar",
                          count: `${stats.payments?.total || 0} so‘m`,
                          extra: `Bugun: ${stats.payments?.today || 0} so‘m`,
                        },
                      ].map((item, i) => (
                        <Grid key={i} item xs={12} sm={6} md={4}>
                          <Card
                            sx={{
                              transition: "0.3s",
                              "&:hover": {
                                boxShadow: 6,
                                transform: "scale(1.02)",
                              },
                            }}
                            onClick={() =>
                              openStatsDialog(
                                item.title,
                                stats[item.title?.toLowerCase()]
                              )
                            }
                          >
                            <CardContent>
                              <Typography variant="h6">{item.title}</Typography>
                              <Typography variant="h4">{item.count}</Typography>
                              {item.extra && (
                                <Typography variant="body2">
                                  {item.extra}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </>
                  ) : role === "student" ? (
                    <>
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">Test baholari</Typography>
                            <Typography variant="h4">
                              {stats.tests?.average || 0}%
                            </Typography>
                            <Typography variant="body2">
                              Oxirgi test: {stats.tests?.last || 0}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">
                              Dars qatnashuvi
                            </Typography>
                            <Typography variant="h4">
                              {stats.attendance?.attended || 0} /{" "}
                              {(stats.attendance?.attended || 0) +
                                (stats.attendance?.missed || 0)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Card onClick={() => navigate("/dashboard/myprofile")}>
                          <CardContent>
                            <Typography variant="h6">Profil</Typography>
                            <Typography>{user?.full_name}</Typography>
                            <Typography>{user?.phone}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  ) : role === "teacher" ? (
                    <>
                      <Grid item xs={12} sm={6} md={4}>
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
                      <Grid item xs={12} sm={6} md={4}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">Bitirganlar</Typography>
                            <Typography variant="h4">
                              {stats.graduated || 0}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Card onClick={() => navigate("/dashboard/myprofile")}>
                          <CardContent>
                            <Typography variant="h6">O‘zim haqimda</Typography>
                            <Typography>{user?.full_name}</Typography>
                            <Typography>{user?.phone}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  ) : null}
                </Grid>

                {/* Modal */}
                <Dialog
                  open={openDialog}
                  onClose={closeDialog}
                  fullWidth
                  maxWidth="sm"
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
