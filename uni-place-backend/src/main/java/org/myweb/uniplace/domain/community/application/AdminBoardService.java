// 경로: org/myweb/uniplace/domain/community/application/AdminBoardService.java
package org.myweb.uniplace.domain.community.application;

import org.myweb.uniplace.domain.community.api.admin.dto.request.BoardImportanceUpdateRequest;

public interface AdminBoardService {

    void deleteBoardAsAdmin(int boardId);

    void deleteReplyAsAdmin(int replyId);

    void updateImportance(int boardId, BoardImportanceUpdateRequest request);
}