package com.nocap.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "hygiene_checks")
public class HygieneCheck {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
//
    @Column(name = "restaurant_id")
    private Long restaurantId;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt = LocalDateTime.now();

    /** Null means the owner never uploaded — that counts as a fail. */
    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "photo_path")
    private String photoPath;//

    private Integer score = 0;
    private Boolean passed = false;
}
