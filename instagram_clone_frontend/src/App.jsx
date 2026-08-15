import React from 'react'
import { Route, Routes } from 'react-router-dom'
import SignupPage from './pages/SignupPages'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import CreatePage from './pages/CreatePage'
import { UploadProvider } from './context/UploadContext'
import { UserProvider, useUser } from './context/UserContext'
import { ToastProvider } from './context/ToastContext'
import UploadBanner from './components/UploadBanner'
import ProtectedRoute from './components/ProtectedRoute'
import AccountSwitcherModal from './components/AccountSwitcherModal'
import InstallAppModal from './components/InstallAppModal'

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import ReelsPage from './pages/Reelspage'
import ProfilePage from './pages/ProfilePage'
import ProfileSettings from './pages/ProfileSettings'
import MessagesPage from './pages/MessagesPage'
import NotificationsPage from './pages/NotificationsPage'

const AppContent = () => {
  const { isSwitcherOpen, setIsSwitcherOpen, isInstallModalOpen, closeInstallModal, deferredPrompt } = useUser();

  return (
    <>
      <UploadBanner />
      <AccountSwitcherModal 
        isOpen={isSwitcherOpen} 
        onClose={() => setIsSwitcherOpen(false)} 
      />
      <InstallAppModal 
        isOpen={isInstallModalOpen}
        onClose={closeInstallModal}
        deferredPrompt={deferredPrompt}
      />
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<SignupPage />} />
        <Route path='/login' element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path='/home' element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path='/create/:select' element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
        <Route path='/reels' element={<ProtectedRoute><ReelsPage/></ProtectedRoute>} />
        <Route path="/profile/:id/:tab?" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <UserProvider>
        <UploadProvider>
          <AppContent />
        </UploadProvider>
      </UserProvider>
    </ToastProvider>
  )
}

export default App
