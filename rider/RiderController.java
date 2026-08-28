package com.nocap.controller;

import com.nocap.model.Rider;
import com.nocap.model.Delivery;
import com.nocap.model.Order;
import com.nocap.model.Restaurant;
import com.nocap.model.User;
import com.nocap.repository.RestaurantRepository;
import com.nocap.repository.UserRepository;
import com.nocap.service.RiderService;
import com.nocap.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/riders")
@CrossOrigin(origins = "*")
public class RiderController {

    @Autowired 
    private RiderService riderService;
    
    @Autowired 
    private AuthService authService;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

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

    // Update profile (phone / address)
    @PutMapping("/{riderId}")
    public ResponseEntity<?> updateProfile(@PathVariable Long riderId, @RequestBody Map<String, Object> body) {
        Rider updated = riderService.updateProfile(riderId, body);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // Toggle online (or set explicitly with body { "isOnline": true|false })
    @PutMapping("/toggle-online/{riderId}")
    public ResponseEntity<?> toggleOnline(@PathVariable Long riderId, @RequestBody(required = false) Map<String, Object> body) {

        Rider updated;

        if (body != null && body.containsKey("isOnline")) {
            updated = riderService.setOnlineStatus(riderId, Boolean.valueOf(String.valueOf(body.get("isOnline"))));
        } else {
            updated = riderService.toggleOnlineStatus(riderId);
        }

        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // Current online/approval status
    @GetMapping("/status/{riderId}")
    public ResponseEntity<?> getStatus(@PathVariable Long riderId) {

        Rider rider = riderService.getRiderProfile(riderId);

        if (rider == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("riderId", rider.getId());
        response.put("isOnline", rider.getIsOnline());
        response.put("status", rider.getStatus());

        return ResponseEntity.ok(response);
    }

    // Rider's average rating
    @GetMapping("/rating/{riderId}")
    public ResponseEntity<?> getRating(@PathVariable Long riderId) {

        Rider rider = riderService.getRiderProfile(riderId);

        if (rider == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("riderId", rider.getId());
        response.put("rating", rider.getRating());

        return ResponseEntity.ok(response);
    }

    // Reviews left for a rider (not modeled per-rider yet — placeholder empty list)
    @GetMapping("/reviews/{riderId}")
    public ResponseEntity<?> getReviews(@PathVariable Long riderId) {
        return ResponseEntity.ok(new java.util.ArrayList<>());
    }

    // Save the rider's current GPS position (called periodically by the rider dashboard while online)
    @PutMapping("/{riderId}/location")
    public ResponseEntity<?> updateLocation(@PathVariable Long riderId, @RequestBody Map<String, String> body) {
        Rider updated = riderService.updateLocation(riderId, body.get("latitude"), body.get("longitude"));
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // Get available deliveries
    @GetMapping("/available-deliveries")
    public ResponseEntity<?> getAvailableDeliveries() {
        List<Delivery> deliveries = riderService.getAvailableDeliveries();
        return ResponseEntity.ok(enrichAll(deliveries));
    }

    // Accept delivery
    @PutMapping("/accept-delivery/{deliveryId}/{riderId}")
    public ResponseEntity<?> acceptDelivery(@PathVariable Long deliveryId, @PathVariable Long riderId) {
        Delivery delivery = riderService.acceptDelivery(deliveryId, riderId);
        return delivery != null ? ResponseEntity.ok(enrich(delivery)) : ResponseEntity.badRequest().build();
    }

    // Decline a delivery before accepting it (it just stays available for another rider)
    @PutMapping("/reject-delivery/{deliveryId}/{riderId}")
    public ResponseEntity<?> rejectDelivery(@PathVariable Long deliveryId, @PathVariable Long riderId) {
        Delivery delivery = riderService.getDeliveryById(deliveryId);
        return delivery != null ? ResponseEntity.ok(enrich(delivery)) : ResponseEntity.notFound().build();
    }

    // Get a single delivery by id
    @GetMapping("/delivery/{deliveryId}")
    public ResponseEntity<?> getDelivery(@PathVariable Long deliveryId) {
        Delivery delivery = riderService.getDeliveryById(deliveryId);
        return delivery != null ? ResponseEntity.ok(enrich(delivery)) : ResponseEntity.notFound().build();
    }

    // Mark picked up
    @PutMapping("/mark-pickup/{deliveryId}")
    public ResponseEntity<?> markPickup(@PathVariable Long deliveryId) {
        Delivery delivery = riderService.markPickedUp(deliveryId);
        return delivery != null ? ResponseEntity.ok(enrich(delivery)) : ResponseEntity.badRequest().build();
    }

    // Mark delivered
    @PutMapping("/mark-delivered/{deliveryId}")
    public ResponseEntity<?> markDelivered(@PathVariable Long deliveryId) {
        Delivery delivery = riderService.markDelivered(deliveryId);
        return delivery != null ? ResponseEntity.ok(enrich(delivery)) : ResponseEntity.badRequest().build();
    }

    // Get rider deliveries
    @GetMapping("/deliveries/{riderId}")
    public ResponseEntity<?> getDeliveries(@PathVariable Long riderId) {
        List<Delivery> deliveries = riderService.getRiderDeliveries(riderId);
        return ResponseEntity.ok(enrichAll(deliveries));
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


    // ============================================================
    // RESPONSE ENRICHMENT
    // ============================================================
    //
    // Order only stores restaurantId/customerId, so the rider screens
    // (which expect delivery.order.restaurant.name/address and
    // delivery.order.customer.name/phone/address) get those nested
    // objects filled in here rather than left blank.
    //

    private List<Map<String, Object>> enrichAll(List<Delivery> deliveries) {
        return deliveries.stream().map(this::enrich).collect(java.util.stream.Collectors.toList());
    }

    private Map<String, Object> enrich(Delivery delivery) {

        Map<String, Object> result = new HashMap<>();
        result.put("id", delivery.getId());
        result.put("status", delivery.getStatus());
        result.put("pickupTime", delivery.getPickupTime());
        result.put("deliveryTime", delivery.getDeliveryTime());
        result.put("deliveryFee", delivery.getDeliveryFee());
        result.put("distanceKm", delivery.getDistanceKm());
        result.put("createdAt", delivery.getCreatedAt());

        Order order = delivery.getOrder();

        if (order != null) {

            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("id", order.getId());
            orderMap.put("status", order.getStatus());
            orderMap.put("total", order.getTotal());
            orderMap.put("address", order.getAddress());
            orderMap.put("deliveryLat", order.getDeliveryLat());
            orderMap.put("deliveryLng", order.getDeliveryLng());

            Restaurant restaurant = restaurantRepository.findById(order.getRestaurantId()).orElse(null);
            if (restaurant != null) {
                Map<String, Object> restaurantMap = new HashMap<>();
                restaurantMap.put("name", restaurant.getName());
                restaurantMap.put("address", restaurant.getAddress());
                restaurantMap.put("latitude", restaurant.getLatitude());
                restaurantMap.put("longitude", restaurant.getLongitude());
                orderMap.put("restaurant", restaurantMap);
            }

            User customer = userRepository.findById(order.getCustomerId()).orElse(null);
            if (customer != null) {
                Map<String, Object> customerMap = new HashMap<>();
                customerMap.put("name", customer.getName());
                customerMap.put("phone", customer.getPhone());
                customerMap.put("address", customer.getAddress());
                orderMap.put("customer", customerMap);
            }

            result.put("order", orderMap);
        }

        return result;
    }
}