package org.myweb.uniplace.domain.support.api.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter  // ★ @ModelAttribute 바인딩에 반드시 필요
public class NoticeSearchRequest {
    private String noticeSt;   // String으로 받아서 enum 변환 문제 방지
    private String code;
    private String importance; // Y=중요공지만, N=일반공지만, null/''=전체
    private String keyword;
}