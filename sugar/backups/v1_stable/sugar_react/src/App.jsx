import React, { useState, useEffect } from 'react';
import AuthStep from './components/AuthStep';
import AdminStep from './components/AdminStep';
import EntryStep from './components/EntryStep';
import RecitalStep from './components/RecitalStep';
import RewardStep from './components/RewardStep';

function App() {
  const [step, setStep] = useState(-1); // -2: Admin, -1: Auth, 0: Entry, 1: Recital, 2: Reward
  const [user, setUser] = useState('');
  const [token, setToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('sugar_user_name');
    const savedToken = localStorage.getItem('sugar_token');
    const savedIsAdmin = localStorage.getItem('sugar_is_admin') === 'true';
    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
      setIsAdmin(savedIsAdmin);
      setStep(savedIsAdmin ? -2 : 0);
    }
  }, []);

  const handleAuthSuccess = (data) => {
    setUser(data.username);
    setToken(data.token);
    setIsAdmin(data.isAdmin === 1);
    localStorage.setItem('sugar_user_name', data.username);
    localStorage.setItem('sugar_token', data.token);
    localStorage.setItem('sugar_is_admin', data.isAdmin === 1 ? 'true' : 'false');
    if (data.isAdmin === 1) setStep(-2);
    else setStep(0);
  };

  const handleEntryNext = (id) => {
    setStudentId(id);
    setStep(1);
  };

  const handleRecitalNext = (finalScore) => {
    setScore(finalScore);
    setStep(2);
  };

  const handleFinish = async (ramen, finalScore) => {
    const activeScore = finalScore || score;
    if (token) {
      try {
        await fetch('https://logos.koreanok.com/api/records', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ score: activeScore, ramen_type: ramen, student_id: studentId })
        });
      } catch (e) {
        console.error('Failed to save record:', e);
      }
    }

    localStorage.removeItem('sugar_user_name');
    localStorage.removeItem('sugar_token');
    localStorage.removeItem('sugar_is_admin');
    setStep(-1);
    setUser('');
    setToken('');
    setStudentId('');
    setIsAdmin(false);
    setScore(0);
  };

  const handleLogout = () => {
    localStorage.removeItem('sugar_user_name');
    localStorage.removeItem('sugar_token');
    localStorage.removeItem('sugar_is_admin');
    setStep(-1);
    setUser('');
    setToken('');
    setStudentId('');
    setIsAdmin(false);
  };

  return (
    <div className="kiosk-container">
      {step === -2 && <AdminStep token={token} onLogout={handleLogout} />}
      {step === -1 && <AuthStep onAuthSuccess={handleAuthSuccess} />}
      {step === 0 && <EntryStep onNext={handleEntryNext} initialValue={user} onLogout={handleLogout} />}
      {step === 1 && <RecitalStep onNext={handleRecitalNext} onBack={() => setStep(0)} />}
      {step === 2 && <RewardStep user={user} score={score} onFinish={(ramen) => handleFinish(ramen, score)} />}
    </div>
  );
}

export default App;
