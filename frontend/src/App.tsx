// Core
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Components
import Login from "./Components/login/Login";
import Signup from "./Components/Signup/Signup";
import Verify from "./Components/Verify/Verify";
import UserAcc from "./Components/UserAcc/UserAcc";
import Dashboard from "./Components/dashboard/Dashboard";

// Styling
import "./App.css";

function App() {
  const queryClient = new QueryClient();

  const Layout = () => {
    return (
      <div className="dark-theme">
        <div style={{ display: "flex" }}>
          <div className="main-content" style={{ flex: 6 }}>
            <Outlet />
          </div>
        </div>
      </div>
    );
  };

  // If not logged in, route user to login page
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const currentUser: string | null = sessionStorage.getItem("user_id");
    if (!currentUser || currentUser === "-1") {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  // Router for path to pages
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/dashboard",
          element: <Dashboard />,
        },
        {
          path: "/useracc",
          element: <UserAcc />,
        },
      ],
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/verify",
      element: <Verify />,
    },
  ]);

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </div>
  );
}

export default App;
