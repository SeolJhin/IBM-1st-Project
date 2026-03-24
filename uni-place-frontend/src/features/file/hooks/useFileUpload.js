// features/file/hooks/useFileUpload.js
import { useState, useCallback, useRef } from 'react';

export default function useFileUpload({ maxCount = 10 } = {}) {
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [deleteFileIds, setDeleteFileIds] = useState([]);
  // 기존 파일 순서 변경을 위한 상태 (fileId 배열)
  // null = initExistingOrder가 아직 호출되지 않은 상태
  const [existingOrder, setExistingOrder] = useState(null);

  // existingOrder의 최신값을 moveExisting 클로저 안에서 읽기 위한 ref
  // (배포 환경에서 useEffect 타이밍 차이로 existingOrder가 null인 채로
  //  moveExisting이 호출될 때 발생하는 버그를 방지)
  const existingOrderRef = useRef(null);

  const addFiles = useCallback(
    (fileList) => {
      const selected = Array.from(fileList);
      setNewFiles((prev) => {
        const merged = [...prev, ...selected].slice(0, maxCount);
        setPreviews(merged.map((f) => URL.createObjectURL(f)));
        return merged;
      });
    },
    [maxCount]
  );

  const removeNewFile = useCallback((index) => {
    setNewFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  }, []);

  // 새 파일 순서 변경 (드래그 or 버튼)
  const moveNewFile = useCallback((fromIndex, toIndex) => {
    setNewFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  }, []);

  const toggleDeleteExisting = useCallback((fileId) => {
    setDeleteFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  // 기존 파일 순서 초기화 — 수정 모달 진입 시 반드시 호출
  const initExistingOrder = useCallback((files) => {
    const ids = files.map((f) => f.fileId);
    existingOrderRef.current = ids;
    setExistingOrder(ids);
  }, []);

  // 기존 파일 순서 변경
  // ✅ 수정: existingOrder가 null(initExistingOrder 미호출)이면
  //    ref에서 현재 순서를 읽어 즉시 반영 — 배포 환경의 타이밍 버그 방지
  const moveExisting = useCallback((fromIndex, toIndex) => {
    setExistingOrder((prev) => {
      const base = prev ?? existingOrderRef.current;
      if (!base) return prev; // 파일 자체가 없는 경우 — 정상적으로 skip
      const next = [...base];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      existingOrderRef.current = next;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setNewFiles([]);
    setPreviews([]);
    setDeleteFileIds([]);
    existingOrderRef.current = null;
    setExistingOrder(null);
  }, []);

  return {
    newFiles,
    previews,
    deleteFileIds,
    existingOrder,
    addFiles,
    removeNewFile,
    moveNewFile,
    toggleDeleteExisting,
    initExistingOrder,
    moveExisting,
    reset,
  };
}
