import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ReviewList from './pages/ReviewList'
import ReviewDetail from './pages/ReviewDetail'
import CreateReview from './pages/CreateReview'
import Profile from './pages/Profile'
import Login from './pages/Login'
import { AuthProvider } from './hooks/useAuth'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="reviews" element={<ReviewList />} />
          <Route path="reviews/:id" element={<ReviewDetail />} />
          <Route path="create" element={<CreateReview />} />
          <Route path="profile" element={<Profile />} />
          <Route path="login" element={<Login />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App