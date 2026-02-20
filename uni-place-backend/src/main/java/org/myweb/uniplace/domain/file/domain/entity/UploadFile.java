package org.myweb.uniplace.domain.file.domain.entity;

import java.time.LocalDateTime;

import org.myweb.uniplace.global.common.SoftDeleteEntity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "files")
// ✅ B안: 전역 필터(@Where/@SQLRestriction) 제거!
// 조회 시 delete_yn 필터링은 Repository 메서드에서 조건으로 처리한다.
public class UploadFile extends SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "file_id", nullable = false)
    private Integer fileId;

    @Column(name = "file_parent_type", nullable = false, length = 50)
    private String fileParentType;

    @Column(name = "file_parent_id")
    private Integer fileParentId;

    /**
     * ✅ DB에는 상대 경로만 저장 권장
     * 예: ROOM/10/2026/02/13/
     */
    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "origin_filename", nullable = false, length = 260)
    private String originFilename;

    @Column(name = "rename_filename", nullable = false, length = 260)
    private String renameFilename;

    /**
     * ✅ DB 스펙이 int라 Integer 사용
     * 업로드 시 2GB 초과 방어 로직 필수
     */
    @Column(name = "file_size", nullable = false)
    private Integer fileSize;

    /**
     * ✅ 확장자 저장(.png 등), VARCHAR(20)
     */
    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "update_at")
    private LocalDateTime updateAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (deleteYn == null) deleteYn = "N";
    }
}