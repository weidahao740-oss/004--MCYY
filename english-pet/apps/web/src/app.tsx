import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import ProtectedRoute from '@/auth/ProtectedRoute';
import HomePage from '@/pages/HomePage/HomePage';
import ChatPage from '@/pages/ChatPage/ChatPage';
import EventPage from '@/pages/EventPage/EventPage';
import FirstDayPage from '@/pages/FirstDayPage/FirstDayPage';
import JournalPage from '@/pages/JournalPage/JournalPage';
import MemoryPage from '@/pages/MemoryPage/MemoryPage';
import RoomPage from '@/pages/RoomPage/RoomPage';
import SettingsPage from '@/pages/SettingsPage/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="room" element={<RoomPage />} />
          <Route path="first-day" element={<FirstDayPage />} />
          <Route path="events" element={<EventPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="memories" element={<MemoryPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
