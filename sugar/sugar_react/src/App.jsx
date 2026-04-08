import React, { useState, useEffect } from 'react';
import SelectionStep from './components/SelectionStep';
import AuthStep from './components/AuthStep';
import AdminStep from './components/AdminStep';
import EntryStep from './components/EntryStep';
import RecitalStep from './components/RecitalStep';
import RewardStep from './components/RewardStep';
import PraiseStep from './components/PraiseStep';

function App() {
  const [step, setStep] = useState(localStorage.getItem('sugar_token') ? (localStorage.getItem('sugar_is_admin') === 'true' ? -2 : 1) : -3); 
  // -3: Selection, -2: Admin, -1: Auth, 0: Entry, 1: Recital, 2: Reward, 3: Praise
  
  const [user, setUser] = useState(localStorage.getItem('sugar_user_name') || '');
  const [token, setToken] = useState(localStorage.getItem('sugar_token') || '');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('sugar_is_admin') === 'true');
  const [userType, setUserType] = useState(localStorage.getItem('sugar_user_type') || '');
  const [studentId, setStudentId] = useState('');
  const [score, setScore] = useState(0);
  const [pendingRamen, setPendingRamen] = useState(null);
  const [finalRewardMessage, setFinalRewardMessage] = useState('');

  const handleSelection = (type) => {
    setUserType(type);
    localStorage.setItem('sugar_user_type', type);
    // Everyone skips initial Auth and goes straight to Recital
    setStep(1); 
  };

  const handleAuthSuccess = (data) => {
    setUser(data.username);
    setToken(data.token);
    setIsAdmin(data.isAdmin === 1);
    localStorage.setItem('sugar_user_name', data.username);
    localStorage.setItem('sugar_token', data.token);
    localStorage.setItem('sugar_is_admin', data.isAdmin === 1 ? 'true' : 'false');
    
    if (data.isAdmin === 1) setStep(-2);
    else {
      setStudentId(data.username);
      // If we have a pending reward (Late-Login)
      if (pendingRamen) {
        if (pendingRamen === 'STAMP') {
            // Koreans: Save first, then go directly to the integrated Step 3
            handleFinish(pendingRamen, score, data.token, data.username);
        } else {
            // Foreigners: Finish immediately to Praise screen
            const msg = `${data.username}님, ${pendingRamen} 맛있게 드세요!🎉`;
            setFinalRewardMessage(msg);
            handleFinish(pendingRamen, score, data.token, data.username, msg);
        }
      } else {
        setStep(1); 
      }
    }
  };

  const handleRecitalNext = (finalScore) => {
    setScore(finalScore);
    if (finalScore >= 85) {
        if (userType === 'korean') {
            // Koreans: Go to Auth first, then Reward
            setPendingRamen('STAMP');
            setStep(-1);
        } else {
            // Foreigners: Reward selection first
            setStep(2);
        }
    } else {
        setStep(3); 
    }
  };

  const handleRewardFinish = (ramen) => {
    if (token) {
        // If already logged in, handle final save and move to Praise
        handleFinish(ramen, score);
    } else {
        // Late login flow
        setPendingRamen(ramen);
        setStep(-1); 
    }
  };

  const handleFinish = async (ramen, finalScore, overrideToken, overrideUser, overrideMsg, shouldRedirect = true) => {
    const activeScore = finalScore || score;
    const activeToken = overrideToken || token;
    const activeUser = overrideUser || user || studentId;
    let activeRamen = ramen || 'NONE';
    if (userType === 'korean' && activeScore >= 85) activeRamen = 'STAMP';
    
    // Set final message if not already set (e.g. for foreigners who were already logged in)
    if (!overrideMsg && !finalRewardMessage) {
        if (userType === 'korean' && activeScore >= 85) {
            setFinalRewardMessage(`${activeUser}님, 스템프가 찍혔습니다!🎉`);
        } else if (activeRamen !== 'NONE' && activeRamen !== 'STAMP') {
            setFinalRewardMessage(`${activeUser}님, ${activeRamen} 맛있게 드세요!🎉`);
        }
    }

    try {
      await fetch('https://logos.koreanok.com/api/records', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken || 'GUEST_TOKEN'}`
        },
        body: JSON.stringify({ 
          score: activeScore, 
          ramen_type: activeRamen, 
          student_id: activeUser || (userType === 'korean' ? 'KOREAN_GUEST' : 'GUEST'),
          user_type: userType 
        })
      });
    } catch (e) {
      console.error('Failed to save record:', e);
    }
    if (shouldRedirect) setStep(3);
  };

  const handleRestart = () => {
    localStorage.removeItem('sugar_user_name');
    localStorage.removeItem('sugar_token');
    localStorage.removeItem('sugar_is_admin');
    localStorage.removeItem('sugar_user_type');
    setStep(-3);
    setUser('');
    setToken('');
    setStudentId('');
    setUserType('');
    setIsAdmin(false);
    setScore(0);
    setPendingRamen(null);
    setFinalRewardMessage('');
  };

  const handleLogout = () => {
    localStorage.clear();
    setStep(-3);
    setUser('');
    setToken('');
    setStudentId('');
    setUserType('');
    setIsAdmin(false);
  };

  return (
    <div className="kiosk-container">
      {step === -3 && <SelectionStep onSelect={handleSelection} />}
      {step === -2 && <AdminStep token={token} onLogout={handleLogout} />}
      {step === -1 && (
        <AuthStep 
            userType={userType} 
            pendingRamen={pendingRamen}
            onAuthSuccess={handleAuthSuccess} 
            onBack={() => setStep(-3)} 
        />
      )}
      {step === 1 && <RecitalStep userType={userType} onNext={handleRecitalNext} onBack={() => setStep(-3)} />}
      
      {step === 2 && (
        <RewardStep 
          user={user || studentId} 
          userType={userType}
          score={score} 
          onFinish={handleRewardFinish} 
        />
      )}

      {step === 3 && (
        <PraiseStep 
            user={user || studentId} 
            userType={userType} 
            score={score} 
            finalRewardMessage={finalRewardMessage} 
            onRestart={handleRestart} 
        />
      )}
    </div>
  );
}

export default App;
