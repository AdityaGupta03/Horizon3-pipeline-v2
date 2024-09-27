// Core
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

// Components
import Login from "./components/login/Login";

// Styling
import "./App.css";

function App() {
  sessionStorage.setItem("isLoggedIn", "false");
  localStorage.setItem("isLoggedIn", "false");
  localStorage.setItem("user_id", "-1");

  const currentUser = localStorage.getItem("user_id");
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
    if (!currentUser) {
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
      children: [],
    },
    {
      path: "/login",
      element: <Login />,
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
