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
} from "@mui/material";
import { Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL, config } from "../services/api";

import Register from "./Register";
import Users from "./Users";
import Groups from "./Groups";
import Payments from "./Payments";
import Students from "./Students";
import Attendance from "./Attendance";
import Test from "./Test";
import Courses from "./Course";
import MyProfile from "./MyProfile";

const Dashboard = ({ role }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      { name: "Yozilish", path: "yozilish", component: <Register /> },
      {
        name: "Testlar",
        path: "testlar",
        component: <Test role={"student"} />,
      },
    ],
  };

  const pages = pagesByRole[role] || [];

  useEffect(() => {
    axios
      .get(`${BASE_URL}/users/me`, config)
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* ✅ AppBar (yuqori qism) */}
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            LMS Dashboard ({role})
          </Typography>

          {/* 👇 Avatar + menyu */}
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

      {/* ✅ Asosiy kontent qismi */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Routes>
          {pages.map((page, i) => (
            <Route
              key={i}
              path={page.path}
              element={<div>{page.component}</div>}
            />
          ))}
          {/* Profil sahifasi */}
          <Route path="myprofile" element={<MyProfile />} />
          <Route
            path="/"
            element={
              <Typography variant="h5">Dashboard asosiy sahifasi</Typography>
            }
          />
        </Routes>
      </Box>
    </Box>
  );
};

export default Dashboard;
