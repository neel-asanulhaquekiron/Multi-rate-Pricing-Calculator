import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/app/Layout";
import { RequireAuth } from "@/app/RequireAuth";
import { DocumentsPage } from "@/features/documents/DocumentsPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignupPage } from "@/features/auth/SignupPage";
import { DocumentEditorPage } from "@/features/documents/DocumentEditorPage";
import { PrintPage } from "@/features/documents/PrintPage";
import { ReportsPage } from "@/features/reports/ReportsPage";

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
