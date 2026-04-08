import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, ArrowLeft } from 'lucide-react';
import { SFX, speak, getSimilarityScore } from '../utils/mission';
import { BIBLE_VERSES } from '../data/verses';

const RecitalStep = ({ onNext, onBack }) => {
    const [isReciting, setIsReciting] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [score, setScore] = useState(null);
    const [isWaveActive, setIsWaveActive] = useState(false);
    const recognitionRef = useRef(null);
    const accumulatedTranscriptRef = useRef('');

    const dailyVerse = BIBLE_VERSES[Math.floor((new Date().setHours(0,0,0,0) - new Date(2024,0,1).getTime()) / 86400000) % BIBLE_VERSES.length];
    const targetText = dailyVerse.text.replace(/"/g, "").trim();

    useEffect(() => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            recognitionRef.current = new SpeechRec();
            recognitionRef.current.lang = 'ko-KR';
            recognitionRef.current.continuous = true;

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                accumulatedTranscriptRef.current += " " + currentTranscript;
            };

            recognitionRef.current.onend = () => {
                if (isReciting) recognitionRef.current.start();
            };
        }
    }, [isReciting]);

    const handleToggleRecital = () => {
        SFX.play('click');
        if (!isReciting) {
            setTranscript('');
            accumulatedTranscriptRef.current = '';
            setScore(null);
            setIsReciting(true);
            recognitionRef.current.start();
        } else {
            setIsReciting(false);
            recognitionRef.current.stop();
            const finalResults = accumulatedTranscriptRef.current.trim();
            setTranscript(finalResults);
            if (finalResults) {
                const finalScore = getSimilarityScore(finalResults, targetText);
                setScore(finalScore);
                if (finalScore >= 85) SFX.play('success');
            }
        }
    };

    return (
        <div className="fade-in">
            <header>
                <h1>Bible Recital</h1>
                <p className="subtitle">{dailyVerse.ref}</p>
            </header>

            <main>
                <div className={`mission-card ${isReciting ? 'mosaic' : ''}`}>
                    <p className={`verse-text ${isReciting ? 'mosaic' : ''}`}>
                        "{dailyVerse.text}"
                    </p>
                    <button id="btn-listen" className="num-btn special" 
                            style={{ width: '100%', height: '50px', marginTop: '10px' }}
                            onClick={() => speak(targetText, setIsWaveActive)}>
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
                    <button className={`btn-primary ${isReciting ? 'btn-secondary' : ''}`} onClick={handleToggleRecital}>
                        {isReciting ? <Square size={24} style={{ marginRight: '10px' }} /> : <Mic size={24} style={{ marginRight: '10px' }} />}
                        {isReciting ? "암송 완료 (Finish)" : "암송 시작 (Recite)"}
                    </button>
                    
                    <button className="btn-primary btn-secondary btn-check" 
                            disabled={score === null || score < 85}
                            onClick={() => onNext(score)}>
                        {score >= 85 ? "암송 통과! 보상받기" : "85점 이상 시 통과 가능"}
                    </button>
                </div>

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
