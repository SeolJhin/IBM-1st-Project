import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { communityApi } from '../api/communityApi';
import { useAuth } from '../../user/hooks/useAuth';
import ReplyWrite from './ReplyWrite';
import styles from './BoardDetail.module.css';

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

function typeLabel(value) {
  const key = String(value ?? '').toUpperCase();
  if (key === 'FREE' || key === 'BOARD_FREE') return '자유';
  if (key === 'QUESTION' || key === 'BOARD_QUESTION') return '질문';
  if (key === 'REVIEW' || key === 'BOARD_REVIEW') return '후기';
  if (key === 'NOTICE' || key === 'BOARD_NOTICE') return '공지';
  return '일반';
}

function normalizeRole(user) {
  const raw =
    user?.userRole ??
    user?.role ??
    user?.userRl ??
    user?.user_role ??
    user?.authority ??
    user?.authorities?.[0];

  return String(raw ?? '')
    .toLowerCase()
    .replace('role_', '');
}

export default function BoardDetail() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingBoard, setEditingBoard] = useState(false);
  const [boardForm, setBoardForm] = useState({
    boardTitle: '',
    boardCtnt: '',
  });
  const [savingBoard, setSavingBoard] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);

  const [replies, setReplies] = useState([]);
  const [childrenByParent, setChildrenByParent] = useState({});
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState('');
  const [replyingParentId, setReplyingParentId] = useState(null);

  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  const myUserId = String(user?.userId ?? '');
  const role = normalizeRole(user);
  const isAdmin = role === 'admin';

  const canManageBoard = useMemo(() => {
    const owner = myUserId && board?.userId && String(board.userId) === myUserId;
    return Boolean(isAdmin || owner);
  }, [isAdmin, myUserId, board]);

  const canManageReply = useCallback(
    (reply) => {
      const owner = myUserId && reply?.userId && String(reply.userId) === myUserId;
      return Boolean(isAdmin || owner);
    },
    [isAdmin, myUserId]
  );

  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    const data = await communityApi.getBoard(boardId);
    setBoard(data);
    setBoardForm({
      boardTitle: data?.boardTitle ?? '',
      boardCtnt: data?.boardCtnt ?? '',
    });
  }, [boardId]);

  const loadReplies = useCallback(async () => {
    if (!boardId) return;
    setRepliesLoading(true);
    setRepliesError('');
    try {
      const root = await communityApi.getReplies(boardId);
      const parentReplies = Array.isArray(root) ? root : [];
      setReplies(parentReplies);

      const childrenEntries = await Promise.all(
        parentReplies.map(async (parent) => {
          try {
            const children = await communityApi.getChildReplies(boardId, parent.replyId);
            return [parent.replyId, Array.isArray(children) ? children : []];
          } catch {
            return [parent.replyId, []];
          }
        })
      );
      setChildrenByParent(Object.fromEntries(childrenEntries));
    } catch (e) {
      setReplies([]);
      setChildrenByParent({});
      setRepliesError(e?.message || '댓글을 불러오지 못했습니다.');
    } finally {
      setRepliesLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!boardId) {
      setLoading(false);
      setError('게시글 번호가 올바르지 않습니다.');
      return;
    }

    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadBoard(), loadReplies()]);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || '게시글을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [boardId, loadBoard, loadReplies]);

  const startBoardEdit = () => {
    setBoardForm({
      boardTitle: board?.boardTitle ?? '',
      boardCtnt: board?.boardCtnt ?? '',
    });
    setEditingBoard(true);
  };

  const cancelBoardEdit = () => {
    setEditingBoard(false);
    setBoardForm({
      boardTitle: board?.boardTitle ?? '',
      boardCtnt: board?.boardCtnt ?? '',
    });
  };

  const saveBoard = async () => {
    const title = boardForm.boardTitle.trim();
    const content = boardForm.boardCtnt.trim();
    if (!title) return window.alert('제목을 입력해주세요.');
    if (!content) return window.alert('내용을 입력해주세요.');

    setSavingBoard(true);
    try {
      await communityApi.updateBoard(boardId, {
        boardTitle: title,
        boardCtnt: content,
        code: board?.code,
      });
      setBoard((prev) => ({
        ...prev,
        boardTitle: title,
        boardCtnt: content,
      }));
      setEditingBoard(false);
      window.alert('게시글이 수정되었습니다.');
    } catch (e) {
      window.alert(e?.message || '게시글 수정에 실패했습니다.');
    } finally {
      setSavingBoard(false);
    }
  };

  const deleteBoard = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;
    setDeletingBoard(true);
    try {
      await communityApi.deleteBoard(boardId);
      window.alert('게시글이 삭제되었습니다.');
      navigate('/community');
    } catch (e) {
      window.alert(e?.message || '게시글 삭제에 실패했습니다.');
    } finally {
      setDeletingBoard(false);
    }
  };

  const startReplyEdit = (reply) => {
    setReplyError('');
    setEditingReplyId(reply.replyId);
    setEditingReplyText(reply.replyCtnt ?? '');
  };

  const cancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditingReplyText('');
    setReplyError('');
  };

  const saveReplyEdit = async (replyId) => {
    const value = editingReplyText.trim();
    if (!value) {
      setReplyError('댓글 내용을 입력해주세요.');
      return;
    }

    setSavingReply(true);
    try {
      await communityApi.updateReply(replyId, { replyCtnt: value });
      cancelReplyEdit();
      await loadReplies();
    } catch (e) {
      setReplyError(e?.message || '댓글 수정에 실패했습니다.');
    } finally {
      setSavingReply(false);
    }
  };

  const removeReply = async (replyId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await communityApi.deleteReply(replyId);
      await loadReplies();
    } catch (e) {
      window.alert(e?.message || '댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/community')}>
          목록으로
        </button>

        {loading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <>
            <article className={styles.card}>
              {editingBoard ? (
                <div className={styles.boardEditWrap}>
                  <label className={styles.label}>제목</label>
                  <input
                    className={styles.input}
                    value={boardForm.boardTitle}
                    onChange={(e) =>
                      setBoardForm((prev) => ({ ...prev, boardTitle: e.target.value }))
                    }
                    disabled={savingBoard}
                    maxLength={200}
                  />
                  <label className={styles.label}>내용</label>
                  <textarea
                    className={styles.textarea}
                    value={boardForm.boardCtnt}
                    onChange={(e) =>
                      setBoardForm((prev) => ({ ...prev, boardCtnt: e.target.value }))
                    }
                    disabled={savingBoard}
                  />
                </div>
              ) : (
                <>
                  <h1 className={styles.title}>{board?.boardTitle || '(제목 없음)'}</h1>
                  <div className={styles.meta}>
                    분류 {typeLabel(board?.code)} | 작성자 {board?.userId || '-'} | 작성일{' '}
                    {formatDateTime(board?.createdAt)} | 조회수 {board?.readCount ?? 0} | 좋아요{' '}
                    {board?.likeCount ?? 0}
                  </div>
                  <div className={styles.content}>{board?.boardCtnt || '(내용 없음)'}</div>
                </>
              )}

              {canManageBoard && (
                <div className={styles.actions}>
                  {editingBoard ? (
                    <>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={saveBoard}
                        disabled={savingBoard}
                      >
                        {savingBoard ? '저장 중...' : '저장'}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={cancelBoardEdit}
                        disabled={savingBoard}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className={styles.primaryBtn} onClick={startBoardEdit}>
                        수정
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={deleteBoard}
                        disabled={deletingBoard}
                      >
                        {deletingBoard ? '삭제 중...' : '삭제'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>

            <section className={styles.replySection}>
              <div className={styles.replyHead}>
                <div className={styles.replyTitle}>댓글</div>
                <div className={styles.replyCount}>{replies.length}개</div>
              </div>

              <div style={{ marginTop: 12 }}>
                {myUserId ? (
                  <ReplyWrite boardId={Number(boardId)} onCreated={loadReplies} />
                ) : (
                  <div className={styles.empty}>로그인 후 댓글을 작성할 수 있습니다.</div>
                )}
              </div>

              {repliesError ? <div className={styles.error}>{repliesError}</div> : null}

              <div className={styles.replyList}>
                {repliesLoading ? (
                  <div className={styles.loading}>댓글을 불러오는 중...</div>
                ) : replies.length === 0 ? (
                  <div className={styles.empty}>댓글이 없습니다.</div>
                ) : (
                  replies.map((parent) => {
                    const children = childrenByParent[parent.replyId] ?? [];
                    const isParentEditing = editingReplyId === parent.replyId;

                    return (
                      <div key={parent.replyId} className={styles.replyItem}>
                        <div className={styles.replyTop}>
                          <div>
                            <div className={styles.replyAuthor}>{parent.userId}</div>
                            <div className={styles.replyMeta}>{formatDateTime(parent.createdAt)}</div>
                          </div>

                          <div className={styles.replyActionRow}>
                            {canManageReply(parent) && (
                              <>
                                {isParentEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.textBtn}
                                      onClick={() => saveReplyEdit(parent.replyId)}
                                      disabled={savingReply}
                                    >
                                      {savingReply ? '저장중' : '저장'}
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.textBtn}
                                      onClick={cancelReplyEdit}
                                      disabled={savingReply}
                                    >
                                      취소
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.textBtn}
                                      onClick={() => startReplyEdit(parent)}
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.textDangerBtn}
                                      onClick={() => removeReply(parent.replyId)}
                                    >
                                      삭제
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            <button
                              type="button"
                              className={styles.textBtn}
                              onClick={() =>
                                setReplyingParentId((prev) =>
                                  prev === parent.replyId ? null : parent.replyId
                                )
                              }
                            >
                              {replyingParentId === parent.replyId ? '답글 닫기' : '답글'}
                            </button>
                          </div>
                        </div>

                        {isParentEditing ? (
                          <>
                            <textarea
                              className={styles.editArea}
                              value={editingReplyText}
                              onChange={(e) => setEditingReplyText(e.target.value)}
                              disabled={savingReply}
                            />
                            {replyError ? <div className={styles.error}>{replyError}</div> : null}
                          </>
                        ) : (
                          <div className={styles.replyBody}>{parent.replyCtnt}</div>
                        )}

                        {replyingParentId === parent.replyId && (
                          <div style={{ marginTop: 10 }}>
                            <ReplyWrite
                              boardId={Number(boardId)}
                              parentId={parent.replyId}
                              onCreated={async () => {
                                await loadReplies();
                                setReplyingParentId(null);
                              }}
                              onCancel={() => setReplyingParentId(null)}
                              autoFocus
                            />
                          </div>
                        )}

                        {children.map((child) => {
                          const isChildEditing = editingReplyId === child.replyId;
                          return (
                            <div key={child.replyId} className={styles.replyItemChild}>
                              <div className={styles.replyTop}>
                                <div>
                                  <div className={styles.replyAuthor}>{child.userId}</div>
                                  <div className={styles.replyMeta}>
                                    {formatDateTime(child.createdAt)}
                                  </div>
                                </div>
                                {canManageReply(child) && (
                                  <div className={styles.replyActionRow}>
                                    {isChildEditing ? (
                                      <>
                                        <button
                                          type="button"
                                          className={styles.textBtn}
                                          onClick={() => saveReplyEdit(child.replyId)}
                                          disabled={savingReply}
                                        >
                                          {savingReply ? '저장중' : '저장'}
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.textBtn}
                                          onClick={cancelReplyEdit}
                                          disabled={savingReply}
                                        >
                                          취소
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className={styles.textBtn}
                                          onClick={() => startReplyEdit(child)}
                                        >
                                          수정
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.textDangerBtn}
                                          onClick={() => removeReply(child.replyId)}
                                        >
                                          삭제
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>

                              {isChildEditing ? (
                                <>
                                  <textarea
                                    className={styles.editArea}
                                    value={editingReplyText}
                                    onChange={(e) => setEditingReplyText(e.target.value)}
                                    disabled={savingReply}
                                  />
                                  {replyError ? <div className={styles.error}>{replyError}</div> : null}
                                </>
                              ) : (
                                <div className={styles.replyBody}>{child.replyCtnt}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
