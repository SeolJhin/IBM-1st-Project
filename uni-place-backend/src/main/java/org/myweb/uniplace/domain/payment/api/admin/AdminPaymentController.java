package org.myweb.uniplace.domain.payment.api.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentRepository paymentRepository;

    @GetMapping
    public List<Payment> findAll() {
        return paymentRepository.findAll();
    }

    @GetMapping("/{id}")
    public Payment findOne(@PathVariable("id") Integer id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
    }
}
