import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react';
import styles from '../pages/NoticeEditor.module.css';

const FONT_SIZES = [
  '12px',
  '14px',
  '15px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
];

/* ── Range 저장/복원 ── */
function saveRange() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).cloneRange();
}
function restoreRange(range) {
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ── Range 끝으로 이동 ── */
function collapseToEnd(editor) {
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/* ── Range에 노드 삽입 ── */
function insertNodeAtRange(range, node) {
  range.deleteContents();
  range.insertNode(node);
  // 커서를 삽입된 노드 뒤로
  range.setStartAfter(node);
  range.setEndAfter(node);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

const NoticeEditor = forwardRef(function NoticeEditor(
  { disabled = false },
  ref
) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const rangeRef = useRef(null); // 마지막으로 저장한 커서 위치
  const pendingRef = useRef([]); // { file, objectUrl }[]

  /* ── 외부 인터페이스 ── */
  useImperativeHandle(ref, () => ({
    getHTML: () => editorRef.current?.innerHTML ?? '',
    setHTML: (html) => {
      if (editorRef.current)
        editorRef.current.innerHTML = html || '<p><br></p>';
    },
    focus: () => editorRef.current?.focus(),
    getPendingFiles: () => pendingRef.current.map((p) => p.file),
    clearPendingFiles: () => {
      pendingRef.current = [];
    },
  }));

  /* 초기 빈 p */
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = '<p><br></p>';
    }
  }, []);

  /* ── 에디터 포커스/셀렉션 변경 시 range 저장 ── */
  const handleSelectionChange = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    // 에디터 내부 커서인지 확인
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      rangeRef.current = range.cloneRange();
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  /* ── 이미지 삽입 (핵심 로직) ── */
  const doInsertImages = (files) => {
    const editor = editorRef.current;
    if (!editor) return;

    files.forEach((file) => {
      const objectUrl = URL.createObjectURL(file);
      pendingRef.current.push({ file, objectUrl });

      /* img 엘리먼트 생성 */
      const img = document.createElement('img');
      img.src = objectUrl;
      img.setAttribute('data-notice-img', '1');
      img.setAttribute('data-pending', '1');
      img.style.cssText =
        'max-width:100%;display:block;margin:12px auto;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);cursor:pointer;';

      /* 저장된 range 복원, 없으면 맨 끝 */
      let range = rangeRef.current;
      if (!range || !editor.contains(range.commonAncestorContainer)) {
        // range가 에디터 밖이면 맨 끝에
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      } else {
        range = range.cloneRange();
      }

      /* range가 텍스트 노드 안에 있을 경우 → 그 뒤에 삽입 */
      if (range.collapsed) {
        // 현재 커서 위치에 img 삽입
        range.insertNode(img);
        // 빈 줄 (p) 추가해서 이미지 아래 계속 타이핑 가능하게
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        img.insertAdjacentElement('afterend', p);
        // 커서를 p 안으로
        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
        rangeRef.current = newRange.cloneRange();
      } else {
        range.collapse(false);
        range.insertNode(img);
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        img.insertAdjacentElement('afterend', p);
        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
        rangeRef.current = newRange.cloneRange();
      }
    });
  };

  /* ── 이미지 삽입 버튼 클릭 ── */
  const handleInsertImageClick = () => {
    // 버튼 클릭 전 selectionchange 이벤트가 이미 range를 저장했음
    // 혹시 모르니 한 번 더 저장
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (editorRef.current?.contains(r.commonAncestorContainer)) {
        rangeRef.current = r.cloneRange();
      }
    }
    fileInputRef.current?.click();
  };

  /* ── 파일 선택 완료 ── */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const valid = files.filter((f) => allowed.includes(f.type));
    if (valid.length !== files.length)
      alert('이미지 파일(PNG, JPG, GIF, WEBP)만 가능합니다.');
    if (valid.length) doInsertImages(valid);
    e.target.value = '';
  };

  /* ── 클립보드 붙여넣기 ── */
  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imgItems = items.filter((it) => it.type.startsWith('image/'));
    if (!imgItems.length) return;
    e.preventDefault();
    const files = imgItems.map((it) => it.getAsFile()).filter(Boolean);
    if (files.length) doInsertImages(files);
  };

  /* ── 이미지 클릭 → 삭제 ── */
  const handleEditorClick = (e) => {
    const img = e.target.closest('img[data-notice-img]');
    if (!img) return;
    if (window.confirm('이미지를 삭제하시겠습니까?')) {
      const src = img.getAttribute('src');
      pendingRef.current = pendingRef.current.filter(
        (p) => p.objectUrl !== src
      );
      if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
      img.remove();
    }
  };

  /* ── 툴바 execCommand (B/I/U/정렬) ── */
  const execFmt = (cmd) => {
    // 에디터 포커스 + range 복원 후 명령
    editorRef.current?.focus();
    if (rangeRef.current) restoreRange(rangeRef.current);
    document.execCommand(cmd, false, null);
  };

  const applyFontSize = (px) => {
    editorRef.current?.focus();
    if (rangeRef.current) restoreRange(rangeRef.current);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = px;
    try {
      range.surroundContents(span);
    } catch (_) {
      // 범위가 여러 노드에 걸쳐있을 경우 무시
    }
  };

  return (
    <div className={styles.editorWrap}>
      {/* ── 툴바 ── */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('bold')}
          title="굵게"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('italic')}
          title="기울임"
        >
          <i style={{ fontStyle: 'italic' }}>I</i>
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('underline')}
          title="밑줄"
        >
          <u>U</u>
        </button>

        <div className={styles.toolDivider} />

        <select
          className={styles.fontSizeSelect}
          defaultValue="15px"
          title="글자 크기"
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            applyFontSize(e.target.value);
          }}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className={styles.toolDivider} />

        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('justifyLeft')}
          title="왼쪽 정렬"
        >
          <svg width="14" height="12" viewBox="0 0 14 12">
            <rect y="0" width="14" height="2" fill="currentColor" />
            <rect y="4" width="10" height="2" fill="currentColor" />
            <rect y="8" width="14" height="2" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('justifyCenter')}
          title="가운데 정렬"
        >
          <svg width="14" height="12" viewBox="0 0 14 12">
            <rect y="0" width="14" height="2" fill="currentColor" />
            <rect x="2" y="4" width="10" height="2" fill="currentColor" />
            <rect y="8" width="14" height="2" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('justifyRight')}
          title="오른쪽 정렬"
        >
          <svg width="14" height="12" viewBox="0 0 14 12">
            <rect y="0" width="14" height="2" fill="currentColor" />
            <rect x="4" y="4" width="10" height="2" fill="currentColor" />
            <rect y="8" width="14" height="2" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* ── 편집 영역 ── */}
      <div
        ref={editorRef}
        className={styles.editorBody}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onPaste={handlePaste}
        onClick={handleEditorClick}
      />

      {/* ── 하단 이미지 삽입 버튼 ── */}
      <div className={styles.editorFooter}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className={styles.imgInsertBtn}
          onClick={handleInsertImageClick}
          disabled={disabled}
        >
          🖼 이미지 삽입
        </button>
        <span style={{ fontSize: 12, color: '#aaa' }}>
          클릭 또는 이미지를 직접 붙여넣기(Ctrl+V) 가능
        </span>
      </div>
    </div>
  );
});

export default NoticeEditor;
