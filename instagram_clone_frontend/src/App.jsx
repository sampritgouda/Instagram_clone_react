import React from 'react'
import { Route, Routes } from 'react-router-dom'
import SignupPage from './pages/SignupPages'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import CreatePage from './pages/CreatePage'
import { UploadProvider } from './context/UploadContext'
import UploadBanner from './components/UploadBanner'

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import ReelsPage from './pages/Reelspage'
import ProfilePage from './pages/ProfilePage'
import ProfileSettings from './pages/ProfileSettings'

const App = () => {
  return (
    <UploadProvider>
      <UploadBanner />
      <Routes>
        <Route path='/' element={<SignupPage />} />
        <Route path='/home' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/create' element={<CreatePage />} />
        <Route path='/reels' element={<ReelsPage/>}/>
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileSettings />} />

      </Routes>
    </UploadProvider>
  )
}

export default App
