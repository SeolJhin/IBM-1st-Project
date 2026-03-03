package org.myweb.uniplace.domain.payment.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGateway;
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGatewayFactory;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyResponse;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentAttempt;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntentStatus;
import org.myweb.uniplace.domain.payment.domain.entity.ServiceGoods;
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.payment.repository.ServiceGoodsRepository;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaymentIntentRepository paymentIntentRepository;
    @Mock
    private PaymentGatewayFactory paymentGatewayFactory;
    @Mock
    private PaymentAttemptService paymentAttemptService;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private MonthlyChargeRepository monthlyChargeRepository;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private ServiceGoodsRepository serviceGoodsRepository;
    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "objectMapper", new ObjectMapper());
        ReflectionTestUtils.setField(paymentService, "appBaseUrl", "http://localhost:8080");
    }

    @Test
    @DisplayName("prepare(order): payment/intent 생성 후 ready 응답")
    void prepareOrderSuccess() {
        String userId = "user-1";
        BigDecimal total = new BigDecimal("50000");

        PaymentPrepareRequest request = new PaymentPrepareRequest();
        request.setServiceGoodsId(1);
        request.setProvider("TOSS");
        request.setOrderId(10);

        User user = user(userId);
        Order order = Order.builder()
            .orderId(10)
            .user(user)
            .orderSt(OrderStatus.ordered)
            .totalPrice(total)
            .build();

        ServiceGoods goods = ServiceGoods.builder()
            .serviceGoodsId(1)
            .serviceGoodsCd("order")
            .serviceGoodsNm("room-service")
            .isActive(1)
            .build();

        PaymentGatewayReadyResponse ready = PaymentGatewayReadyResponse.builder()
            .providerRefId("pref-1")
            .redirectPcUrl("https://pc")
            .redirectMobileUrl("https://mobile")
            .redirectAppUrl("app://pay")
            .pgReadyJson("{\"ok\":true}")
            .build();

        given(orderRepository.findById(10)).willReturn(Optional.of(order));
        given(serviceGoodsRepository.findById(1)).willReturn(Optional.of(goods));
        given(paymentGatewayFactory.get("TOSS")).willReturn(paymentGateway);
        given(paymentGateway.ready(any(PaymentGatewayReadyRequest.class))).willReturn(ready);
        given(paymentRepository.save(any(Payment.class))).willAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            ReflectionTestUtils.setField(p, "paymentId", 100);
            return p;
        });
        given(paymentIntentRepository.save(any(PaymentIntent.class))).willAnswer(invocation -> invocation.getArgument(0));

        PaymentPrepareResponse response = paymentService.prepare(userId, request);

        assertThat(response.getPaymentId()).isEqualTo(100);
        assertThat(response.getPaymentSt()).isEqualTo("ready");
        assertThat(response.getProviderRefId()).isEqualTo("pref-1");

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        Payment savedPayment = paymentCaptor.getValue();
        assertThat(savedPayment.getTargetType()).isEqualTo("order");
        assertThat(savedPayment.getTargetId()).isEqualTo(10);
        assertThat(savedPayment.getTotalPrice()).isEqualByComparingTo(total);

        ArgumentCaptor<PaymentGatewayReadyRequest> readyCaptor = ArgumentCaptor.forClass(PaymentGatewayReadyRequest.class);
        verify(paymentGateway).ready(readyCaptor.capture());
        assertThat(readyCaptor.getValue().getTotalPrice()).isEqualByComparingTo(total);
        assertThat(readyCaptor.getValue().getItemName()).isEqualTo("room-service");

        ArgumentCaptor<PaymentIntent> intentCaptor = ArgumentCaptor.forClass(PaymentIntent.class);
        verify(paymentIntentRepository).save(intentCaptor.capture());
        assertThat(intentCaptor.getValue().getPaymentId()).isEqualTo(100);
        assertThat(intentCaptor.getValue().getIntentSt()).isEqualTo(PaymentIntentStatus.READY_OK);
    }

    @Test
    @DisplayName("approve(order): 상태/금액 일치 시 payment paid + order paid")
    void approveOrderSuccess() {
        String userId = "user-1";
        BigDecimal total = new BigDecimal("50000");

        Payment payment = Payment.builder()
            .paymentId(1)
            .userId(userId)
            .serviceGoodsId(1)
            .provider("TOSS")
            .merchantUid("PAY_1")
            .currency("KRW")
            .totalPrice(total)
            .capturedPrice(BigDecimal.ZERO)
            .paymentSt("ready")
            .targetType("order")
            .targetId(10)
            .build();

        User user = user(userId);
        Order order = Order.builder()
            .orderId(10)
            .user(user)
            .orderSt(OrderStatus.ordered)
            .totalPrice(total)
            .paymentId(null)
            .build();

        PaymentIntent intent = PaymentIntent.builder()
            .paymentIntentId(5L)
            .paymentId(1)
            .intentSt(PaymentIntentStatus.READY_OK)
            .providerRefId("pref-1")
            .build();

        PaymentGatewayApproveResponse approve = PaymentGatewayApproveResponse.builder()
            .providerPaymentId("provider-1")
            .gatewayStatus("APPROVED")
            .merchantUid("PAY_1")
            .currency("KRW")
            .capturedPrice(total)
            .pgApproveJson("{\"status\":\"APPROVED\"}")
            .build();

        PaymentApproveRequest request = new PaymentApproveRequest();
        request.setPaymentId(1);
        request.setPgToken("pg-token");

        given(paymentRepository.findById(1)).willReturn(Optional.of(payment));
        given(orderRepository.findById(10)).willReturn(Optional.of(order));
        given(paymentIntentRepository.findTopByPaymentIdOrderByPaymentIntentIdDesc(1)).willReturn(Optional.of(intent));
        given(paymentGatewayFactory.get("TOSS")).willReturn(paymentGateway);
        given(paymentGateway.approve(any(PaymentGatewayApproveRequest.class))).willReturn(approve);
        given(paymentRepository.findByProviderAndProviderPaymentId("TOSS", "provider-1")).willReturn(Optional.empty());
        given(paymentRepository.save(any(Payment.class))).willAnswer(invocation -> invocation.getArgument(0));
        given(paymentIntentRepository.save(any(PaymentIntent.class))).willAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.approve(userId, request);

        assertThat(response.getPaymentId()).isEqualTo(1);
        assertThat(response.getPaymentSt()).isEqualTo("paid");
        assertThat(payment.getPaymentSt()).isEqualTo("paid");
        assertThat(payment.getProviderPaymentId()).isEqualTo("provider-1");
        assertThat(order.getOrderSt()).isEqualTo(OrderStatus.paid);
        assertThat(order.getPaymentId()).isEqualTo(1);

        verify(paymentAttemptService).recordAttemptSt(1, PaymentAttempt.AttemptSt.requested);
        verify(paymentAttemptService).recordAttemptSt(1, PaymentAttempt.AttemptSt.approved);
    }

    @Test
    @DisplayName("approve(monthly_charge): 승인 성공 시 charge paid + payment_id 연결")
    void approveMonthlyChargeSuccess() {
        String userId = "user-1";
        BigDecimal total = new BigDecimal("800000");

        Payment payment = Payment.builder()
            .paymentId(2)
            .userId(userId)
            .serviceGoodsId(2)
            .provider("TOSS")
            .merchantUid("PAY_2")
            .currency("KRW")
            .totalPrice(total)
            .capturedPrice(BigDecimal.ZERO)
            .paymentSt("ready")
            .targetType("monthly_charge")
            .targetId(20)
            .build();

        MonthlyCharge charge = MonthlyCharge.builder()
            .chargeId(20)
            .contractId(300)
            .chargeType("rent")
            .billingDt("2026-02")
            .price(total)
            .chargeSt(MonthlyCharge.ST_UNPAID)
            .build();

        PaymentIntent intent = PaymentIntent.builder()
            .paymentIntentId(6L)
            .paymentId(2)
            .intentSt(PaymentIntentStatus.READY_OK)
            .providerRefId("pref-2")
            .build();

        PaymentGatewayApproveResponse approve = PaymentGatewayApproveResponse.builder()
            .providerPaymentId("provider-2")
            .gatewayStatus("APPROVED")
            .merchantUid("PAY_2")
            .currency("KRW")
            .capturedPrice(total)
            .pgApproveJson("{\"status\":\"APPROVED\"}")
            .build();

        PaymentApproveRequest request = new PaymentApproveRequest();
        request.setPaymentId(2);
        request.setPgToken("pg-token");

        given(paymentRepository.findById(2)).willReturn(Optional.of(payment));
        given(monthlyChargeRepository.findById(20)).willReturn(Optional.of(charge));
        given(contractRepository.findById(300)).willReturn(Optional.of(contract(300, ContractStatus.active)));
        given(paymentIntentRepository.findTopByPaymentIdOrderByPaymentIntentIdDesc(2)).willReturn(Optional.of(intent));
        given(paymentGatewayFactory.get("TOSS")).willReturn(paymentGateway);
        given(paymentGateway.approve(any(PaymentGatewayApproveRequest.class))).willReturn(approve);
        given(paymentRepository.findByProviderAndProviderPaymentId("TOSS", "provider-2")).willReturn(Optional.empty());
        given(paymentRepository.save(any(Payment.class))).willAnswer(invocation -> invocation.getArgument(0));
        given(paymentIntentRepository.save(any(PaymentIntent.class))).willAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.approve(userId, request);

        assertThat(response.getPaymentSt()).isEqualTo("paid");
        assertThat(charge.getChargeSt()).isEqualTo(MonthlyCharge.ST_PAID);
        assertThat(charge.getPaymentId()).isEqualTo(2);
    }

    @Test
    @DisplayName("approve(monthly_charge): overdue 청구는 결제할 수 없다")
    void approveMonthlyChargeFailsWhenOverdue() {
        String userId = "user-1";
        BigDecimal total = new BigDecimal("800000");

        Payment payment = Payment.builder()
            .paymentId(22)
            .userId(userId)
            .serviceGoodsId(2)
            .provider("TOSS")
            .merchantUid("PAY_22")
            .currency("KRW")
            .totalPrice(total)
            .capturedPrice(BigDecimal.ZERO)
            .paymentSt("ready")
            .targetType("monthly_charge")
            .targetId(220)
            .build();

        MonthlyCharge charge = MonthlyCharge.builder()
            .chargeId(220)
            .contractId(330)
            .chargeType("rent")
            .billingDt("2026-02")
            .price(total)
            .chargeSt("overdue")
            .build();

        PaymentApproveRequest request = new PaymentApproveRequest();
        request.setPaymentId(22);
        request.setPgToken("pg-token");

        given(paymentRepository.findById(22)).willReturn(Optional.of(payment));
        given(monthlyChargeRepository.findById(220)).willReturn(Optional.of(charge));
        given(contractRepository.findById(330)).willReturn(Optional.of(contract(330, ContractStatus.active)));

        assertThatThrownBy(() -> paymentService.approve(userId, request))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getErrorCode())
            .isEqualTo(ErrorCode.BILLING_CHARGE_ALREADY_PAID);

        verify(paymentGatewayFactory, never()).get(any());
    }

    @Test
    @DisplayName("approve: 이미 paid면 멱등으로 동일 결과 반환")
    void approveIdempotentWhenAlreadyPaid() {
        LocalDateTime paidAt = LocalDateTime.now().minusMinutes(1);
        Payment payment = Payment.builder()
            .paymentId(3)
            .userId("user-1")
            .provider("TOSS")
            .merchantUid("PAY_3")
            .currency("KRW")
            .totalPrice(new BigDecimal("10000"))
            .paymentSt("paid")
            .paidAt(paidAt)
            .targetType("order")
            .targetId(99)
            .serviceGoodsId(1)
            .build();

        PaymentApproveRequest request = new PaymentApproveRequest();
        request.setPaymentId(3);
        request.setPgToken("anything");

        given(paymentRepository.findById(3)).willReturn(Optional.of(payment));

        PaymentResponse response = paymentService.approve("user-1", request);

        assertThat(response.getPaymentId()).isEqualTo(3);
        assertThat(response.getPaymentSt()).isEqualTo("paid");
        assertThat(response.getPaidAt()).isEqualTo(paidAt);
        verify(paymentGatewayFactory, never()).get(any());
        verify(paymentAttemptService, never()).recordAttemptSt(any(), any());
    }

    @Test
    @DisplayName("approve: 금액/정합성 불일치면 PAYMENT_INVALID_TARGET")
    void approveFailsWhenAmountMismatch() {
        String userId = "user-1";
        BigDecimal total = new BigDecimal("50000");

        Payment payment = Payment.builder()
            .paymentId(4)
            .userId(userId)
            .serviceGoodsId(1)
            .provider("TOSS")
            .merchantUid("PAY_4")
            .currency("KRW")
            .totalPrice(total)
            .capturedPrice(BigDecimal.ZERO)
            .paymentSt("ready")
            .targetType("order")
            .targetId(40)
            .build();

        User user = user(userId);
        Order order = Order.builder()
            .orderId(40)
            .user(user)
            .orderSt(OrderStatus.ordered)
            .totalPrice(total)
            .build();

        PaymentIntent intent = PaymentIntent.builder()
            .paymentIntentId(7L)
            .paymentId(4)
            .intentSt(PaymentIntentStatus.READY_OK)
            .providerRefId("pref-4")
            .build();

        PaymentGatewayApproveResponse approve = PaymentGatewayApproveResponse.builder()
            .providerPaymentId("provider-4")
            .gatewayStatus("APPROVED")
            .merchantUid("PAY_4")
            .currency("KRW")
            .capturedPrice(new BigDecimal("40000"))
            .build();

        PaymentApproveRequest request = new PaymentApproveRequest();
        request.setPaymentId(4);
        request.setPgToken("pg-token");

        given(paymentRepository.findById(4)).willReturn(Optional.of(payment));
        given(orderRepository.findById(40)).willReturn(Optional.of(order));
        given(paymentIntentRepository.findTopByPaymentIdOrderByPaymentIntentIdDesc(4)).willReturn(Optional.of(intent));
        given(paymentGatewayFactory.get("TOSS")).willReturn(paymentGateway);
        given(paymentGateway.approve(any(PaymentGatewayApproveRequest.class))).willReturn(approve);
        given(paymentIntentRepository.save(any(PaymentIntent.class))).willAnswer(invocation -> invocation.getArgument(0));

        assertThatThrownBy(() -> paymentService.approve(userId, request))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getErrorCode())
            .isEqualTo(ErrorCode.PAYMENT_INVALID_TARGET);

        verify(paymentAttemptService).recordAttemptSt(4, PaymentAttempt.AttemptSt.requested);
        verify(paymentAttemptService).recordAttemptSt(4, PaymentAttempt.AttemptSt.failed);
    }

    private static User user(String userId) {
        return User.builder()
            .userId(userId)
            .userNm("tester")
            .userEmail("tester@example.com")
            .userPwd("pwd")
            .userBirth(LocalDate.of(1999, 1, 1))
            .userTel("010-1111-2222")
            .userRole(UserRole.user)
            .userSt(UserStatus.active)
            .deleteYN("N")
            .firstSign("N")
            .build();
    }

    private static Contract contract(Integer contractId, ContractStatus status) {
        return Contract.builder()
            .contractId(contractId)
            .contractSt(status)
            .build();
    }
}
