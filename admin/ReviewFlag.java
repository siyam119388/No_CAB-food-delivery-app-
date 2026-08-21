package com.nocap.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "review_flags")
public class ReviewFlag {

    public enum Decision { PENDING, KEPT, REMOVED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "review_id")
    private Long reviewId;

    /** 0-100. Above 70 the review is hidden and sent to an admin. */
    private Integer confidence;

    /** Comma separated list of the checks that fired. */
    private String signals;

    @Enumerated(EnumType.STRING)
    private Decision decision = Decision.PENDING;

    @Column(name = "decided_by")
    private Long decidedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
