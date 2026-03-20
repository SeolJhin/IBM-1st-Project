import React from 'react';
import LegalPage from './LegalPage';
import styles from './LegalPage.module.css';

export default function Privacy() {
  return (
    <LegalPage title="개인정보처리방침" lastUpdated="2026년 1월 1일">
      <div className={styles.highlight}>
        UNI-PLACE는 개인정보 보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령에 따라
        이용자의 개인정보를 보호하고 있습니다.
      </div>

      <h2>1. 수집하는 개인정보 항목</h2>
      <p>회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.</p>

      <h3>가. 회원가입 시</h3>
      <ul>
        <li><strong>필수:</strong> 이름, 이메일 주소, 비밀번호, 휴대폰 번호, 생년월일</li>
        <li><strong>선택:</strong> 프로필 사진, 성별</li>
      </ul>

      <h3>나. 계약 체결 시</h3>
      <ul>
        <li><strong>필수:</strong> 주민등록번호 앞 6자리, 주소, 긴급연락처</li>
        <li><strong>선택:</strong> 직장 정보, 재직증명서류</li>
      </ul>

      <h3>다. 결제 시</h3>
      <ul>
        <li>결제 수단 정보(카드번호, 계좌번호 등 — PG사를 통해 처리되며 회사는 저장하지 않습니다)</li>
        <li>결제 내역</li>
      </ul>

      <h3>라. 서비스 이용 과정에서 자동 수집</h3>
      <ul>
        <li>IP 주소, 쿠키, 방문 일시, 서비스 이용 기록, 기기 정보</li>
      </ul>

      <h2>2. 개인정보 수집 및 이용 목적</h2>
      <table>
        <thead>
          <tr>
            <th>목적</th>
            <th>수집 항목</th>
            <th>보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>회원 관리 및 본인 확인</td>
            <td>이름, 이메일, 휴대폰 번호</td>
            <td>탈퇴 후 30일</td>
          </tr>
          <tr>
            <td>입주 계약 체결 및 이행</td>
            <td>계약 관련 개인정보 전체</td>
            <td>계약 종료 후 5년</td>
          </tr>
          <tr>
            <td>결제 처리 및 환불</td>
            <td>결제 내역</td>
            <td>5년(전자상거래법)</td>
          </tr>
          <tr>
            <td>고객 문의 및 민원 처리</td>
            <td>이름, 이메일, 문의 내용</td>
            <td>처리 완료 후 3년</td>
          </tr>
          <tr>
            <td>서비스 개선 및 통계</td>
            <td>이용 기록, 접속 로그</td>
            <td>3개월</td>
          </tr>
        </tbody>
      </table>

      <h2>3. 개인정보의 제3자 제공</h2>
      <p>
        회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우는 예외로 합니다.
      </p>
      <ul>
        <li>이용자가 사전에 동의한 경우</li>
        <li>법령에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
      </ul>

      <h2>4. 개인정보의 보유 및 이용 기간</h2>
      <p>
        회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
        단, 관련 법령에 의해 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.
      </p>

      <h2>5. 이용자의 권리</h2>
      <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
      <ul>
        <li>개인정보 열람 요청</li>
        <li>개인정보 정정·삭제 요청</li>
        <li>개인정보 처리 정지 요청</li>
        <li>개인정보 이동 요청</li>
      </ul>
      <p>
        위 권리 행사는 마이페이지 또는 고객센터(uniplace@asdf.com)를 통해 할 수 있으며,
        회사는 접수 후 10일 이내에 조치 결과를 통보합니다.
      </p>

      <h2>6. 개인정보 보호책임자</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>성명</strong></td>
            <td>홍길동</td>
          </tr>
          <tr>
            <td><strong>직책</strong></td>
            <td>개인정보 보호책임자(CPO)</td>
          </tr>
          <tr>
            <td><strong>이메일</strong></td>
            <td>privacy@uniplace.com</td>
          </tr>
          <tr>
            <td><strong>전화</strong></td>
            <td>02-123-4567</td>
          </tr>
        </tbody>
      </table>

      <h2>7. 개인정보처리방침 변경</h2>
      <p>
        본 개인정보처리방침은 2026년 1월 1일부터 적용됩니다.
        이전 버전의 개인정보처리방침은 고객센터를 통해 확인하실 수 있습니다.
      </p>
    </LegalPage>
  );
}
