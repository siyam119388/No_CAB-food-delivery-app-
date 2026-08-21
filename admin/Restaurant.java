package com.nocap.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "restaurants")
public class Restaurant {

    /** Customers only ever see APPROVED restaurants. */
    public enum Status { PENDING, APPROVED, REJECTED, SUSPENDED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id")
    private Long ownerId;

    private String name;
    private String address;
    private String cuisine;

    @Column(name = "delivery_fee")
    private BigDecimal deliveryFee = new BigDecimal("50.00");

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @Column(name = "hygiene_score")
    private Integer hygieneScore = 0;

    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
