package org.myweb.uniplace.domain.file.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.domain.entity.UploadFile;
import org.myweb.uniplace.domain.file.repository.UploadFileRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FileServiceImplTest {

    @Mock
    private UploadFileRepository uploadFileRepository;

    @InjectMocks
    private FileServiceImpl fileService;

    private UploadFile entity;

    
    @BeforeEach
    void setUp() {
        entity = UploadFile.builder()
                .fileId(1)
                .fileParentType("ROOM")
                .fileParentId(10)
                .filePath("ROOM/10/2026/02/19/")
                .originFilename("test.jpg")
                .renameFilename("uuid-test.jpg")
                .fileSize(123)
                .fileType(".jpg")
                .build();
    }

    @Test
    @DisplayName("getActiveFiles: deleteYn='N' 조건으로 목록 조회")
    void getActiveFiles_success() {
        given(uploadFileRepository
                .findByFileParentTypeAndFileParentIdAndDeleteYnOrderByFileIdDesc("ROOM", 10, "N"))
                .willReturn(List.of(entity));

        List<FileResponse> result = fileService.getActiveFiles("ROOM", 10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOriginFilename()).isEqualTo("test.jpg");
        assertThat(result.get(0).getRenameFilename()).isEqualTo("uuid-test.jpg");
    }

    @Test
    @DisplayName("softDeleteFiles: 파일ID들로 soft delete 수행")
    void softDeleteFiles_success() {
        given(uploadFileRepository.softDeleteByIds(List.of(1, 2))).willReturn(2);

        fileService.softDeleteFiles(List.of(1, 2));

        verify(uploadFileRepository).softDeleteByIds(List.of(1, 2));
    }

    @Test
    @DisplayName("softDeleteFilesByParent: parent 조건 + 파일ID들로 soft delete 수행")
    void softDeleteFilesByParent_success() {
        given(uploadFileRepository.softDeleteByIdsAndParent(List.of(1), "ROOM", 10)).willReturn(1);

        fileService.softDeleteFilesByParent("ROOM", 10, List.of(1));

        verify(uploadFileRepository).softDeleteByIdsAndParent(List.of(1), "ROOM", 10);
    }
}