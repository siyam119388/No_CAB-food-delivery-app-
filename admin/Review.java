package com.nocap.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reviews")
public class Review {

    public enum Status { VISIBLE, HIDDEN, REMOVED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * NOT NULL and UNIQUE in the database.
     * A review cannot exist without a real delivered order behind it,
     * and one order can only ever produce one review.
     */
    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "restaurant_id")
    private Long restaurantId;

    private Integer rating;
    private String comment;

    @Enumerated(EnumType.STRING)
    private Status status = Status.VISIBLE;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
