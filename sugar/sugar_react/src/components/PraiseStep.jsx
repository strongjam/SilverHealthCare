import React, { useState, useEffect } from 'react';
import { CheckCircle2, Award, Heart, Smile, Star, Crown, Sparkles } from 'lucide-react';

const PraiseStep = ({ user, userType, score, finalRewardMessage, onRestart }) => {
    const [stampCount, setStampCount] = useState(0);
    const [isLoading, setIsLoading] = useState(userType === 'korean' && score >= 85);

    useEffect(() => {
        if (userType === 'korean' && score >= 85) {
            fetchStampCount();
        }
    }, [userType, score]);

    const fetchStampCount = async () => {
        try {
            const res = await fetch(`https://logos.koreanok.com/api/records/my-summary?user_type=korean`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sugar_token') || 'GUEST_TOKEN'}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStampCount(data.length % 10 || 0);
            }
        } catch (e) {
            console.error('Failed to fetch stamps:', e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', padding: '100px' }}>로딩 중...</div>;

    return (
        <div className="fade-in" style={{ textAlign: 'center', padding: '10px 10px 80px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header style={{ marginBottom: '2vh' }}>
                <h1 style={{ fontSize: 'clamp(2rem, 8vh, 3rem)' }}>🎉 참 잘하셨습니다!</h1>
                <p className="subtitle" style={{ color: '#FF6B6B', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {finalRewardMessage || (userType === 'korean' ? '오늘 하루도 말씀으로 승리하세요!' : '수고하셨습니다!')}
                </p>
            </header>

            <main style={{ maxWidth: '600px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="mission-card" style={{ padding: '40px 30px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                    {userType === 'korean' ? (
                        score >= 85 ? (
                            <div style={{ width: '100%' }}>
                                <h2 style={{ margin: '0 0 20px 0', color: '#FF6B6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Award size={28} style={{ marginRight: '10px' }} /> 스템프 북 (Stamp Book)
                                </h2>
                                <div style={{ 
                                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', 
                                    maxWidth: '400px', margin: '0 auto 20px auto' 
                                }}>
                                    {[...Array(10)].map((_, i) => {
                                        const isStamped = i < (stampCount === 0 && score >= 85 ? 1 : stampCount);
                                        // Note: If newly achieved, stampCount might be 0 until fetch completes, but we know it's at least 1 if score >= 85
                                        // Actually, the backend record was already saved in handleFinish, so fetch should return latest.
                                        const displayCount = stampCount || (score >= 85 ? 1 : 0);
                                        const isMarked = i < displayCount;
                                        
                                        return (
                                            <div key={i} style={{ 
                                                aspectRatio: '1', borderRadius: '50%', border: '3px dashed #eee',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isMarked ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                                                borderColor: isMarked ? '#FF6B6B' : '#eee',
                                                position: 'relative'
                                            }}>
                                                {isMarked && (
                                                    <CheckCircle2 color="#FF6B6B" size={32} className="animate-pop" />
                                                )}
                                                <span style={{ 
                                                    position: 'absolute', bottom: '-20px', fontSize: '0.8rem', 
                                                    color: isMarked ? '#FF6B6B' : '#ccc', fontWeight: 700 
                                                }}>{i + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="animate-pop" style={{ marginBottom: '20px' }}>
                                    <Crown color="#FFB800" size={100} />
                                </div>
                                <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: '#FFB800' }}>오늘도 말씀으로 승리!</h2>
                                <p style={{ color: '#666', marginBottom: '20px' }}>말씀과 함께하는 복된 하루 되세요. ✨</p>
                            </div>
                        )
                    ) : (
                        score >= 85 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="animate-pop" style={{ marginBottom: '15px' }}>
                                    <CheckCircle2 color="var(--primary)" size={80} />
                                </div>
                                <h2 style={{ margin: '0 0 20px 0', fontSize: '1.8rem' }}>미션 완료!</h2>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="animate-pop" style={{ marginBottom: '15px' }}>
                                    <Heart color="#FF6B6B" size={80} fill="#FF6B6B" style={{ opacity: 0.8 }} />
                                </div>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>수고하셨습니다!</h2>
                                <p style={{ color: '#888', marginBottom: '15px' }}>다음에 또 도전해 보세요! 💪</p>
                            </div>
                        )
                    )}
                    
                    {score >= 85 && (
                        <>
                            <div className="score-badge" style={{ fontSize: '2.5rem', padding: '10px 25px', margin: '20px auto', width: 'fit-content' }}>
                                {score}점
                            </div>
                            <p style={{ color: '#666', margin: 0 }}>말씀을 암송하는 당신의 모습이 참 아름답습니다.</p>
                        </>
                    )}
                </div>

                <button className="btn-primary" style={{ marginTop: '40px', width: '100%' }} onClick={onRestart}>
                    메인화면으로 돌아가기
                </button>
            </main>
        </div>
    );
};

export default PraiseStep;
