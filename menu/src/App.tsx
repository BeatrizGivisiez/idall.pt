/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

// Layouts & Pages
import { AdminLayout } from "./components/admin/AdminLayout";
import { Login } from "./pages/admin/Login";
import { Dashboard } from "./pages/admin/Dashboard";
import { MenuManager } from "./pages/admin/MenuManager";
import { Settings } from "./pages/admin/Settings";
import { RestaurantMenu } from "./pages/public/RestaurantMenu";
import { Home } from "./pages/public/Home";
import { SuperAdminLayout } from "./components/superadmin/SuperAdminLayout";
import { SuperAdminDashboard } from "./pages/superadmin/SuperAdminDashboard";
import { CreateRestaurant } from "./pages/superadmin/CreateRestaurant";
import { Times } from "./pages/admin/Times";
import { Sales } from "./pages/admin/Sales";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/r/:slug" element={<RestaurantMenu />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="menu" element={<MenuManager />} />
              <Route path="settings" element={<Settings />} />
              <Route path="times" element={<Times />} />
              <Route path="sales" element={<Sales />} />
            </Route>

            {/* Super Admin Routes */}
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="new" element={<CreateRestaurant />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
