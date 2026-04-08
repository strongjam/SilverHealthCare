import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Mic, Square, Volume2, ArrowLeft, History, X } from 'lucide-react';
import { SFX, speak, getSimilarityScore } from '../utils/mission';
import { BIBLE_VERSES } from '../data/verses';

const RecitalStep = ({ onNext, onBack, userType }) => {
    const [isReciting, setIsReciting] = useState(false);
    const [showArchive, setShowArchive] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [score, setScore] = useState(null);
    const [isWaveActive, setIsWaveActive] = useState(false);
    const recognitionRef = useRef(null);
    const accumulatedTranscriptRef = useRef('');
    const isRecitingRef = useRef(false);

    const formatReference = (ref) => {
        if (!ref) return "";
        return ref.replace(':', '장 ') + '절';
    };

    const dailyVerse = BIBLE_VERSES[Math.floor((new Date().setHours(0,0,0,0) - new Date(2024,0,1).getTime()) / 86400000) % BIBLE_VERSES.length];
    
    const formattedRef = formatReference(dailyVerse.ref);
    // Merge Ref and Text for combined recital
    const fullTargetText = `${formattedRef} ${dailyVerse.text}`.replace(/"/g, "").trim();
    const displayRef = formattedRef;
    const displayText = dailyVerse.text;

    useEffect(() => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            recognitionRef.current = new SpeechRec();
            recognitionRef.current.lang = 'ko-KR';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true; 

            recognitionRef.current.onresult = (event) => {
                let fullText = '';
                for (let i = 0; i < event.results.length; i++) {
                    fullText += event.results[i][0].transcript;
                }
                accumulatedTranscriptRef.current = fullText;
            };

            recognitionRef.current.onend = () => {
                if (isRecitingRef.current && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.log('Recognition restart ignored:', e);
                    }
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech Recognition Error:', event.error);
            };
        }
    }, []);

    const handleToggleRecital = () => {
        SFX.play('click');
        if (!isReciting) {
            setTranscript('');
            accumulatedTranscriptRef.current = '';
            setScore(null);
            setIsReciting(true);
            isRecitingRef.current = true;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) { console.error(e); }
            }
        } else {
            setIsReciting(false);
            isRecitingRef.current = false;
            setTranscript("🎤 분석 중입니다...");
            
            if (recognitionRef.current) {
                // Use a one-time handler for this specific finalization
                const handleFinalize = () => {
                    SFX.play('success');
                    const finalResults = accumulatedTranscriptRef.current.trim();
                    setTranscript(finalResults);
                    
                    if (finalResults) {
                        const finalScore = getSimilarityScore(fullTargetText, finalResults);
                        setScore(finalScore);
                        if (finalScore >= 85) SFX.play('success');
                    } else {
                        setScore(0);
                    }
                    // Reset onend to the normal restart logic for next session
                    recognitionRef.current.onend = () => {
                        if (isRecitingRef.current) {
                            try { recognitionRef.current.start(); } catch(e){}
                        }
                    };
                };
                
                recognitionRef.current.ononend = handleFinalize; // Safety for some browsers
                recognitionRef.current.onend = handleFinalize;
                recognitionRef.current.stop();
            }
        }
    };

    const getPastVerses = () => {
        const today = new Date().setHours(0,0,0,0);
        const dayMs = 86400000;
        const past = [];
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today - (i * dayMs));
            const isoDate = date.toISOString().split('T')[0];
            const idx = Math.floor((date.getTime() - new Date(2024,0,1).getTime()) / dayMs) % BIBLE_VERSES.length;
            past.push({ date: date.toLocaleDateString(), isoDate, ...BIBLE_VERSES[idx], formattedRef: formatReference(BIBLE_VERSES[idx].ref) });
        }
        return past;
    };

    const [pastScores, setPastScores] = useState({});

    const fetchPastScores = async () => {
        try {
            const res = await fetch(`https://logos.koreanok.com/api/records/my-summary?user_type=${userType}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sugar_token') || 'GUEST_TOKEN'}` }
            });
            if (res.ok) {
                const data = await res.json();
                const scoreMap = {};
                data.forEach(row => {
                    scoreMap[row.date] = row.high_score;
                });
                setPastScores(scoreMap);
            }
        } catch (e) {
            console.error('Failed to fetch past scores:', e);
        }
    };

    const handleToggleArchive = () => {
        const nextShow = !showArchive;
        setShowArchive(nextShow);
        if (nextShow) {
            SFX.play('click');
            fetchPastScores();
        }
    };

    return (
        <div className="fade-in">
            <header style={{ position: 'relative' }}>
                <button className="num-btn" 
                        style={{ position: 'absolute', right: 0, top: 0, width: '50px', height: '50px', borderRadius: '12px' }}
                        onClick={handleToggleArchive}>
                    <History size={20} />
                </button>
                <h1>Sugar logos</h1>
                <p className="subtitle" style={{ color: '#FF6B6B', fontWeight: 'bold' }}>
                    💡 말씀 구절을 처음에 말하시고 이어서 말씀을 암송해주세요.
                </p>
                <div style={{ fontSize: '1.2rem', color: '#444', marginTop: '10px' }}>{displayRef}</div>
            </header>

            <main>
                <div className={`mission-card ${isReciting ? 'mosaic' : ''}`}>
                    <p className={`verse-text ${isReciting ? 'mosaic' : ''}`}>
                        <span style={{ color: '#FF6B6B', display: 'block', fontSize: '1rem', marginBottom: '10px' }}>[{displayRef}]</span>
                        "{displayText}"
                    </p>
                    <button id="btn-listen" className="num-btn special" 
                            style={{ width: '100%', height: '50px', marginTop: '10px' }}
                            onClick={() => speak(fullTargetText, setIsWaveActive)}>
                        <Volume2 size={20} style={{ marginRight: '8px' }} /> 말씀 듣기 (Listen)
                    </button>
                </div>

                <div className={`voice-wave ${isReciting || isWaveActive ? 'active' : ''}`}>
                    {[1, 2, 3, 4, 5, 2, 4, 1].map((h, i) => (
                        <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>

                <div className="transcript-container" style={{ textAlign: 'center', minHeight: '60px', marginBottom: '20px' }}>
                    <p className="transcript-text" style={{ color: '#636e72', fontStyle: 'italic' }}>
                        {transcript || (isReciting ? "🎤 암송 중입니다..." : "(암송 시작 버튼을 눌러주세요)")}
                    </p>
                    {score !== null && (
                        <div className="score-badge animate-pop" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF6B6B', marginTop: '10px' }}>
                            <span style={{ fontSize: '1rem', color: '#666' }}>점수:</span> {score}점
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button 
                        className={`btn-primary ${isReciting ? 'btn-secondary' : ''}`} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                        onClick={handleToggleRecital}
                    >
                        {isReciting ? <Square size={24} /> : <Mic size={24} />}
                        {isReciting ? "암송 완료 (Finish)" : "암송 시작 (Recite)"}
                    </button>
                    
                    <button className="btn-primary btn-secondary btn-check" 
                            disabled={score === null}
                            onClick={() => onNext(score)}>
                        {userType === 'korean' 
                            ? (score !== null ? "결과 저장하고 완료하기" : "암송 후 완료 가능")
                            : (score >= 85 ? "암송 통과! 보상받기" : "결과 저장하고 완료하기 (85점 미만)")}
                    </button>
                </div>

                {showArchive && (
                    <div className="fade-in" style={{ 
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="mission-card" style={{ 
                            width: '90%', maxWidth: '600px', maxHeight: '80vh', 
                            overflowY: 'auto', textAlign: 'left', padding: '30px' 
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: '#333', fontSize: '1.4rem', display: 'flex', alignItems: 'center', fontWeight: '800' }}>
                                    <Calendar size={24} style={{ marginRight: '12px', color: '#FF6B6B' }} /> 지난 말씀 (Past Verses)
                                </h3>
                                <button 
                                    className="num-btn" 
                                    style={{ 
                                        width: '45px', height: '45px', borderRadius: '50%', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: 0, border: 'none', background: 'rgba(0,0,0,0.05)',
                                        transition: 'background 0.2s'
                                    }} 
                                    onClick={() => setShowArchive(false)}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {getPastVerses().map((v, i) => (
                                    <div key={i} style={{ 
                                        padding: '24px', 
                                        background: 'rgba(255,255,255,0.6)', 
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.03)'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: '#FF6B6B', fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{v.date}</span>
                                            {pastScores[v.isoDate] !== undefined ? (
                                                <span style={{ 
                                                    background: pastScores[v.isoDate] >= 85 ? '#FF6B6B' : '#636e72', 
                                                    color: 'white', padding: '4px 10px', 
                                                    borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800'
                                                }}>
                                                    {pastScores[v.isoDate] >= 85 ? '성공' : '도전'}: {pastScores[v.isoDate]}점
                                                </span>
                                            ) : (
                                                <span style={{ 
                                                    background: '#f1f2f6', color: '#b2bec3', padding: '4px 10px', 
                                                    borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600'
                                                }}>
                                                    미참여
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '10px', color: '#2d3436' }}>{v.formattedRef}</div>
                                        <div style={{ fontSize: '1.05rem', color: '#636e72', lineHeight: '1.6', fontStyle: 'italic' }}>"{v.text}"</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '30px', textAlign: 'left' }}>
                    <button className="num-btn special" 
                            style={{ width: '180px', height: '55px' }} 
                            onClick={onBack}>
                        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> 이전으로 (Back)
                    </button>
                </div>
            </main>

            <footer>
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: '66%' }}></div>
                </div>
                <div className="step-indicator">
                    <span>말씀 암송</span>
                    <span>66%</span>
                </div>
            </footer>
        </div>
    );
};

export default RecitalStep;
