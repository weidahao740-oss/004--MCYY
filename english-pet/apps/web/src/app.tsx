import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import ProtectedRoute from '@/auth/ProtectedRoute';
import HomePage from '@/pages/HomePage/HomePage';

const ChatPage = lazy(() => import('@/pages/ChatPage/ChatPage'));
const ChapterOnePage = lazy(() => import('@/pages/ChapterOnePage/ChapterOnePage'));
const JournalPage = lazy(() => import('@/pages/JournalPage/JournalPage'));
const MemoryPage = lazy(() => import('@/pages/MemoryPage/MemoryPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage/NotFoundPage'));

function RouteFallback() {
  return <main className="mx-auto max-w-5xl px-5 py-24 text-center text-sm text-muted-foreground">正在打开页面…</main>;
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="room" element={<ChapterOnePage />} />
            <Route path="first-day" element={<Navigate to="/room" replace />} />
            <Route path="events" element={<Navigate to="/room" replace />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="memories" element={<MemoryPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="settings" element={<Navigate to="/room?view=settings" replace />} />
            <Route path="account/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
