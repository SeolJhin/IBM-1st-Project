// features/file/hooks/useFileUpload.js
import { useState, useCallback } from 'react';

export default function useFileUpload({ maxCount = 10 } = {}) {
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [deleteFileIds, setDeleteFileIds] = useState([]);
  // 기존 파일 순서 변경을 위한 상태 (fileId 배열)
  const [existingOrder, setExistingOrder] = useState(null); // null = 원본 순서

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

  // 기존 파일 순서 변경
  const initExistingOrder = useCallback((files) => {
    setExistingOrder(files.map((f) => f.fileId));
  }, []);

  const moveExisting = useCallback((fromIndex, toIndex) => {
    setExistingOrder((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setNewFiles([]);
    setPreviews([]);
    setDeleteFileIds([]);
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
