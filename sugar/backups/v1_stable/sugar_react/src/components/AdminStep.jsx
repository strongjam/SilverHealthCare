import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, LogOut, Award, Shield, Trash2 } from 'lucide-react';
import { SFX } from '../utils/mission';

const AdminStep = ({ token, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('https://logos.koreanok.com/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError('데이터를 불러오지 못했습니다.');
            }
        } catch (err) {
            setError('서버 통신 오류');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (username) => {
        if (!window.confirm(`${username} 사용자의 모든 정보와 기록이 삭제됩니다. 계속하시겠습니까?`)) return;
        
        SFX.play('click');
        try {
            const res = await fetch(`https://logos.koreanok.com/api/admin/users/${username}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                SFX.play('success');
                alert('삭제되었습니다.');
                fetchUsers();
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (err) {
            alert('서버 통신 오류');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3vh' }}>
                <div style={{ textAlign: 'left' }}>
                    <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={32} color="#FF6B6B" /> Admin Panel
                    </h1>
                    <p className="subtitle">사용자 활동 및 보상 관리</p>
                </div>
                <button className="num-btn special" style={{ width: 'auto', height: '45px', padding: '0 20px' }} onClick={onLogout}>
                    <LogOut size={18} style={{ marginRight: '8px' }} /> 로그아웃
                </button>
            </header>

            <main>
                <div className="mission-card" style={{ padding: '20px', minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input 
                                type="text"
                                placeholder="사용자 아이디 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-display"
                                style={{ height: '45px', fontSize: '1rem', paddingLeft: '40px', textAlign: 'left', letterSpacing: 'normal' }}
                            />
                        </div>
                        <button className="num-btn" style={{ width: '45px', height: '45px' }} onClick={fetchUsers}>
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead style={{ background: 'rgba(0,0,0,0.05)', position: 'sticky', top: 0 }}>
                            <tr>
                                <th style={{ padding: '12px 15px' }}>아이디 (Username)</th>
                                <th style={{ padding: '12px 15px' }}>비밀번호 (Pass)</th>
                                <th style={{ padding: '12px 15px' }}>학번 (Student ID)</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center' }}>수령 라면</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center' }}>최고 점수</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>데이터가 없습니다.</td></tr>
                            ) : (
                                filteredUsers.map((u, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                        <td style={{ padding: '12px 15px', fontWeight: 600 }}>{u.username}</td>
                                        <td style={{ padding: '12px 15px', color: '#888' }}>{u.password}</td>
                                        <td style={{ padding: '12px 15px' }}>{u.student_id || '-'}</td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            <span className="score-badge" style={{ padding: '4px 10px', fontSize: '0.9rem' }}>
                                                <Award size={14} style={{ marginRight: '4px' }} /> {u.total_ramen}개
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#FF6B6B' }}>
                                            {u.high_score || 0}점
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            <button 
                                                className="num-btn special" 
                                                style={{ width: '35px', height: '35px', padding: 0 }}
                                                onClick={() => handleDeleteUser(u.username)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <footer>
                <div className="step-indicator" style={{ justifyContent: 'center' }}>
                    <span>총 {filteredUsers.length}명의 사용자가 등록되어 있습니다.</span>
                </div>
            </footer>
        </div>
    );
};

export default AdminStep;
