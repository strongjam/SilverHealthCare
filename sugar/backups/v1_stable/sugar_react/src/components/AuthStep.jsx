import React, { useState } from 'react';
import { User, Lock, UserPlus, LogIn } from 'lucide-react';
import { SFX } from '../utils/mission';

const AuthStep = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const API_BASE = 'https://logos.koreanok.com/api'; // Use absolute URL for production

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return alert('아이디와 비밀번호를 입력해주세요.');
        
        setLoading(true);
        setMessage({ type: '', text: '' });
        SFX.play('click');

        const endpoint = isLogin ? '/auth/login' : '/auth/signup';
        
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                SFX.play('success');
                if (isLogin) {
                    onAuthSuccess(data); // data contains token and username
                } else {
                    setMessage({ type: 'success', text: '회원가입이 완료되었습니다. 로그인해주세요!' });
                    setIsLogin(true);
                    setPassword('');
                }
            } else {
                setMessage({ type: 'error', text: data.error || '오류가 발생했습니다.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: '서버와 통신할 수 없습니다.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <header>
                <h1>Sugar Logos</h1>
                <p className="subtitle">성경암송 미션 시작하기</p>
            </header>

            <main>
                <div className="mission-card" style={{ padding: '3vh 30px' }}>
                    <div style={{ display: 'flex', marginBottom: '25px', gap: '10px' }}>
                        <button 
                            className={`num-btn ${isLogin ? 'active' : 'special'}`} 
                            style={{ flex: 1, height: '50px', background: isLogin ? 'var(--primary-gradient)' : '', color: isLogin ? 'white' : '' }}
                            onClick={() => { setIsLogin(true); setMessage({ type: '', text: '' }); SFX.play('click'); }}
                        >
                            로그인
                        </button>
                        <button 
                            className={`num-btn ${!isLogin ? 'active' : 'special'}`} 
                            style={{ flex: 1, height: '50px', background: !isLogin ? 'var(--primary-gradient)' : '', color: !isLogin ? 'white' : '' }}
                            onClick={() => { setIsLogin(false); setMessage({ type: '', text: '' }); SFX.play('click'); }}
                        >
                            회원가입
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="input-display-container" style={{ margin: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <User size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                <input 
                                    type="text" 
                                    placeholder="아이디 (ID / Student No.)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input-display"
                                    style={{ fontSize: '1.2rem', paddingLeft: '45px', textAlign: 'left', letterSpacing: 'normal' }}
                                />
                            </div>
                        </div>

                        <div className="input-display-container" style={{ margin: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <Lock size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                <input 
                                    type="password" 
                                    placeholder="비밀번호 (Password)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-display"
                                    style={{ fontSize: '1.2rem', paddingLeft: '45px', textAlign: 'left', letterSpacing: 'normal' }}
                                />
                            </div>
                        </div>

                        {message.text && (
                            <p style={{ color: message.type === 'error' ? '#ff4d4f' : '#52c41a', fontSize: '0.9rem', textAlign: 'center' }}>
                                {message.text}
                            </p>
                        )}

                        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? '처리 중...' : (isLogin ? '로그인 (Login)' : '회원가입 (Join)')}
                            {isLogin ? <LogIn size={20} style={{ marginLeft: '8px' }} /> : <UserPlus size={20} style={{ marginLeft: '8px' }} />}
                        </button>
                    </form>
                </div>
            </main>

            <footer>
                <div className="step-indicator" style={{ justifyContent: 'center' }}>
                    <span>환영합니다! 먼저 로그인해 주세요.</span>
                </div>
            </footer>
        </div>
    );
};

export default AuthStep;
