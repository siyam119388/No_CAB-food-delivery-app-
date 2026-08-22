package com.nocap.controller;

import com.nocap.model.Rider;
import com.nocap.model.Delivery;
import com.nocap.model.User;
import com.nocap.service.RiderService;
import com.nocap.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/rider")
@CrossOrigin(origins = "*")
public class RiderController {

    @Autowired 
    private RiderService riderService;
    
    @Autowired 
    private AuthService authService;

    // Rider signup
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> request) {
        try {
            User user = new User();
            user.setName(request.get("name"));
            user.setEmail(request.get("email"));
            user.setPassword(request.get("password"));
            user.setPhone(request.get("phone"));
            user.setAddress(request.get("address"));
            
            String nid = request.get("nid");
            User newRider = authService.riderSignup(user, nid);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", newRider.getId());
            response.put("name", newRider.getName());
            response.put("email", newRider.getEmail());
            response.put("role", newRider.getRole());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Signup failed: " + e.getMessage());
        }
    }

    // Get profile
    @GetMapping("/profile/{riderId}")
    public ResponseEntity<?> getProfile(@PathVariable Long riderId) {
        Rider rider = riderService.getRiderProfile(riderId);
        return rider != null ? ResponseEntity.ok(rider) : ResponseEntity.notFound().build();
    }

    // Toggle online
    @PutMapping("/toggle-online/{riderId}")
    public ResponseEntity<?> toggleOnline(@PathVariable Long riderId) {
        Rider updated = riderService.toggleOnlineStatus(riderId);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // Get available deliveries
    @GetMapping("/available-deliveries")
    public ResponseEntity<?> getAvailableDeliveries() {
        List<Delivery> deliveries = riderService.getAvailableDeliveries();
        return ResponseEntity.ok(deliveries);
    }

    // Accept delivery
    @PutMapping("/accept-delivery/{deliveryId}/{riderId}")
    public ResponseEntity<?> acceptDelivery(@PathVariable Long deliveryId, @PathVariable Long riderId) {
        Delivery delivery = riderService.acceptDelivery(deliveryId, riderId);
        return delivery != null ? ResponseEntity.ok(delivery) : ResponseEntity.badRequest().build();
    }

    // Mark picked up
    @PutMapping("/mark-pickup/{deliveryId}")
    public ResponseEntity<?> markPickup(@PathVariable Long deliveryId) {
        Delivery delivery = riderService.markPickedUp(deliveryId);
        return delivery != null ? ResponseEntity.ok(delivery) : ResponseEntity.badRequest().build();
    }

    // Mark delivered
    @PutMapping("/mark-delivered/{deliveryId}")
    public ResponseEntity<?> markDelivered(@PathVariable Long deliveryId) {
        Delivery delivery = riderService.markDelivered(deliveryId);
        return delivery != null ? ResponseEntity.ok(delivery) : ResponseEntity.badRequest().build();
    }

    // Get rider deliveries
    @GetMapping("/deliveries/{riderId}")
    public ResponseEntity<?> getDeliveries(@PathVariable Long riderId) {
        List<Delivery> deliveries = riderService.getRiderDeliveries(riderId);
        return ResponseEntity.ok(deliveries);
    }

    // Approve rider (admin)
    @PutMapping("/approve/{riderId}")
    public ResponseEntity<?> approveRider(@PathVariable Long riderId) {
        Rider rider = riderService.approveRider(riderId);
        return rider != null ? ResponseEntity.ok(rider) : ResponseEntity.notFound().build();
    }

    // Reject rider (admin)
    @PutMapping("/reject/{riderId}")
    public ResponseEntity<?> rejectRider(@PathVariable Long riderId) {
        Rider rider = riderService.rejectRider(riderId);
        return rider != null ? ResponseEntity.ok(rider) : ResponseEntity.notFound().build();
    }
}