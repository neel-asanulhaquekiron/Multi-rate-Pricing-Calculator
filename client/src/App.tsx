import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { RequireAuth } from "./RequireAuth";
import { DocumentEditorPage, DocumentsPage, LoginPage, PrintPage, ReportsPage, SignupPage } from "./pages/stubs";

/**
 * Route map:
 *   /            → redirect to /documents
 *   /login,/signup            public
 *   /documents                ┐
 *   /documents/:id            │ behind RequireAuth
 *   /documents/:id/print      │ (401 anywhere also lands here via auth context)
 *   /reports                  ┘
 */
export const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentEditorPage />} />
          <Route path="/documents/:id/print" element={<PrintPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/documents" replace />} />
      </Route>
    </Routes>
  );
};
