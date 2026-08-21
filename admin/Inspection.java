package com.nocap.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inspections")
public class Inspection {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id")
    private Long restaurantId;

    /** Four categories, 25 points each. */
    private Integer cleanliness;
    private Integer storage;

    @Column(name = "staff_hygiene")
    private Integer staffHygiene;

    @Column(name = "waste_control")
    private Integer wasteControl;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "officer_name")
    private String officerName;

    @Column(name = "officer_note")
    private String officerNote;

    @Column(name = "inspected_at")
    private LocalDateTime inspectedAt = LocalDateTime.now();
}
