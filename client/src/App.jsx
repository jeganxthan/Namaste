import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import UserProvider from "./context/UserProvider";

const App = () => (
  <UserProvider>

    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route path="/" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  </UserProvider>
);

export default App;
