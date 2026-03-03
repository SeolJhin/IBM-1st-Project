import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { communityApi } from '../api/communityApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './BoardDetail.module.css';

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function typeLabel(code) {
  const k = String(code ?? '').toUpperCase();
  if (k.includes('FREE')) return '자유';
  if (k.includes('QUESTION')) return '질문';
  if (k.includes('REVIEW')) return '후기';
  if (k.includes('NOTICE')) return '공지';
  return code ?? '';
}

/* ── 익명 번호 매핑 ──────────────────────────────────────────
 * boardRealAuthorId : 게시글 실제 작성자 userId
 * allReplies        : 루트 + 대댓글 전체 flat 배열
 * 반환: { userId → 표시명 }
 *   게시글 작성자      → "익명(글쓴이)"
 *   그 외 댓글 작성자  → 등장 순서로 "익명1", "익명2" ...
 */
function buildAnonMap(boardRealAuthorId, allReplies) {
  const map = {};
  if (boardRealAuthorId) map[boardRealAuthorId] = '익명(글쓴이)';
  let counter = 1;
  for (const r of allReplies) {
    const uid = r.userId;
    if (!uid || map[uid]) continue;
    map[uid] = `익명${counter++}`;
  }
  return map;
}

function displayName(userId, anonymity, anonMap) {
  if (String(anonymity ?? 'N').toUpperCase() === 'Y') {
    return anonMap[userId] ?? '익명';
  }
  return userId;
}

/* ── 대댓글 작성 박스 ───────────────────────────────────── */
function ChildWriteBox({ boardId, parentId, onCreated, onCancel }) {
  const [text, setText] = useState('');
  const [anon, setAnon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    const v = text.trim();
    if (!v) {
      setErr('내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await communityApi.createChildReply(boardId, parentId, {
        replyCtnt: v,
        anonymity: anon ? 'Y' : 'N',
      });
      setText('');
      onCreated?.();
    } catch (e) {
      setErr(e?.message || '등록 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.childWriteBox}>
      <textarea
        className={styles.replyTextarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="답글을 입력하세요"
        rows={3}
        disabled={saving}
        autoFocus
      />
      {err && <div className={styles.replyErr}>{err}</div>}
      <div className={styles.replyWriteFooter}>
        <label className={styles.anonLabel}>
          <input
            type="checkbox"
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            disabled={saving}
          />
          익명
        </label>
        <div className={styles.editBtns} style={{ margin: 0 }}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => {
              setText('');
              setErr('');
              onCancel?.();
            }}
            disabled={saving}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={submit}
            disabled={saving || !text.trim()}
          >
            {saving ? '등록 중…' : '답글 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 댓글 아이템 ────────────────────────────────────────── */
function ReplyItem({
  reply: initialReply,
  boardId,
  myUserId,
  anonMap,
  onRefresh,
  isChild = false,
}) {
  const [reply, setReply] = useState(initialReply);
  const [showChildWrite, setShowChildWrite] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(initialReply.replyCtnt ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [children, setChildren] = useState([]);
  const [childLoading, setChildLoading] = useState(false);

  const isMine = myUserId && String(reply.userId) === String(myUserId);
  const authorName = displayName(reply.userId, reply.anonymity, anonMap);
  const isAuthorStyle = authorName === '익명(글쓴이)';

  useEffect(() => {
    if (isChild) return;
    loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply.replyId]);

  const loadChildren = useCallback(async () => {
    setChildLoading(true);
    try {
      const data = await communityApi.getChildReplies(boardId, reply.replyId);
      setChildren(Array.isArray(data) ? data : []);
    } catch {
      setChildren([]);
    } finally {
      setChildLoading(false);
    }
  }, [boardId, reply.replyId]);

  const handleChildCreated = async () => {
    setShowChildWrite(false);
    await loadChildren();
    onRefresh?.();
  };

  const handleLike = async () => {
    try {
      if (reply.likedByMe) await communityApi.unlikeReply(reply.replyId);
      else await communityApi.likeReply(reply.replyId);
      setReply((prev) => ({
        ...prev,
        likedByMe: !prev.likedByMe,
        likeCount: (prev.likeCount ?? 0) + (prev.likedByMe ? -1 : 1),
      }));
    } catch (e) {
      console.warn('reply like error:', e?.message);
    }
  };

  const saveEdit = async () => {
    const v = editText.trim();
    if (!v) {
      setErr('내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await communityApi.updateReply(reply.replyId, { replyCtnt: v });
      setReply((prev) => ({ ...prev, replyCtnt: v }));
      setEditing(false);
    } catch (e) {
      setErr(e?.message || '수정 실패');
    } finally {
      setSaving(false);
    }
  };

  const deleteReply = async () => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    try {
      await communityApi.deleteReply(reply.replyId);
      onRefresh?.();
    } catch (e) {
      window.alert(e?.message || '삭제 실패');
    }
  };

  return (
    <div className={`${styles.replyItem} ${isChild ? styles.childReply : ''}`}>
      {isChild && <span className={styles.childArrow}>↳</span>}

      <div className={styles.replyHeader}>
        <div className={styles.replyMeta}>
          <span
            className={`${styles.replyAuthor} ${isAuthorStyle ? styles.replyAuthorOwner : ''}`}
          >
            {authorName}
          </span>
          <span className={styles.replyDate}>
            {formatDateTime(reply.createdAt)}
          </span>
        </div>
        <div className={styles.replyActions}>
          <button
            type="button"
            className={`${styles.replyLikeBtn} ${reply.likedByMe ? styles.replyLikeBtnActive : ''}`}
            onClick={handleLike}
          >
            {reply.likedByMe ? '❤️' : '🤍'} {reply.likeCount ?? 0}
          </button>
          {!isChild && (
            <button
              type="button"
              className={styles.replyMetaBtn}
              onClick={() => setShowChildWrite((v) => !v)}
            >
              💬 답글
            </button>
          )}
          {isMine && !editing && (
            <>
              <button
                type="button"
                className={styles.replyMetaBtn}
                onClick={() => {
                  setEditing(true);
                  setEditText(reply.replyCtnt ?? '');
                }}
              >
                수정
              </button>
              <button
                type="button"
                className={`${styles.replyMetaBtn} ${styles.deleteBtn}`}
                onClick={deleteReply}
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className={styles.editArea}>
          <textarea
            className={styles.replyTextarea}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            disabled={saving}
          />
          {err && <div className={styles.replyErr}>{err}</div>}
          <div className={styles.editBtns}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setEditing(false);
                setErr('');
              }}
              disabled={saving}
            >
              취소
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={saveEdit}
              disabled={saving}
            >
              {saving ? '저장중…' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.replyContent}>{reply.replyCtnt}</div>
      )}

      {!isChild && showChildWrite && (
        <ChildWriteBox
          boardId={boardId}
          parentId={reply.replyId}
          onCreated={handleChildCreated}
          onCancel={() => setShowChildWrite(false)}
        />
      )}

      {!isChild && (
        <>
          {childLoading && (
            <div className={styles.childLoading}>답글 불러오는 중…</div>
          )}
          {children.length > 0 && (
            <div className={styles.childrenList}>
              {children.map((child) => (
                <ReplyItem
                  key={child.replyId}
                  reply={child}
                  boardId={boardId}
                  myUserId={myUserId}
                  anonMap={anonMap}
                  onRefresh={async () => {
                    await loadChildren();
                    onRefresh?.();
                  }}
                  isChild
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function BoardDetail() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replies, setReplies] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [replyAnon, setReplyAnon] = useState(false);
  const [replySaving, setReplySaving] = useState(false);
  const [replyErr, setReplyErr] = useState('');

  // 게시글 수정 상태
  const [boardEditing, setBoardEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [boardSaving, setBoardSaving] = useState(false);
  const [boardEditErr, setBoardEditErr] = useState('');

  const isLoggedIn = !!user;
  const myUserId = user?.userId ?? '';

  // board.userId는 익명이면 "익명"으로 마스킹됨 → realAuthorId는 별도 보존
  const [realAuthorId, setRealAuthorId] = useState('');
  const isBoardMine = !!myUserId && !!realAuthorId && myUserId === realAuthorId;

  // 익명 번호 맵: 루트 댓글 기준으로 계산
  const anonMap = buildAnonMap(realAuthorId, replies);

  const fetchCount = useRef(0);

  const loadReplies = useCallback(async () => {
    if (!boardId) return;
    try {
      const data = await communityApi.getReplies(boardId);
      setReplies(Array.isArray(data) ? data : []);
    } catch {
      setReplies([]);
    }
  }, [boardId]);

  useEffect(() => {
    if (!boardId) {
      setLoading(false);
      setError('잘못된 게시글 번호입니다.');
      return;
    }

    fetchCount.current += 1;
    const thisCount = fetchCount.current;

    setLoading(true);
    setError('');

    communityApi
      .getBoard(boardId)
      .then((data) => {
        if (fetchCount.current !== thisCount) return;
        setBoard(data);
        setLiked(data?.likedByMe ?? false);
        setLikeCount(data?.likeCount ?? 0);
        // 익명 게시글이면 userId가 "익명"으로 오므로 myUserId와 비교 불가
        // → anonymity='N'이면 userId 그대로, 'Y'이면 본인 여부는 myUserId 기반으로 처리
        // 백엔드가 realUserId를 안 내려주므로 일단 anonymity 체크
        setRealAuthorId(data?.realUserId ?? data?.userId ?? '');
        return loadReplies();
      })
      .catch((e) => {
        if (fetchCount.current !== thisCount) return;
        setError(e?.message || '게시글을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (fetchCount.current !== thisCount) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  /* 게시글 작성자 본인 여부: 비익명이면 userId 비교, 익명이면 수정/삭제 버튼 숨김
     (익명 게시글 수정은 백엔드에서 JWT로 검증하므로 시도는 가능하나
      프론트에서는 비익명인 경우에만 버튼 표시) */
  const showBoardActions = isBoardMine && board?.anonymity !== 'Y';

  const startBoardEdit = () => {
    setEditTitle(board?.boardTitle ?? '');
    setEditContent(board?.boardCtnt ?? '');
    setBoardEditErr('');
    setBoardEditing(true);
  };

  const saveBoardEdit = async () => {
    if (!editTitle.trim()) {
      setBoardEditErr('제목을 입력해 주세요.');
      return;
    }
    setBoardSaving(true);
    setBoardEditErr('');
    try {
      await communityApi.updateBoard(boardId, {
        boardTitle: editTitle.trim(),
        boardCtnt: editContent,
      });
      setBoard((prev) => ({
        ...prev,
        boardTitle: editTitle.trim(),
        boardCtnt: editContent,
      }));
      setBoardEditing(false);
    } catch (e) {
      setBoardEditErr(e?.message || '수정 실패');
    } finally {
      setBoardSaving(false);
    }
  };

  const deleteBoard = async () => {
    if (!window.confirm('게시글을 삭제할까요?')) return;
    try {
      await communityApi.deleteBoard(boardId);
      navigate('/community');
    } catch (e) {
      window.alert(e?.message || '삭제 실패');
    }
  };

  const handleBoardLike = async () => {
    if (!isLoggedIn) return;
    try {
      if (liked) await communityApi.unlikeBoard(boardId);
      else await communityApi.likeBoard(boardId);
      setLiked((v) => !v);
      setLikeCount((c) => c + (liked ? -1 : 1));
    } catch (e) {
      console.warn('board like error:', e?.message);
    }
  };

  const submitReply = async () => {
    const v = replyText.trim();
    if (!v) {
      setReplyErr('내용을 입력해 주세요.');
      return;
    }
    setReplySaving(true);
    setReplyErr('');
    try {
      await communityApi.createReply(Number(boardId), {
        replyCtnt: v,
        anonymity: replyAnon ? 'Y' : 'N',
      });
      setReplyText('');
      setReplyAnon(false);
      await loadReplies();
    } catch (e) {
      setReplyErr(e?.message || '댓글 등록 실패');
    } finally {
      setReplySaving(false);
    }
  };

  /* 게시글 작성자 표시 */
  const boardAuthorLabel =
    board?.anonymity === 'Y' ? '익명(글쓴이)' : (board?.userId ?? '');

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/community')}
        >
          ← 목록으로
        </button>

        {loading ? (
          <div className={styles.state}>불러오는 중…</div>
        ) : error ? (
          <div className={styles.errorBox}>⚠️ {error}</div>
        ) : (
          <>
            {/* ── 게시글 ── */}
            <article className={styles.article}>
              <div className={styles.articleMeta}>
                <span className={styles.articleType}>
                  {typeLabel(board?.code)}
                </span>
                <h1 className={styles.articleTitle}>{board?.boardTitle}</h1>
                <div className={styles.articleInfo}>
                  <span className={styles.infoItem}>
                    ✍{' '}
                    <span
                      className={
                        board?.anonymity === 'Y' ? styles.anonAuthor : ''
                      }
                    >
                      {boardAuthorLabel}
                    </span>
                  </span>
                  <span className={styles.infoItem}>
                    🕐 {formatDateTime(board?.createdAt)}
                  </span>
                  <span className={styles.infoItem}>
                    👁 {board?.readCount ?? 0}
                  </span>
                  {showBoardActions && !boardEditing && (
                    <div className={styles.boardActions}>
                      <button
                        type="button"
                        className={styles.boardEditBtn}
                        onClick={startBoardEdit}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className={`${styles.boardEditBtn} ${styles.boardDeleteBtn}`}
                        onClick={deleteBoard}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {boardEditing ? (
                <div className={styles.boardEditForm}>
                  <input
                    className={styles.boardEditTitle}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    disabled={boardSaving}
                  />
                  <textarea
                    className={styles.boardEditContent}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={10}
                    disabled={boardSaving}
                  />
                  {boardEditErr && (
                    <div className={styles.replyErr}>{boardEditErr}</div>
                  )}
                  <div className={styles.editBtns}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => {
                        setBoardEditing(false);
                        setBoardEditErr('');
                      }}
                      disabled={boardSaving}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={saveBoardEdit}
                      disabled={boardSaving}
                    >
                      {boardSaving ? '저장 중…' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.articleBody}
                  dangerouslySetInnerHTML={{ __html: board?.boardCtnt ?? '' }}
                />
              )}

              {/* 첨부 파일 */}
              {board?.files && board.files.length > 0 && (
                <div className={styles.fileList}>
                  <div className={styles.fileListTitle}>📎 첨부 파일</div>
                  {board.files.map((f) => {
                    const isImage =
                      String(f.fileType ?? '').toLowerCase() === 'image' ||
                      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(
                        f.originFilename ?? f.renameFilename ?? ''
                      );
                    return (
                      <div key={f.fileId} className={styles.fileItem}>
                        {isImage ? (
                          <img
                            src={`/api${f.viewUrl}`}
                            alt={f.originFilename || 'image'}
                            className={styles.attachedImage}
                          />
                        ) : (
                          <a
                            href={`/api${f.downloadUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.fileLink}
                          >
                            📄 {f.originFilename || f.renameFilename || '파일'}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.articleFooter}>
                <button
                  type="button"
                  className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
                  onClick={handleBoardLike}
                >
                  {liked ? '❤️' : '🤍'} 좋아요 {likeCount}
                </button>
              </div>
            </article>

            {/* ── 댓글 ── */}
            <section className={styles.replySection}>
              <div className={styles.replySectionTitle}>
                댓글 <span className={styles.replyCount}>{replies.length}</span>
              </div>

              {isLoggedIn ? (
                <div className={styles.replyWriteBox}>
                  <textarea
                    className={styles.replyTextarea}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="댓글을 입력하세요"
                    rows={3}
                    disabled={replySaving}
                  />
                  {replyErr && (
                    <div className={styles.replyErr}>{replyErr}</div>
                  )}
                  <div className={styles.replyWriteFooter}>
                    <label className={styles.anonLabel}>
                      <input
                        type="checkbox"
                        checked={replyAnon}
                        onChange={(e) => setReplyAnon(e.target.checked)}
                        disabled={replySaving}
                      />
                      익명
                    </label>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <span className={styles.replyCounter}>
                        {replyText.length}/2000
                      </span>
                      <button
                        type="button"
                        className={styles.replySubmitBtn}
                        onClick={submitReply}
                        disabled={replySaving || !replyText.trim()}
                      >
                        {replySaving ? '등록 중…' : '댓글 등록'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.loginNotice}>
                  💬 댓글을 작성하려면 로그인해 주세요.
                </div>
              )}

              {replies.length === 0 ? (
                <div className={styles.noReply}>첫 댓글을 남겨보세요!</div>
              ) : (
                <div className={styles.replyList}>
                  {replies.map((r) => (
                    <ReplyItem
                      key={r.replyId}
                      reply={r}
                      boardId={Number(boardId)}
                      myUserId={myUserId}
                      anonMap={anonMap}
                      onRefresh={loadReplies}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
