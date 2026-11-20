import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Spinner from "./components/ui/Spinner";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/shared/Profile";
import ChangePassword from "./pages/shared/ChangePassword";
import NoticeBoard from "./pages/shared/NoticeBoard";
import TimetableManager from "./pages/shared/TimetableManager";

import AdminDashboard from "./pages/admin/Dashboard";
import Students from "./pages/admin/Students";
import FacultyPage from "./pages/admin/Faculty";
import Branches from "./pages/admin/Branches";
import Subjects from "./pages/admin/Subjects";
import Exams from "./pages/admin/Exams";
import Settings from "./pages/admin/Settings";

import FacultyDashboard from "./pages/faculty/Dashboard";
import StudentSearch from "./pages/faculty/StudentSearch";
import MarksEntry from "./pages/faculty/MarksEntry";
import FacultyMaterials from "./pages/faculty/Materials";

import StudentDashboard from "./pages/student/Dashboard";
import StudentTimetable from "./pages/student/Timetable";
import StudentMarks from "./pages/student/Marks";
import StudentMaterials from "./pages/student/Materials";

function HomeRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return <Spinner className="h-screen" />;
  return user ? <Navigate to={`/${role}`} replace /> : <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allow={["admin"]} />}>
        <Route path="/admin" element={<AppLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="faculty" element={<FacultyPage />} />
          <Route path="branches" element={<Branches />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="exams" element={<Exams />} />
          <Route path="timetable" element={<TimetableManager />} />
          <Route path="notices" element={<NoticeBoard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["faculty"]} />}>
        <Route path="/faculty" element={<AppLayout />}>
          <Route index element={<FacultyDashboard />} />
          <Route path="students" element={<StudentSearch />} />
          <Route path="marks" element={<MarksEntry />} />
          <Route path="timetable" element={<TimetableManager />} />
          <Route path="materials" element={<FacultyMaterials />} />
          <Route path="notices" element={<NoticeBoard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["student"]} />}>
        <Route path="/student" element={<AppLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="marks" element={<StudentMarks />} />
          <Route path="materials" element={<StudentMaterials />} />
          <Route path="notices" element={<NoticeBoard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
