package com.nocap.controller;

import com.nocap.model.Document;
import com.nocap.model.Restaurant;
import com.nocap.repository.RestaurantRepository;
import com.nocap.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/verification")
@CrossOrigin(origins = "*")
public class VerificationController {

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private RestaurantRepository restaurantRepository;

    // restaurant.js -> GET /api/verification/restaurant/{restaurantId}
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<?> getStatus(@PathVariable Long restaurantId) {

        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElse(null);

        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        List<Document> documents = verificationService.getDocuments(restaurantId);

        Map<String, Object> response = new HashMap<>();
        response.put("restaurantId", restaurantId);
        response.put("status", restaurant.getStatus());
        response.put("documents", documents);

        return ResponseEntity.ok(response);
    }
}
