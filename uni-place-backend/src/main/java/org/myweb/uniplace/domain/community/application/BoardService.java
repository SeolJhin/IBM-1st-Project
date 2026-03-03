package org.myweb.uniplace.domain.community.application;

import org.myweb.uniplace.domain.community.api.dto.request.BoardCreateRequest;
import org.myweb.uniplace.domain.community.api.dto.request.BoardUpdateRequest;
import org.myweb.uniplace.domain.community.api.dto.response.BoardResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface BoardService {

    PageResponse<BoardResponse> getBoardList(String boardType, Pageable pageable);

    BoardResponse getBoardDetail(int boardId, boolean increaseReadCount);

    void createBoard(BoardCreateRequest request, MultipartFile file);

    void updateBoard(int boardId, BoardUpdateRequest request, boolean deleteFlag, MultipartFile file);

    void deleteBoard(int boardId);
    
    PageResponse<BoardResponse> getMyBoards(String boardType, Pageable pageable);

    PageResponse<BoardResponse> searchBoards(String boardType, String searchType, String keyword, Pageable pageable);
}
