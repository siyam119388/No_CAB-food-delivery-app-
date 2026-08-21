package com.nocap.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "documents")
public class Document {

    public enum Type   { TRADE_LICENCE, CHEF_CERT, OWNER_NID }//
    public enum Status { PENDING, APPROVED, REJECTED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id")
    private Long restaurantId;

    @Enumerated(EnumType.STRING)
    private Type type;

    @Column(name = "file_path")
    private String filePath;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
