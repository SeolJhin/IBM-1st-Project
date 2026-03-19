package org.myweb.uniplace.domain.community.application;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.myweb.uniplace.domain.ai.application.moderation.BannedWordService;
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
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardServiceImpl implements BoardService {

    private static final String DEFAULT_BOARD_CODE = "BOARD_FREE";

    private final BoardRepository boardRepository;
    private final ReplyRepository replyRepository;
    private final FileService fileService;
    private final BoardLikeRepository boardLikeRepository;
    private final UserRepository userRepository;
    
    private final BannedWordService bannedWordService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BoardResponse> getBoardList(String boardType, Pageable pageable) {

        String normalizedType = normalizeBoardCodeForFilter(boardType);
        if (normalizedType != null) {
            Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
            Page<Board> page = boardRepository.findByCodeOrderByBoardIdDesc(normalizedType, pageReq);
            String me = tryCurrentUserId();
            Page<BoardResponse> mapped = page.map(b -> {
                long cnt = boardLikeRepository.countByIdBoardId(b.getBoardId());
                boolean liked = (me != null) && boardLikeRepository.existsByIdUserIdAndIdBoardId(me, b.getBoardId());
                org.myweb.uniplace.domain.user.domain.entity.User author = userRepository.findById(b.getUserId()).orElse(null);
                return BoardResponse.fromEntity(b, cnt, liked, author);
            });
            return PageResponse.of(mapped);
        }

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
                    org.myweb.uniplace.domain.user.domain.entity.User author = userRepository.findById(b.getUserId()).orElse(null);
                    return BoardResponse.fromEntity(b, cnt, liked, author);
                })
                .toList();

        Set<Integer> topIdSet = new HashSet<>(topIds);

        List<BoardResponse> pageResp = page.getContent().stream()
                .filter(b -> !topIdSet.contains(b.getBoardId()))
                .map(b -> {
                    long cnt = likeCountMap.getOrDefault(b.getBoardId(), 0L);
                    boolean liked = (me != null) && boardLikeRepository.existsByIdUserIdAndIdBoardId(me, b.getBoardId());
                    org.myweb.uniplace.domain.user.domain.entity.User author = userRepository.findById(b.getUserId()).orElse(null);
                    return BoardResponse.fromEntity(b, cnt, liked, author);
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
        String normalizedType = normalizeBoardCodeForFilter(boardType);

        Page<Board> page;
        if (normalizedType != null) {
            page = boardRepository.findByUserIdAndCodeOrderByBoardIdDesc(userId, normalizedType, pageReq);
        } else {
            page = boardRepository.findByUserIdOrderByBoardIdDesc(userId, pageReq);
        }

        String me = userId;
        org.myweb.uniplace.domain.user.domain.entity.User meUser = userRepository.findById(userId).orElse(null);
        Page<BoardResponse> mapped = page.map(b -> {
            long cnt = boardLikeRepository.countByIdBoardId(b.getBoardId());
            boolean liked = boardLikeRepository.existsByIdUserIdAndIdBoardId(me, b.getBoardId());
            return BoardResponse.fromEntity(b, cnt, liked, meUser);
        });
        return PageResponse.of(mapped);
    }

    @Override
    public BoardResponse getBoardDetail(int boardId, boolean increaseReadCount) {
        if (increaseReadCount) {
            boardRepository.incrementReadCount(boardId);
        }

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        List<FileResponse> files = null;
        if ("Y".equalsIgnoreCase(board.getFileCk())) {
            files = fileService.getActiveFiles("BOARD", board.getBoardId());
        }

        long likeCount = boardLikeRepository.countByIdBoardId(boardId);

        String me = tryCurrentUserId();
        boolean liked = (me != null) && boardLikeRepository.existsByIdUserIdAndIdBoardId(me, boardId);

        org.myweb.uniplace.domain.user.domain.entity.User author = userRepository.findById(board.getUserId()).orElse(null);
        return BoardResponse.fromEntity(board, files, likeCount, liked, author);
    }

    @Override
    public int createBoard(BoardCreateRequest request, MultipartFile file) {
        AuthUser authUser = requireCurrentAuthUser();
        String boardCode = normalizeBoardCodeForWrite(request.getCode());
        requireBoardWriteRole(authUser, boardCode);
        String userId = authUser.getUserId();

        // banned 유저는 커뮤니티 글 작성 불가
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getUserSt() == UserStatus.banned) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        });
        
        String filteredTitle = bannedWordService.filter(request.getBoardTitle());
        String filteredContent = bannedWordService.filter(request.getBoardCtnt());

        Board board = Board.builder()
                .boardTitle(filteredTitle)
                .boardCtnt(filteredContent)
                .userId(userId)
                .code(boardCode)
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
        return saved.getBoardId();
    }

    @Override
    public void updateBoard(int boardId, BoardUpdateRequest request, boolean deleteFlag, MultipartFile file) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        AuthUser authUser = requireCurrentAuthUser();
        if (!canModifyBoard(board, authUser)) throw new BusinessException(ErrorCode.FORBIDDEN);

        if (request.getBoardTitle() != null) {
            board.setBoardTitle(bannedWordService.filter(request.getBoardTitle()));
        }

        if (request.getBoardCtnt() != null) {
            board.setBoardCtnt(bannedWordService.filter(request.getBoardCtnt()));
        }
        if (request.getCode() != null) board.setCode(normalizeBoardCodeForWrite(request.getCode()));

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

        AuthUser authUser = requireCurrentAuthUser();
        if (!canModifyBoard(board, authUser)) throw new BusinessException(ErrorCode.FORBIDDEN);

        boardRepository.deleteById(boardId);
    }


    @Override
    @Transactional(readOnly = true)
    public PageResponse<BoardResponse> searchBoards(String boardType, String searchType, String keyword, Pageable pageable) {
        String normalizedCode = normalizeBoardCodeForFilter(boardType);
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        String me = tryCurrentUserId();

        Page<Board> page;
        if ("userId".equalsIgnoreCase(searchType)) {
            page = boardRepository.searchByUserId(normalizedCode, keyword == null ? "" : keyword, pageReq);
        } else if ("nickname".equalsIgnoreCase(searchType) || "userNickname".equalsIgnoreCase(searchType)) {
            page = boardRepository.searchByNickname(normalizedCode, keyword == null ? "" : keyword, pageReq);
        } else {
            // default: title
            page = boardRepository.searchByTitle(normalizedCode, keyword == null ? "" : keyword, pageReq);
        }

        Page<BoardResponse> mapped = page.map(b -> {
            long cnt = boardLikeRepository.countByIdBoardId(b.getBoardId());
            boolean liked = (me != null) && boardLikeRepository.existsByIdUserIdAndIdBoardId(me, b.getBoardId());
            org.myweb.uniplace.domain.user.domain.entity.User author = userRepository.findById(b.getUserId()).orElse(null);
            return BoardResponse.fromEntity(b, cnt, liked, author);
        });
        return PageResponse.of(mapped);
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
        return requireCurrentAuthUser().getUserId();
    }

    private AuthUser requireCurrentAuthUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Object p = auth.getPrincipal();
        if (p instanceof AuthUser au) return au;
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    private void requireBoardWriteRole(AuthUser authUser, String boardCode) {
        String role = authUser.getRole();
        if (role == null) throw new BusinessException(ErrorCode.FORBIDDEN);

        String normalized = role.trim().toLowerCase(Locale.ROOT);
        boolean isAdmin = "admin".equals(normalized);
        boolean isTenant = "tenant".equals(normalized);
        boolean isUser = "user".equals(normalized);

        // 자유 게시판: 로그인한 모든 사용자 (user, tenant, admin) 작성 허용
        if ("BOARD_FREE".equalsIgnoreCase(boardCode)) {
            if (!isAdmin && !isTenant && !isUser) throw new BusinessException(ErrorCode.FORBIDDEN);
            return;
        }

        // 질문 게시판: 입주자(tenant) 및 관리자(admin)만 작성 허용
        if ("BOARD_QUESTION".equalsIgnoreCase(boardCode)) {
            if (!isAdmin && !isTenant) throw new BusinessException(ErrorCode.FORBIDDEN);
            return;
        }

        if (!isAdmin && !isTenant) throw new BusinessException(ErrorCode.FORBIDDEN);
    }

    private boolean canModifyBoard(Board board, AuthUser authUser) {
        String role = authUser.getRole();
        String userId = authUser.getUserId();
        String boardCode = String.valueOf(board.getCode());

        boolean isOwner = userId != null && userId.equals(board.getUserId());
        boolean isAdmin = role != null && "admin".equalsIgnoreCase(role.trim());

        // 자유게시판/질문게시판/후기게시판은 관리자 또는 작성자 본인 수정/삭제 허용
        if ("BOARD_FREE".equalsIgnoreCase(boardCode)
                || "BOARD_QUESTION".equalsIgnoreCase(boardCode)
                || "BOARD_REVIEW".equalsIgnoreCase(boardCode)) {
            return isAdmin || isOwner;
        }

        // 그 외 게시판은 기존처럼 작성자 본인만 허용
        return isOwner;
    }

    private String nvlYn(String v, String def) {
        if (v == null || v.isBlank()) return def;
        return "Y".equalsIgnoreCase(v) ? "Y" : "N";
    }

    private String normalizeBoardCodeForFilter(String rawType) {
        if (rawType == null || rawType.isBlank()) return null;

        String mapped = mapBoardCodeAlias(rawType);
        if ("ALL".equalsIgnoreCase(mapped)) return null;
        return mapped;
    }

    private String normalizeBoardCodeForWrite(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) return DEFAULT_BOARD_CODE;

        String mapped = mapBoardCodeAlias(rawCode);
        if ("ALL".equalsIgnoreCase(mapped)) return DEFAULT_BOARD_CODE;
        return mapped;
    }

    private String mapBoardCodeAlias(String raw) {
        String normalized = raw.trim().toUpperCase();

        return switch (normalized) {
            case "FREE" -> "BOARD_FREE";
            case "QUESTION" -> "BOARD_QUESTION";
            case "REVIEW" -> "BOARD_REVIEW";
            case "NOTICE" -> "BOARD_NOTICE";
            default -> normalized;
        };
    }
}