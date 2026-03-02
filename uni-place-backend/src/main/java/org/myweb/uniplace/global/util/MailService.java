package org.myweb.uniplace.global.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * 비밀번호 재설정 이메일 발송 (비동기)
     *
     * @param toEmail 수신자 이메일
     * @param token   재설정 토큰
     */
    @Async
    public void sendPasswordResetMail(String toEmail, String token) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + token;

            String html = """
                    <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                      <h2 style="color: #c8932a; text-align: center;">UNI-PLACE</h2>
                      <h3 style="text-align: center; color: #333;">비밀번호 재설정</h3>
                      <p style="color: #555; line-height: 1.6;">
                        안녕하세요.<br>
                        비밀번호 재설정 요청이 접수되었습니다.<br>
                        아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
                      </p>
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="%s"
                           style="background-color: #c8932a; color: white; padding: 14px 32px;
                                  text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          비밀번호 재설정
                        </a>
                      </div>
                      <p style="color: #999; font-size: 13px; line-height: 1.5;">
                        ※ 이 링크는 <strong>30분</strong> 후 만료됩니다.<br>
                        ※ 본인이 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.
                      </p>
                      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                      <p style="color: #bbb; font-size: 12px; text-align: center;">UNI-PLACE Co-living Platform</p>
                    </div>
                    """.formatted(resetLink);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("[UNI-PLACE] 비밀번호 재설정 안내");
            helper.setText(html, true);

            mailSender.send(message);
            log.info("[MAIL] 비밀번호 재설정 메일 발송 완료: {}", toEmail);
        } catch (Exception e) {
            log.error("[MAIL] 비밀번호 재설정 메일 발송 실패: {} | reason={}", toEmail, e.getMessage());
        }
    }
}
