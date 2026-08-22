package com.nocap.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) //
    private Long id;

    @Column(name = "restaurant_id")
    private Long restaurantId;

    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private Boolean available = true;/
}
