// Utility for String Similarity (Levenshtein Distance based)
function getSimilarityScore(str1, str2) {
    const s1 = str1.replace(/\s+/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const s2 = str2.replace(/\s+/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    
    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLen = Math.max(s1.length, s2.length);
    return Math.round(((maxLen - distance) / maxLen) * 100);
}

// Utility for TTS
function speak(text, callback) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    
    const wave = document.querySelector('.voice-wave');
    if (wave) wave.classList.add('active');

    utterance.onend = () => {
        if (wave) wave.classList.remove('active');
        if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
}

// Sound Effects
const SFX = {
    play(type) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        if (type === 'click') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, context.currentTime);
            gainNode.gain.setValueAtTime(0.1, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
            oscillator.start(); oscillator.stop(context.currentTime + 0.1);
        } else if (type === 'success') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(600, context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.1, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
            oscillator.start(); oscillator.stop(context.currentTime + 0.3);
        } else if (type === 'error') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, context.currentTime);
            gainNode.gain.setValueAtTime(0.1, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
            oscillator.start(); oscillator.stop(context.currentTime + 0.3);
        }
    }
};

// State management
const AppState = {
    save(key, value) { localStorage.setItem(`sugar_logos_${key}`, value); },
    load(key) { return localStorage.getItem(`sugar_logos_${key}`); },
    clear() { localStorage.clear(); }
};

// Navigation
function goTo(page) {
    // 1. 발음(TTS) 및 음성 인식 즉시 중단
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window.currentRecognition) {
        try { window.currentRecognition.stop(); } catch (e) {}
    }
    
    // 2. 즉시 페이지 이동 (지연 및 애니메이션 완전 제거)
    window.location.href = page;
}

// Cleanup on page exit
window.addEventListener('beforeunload', () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
});

// Page Initialization Logic
document.addEventListener('DOMContentLoaded', () => {
    // Step 1: Input handling
    if (document.getElementById('input-display')) {
        const display = document.getElementById('input-display');
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                SFX.play('click');
                const val = btn.innerText;
                if (val === 'CLR') display.innerText = '';
                else if (val === 'DEL') display.innerText = display.innerText.slice(0, -1);
                else if (display.innerText.length < 10) display.innerText += val;
            });
        });

        document.getElementById('btn-start').addEventListener('click', () => {
            if (display.innerText.length > 0) {
                SFX.play('success');
                AppState.save('userId', display.innerText);
                goTo('step2.html');
            } else alert('학번이나 이름을 입력해주세요!');
        });
    }

    // Step 2: Voice Recognition & Scoring
    if (document.querySelector('.btn-recite')) {
        const btnRecite = document.querySelector('.btn-recite');
        const btnCheck = document.querySelector('.btn-check');
        const transcriptDisplay = document.querySelector('.transcript-text');
        const wave = document.querySelector('.voice-wave');
        const verseDisplay = document.querySelector('.verse-text');
        const verseRefDisplay = document.querySelector('#verse-ref');

        // --- 매일 바뀌는 말씀 로직 추가 ---
        function getDailyVerse() {
            if (typeof BIBLE_VERSES === 'undefined' || BIBLE_VERSES.length === 0) {
                return { ref: "요한복음 3:16", text: "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라" };
            }
            // 2024년 1월 1일 기준 날짜 차이 계산
            const startDate = new Date(2024, 0, 1).getTime();
            const today = new Date().setHours(0, 0, 0, 0);
            const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            return BIBLE_VERSES[dayIndex % BIBLE_VERSES.length];
        }

        const dailyVerse = getDailyVerse();
        if (verseRefDisplay) verseRefDisplay.innerText = dailyVerse.ref;
        if (verseDisplay) verseDisplay.innerText = `"${dailyVerse.text}"`;
        
        const targetVerse = dailyVerse.text;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let isReciting = false;
        let finalTranscript = "";


        if (!SpeechRecognition) {
            alert("이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 권장)");
            btnRecite.style.display = 'none';
        } else {
            const recognition = new SpeechRecognition();
            window.currentRecognition = recognition; // 내비게이션 시 제어 가능하도록 노출
            recognition.lang = 'ko-KR';
            recognition.continuous = false; // 말이 끊기면 자동으로 종료 (사용자 요청)
            recognition.interimResults = false; // 암송 중 실시간 글자 노출 방지 (사용자 요청)

            let persistentHistory = ""; 
            let currentSessionFinals = ""; 

            function mergeTranscripts(oldText, newText) {
                oldText = oldText.trim();
                newText = newText.trim();
                if (!oldText) return newText;
                if (!newText) return oldText;
                if (oldText.includes(newText)) return oldText;

                let overlap = 0;
                const checkLen = Math.min(oldText.length, newText.length);
                for (let i = 1; i <= checkLen; i++) {
                    if (oldText.slice(-i) === newText.slice(0, i)) {
                        overlap = i;
                    }
                }
                return oldText + " " + newText.slice(overlap);
            }

            btnRecite.addEventListener('click', () => {
                if (!isReciting) {
                    SFX.play('click');
                    
                    // UI 상태 먼저 업데이트 (로딩/차단 시에도 반영되도록)
                    isReciting = true;
                    btnRecite.innerText = "🛑 암송 완료 (Finish)";
                    btnRecite.style.background = "#ff4757";
                    wave.classList.add('active');
                    verseDisplay.classList.add('mosaic');

                    persistentHistory = "";
                    currentSessionFinals = "";
                    transcriptDisplay.innerText = "🎤 암송 중입니다... (말을 마치면 자동으로 종료되거나 완료를 눌러주세요)";
                    transcriptDisplay.style.opacity = "0.7";
                    scoreDisplay.style.display = 'none';
                    
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Speech recognition start error:", e);
                        // 이미 실행 중이면 에러가 날 수 있으나, 상태는 그대로 유지
                    }
                } else {
                    SFX.play('click');
                    isReciting = false;
                    try {
                        recognition.stop();
                    } catch (e) {}
                    
                    // UI 상태 복구
                    btnRecite.innerText = "🎤 암송 시작 (Recite)";
                    btnRecite.style.background = "var(--primary-gradient)";
                    wave.classList.remove('active');
                    verseDisplay.classList.remove('mosaic');
                }
            });

            recognition.onresult = (event) => {
                // 실시간으로 결과를 보여주지 않고 내부 변수에만 저장
                if (event.results.length > 0) {
                    currentSessionFinals = event.results[0][0].transcript;
                }
            };

            recognition.onend = () => {
                // 종료 시점에 최종 텍스트 표시 및 결과 처리
                const finalResult = currentSessionFinals.trim();
                transcriptDisplay.innerText = finalResult || "(인식된 내용이 없습니다)";
                transcriptDisplay.style.opacity = "1.0";
                
                btnRecite.innerText = "🎤 암송 다시 시작";
                btnRecite.style.background = "var(--primary-gradient)";
                wave.classList.remove('active');
                verseDisplay.classList.remove('mosaic');
                isReciting = false;

                if (finalResult) {
                    const score = getSimilarityScore(finalResult, targetVerse);
                    scoreDisplay.style.display = 'flex';
                    scoreDisplay.innerHTML = `<span>점수:</span> ${score}점`;
                    
                    if (score >= 90) {
                        SFX.play('success');
                        scoreDisplay.style.color = '#4ecdc4';
                        btnCheck.disabled = false;
                        btnCheck.classList.add('active');
                        btnCheck.innerText = "암송 통과! 보상받기";
                    } else {
                        SFX.play('error');
                        scoreDisplay.style.color = '#ff6b6b';
                        alert(`아쉽습니다! ${score}점입니다. 90점 이상이어야 통과입니다.`);
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === 'no-speech') {
                    // Ignore no-speech errors to stay persistent
                } else {
                    isReciting = false;
                    wave.classList.remove('active');
                    verseDisplay.classList.remove('mosaic');
                    btnRecite.innerText = "🎤 암송 다시 시작";
                }
            };
        }

        document.querySelector('.btn-audio').addEventListener('click', () => {
            speak(targetVerse);
        });

        btnCheck.addEventListener('click', () => {
            if (!btnCheck.disabled) goTo('step3.html');
        });
    }

    // Step 3: Ramen selection
    if (document.querySelector('.ramen-grid')) {
        const items = document.querySelectorAll('.ramen-item');
        let selectedRamen = null;
        items.forEach(item => {
            item.addEventListener('click', () => {
                SFX.play('click');
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedRamen = item.querySelector('p').innerText;
            });
        });

        document.getElementById('btn-finish').addEventListener('click', () => {
            if (selectedRamen) {
                SFX.play('success');
                const userId = AppState.load('userId');
                alert(`${userId}님, ${selectedRamen} 맛있게 드세요!🎉`);
                AppState.clear();
                goTo('step1.html');
            } else alert('라면을 선택해 주세요!');
        });
    }
});
