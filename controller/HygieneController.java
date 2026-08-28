package com.nocap.controller;

import com.nocap.model.HygieneCheck;
import com.nocap.service.HygieneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hygiene")
@CrossOrigin(origins = "*")
public class HygieneController {

    @Autowired
    private HygieneService hygieneService;

    // restaurant.js -> GET /api/hygiene/restaurant/{id}/score
    @GetMapping("/restaurant/{restaurantId}/score")
    public ResponseEntity<?> getScore(@PathVariable Long restaurantId) {
        Map<String, Object> response = new HashMap<>();
        response.put("restaurantId", restaurantId);
        response.put("score", hygieneService.getScore(restaurantId));
        return ResponseEntity.ok(response);
    }

    // restaurant.js -> GET /api/hygiene/restaurant/{id}/checks
    @GetMapping("/restaurant/{restaurantId}/checks")
    public ResponseEntity<List<HygieneCheck>> getChecks(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(hygieneService.getChecksForRestaurant(restaurantId));
    }

    // Owner or system requests a new random check
    @PostMapping("/restaurant/{restaurantId}/request")
    public ResponseEntity<?> requestCheck(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(hygieneService.requestCheck(restaurantId));
    }

    // restaurant.js -> POST /api/hygiene/checks/{id}/submit   body: { photoUrl }
    @PostMapping("/checks/{checkId}/submit")
    public ResponseEntity<?> submitPhoto(@PathVariable Long checkId, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(hygieneService.submitPhoto(checkId, body.get("photoUrl")));
        } catch (Exception e) {
            return badRequest(e.getMessage());
        }
    }

    // restaurant.js -> POST /api/hygiene/checks/{id}/appeal   body: { appealReason }
    @PostMapping("/checks/{checkId}/appeal")
    public ResponseEntity<?> appeal(@PathVariable Long checkId, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(hygieneService.appeal(checkId, body.get("appealReason")));
        } catch (Exception e) {
            return badRequest(e.getMessage());
        }
    }

    private ResponseEntity<?> badRequest(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message != null ? message : "Request failed.");
        return ResponseEntity.badRequest().body(error);
    }
}
