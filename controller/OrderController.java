package com.nocap.controller;

import com.nocap.model.Delivery;
import com.nocap.model.Order;
import com.nocap.model.OrderItem;
import com.nocap.model.Restaurant;
import com.nocap.repository.RestaurantRepository;
import com.nocap.service.DeliveryService;
import com.nocap.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private RestaurantRepository restaurantRepository;

    // ============================================================
    // PLACE ORDER  (customer.js -> POST /api/orders)
    // ============================================================
    @PostMapping("/api/orders")
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> body) {

        try {
            Long customerId = toLong(body.get("customerId"));
            Long restaurantId = toLong(body.get("restaurantId"));
            String address = body.get("address") != null ? String.valueOf(body.get("address")) : null;
            String paymentMethod = body.get("paymentMethod") != null ? String.valueOf(body.get("paymentMethod")) : "COD";

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("orderItems");

            Double deliveryLat = body.get("deliveryLat") != null ? Double.valueOf(String.valueOf(body.get("deliveryLat"))) : null;
            Double deliveryLng = body.get("deliveryLng") != null ? Double.valueOf(String.valueOf(body.get("deliveryLng"))) : null;

            Order order = orderService.placeOrder(customerId, restaurantId, items, address, paymentMethod, deliveryLat, deliveryLng);

            return ResponseEntity.ok(order);

        } catch (Exception e) {
            return badRequest(e.getMessage());
        }
    }

    // ============================================================
    // GET ORDER (with items)  (GET /api/orders/{id})
    // ============================================================
    @GetMapping("/api/orders/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {

        Order order = orderService.getOrderById(id);

        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        List<OrderItem> items = orderService.getOrderItems(id);

        Map<String, Object> response = new HashMap<>();
        response.put("id", order.getId());
        response.put("customerId", order.getCustomerId());
        response.put("restaurantId", order.getRestaurantId());
        response.put("subtotal", order.getSubtotal());
        response.put("deliveryFee", order.getDeliveryFee());
        response.put("total", order.getTotal());
        response.put("paymentMethod", order.getPaymentMethod());
        response.put("address", order.getAddress());
        response.put("status", order.getStatus());
        response.put("createdAt", order.getCreatedAt());
        response.put("items", items);

        // Live map data: restaurant location + (once assigned) the rider's current position
        Restaurant restaurant = restaurantRepository.findById(order.getRestaurantId()).orElse(null);
        if (restaurant != null) {
            response.put("restaurantLat", restaurant.getLatitude());
            response.put("restaurantLng", restaurant.getLongitude());
            response.put("restaurantName", restaurant.getName());
        }

        Delivery delivery = deliveryService.getDeliveryByOrderId(id);
        if (delivery != null && delivery.getRider() != null) {
            response.put("riderId", delivery.getRider().getId());
            response.put("riderName", delivery.getRider().getUser() != null ? delivery.getRider().getUser().getName() : null);
            response.put("riderLat", delivery.getRider().getLatitude());
            response.put("riderLng", delivery.getRider().getLongitude());
        }

        return ResponseEntity.ok(response);
    }

    // ============================================================
    // UPDATE ORDER STATUS  (restaurant.js -> PUT /api/orders/{id})
    // body: { "status": "ACCEPTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "READY" | "CANCELLED" | "REJECTED" }
    // ============================================================
    @PutMapping("/api/orders/{id}")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {

        try {
            Order updated = orderService.updateStatus(id, body.get("status"));
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return badRequest(e.getMessage());
        }
    }

    // ============================================================
    // RESTAURANT'S ORDERS  (restaurant.js -> GET /api/orders/restaurant/{restaurantId})
    // ============================================================
    @GetMapping("/api/orders/restaurant/{restaurantId}")
    public ResponseEntity<List<Order>> getRestaurantOrders(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(orderService.getRestaurantOrders(restaurantId));
    }

    // ============================================================
    // CUSTOMER'S ORDERS  (customer.js -> GET /api/customers/{customerId}/orders)
    // ============================================================
    @GetMapping("/api/customers/{customerId}/orders")
    public ResponseEntity<List<Order>> getCustomerOrders(@PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.getCustomerOrders(customerId));
    }


    private Long toLong(Object value) {
        if (value == null) return null;
        return Long.valueOf(String.valueOf(value));
    }

    private ResponseEntity<?> badRequest(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message != null ? message : "Request failed.");
        return ResponseEntity.badRequest().body(error);
    }
}
