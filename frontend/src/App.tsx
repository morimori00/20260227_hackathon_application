import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AlertsPage from '@/pages/AlertsPage';
import TransactionDetailPage from '@/pages/TransactionDetailPage';
import AccountProfilePage from '@/pages/AccountProfilePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import NetworkPage from '@/pages/NetworkPage';
import UploadPage from '@/pages/UploadPage';
import ChatbotPage from '@/pages/ChatbotPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/alerts" replace />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/transactions/:transactionId" element={<TransactionDetailPage />} />
          <Route path="/accounts/:accountId" element={<AccountProfilePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
