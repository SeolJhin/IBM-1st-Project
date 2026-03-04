import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { communityApi } from '../api/communityApi';
import { adminApi } from '../../admin/api/adminApi';
import { useAuth } from '../../user/hooks/useAuth';
import UserStatusModal from '../../user/components/UserStatusModal';
import styles from './BoardDetail.module.css';

const READ_COUNT_DEDUPE_MS = 1500;

function shouldIncreaseBoardReadCount(boardId) {
  if (!boardId) return false;

  const key = `community-board-read:${boardId}`;
  const now = Date.now();

  try {
    const prev = Number(sessionStorage.getItem(key) || 0);
    if (now - prev < READ_COUNT_DEDUPE_MS) return false;
    sessionStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
}

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
 * 백엔드 ReplyResponse:
 *   userId     = 비익명이면 닉네임, 익명이면 null
 *   realUserId = 항상 실제 userId (본인 여부 판단용)
 */
function buildAnonMap(boardRealAuthorId, allReplies) {
  const map = {};
  // 게시글 작성자: 익명 댓글 작성 시 '익명(글쓴이)'로 표시
  if (boardRealAuthorId) map[boardRealAuthorId] = '익명(글쓴이)';
  let counter = 1;
  for (const r of allReplies) {
    // 익명 댓글만 번호 부여
    const isAnon = String(r?.anonymity ?? 'N').toUpperCase() === 'Y';
    if (!isAnon) continue;
    const uid = r.realUserId ?? r.userId;
    if (!uid || map[uid]) continue;
    map[uid] = `익명${counter++}`;
  }
  return map;
}

function displayName(item, anonMap, { isAdmin = false } = {}) {
  const isAnon = String(item?.anonymity ?? 'N').toUpperCase() === 'Y';
  // 비익명: 백엔드가 userId 필드에 닉네임을 담아서 내려줌
  if (!isAnon) return item?.userId ?? '-';
  // 익명 + 관리자: 닉네임(userId) 그대로 표시, 없으면 realUserId
  if (isAdmin) return item?.userId ?? item?.realUserId ?? '익명';
  // 익명 + 일반: anonMap으로 번호 매핑
  const realId = item?.realUserId;
  return anonMap[realId] ?? '익명';
}

/* ── 대댓글 작성 박스 ───────────────────────────────────── */
function ChildWriteBox({ boardId, parentId, onCreated, onCancel, disabled }) {
  const [text, setText] = useState('');
  const [anon, setAnon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (disabled) {
      setErr('정지(banned) 상태의 계정은 커뮤니티 글을 작성할 수 없습니다.');
      return;
    }
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
        disabled={saving || disabled}
        autoFocus
      />
      {err && <div className={styles.replyErr}>{err}</div>}
      <div className={styles.replyWriteFooter}>
        <label className={styles.anonLabel}>
          <input
            type="checkbox"
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            disabled={saving || disabled}
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
            disabled={saving || disabled || !text.trim()}
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
  isAdmin = false,
  disabledWrite = false,
  onAdminUserClick,
}) {
  const [reply, setReply] = useState(initialReply);
  const [showChildWrite, setShowChildWrite] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(initialReply.replyCtnt ?? '');
  const [editAnon, setEditAnon] = useState(
    String(initialReply.anonymity ?? 'N').toUpperCase() === 'Y'
  );

  // props(initialReply)가 바뀌면(부모 loadReplies 후) 내부 state 동기화
  useEffect(() => {
    setReply(initialReply);
    if (!editing) {
      setEditText(initialReply.replyCtnt ?? '');
      setEditAnon(String(initialReply.anonymity ?? 'N').toUpperCase() === 'Y');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReply.replyId, initialReply.anonymity, initialReply.replyCtnt]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [children, setChildren] = useState([]);
  const [childLoading, setChildLoading] = useState(false);

  // 본인 여부: realUserId 기준 (익명 댓글도 수정/삭제 가능해야 함)
  const isMine =
    myUserId && String(reply.realUserId ?? reply.userId) === String(myUserId);
  const authorName = displayName(reply, anonMap, { isAdmin });
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
      await communityApi.updateReply(reply.replyId, {
        replyCtnt: v,
        anonymity: editAnon ? 'Y' : 'N',
      });
      await onRefresh(); // 댓글 목록 전체 재로드 → anonMap 재계산
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

  const adminDeleteReply = async () => {
    if (!window.confirm('관리자 권한으로 이 댓글을 삭제할까요?')) return;
    try {
      await adminApi.adminDeleteReply(reply.replyId);
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
          {isAdmin && (reply?.realUserId || reply?.userId) ? (
            <button
              type="button"
              className={`${styles.replyAuthor} ${isAuthorStyle ? styles.replyAuthorOwner : ''}`}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
              }}
              onClick={() =>
                onAdminUserClick?.(reply.realUserId ?? reply.userId)
              }
              title="회원 정보/상태 변경"
            >
              {authorName}
            </button>
          ) : (
            <span
              className={`${styles.replyAuthor} ${isAuthorStyle ? styles.replyAuthorOwner : ''}`}
            >
              {authorName}
            </span>
          )}
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
              disabled={disabledWrite}
              title={
                disabledWrite
                  ? '정지(banned) 상태의 계정은 커뮤니티 글을 작성할 수 없습니다.'
                  : ''
              }
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
                  setEditAnon(
                    String(reply.anonymity ?? 'N').toUpperCase() === 'Y'
                  );
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
          {isAdmin && !editing && (
            <button
              type="button"
              className={`${styles.replyMetaBtn} ${styles.deleteBtn}`}
              onClick={adminDeleteReply}
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 12,
              }}
            >
              🗑 삭제
            </button>
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
            <label className={styles.anonLabel} style={{ marginRight: 'auto' }}>
              <input
                type="checkbox"
                checked={editAnon}
                onChange={(e) => setEditAnon(e.target.checked)}
                disabled={saving}
              />
              익명
            </label>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setEditing(false);
                setErr('');
                setEditAnon(
                  String(reply.anonymity ?? 'N').toUpperCase() === 'Y'
                );
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
          disabled={disabledWrite}
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
                  isAdmin={isAdmin}
                  disabledWrite={disabledWrite}
                  onAdminUserClick={onAdminUserClick}
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tab = String(
    new URLSearchParams(location.search).get('tab') ?? ''
  ).toUpperCase();
  const communityListUrl =
    tab === 'FREE' || tab === 'QUESTION' || tab === 'REVIEW'
      ? `/community?tab=${tab}`
      : '/community';

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
  const [editBoardAnon, setEditBoardAnon] = useState(false);
  const [boardSaving, setBoardSaving] = useState(false);
  const [boardEditErr, setBoardEditErr] = useState('');

  const isLoggedIn = !!user;
  const myUserId = user?.userId ?? '';

  const userRole = String(user?.userRole ?? '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isBanned = String(user?.userSt ?? '').toLowerCase() === 'banned';

  const [userStatusModalId, setUserStatusModalId] = useState(null);

  // board.userId는 익명이면 "익명"으로 마스킹됨 → realAuthorId는 별도 보존
  const [realAuthorId, setRealAuthorId] = useState('');
  const [boardMineViaMe, setBoardMineViaMe] = useState(false);
  const isBoardMine =
    !!myUserId &&
    ((!!realAuthorId && myUserId === realAuthorId) ||
      (!realAuthorId && boardMineViaMe));

  // 익명 번호 맵: 루트 댓글 기준으로 계산
  const anonMap = buildAnonMap(realAuthorId, replies);

  const fetchCount = useRef(0);

  const reloadBoard = useCallback(async () => {
    if (!boardId) return;
    try {
      const data = await communityApi.getBoard(boardId, {
        auth: isAdmin,
        increaseReadCount: false,
      });
      setBoard(data);
      setLiked(data?.likedByMe ?? false);
      setLikeCount(data?.likeCount ?? 0);
      setBoardMineViaMe(false);
      const nextRealAuthorId =
        data?.realUserId ??
        (String(data?.anonymity ?? 'N').toUpperCase() === 'Y'
          ? ''
          : (data?.userId ?? ''));
      setRealAuthorId(nextRealAuthorId);
    } catch {
      // ignore
    }
  }, [boardId, isAdmin]);

  const loadReplies = useCallback(async () => {
    if (!boardId) return;
    try {
      const data = await communityApi.getReplies(boardId, { auth: isAdmin });
      setReplies(Array.isArray(data) ? data : []);
    } catch {
      setReplies([]);
    }
  }, [boardId, isAdmin]);

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
    const increaseReadCount = shouldIncreaseBoardReadCount(boardId);

    communityApi
      .getBoard(boardId, { auth: isAdmin, increaseReadCount })
      .then((data) => {
        if (fetchCount.current !== thisCount) return;
        setBoard(data);
        setLiked(data?.likedByMe ?? false);
        setLikeCount(data?.likeCount ?? 0);
        // ✅ admin이면 백엔드에서 realUserId(userId) 내려올 수 있음
        // ✅ 익명 게시글인데 realUserId를 못 받는 경우, /boards/me 목록으로 본인 여부 판별
        setBoardMineViaMe(false);
        const nextRealAuthorId =
          data?.realUserId ??
          (String(data?.anonymity ?? 'N').toUpperCase() === 'Y'
            ? ''
            : (data?.userId ?? ''));
        setRealAuthorId(nextRealAuthorId);
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
  }, [boardId, isAdmin, loadReplies]);

  // ✅ 익명 게시글인데 realUserId를 못 받은 경우: 내 작성글 목록(/boards/me)에서 boardId가 있는지로 본인 여부 추정
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!boardId) return;
    if (String(board?.anonymity ?? 'N').toUpperCase() !== 'Y') return;
    if (realAuthorId) return;

    let mounted = true;
    (async () => {
      try {
        let p = 1;
        let total = 1;
        const size = 50;
        const limitPages = 10;

        while (p <= total && p <= limitPages) {
          const pageRes = await communityApi.myBoards({
            page: p,
            size,
            boardType: 'ALL',
          });
          const content = Array.isArray(pageRes?.content)
            ? pageRes.content
            : [];
          total = Math.max(1, Number(pageRes?.totalPages ?? 1));
          const found = content.some(
            (it) => String(it?.boardId ?? it?.id) === String(boardId)
          );
          if (found) {
            if (mounted) setBoardMineViaMe(true);
            return;
          }
          p += 1;
        }
        if (mounted) setBoardMineViaMe(false);
      } catch {
        if (mounted) setBoardMineViaMe(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn, boardId, board?.anonymity, realAuthorId]);

  // ✅ 내가 작성한 글이면(익명 포함) 상세에서 수정/삭제 표시
  const showBoardActions = isBoardMine;

  const startBoardEdit = () => {
    setEditTitle(board?.boardTitle ?? '');
    setEditContent(board?.boardCtnt ?? '');
    setEditBoardAnon(String(board?.anonymity ?? 'N').toUpperCase() === 'Y');
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
        anonymity: editBoardAnon ? 'Y' : 'N',
      });
      await reloadBoard();
      await loadReplies();
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
      navigate(communityListUrl);
    } catch (e) {
      window.alert(e?.message || '삭제 실패');
    }
  };

  const adminDeleteBoard = async () => {
    if (!window.confirm('관리자 권한으로 이 게시글을 삭제할까요?')) return;
    try {
      await adminApi.adminDeleteBoard(boardId);
      navigate(communityListUrl);
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
    if (isBanned) {
      setReplyErr(
        '정지(banned) 상태의 계정은 커뮤니티 글을 작성할 수 없습니다.'
      );
      return;
    }
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

  /* 게시글 작성자 표시
   * userId          = 익명이면 "익명(글쓴이)", 비익명이면 닉네임
   * realUserNickname = 항상 실제 닉네임 (어드민용)
   */
  const boardAuthorLabel = isAdmin
    ? (board?.realUserNickname ?? board?.realUserId ?? '-') // 어드민: 항상 실제 닉네임
    : (board?.userId ?? '-'); // 일반: userId가 이미 올바른 표시명

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(communityListUrl)}
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
                    {isAdmin && (realAuthorId || board?.userId) ? (
                      <button
                        type="button"
                        className={styles.replyAuthor}
                        style={{
                          background: 'transparent',
                          border: 0,
                          padding: 0,
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setUserStatusModalId(realAuthorId || board.userId)
                        }
                        title="회원 정보/상태 변경"
                      >
                        {boardAuthorLabel}
                      </button>
                    ) : (
                      <span
                        className={
                          board?.anonymity === 'Y' ? styles.anonAuthor : ''
                        }
                      >
                        {boardAuthorLabel}
                      </span>
                    )}
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
                  {isAdmin && !boardEditing && (
                    <div
                      className={styles.boardActions}
                      style={{ marginLeft: 8 }}
                    >
                      <button
                        type="button"
                        className={`${styles.boardEditBtn} ${styles.boardDeleteBtn}`}
                        onClick={adminDeleteBoard}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          borderColor: '#fca5a5',
                        }}
                      >
                        🗑 관리자 삭제
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
                    <label
                      className={styles.anonLabel}
                      style={{ marginRight: 'auto' }}
                    >
                      <input
                        type="checkbox"
                        checked={editBoardAnon}
                        onChange={(e) => setEditBoardAnon(e.target.checked)}
                        disabled={boardSaving}
                      />
                      익명으로 글쓰기
                    </label>
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
                    disabled={replySaving || isBanned}
                  />
                  {replyErr && (
                    <div className={styles.replyErr}>{replyErr}</div>
                  )}
                  {isBanned && !replyErr && (
                    <div className={styles.replyErr}>
                      정지(banned) 상태의 계정은 커뮤니티 글을 작성할 수
                      없습니다.
                    </div>
                  )}
                  <div className={styles.replyWriteFooter}>
                    <label className={styles.anonLabel}>
                      <input
                        type="checkbox"
                        checked={replyAnon}
                        onChange={(e) => setReplyAnon(e.target.checked)}
                        disabled={replySaving || isBanned}
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
                        disabled={replySaving || isBanned || !replyText.trim()}
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
                      isAdmin={isAdmin}
                      disabledWrite={isBanned}
                      onAdminUserClick={(uid) => setUserStatusModalId(uid)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />

      {isAdmin && userStatusModalId && (
        <UserStatusModal
          userId={userStatusModalId}
          currentUserId={myUserId}
          onClose={() => setUserStatusModalId(null)}
          onSaved={() => {
            // 정지/해제 바로 반영
            loadReplies();
          }}
        />
      )}
    </div>
  );
}
