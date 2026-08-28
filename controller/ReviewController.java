package com.nocap.controller;

import com.nocap.model.Review;
import com.nocap.service.ReviewCheckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewCheckService reviewCheckService;

    // orders.html "Submit Review" -> POST /api/reviews
    // body: { orderId, rating, comment }
    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> body) {

        try {
            Long orderId = Long.valueOf(String.valueOf(body.get("orderId")));
            Integer rating = Integer.valueOf(String.valueOf(body.get("rating")));
            String comment = body.get("comment") != null ? String.valueOf(body.get("comment")) : "";

            Review review = reviewCheckService.submitReview(orderId, rating, comment);

            return ResponseEntity.ok(review);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null ? e.getMessage() : "Could not submit review.");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // restaurant public page -> GET /api/reviews/restaurant/{restaurantId}
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Review>> getRestaurantReviews(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewCheckService.getVisibleReviews(restaurantId));
    }
}
