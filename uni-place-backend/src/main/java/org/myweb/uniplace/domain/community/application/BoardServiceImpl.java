package org.myweb.uniplace.domain.community.application;

import java.time.LocalDateTime;
import java.util.*;

import org.myweb.uniplace.domain.community.api.dto.request.BoardCreateRequest;
import org.myweb.uniplace.domain.community.api.dto.request.BoardUpdateRequest;
import org.myweb.uniplace.domain.community.api.dto.response.BoardResponse;
import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.myweb.uniplace.domain.community.repository.BoardLikeRepository;
import org.myweb.uniplace.domain.community.repository.BoardRepository;
import org.myweb.uniplace.domain.community.repository.ReplyRepository;
import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardServiceImpl implements BoardService {

    private final BoardRepository boardRepository;
    private final ReplyRepository replyRepository;
    private final FileService fileService;
    private final BoardLikeRepository boardLikeRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BoardResponse> getBoardList(Pageable pageable) {

        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Board> page = boardRepository.findBoardListOrdered(LocalDateTime.now(), pageReq);

        List<Board> weeklyTop = List.of();
        if (pageReq.getPageNumber() == 0) {
            weeklyTop = boardRepository.findWeeklyTop(
                    LocalDateTime.now().minusDays(7),
                    PageRequest.of(0, 5)
            );
        }

        List<Integer> pageIds = page.getContent().stream().map(Board::getBoardId).toList();
        List<Integer> topIds = weeklyTop.stream().map(Board::getBoardId).toList();

        Set<Integer> unionSet = new LinkedHashSet<>();
        unionSet.addAll(topIds);
        unionSet.addAll(pageIds);
        List<Integer> unionIds = new ArrayList<>(unionSet);

        Map<Integer, Long> likeCountMap = loadBoardLikeCounts(unionIds);
        String me = tryCurrentUserId();

        List<BoardResponse> topResp = weeklyTop.stream()
                .map(b -> {
                    long cnt = likeCountMap.getOrDefault(b.getBoardId(), 0L);
                    boolean liked = (me != null) && boardLikeRepository.existsByIdUserIdAndIdBoardId(me, b.getBoardId());
                    return BoardResponse.fromEntity(b, cnt, liked);
                })
                .toList();

        Set<Integer> topIdSet = new HashSet<>(topIds);

        List<BoardResponse> pageResp = page.getContent().stream()
                .filter(b -> !topIdSet.contains(b.getBoardId()))
                .map(b -> {
                    long cnt = likeCountMap.getOrDefault(b.getBoardId(), 0L);
                    boolean liked = (me != null) && boardLikeRepository.existsByIdUserIdAndIdBoardId(me, b.getBoardId());
                    return BoardResponse.fromEntity(b, cnt, liked);
                })
                .toList();

        List<BoardResponse> merged = new ArrayList<>();
        merged.addAll(topResp);
        merged.addAll(pageResp);

        if (merged.size() > pageReq.getPageSize()) {
            merged = merged.subList(0, pageReq.getPageSize());
        }

        Page<BoardResponse> mappedPage = new PageImpl<>(merged, pageReq, page.getTotalElements());
        return PageResponse.of(mappedPage);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<BoardResponse> getMyBoards(String boardType, Pageable pageable) {
        String userId = requireCurrentUserId();
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        Page<Board> page;
        if (boardType != null && !boardType.isBlank() && !"ALL".equalsIgnoreCase(boardType)) {
            page = boardRepository.findByUserIdAndCodeOrderByBoardIdDesc(userId, boardType, pageReq);
        } else {
            page = boardRepository.findByUserIdOrderByBoardIdDesc(userId, pageReq);
        }

        String me = userId;
        Page<BoardResponse> mapped = page.map(b -> {
            long cnt = boardLikeRepository.countByIdBoardId(b.getBoardId());
            boolean liked = boardLikeRepository.existsByIdUserIdAndIdBoardId(me, b.getBoardId());
            return BoardResponse.fromEntity(b, cnt, liked);
        });
        return PageResponse.of(mapped);
    }

    @Override
    public BoardResponse getBoardDetail(int boardId) {
        boardRepository.incrementReadCount(boardId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        List<FileResponse> files = null;
        if ("Y".equalsIgnoreCase(board.getFileCk())) {
            files = fileService.getActiveFiles("BOARD", board.getBoardId());
        }

        long likeCount = boardLikeRepository.countByIdBoardId(boardId);

        String me = tryCurrentUserId();
        boolean liked = (me != null) && boardLikeRepository.existsByIdUserIdAndIdBoardId(me, boardId);

        return BoardResponse.fromEntity(board, files, likeCount, liked);
    }

    @Override
    public void createBoard(BoardCreateRequest request, MultipartFile file) {
        String userId = requireCurrentUserId();

        Board board = Board.builder()
                .boardTitle(request.getBoardTitle())
                .boardCtnt(request.getBoardCtnt())
                .userId(userId)
                .code(request.getCode())
                .anonymity(nvlYn(request.getAnonymity(), "N"))
                .importance(nvlYn(request.getImportance(), "N"))
                .impEndAt(request.getImpEndAt())
                .build();

        Board saved = boardRepository.save(board);

        if (file != null && !file.isEmpty()) {
            FileUploadRequest up = FileUploadRequest.builder()
                    .fileParentType("BOARD")
                    .fileParentId(saved.getBoardId())
                    .files(List.of(file))
                    .build();
            fileService.uploadFiles(up);
            saved.markFile(true);
        } else {
            saved.markFile(false);
        }

        saved.markReply(false);
    }

    @Override
    public void updateBoard(int boardId, BoardUpdateRequest request, boolean deleteFlag, MultipartFile file) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        String me = requireCurrentUserId();
        if (!me.equals(board.getUserId())) throw new BusinessException(ErrorCode.FORBIDDEN);

        if (request.getBoardTitle() != null) board.setBoardTitle(request.getBoardTitle());
        if (request.getBoardCtnt() != null) board.setBoardCtnt(request.getBoardCtnt());
        if (request.getCode() != null) board.setCode(request.getCode());

        if (request.getAnonymity() != null) board.setAnonymity(nvlYn(request.getAnonymity(), board.getAnonymity()));
        if (request.getImportance() != null) board.setImportance(nvlYn(request.getImportance(), board.getImportance()));
        board.setImpEndAt(request.getImpEndAt());

        if (deleteFlag) {
            List<FileResponse> existing = fileService.getActiveFiles("BOARD", boardId);
            if (existing != null && !existing.isEmpty()) {
                List<Integer> ids = existing.stream().map(FileResponse::getFileId).toList();
                fileService.softDeleteFilesByParent("BOARD", boardId, ids);
            }
            board.markFile(false);
        }

        if (file != null && !file.isEmpty()) {
            List<FileResponse> existing = fileService.getActiveFiles("BOARD", boardId);
            if (existing != null && !existing.isEmpty()) {
                List<Integer> ids = existing.stream().map(FileResponse::getFileId).toList();
                fileService.softDeleteFilesByParent("BOARD", boardId, ids);
            }

            FileUploadRequest up = FileUploadRequest.builder()
                    .fileParentType("BOARD")
                    .fileParentId(boardId)
                    .files(List.of(file))
                    .build();
            fileService.uploadFiles(up);
            board.markFile(true);
        }

        board.markReply(replyRepository.countByBoardId(boardId) > 0);
    }

    @Override
    public void deleteBoard(int boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        String me = requireCurrentUserId();
        if (!me.equals(board.getUserId())) throw new BusinessException(ErrorCode.FORBIDDEN);

        boardRepository.deleteById(boardId);
    }


    private Map<Integer, Long> loadBoardLikeCounts(List<Integer> boardIds) {
        if (boardIds == null || boardIds.isEmpty()) return Map.of();

        List<Object[]> rows = boardLikeRepository.countGroupByBoardIds(boardIds);
        Map<Integer, Long> map = new HashMap<>();
        for (Object[] r : rows) {
            Integer id = (Integer) r[0];
            Long cnt = (Long) r[1];
            map.put(id, cnt == null ? 0L : cnt);
        }
        return map;
    }

    private String tryCurrentUserId() {
        try { return requireCurrentUserId(); }
        catch (Exception e) { return null; }
    }

    private String requireCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Object p = auth.getPrincipal();
        if (p instanceof AuthUser au) return au.getUserId();
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    private String nvlYn(String v, String def) {
        if (v == null || v.isBlank()) return def;
        return "Y".equalsIgnoreCase(v) ? "Y" : "N";
    }
}
