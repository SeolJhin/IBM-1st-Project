/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
// src/features/chat/hooks/useChat.js
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  loadHistory,
  saveHistory,
  clearHistory,
  sendToGemini,
  sendToBackend,
} from '../api/chatApi';

var SYSTEM_PROMPT =
  '당신은 UNI PLACE의 AI 어시스턴트입니다. 항상 친절하고 전문적으로 한국어로 응답하세요. UNI PLACE는 주거 플랫폼으로 계약, 공용 공간, 결제, 룸서비스 등을 지원합니다.';

export function speakText(text, rate, onEnd) {
  if (!text || !text.trim()) return;
  window.speechSynthesis.cancel();
  var utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ko-KR';
  utter.rate = rate || 1.4;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}

export function useChat(params) {
  var user = params.user;
  var geminiApiKey = params.geminiApiKey;
  var useBackend = params.useBackend || false;
  var userId = user ? user.userId || user.id || null : null;
  var userRole = user ? user.userRole || user.role || 'guest' : 'guest';

  var messagesState = useState(function () {
    return loadHistory(userId, userRole);
  });
  var messages = messagesState[0];
  var setMessages = messagesState[1];
  var inputState = useState('');
  var input = inputState[0];
  var setInput = inputState[1];
  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];
  var errorState = useState(null);
  var error = errorState[0];
  var setError = errorState[1];
  var modeState = useState(null);
  var mode = modeState[0];
  var setMode = modeState[1];
  var listeningState = useState(false);
  var listening = listeningState[0];
  var setListening = listeningState[1];

  var bottomRef = useRef(null);
  var recognitionRef = useRef(null);
  var activeMode = useRef(null);
  var isSendingRef = useRef(false); // 중복 전송 방지

  useEffect(
    function () {
      saveHistory(userId, userRole, messages);
    },
    [messages, userId, userRole]
  );
  useEffect(
    function () {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [messages, loading]
  );

  useEffect(
    function () {
      activeMode.current = mode;
      if (!mode) {
        stopRecognition();
        window.speechSynthesis.cancel();
        isSendingRef.current = false;
      }
    },
    [mode]
  );

  function stopRecognition() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setListening(false);
  }

  function startListening(currentMode) {
    if (!currentMode) return;
    var SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Chrome 또는 Edge 브라우저를 사용해주세요.');
      setMode(null);
      return;
    }

    // 이전 인식 정리
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    var recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    var handled = false; // onresult/onerror 중복 처리 방지

    recognition.onstart = function () {
      setListening(true);
    };

    recognition.onresult = function (e) {
      if (handled) return;
      handled = true;
      setListening(false);
      recognitionRef.current = null;

      var transcript = '';
      if (e.results && e.results[0] && e.results[0][0]) {
        transcript = e.results[0][0].transcript.trim();
      }

      // 의미없는 짧은 소음("아", "어" 등 2글자 이하) → 재시작
      if (!transcript || transcript.length <= 1) {
        if (activeMode.current) {
          setTimeout(function () {
            startListening(activeMode.current);
          }, 300);
        }
        return;
      }

      sendMessageInternal(transcript, currentMode);
    };

    recognition.onerror = function (e) {
      if (handled) return;
      handled = true;
      setListening(false);
      recognitionRef.current = null;

      if (e.error === 'no-speech' || e.error === 'audio-capture') {
        // 무음 또는 캡처 실패 → 재시작
        if (activeMode.current) {
          setTimeout(function () {
            startListening(activeMode.current);
          }, 400);
        }
      } else if (e.error !== 'aborted') {
        setError('음성 오류: ' + e.error);
        if (activeMode.current) {
          setTimeout(function () {
            startListening(activeMode.current);
          }, 1000);
        }
      }
    };

    recognition.onend = function () {
      // handled 안 된 경우 안전망 (브라우저가 onresult 없이 onend 호출할 때)
      if (!handled) {
        handled = true;
        setListening(false);
        recognitionRef.current = null;
        if (activeMode.current) {
          setTimeout(function () {
            startListening(activeMode.current);
          }, 300);
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setListening(false);
      recognitionRef.current = null;
    }
  }

  function sendMessageInternal(text, currentMode) {
    if (!text || !text.trim()) return;
    // 중복 전송 방지
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    setError(null);
    var userMsg = { role: 'user', content: text.trim(), ts: Date.now() };

    // messages를 함수형 업데이트로 처리해서 최신값 보장
    setMessages(function (prev) {
      return prev.concat([userMsg]);
    });
    setLoading(true);

    var promise;
    if (useBackend) {
      promise = sendToBackend(text.trim(), userId, userRole);
    } else {
      if (!geminiApiKey) {
        setError('API 키가 설정되지 않았습니다.');
        setLoading(false);
        isSendingRef.current = false;
        if (activeMode.current)
          setTimeout(function () {
            startListening(activeMode.current);
          }, 400);
        return;
      }
      // 현재 messages ref 없이 최신 히스토리 사용
      promise = sendToGemini(geminiApiKey, SYSTEM_PROMPT, [], text.trim());
    }

    promise
      .then(function (answer) {
        // 단 한 번만 추가
        setMessages(function (prev) {
          return prev.concat([
            { role: 'assistant', content: answer, ts: Date.now() },
          ]);
        });
        setLoading(false);
        isSendingRef.current = false;

        if (currentMode === 'blind') {
          // 시각장애인 모드: TTS 자동 → 끝나면 재시작
          speakText(answer, 1.4, function () {
            if (activeMode.current === 'blind') {
              setTimeout(function () {
                startListening('blind');
              }, 400);
            }
          });
        } else if (currentMode === 'voice') {
          // 일반 음성: TTS 없이 바로 재시작
          setTimeout(function () {
            if (activeMode.current === 'voice') {
              startListening('voice');
            }
          }, 400);
        }
      })
      .catch(function (e) {
        setError(e && e.message ? e.message : '오류가 발생했습니다.');
        setLoading(false);
        isSendingRef.current = false;
        if (activeMode.current) {
          setTimeout(function () {
            startListening(activeMode.current);
          }, 1000);
        }
      });
  }

  var sendMessage = useCallback(
    function (text) {
      var trimmed = (text != null ? text : input).trim();
      if (!trimmed) return;
      setInput('');
      isSendingRef.current = false; // 텍스트 전송은 항상 허용
      sendMessageInternal(trimmed, null);
    },
    [input, geminiApiKey, useBackend, userId, userRole]
  );

  var speakMessage = useCallback(function (text) {
    speakText(text, 1.4);
  }, []);

  var setVoiceMode = useCallback(
    function (newMode) {
      if (mode === newMode) {
        setMode(null);
      } else {
        isSendingRef.current = false;
        setMode(newMode);
        setTimeout(function () {
          startListening(newMode);
        }, 200);
      }
    },
    [mode]
  );

  var exitMode = useCallback(function () {
    setMode(null);
  }, []);

  var clear = useCallback(
    function () {
      clearHistory(userId);
      setMessages([]);
      setError(null);
      setMode(null);
      window.speechSynthesis.cancel();
      isSendingRef.current = false;
    },
    [userId]
  );

  return {
    messages: messages,
    input: input,
    setInput: setInput,
    loading: loading,
    error: error,
    sendMessage: sendMessage,
    clear: clear,
    bottomRef: bottomRef,
    userRole: userRole,
    mode: mode,
    listening: listening,
    setVoiceMode: setVoiceMode,
    exitMode: exitMode,
    speakMessage: speakMessage,
  };
}
