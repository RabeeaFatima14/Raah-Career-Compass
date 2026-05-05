import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Landing from './pages/Landing'
import Chat from './pages/Chat'
import PersonalityQuiz from './pages/PersonalityQuiz'
import ProfileForm from './pages/ProfileForm'
import Roadmap from './pages/Roadmap'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/personality" element={<PersonalityQuiz />} />
          <Route path="/profile" element={<ProfileForm />} />
          <Route path="/roadmap" element={<Roadmap />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}