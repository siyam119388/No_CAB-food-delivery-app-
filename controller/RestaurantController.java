package com.nocap.controller;

/* RestaurantController — base path /api/restaurant
   Build in: Part 3 + 4 + 5

   Endpoints:
   GET  /dashboard                   score, today's orders, sales
   POST /documents                   upload trade licence / chef cert / NID
   GET  /verification                current stage + document status
   GET  /menu  |  POST /menu  |  PUT /menu/{id}
   GET  /orders                      new / preparing / completed
   PUT  /orders/{id}/status          accept, reject, mark ready
   GET  /hygiene                     pending check + history
   POST /hygiene/photo               upload kitchen photo
*//

// TODO: @RestController @RequestMapping("/api/restaurant") class
