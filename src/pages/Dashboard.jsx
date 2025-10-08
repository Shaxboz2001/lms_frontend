import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import { Routes, Route, useNavigate } from "react-router-dom";
import Register from "./Register";
import Users from "./Users";
import Groups from "./Groups";
import Payments from "./Payments";
import Students from "./Students";
import Attendance from "./Attendance";
import Test from "./Test";
import Courses from "./Course";

const Dashboard = ({ role }) => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

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
      {
        name: "Ro‘yxatdan o‘tkazish",
        path: "register",
        component: <Courses />,
      },
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

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            LMS Dashboard ({role})
          </Typography>
          <Button color="inherit" onClick={logout}>
            Chiqish
          </Button>
        </Toolbar>
      </AppBar>

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
          {pages.map((page, index) => (
            <ListItem
              button
              key={index}
              onClick={() => navigate(`/dashboard/${page.path}`)}
            >
              <ListItemText primary={page.name} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Routes>
          {pages.map((page, index) =>
            page.path.startsWith("/") ? null : ( // /register tashqariga navigatsiya qiladi
              <Route
                key={index}
                path={page.path}
                element={
                  //   <Typography variant="h5">{page.name} sahifasi</Typography>
                  <div> {page.component}</div>
                }
              />
            )
          )}
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
