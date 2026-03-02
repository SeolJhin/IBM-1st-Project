import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { communityApi } from '../api/communityApi';
import { authApi } from '../../../app/http/authApi'; // ✅ 추가
import ReplyWrite from './ReplyWrite';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function BoardDetail() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState('');

  // ✅ 내 userId 상태
  const [myUserId, setMyUserId] = useState('');

  // 수정 모드
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // -------------------------------
  // ✅ 로그인 유저 정보 가져오기
  // -------------------------------
  useEffect(() => {
    let canceled = false;

    async function loadMe() {
      try {
        const me = await authApi.me();
        if (!canceled && me?.userId) {
          setMyUserId(me.userId);
        }
      } catch {
        // 비로그인 상태면 그냥 무시
        if (!canceled) setMyUserId('');
      }
    }

    loadMe();
    return () => {
      canceled = true;
    };
  }, []);

  // -------------------------------
  // 댓글 로드
  // -------------------------------
  const loadReplies = useCallback(async () => {
    if (!boardId) return;
    setRepliesLoading(true);
    setRepliesError('');
    try {
      const data = await communityApi.getReplies(boardId);
      setReplies(Array.isArray(data) ? data : []);
    } catch (e) {
      setRepliesError(e?.message || '댓글을 불러오지 못했습니다.');
      setReplies([]);
    } finally {
      setRepliesLoading(false);
    }
  }, [boardId]);

  // -------------------------------
  // 게시글 + 댓글 동시 로드
  // -------------------------------
  useEffect(() => {
    if (!boardId) {
      setLoading(false);
      setError('게시글 번호가 올바르지 않습니다.');
      return;
    }

    let canceled = false;

    async function loadAll() {
      setLoading(true);
      setError('');
      try {
        const data = await communityApi.getBoard(boardId);
        if (!canceled) setBoard(data);
      } catch (e) {
        if (!canceled) {
          setError(e?.message || '게시글을 불러오지 못했습니다.');
          setBoard(null);
        }
      } finally {
        if (!canceled) setLoading(false);
      }

      if (!canceled) await loadReplies();
    }

    loadAll();

    return () => {
      canceled = true;
    };
  }, [boardId, loadReplies]);

  // -------------------------------
  // 내 댓글 여부
  // -------------------------------
  const isMine = (reply) =>
    myUserId && String(reply?.userId) === String(myUserId);

  // -------------------------------
  // 수정 시작
  // -------------------------------
  const startEdit = (reply) => {
    setEditError('');
    setEditingId(reply.replyId);
    setEditingText(reply.replyCtnt ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditError('');
  };

  const saveEdit = async (replyId) => {
    const value = editingText.trim();
    if (!value) {
      setEditError('내용을 입력해 주세요.');
      return;
    }

    setSavingEdit(true);
    try {
      await communityApi.updateReply(replyId, { replyCtnt: value });
      cancelEdit();
      await loadReplies();
    } catch (e) {
      setEditError(e?.message || '수정 실패');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteReply = async (replyId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    try {
      await communityApi.deleteReply(replyId);
      await loadReplies();
    } catch (e) {
      window.alert(e?.message || '삭제 실패');
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      <main
        style={{ maxWidth: 980, margin: '0 auto', padding: '24px 20px 48px' }}
      >
        <button
          type="button"
          onClick={() => navigate('/community')}
          style={{
            height: 36,
            padding: '0 14px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          ← 목록으로
        </button>

        {loading ? (
          <div style={{ color: '#6b7280' }}>불러오는 중...</div>
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>⚠️ {error}</div>
        ) : (
          <>
            {/* 게시글 */}
            <article
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <h1 style={{ margin: 0 }}>{board?.boardTitle}</h1>
              <div style={{ marginTop: 10, color: '#6b7280', fontSize: 14 }}>
                작성자: {board?.userId} | 작성일:{' '}
                {formatDateTime(board?.createdAt)}
              </div>
              <div style={{ marginTop: 20, whiteSpace: 'pre-wrap' }}>
                {board?.boardCtnt}
              </div>
            </article>

            {/* 댓글 영역 */}
            <section
              style={{
                marginTop: 16,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 900 }}>댓글 {replies.length}개</div>

              <div style={{ marginTop: 12 }}>
                <ReplyWrite boardId={Number(boardId)} onCreated={loadReplies} />
              </div>

              <div style={{ marginTop: 14 }}>
                {replies.map((r) => {
                  const editing = editingId === r.replyId;
                  return (
                    <div
                      key={r.replyId}
                      style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>{r.userId}</div>

                        {isMine(r) && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {editing ? (
                              <>
                                <button onClick={() => saveEdit(r.replyId)}>
                                  저장
                                </button>
                                <button onClick={cancelEdit}>취소</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(r)}>
                                  수정
                                </button>
                                <button onClick={() => deleteReply(r.replyId)}>
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {editing ? (
                        <>
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={3}
                            style={{ width: '100%', marginTop: 8 }}
                          />
                          {editError && (
                            <div style={{ color: 'red', fontSize: 12 }}>
                              {editError}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ marginTop: 6 }}>{r.replyCtnt}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
