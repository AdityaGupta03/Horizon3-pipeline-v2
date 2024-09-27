import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";

import "./App.css";
import LoginSignup from "./Components/LoginSignup/LoginSignup";

function App() {
  sessionStorage.setItem("isLoggedIn", "false");
  localStorage.setItem("isLoggedIn", "false");
  localStorage.setItem("user_id", "-1");

  const currentUser = localStorage.getItem("user_id");
  const queryClient = new QueryClient();

  const Layout = () => {
    return (
      <div className="dark-theme">
        <Navbar />
        <div style={{ display: "flex" }}>
          <LeftBar />
          <div className="main-content" style={{ flex: 6 }}>
            <Outlet />
          </div>
          {/* <RightBar /> */}
        </div>
      </div>
    );
  };
  // if there is not a user, navigate to homepage, if there is one, show them the appropiate screen
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    return children;
  };
  // children [] = allow sticky nav bar to exist in any of the children pages
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
          path: "/",
          element: <Home />,
        },
        {
          path: "/profile/:username",
          element: <Profile />,
        },
        {
          path: "/user-profile",
          element: <UserProfile />,
        },
        {
          path: "/club/:clubName",
          element: <Club />,
        },
        {
          path: "/class/:className",
          element: <Class />,
        },
        {
          path: "/weather",
          element: <Weather />,
        },
        {
          path: "/calendar",
          element: <ViewCalendar />,
        },
        {
          path: "/faq",
          element: <FAQPage />,
        },
        {
          path: "/chat-bot",
          element: <ChatBot />,
        },
        {
          path: "/map",
          element: <Map />,
        },
        {
          path: "/filter-courses",
          element: <FilterCourses />,
        },
      ],
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/forgot-username",
      element: <ForgotUsername />,
    },
    {
      path: "/verify_email/:email",
      element: <VerifyEmail />,
    },
    {
      path: "/password-auth",
      element: <PasswordAuth />,
    },
    {
      path: "/username-auth",
      element: <UsernameAuth />,
    },
    {
      path: "/change-password",
      element: <ChangePassword />,
    },
    {
      path: "/change-username",
      element: <ChangeUsername />,
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
