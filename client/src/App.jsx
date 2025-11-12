import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import ConditionList from "./pages/condition/ConditionList";
import ConditionForm from "./pages/condition/ConditionForm";
import ConditionView from "./pages/condition/ConditionView";
import ProtectedRoute from "./routes/ProtectedRoutes";
import ConceptMapTranslate from "./pages/conceptMap/ConceptMapTranslate";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<ConditionList />} />
            <Route path="conditions" element={<ConditionList />} />
            <Route path="conditions/:id" element={<ConditionView />} />

            {/* ✅ FIXED: Relative route path (no / at start) */}
            <Route path="translate" element={<ConceptMapTranslate />} />

            <Route
              path="create/condition"
              element={
                <ProtectedRoute adminOnly={true}>
                  <ConditionForm />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
