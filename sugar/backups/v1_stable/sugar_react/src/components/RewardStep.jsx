import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { SFX } from '../utils/mission';

const RewardStep = ({ user, score, onFinish }) => {
    const [selectedRamen, setSelectedRamen] = useState(null);

    const ramens = [
        { id: 'shin', name: '신라면', img: 'https://logos.koreanok.com/images/shin.png' },
        { id: 'jin', name: '진라면', img: 'https://logos.koreanok.com/images/jin.png' },
        { id: 'buldak', name: '불닭볶음면', img: 'https://logos.koreanok.com/images/buldak.png' },
        { id: 'neoguri', name: '너구리', img: 'https://logos.koreanok.com/images/neoguri.png' }
    ];

    const handleSelect = (ramen) => {
        SFX.play('click');
        setSelectedRamen(ramen);
    };

    const handleFinish = () => {
        if (!selectedRamen) return alert('라면을 선택해 주세요!');
        SFX.play('success');
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        
        setTimeout(() => {
            alert(`${user}님, ${selectedRamen.name} 맛있게 드세요!🎉`);
            onFinish(selectedRamen.name);
        }, 500);
    };

    return (
        <div className="fade-in">
            <header>
                <h1>Mission Reward</h1>
                <p className="subtitle">{user}님, 성공을 축하합니다!</p>
            </header>

            <main>
                <div className="ramen-grid">
                    {ramens.map(ramen => (
                        <div key={ramen.id} 
                             className={`ramen-item ${selectedRamen?.id === ramen.id ? 'selected' : ''}`}
                             onClick={() => handleSelect(ramen)}>
                            <img src={ramen.img} alt={ramen.name} />
                            <p style={{ fontWeight: 700 }}>{ramen.name}</p>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '40px' }}>
                    <button className="btn-primary" onClick={handleFinish}>선택 완료 (Finish)</button>
                </div>
            </main>

            <footer>
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: '100%' }}></div>
                </div>
                <div className="step-indicator">
                    <span>보상 선택</span>
                    <span>100%</span>
                </div>
            </footer>
        </div>
    );
};

export default RewardStep;
