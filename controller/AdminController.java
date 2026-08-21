package com.nocap.controller;

/* AdminController — base path /api/admin
   Build in: Part 3 + 5 + 6

   Endpoints:
   GET  /dashboard                   counts and alerts
   GET  /verifications               queue by status
   GET  /verifications/{id}          4 stage detail
   POST /verifications/{id}/approve
   POST /verifications/{id}/reject
   GET  /hygiene                     all scores, at risk list
   POST /restaurants/{id}/suspend
   GET  /reviews/flagged             flagged reviews with signals
   POST /reviews/{id}/keep  |  POST /reviews/{id}/remove
*/

// TODO: @RestController @RequestMapping("/api/admin") class
