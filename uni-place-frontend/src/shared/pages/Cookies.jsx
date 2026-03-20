import React from 'react';
import LegalPage from './LegalPage';
import styles from './LegalPage.module.css';

export default function Cookies() {
  return (
    <LegalPage title="쿠키정책" lastUpdated="2026년 1월 1일">
      <div className={styles.highlight}>
        UNI-PLACE는 더 나은 서비스 경험을 제공하기 위해 쿠키를 사용합니다.
        본 정책은 당사가 쿠키를 어떻게 사용하는지, 그리고 귀하가 어떻게 관리할 수 있는지 설명합니다.
      </div>

      <h2>1. 쿠키란?</h2>
      <p>
        쿠키(Cookie)는 웹사이트가 귀하의 컴퓨터나 모바일 기기에 저장하는 작은 텍스트 파일입니다.
        쿠키는 웹사이트가 귀하의 방문을 기억하고 서비스를 개선하는 데 도움을 줍니다.
        쿠키는 귀하를 해치지 않으며, 귀하의 기기에서 프로그램을 실행하지 않습니다.
      </p>

      <h2>2. 쿠키 사용 목적</h2>
      <table>
        <thead>
          <tr>
            <th>쿠키 유형</th>
            <th>목적</th>
            <th>보존 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>필수 쿠키</strong></td>
            <td>로그인 상태 유지, 보안 인증, 서비스 기본 기능 제공</td>
            <td>세션 종료 시</td>
          </tr>
          <tr>
            <td><strong>기능 쿠키</strong></td>
            <td>언어 설정, 지역 선택 등 개인화 설정 저장</td>
            <td>1년</td>
          </tr>
          <tr>
            <td><strong>분석 쿠키</strong></td>
            <td>방문자 통계, 페이지 이용 행태 분석 (Google Analytics)</td>
            <td>2년</td>
          </tr>
          <tr>
            <td><strong>마케팅 쿠키</strong></td>
            <td>맞춤형 광고 제공, 광고 효과 측정</td>
            <td>90일</td>
          </tr>
        </tbody>
      </table>

      <h2>3. 사용하는 쿠키 목록</h2>

      <h3>필수 쿠키</h3>
      <table>
        <thead>
          <tr><th>쿠키명</th><th>제공자</th><th>목적</th></tr>
        </thead>
        <tbody>
          <tr><td>access_token</td><td>UNI-PLACE</td><td>로그인 인증 토큰</td></tr>
          <tr><td>refresh_token</td><td>UNI-PLACE</td><td>토큰 갱신</td></tr>
          <tr><td>XSRF-TOKEN</td><td>UNI-PLACE</td><td>CSRF 공격 방지</td></tr>
        </tbody>
      </table>

      <h3>분석 쿠키</h3>
      <table>
        <thead>
          <tr><th>쿠키명</th><th>제공자</th><th>목적</th></tr>
        </thead>
        <tbody>
          <tr><td>_ga</td><td>Google Analytics</td><td>방문자 구분</td></tr>
          <tr><td>_gid</td><td>Google Analytics</td><td>24시간 방문 기록</td></tr>
          <tr><td>_gat</td><td>Google Analytics</td><td>요청 속도 제한</td></tr>
        </tbody>
      </table>

      <h2>4. 쿠키 관리 방법</h2>
      <p>
        대부분의 웹 브라우저는 기본적으로 쿠키를 허용하도록 설정되어 있습니다.
        귀하는 브라우저 설정을 통해 쿠키를 관리할 수 있습니다.
      </p>
      <ul>
        <li><strong>Chrome:</strong> 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</li>
        <li><strong>Safari:</strong> 설정 → Safari → 개인정보 보호 → 모든 쿠키 차단</li>
        <li><strong>Firefox:</strong> 설정 → 개인정보 및 보안 → 쿠키 및 사이트 데이터</li>
        <li><strong>Edge:</strong> 설정 → 쿠키 및 사이트 권한</li>
      </ul>
      <p>
        쿠키를 비활성화하면 일부 서비스 기능이 제한될 수 있습니다.
        특히 필수 쿠키를 차단하면 로그인이 유지되지 않을 수 있습니다.
      </p>

      <h2>5. 쿠키 동의 철회</h2>
      <p>
        필수 쿠키 이외의 쿠키에 대한 동의는 언제든지 철회할 수 있습니다.
        설정 메뉴의 '쿠키 설정' 또는 고객센터(uniplace@asdf.com)로 요청해 주세요.
      </p>

      <h2>6. 정책 변경</h2>
      <p>
        당사는 법령 또는 서비스 변경에 따라 본 쿠키정책을 업데이트할 수 있습니다.
        중요한 변경사항은 서비스 내 공지사항을 통해 사전 안내됩니다.
        본 정책은 2026년 1월 1일부터 유효합니다.
      </p>
    </LegalPage>
  );
}
