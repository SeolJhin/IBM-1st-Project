package org.myweb.uniplace.domain.payment.api.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.myweb.uniplace.domain.payment.repository.PaymentRefundRepository;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentRefund;

import java.util.List;

@RestController
@RequestMapping("/admin/refunds")
@RequiredArgsConstructor
public class AdminRefundController {

    private final PaymentRefundRepository paymentRefundRepository;

    @GetMapping
    public List<PaymentRefund> findAll() {
        return paymentRefundRepository.findAll();
    }
}
