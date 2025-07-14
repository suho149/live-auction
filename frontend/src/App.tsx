import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import MyPage from './pages/MyPage';

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Routes>
      </Router>
  );
}

export default App;