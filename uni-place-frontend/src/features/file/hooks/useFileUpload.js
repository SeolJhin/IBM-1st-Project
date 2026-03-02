// features/file/hooks/useFileUpload.js
import { useState, useCallback } from 'react';

/**
 * 파일 업로드 상태 관리 훅
 *
 * 사용법:
 *   const fu = useFileUpload({ maxCount: 5 });
 *   <FileUploader {...fu} existingFiles={data.files} />
 *   // 폼 제출 시:
 *   fd.append('files', ...fu.newFiles)
 *   fu.deleteFileIds.forEach(id => fd.append('deleteFileIds', id))
 */
export default function useFileUpload({ maxCount = 10 } = {}) {
  const [newFiles, setNewFiles] = useState([]); // File 객체 배열
  const [previews, setPreviews] = useState([]); // 미리보기 URL 배열
  const [deleteFileIds, setDeleteFileIds] = useState([]); // 삭제할 기존 파일 ID

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

  const toggleDeleteExisting = useCallback((fileId) => {
    setDeleteFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  const reset = useCallback(() => {
    setNewFiles([]);
    setPreviews([]);
    setDeleteFileIds([]);
  }, []);

  return {
    newFiles,
    previews,
    deleteFileIds,
    addFiles,
    removeNewFile,
    toggleDeleteExisting,
    reset,
  };
}
