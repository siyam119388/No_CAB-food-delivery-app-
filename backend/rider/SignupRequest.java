package com.nocap.controller;

import lombok.Data;

@Data
public class SignupRequest {

    private String name;

    private String email;

    private String password;

    private String phone;

    private String address;

    /*
     * Used only for restaurant signup.
     */
    private String restaurantName;

    /*
     * Used only for restaurant signup.
     */
    private String cuisine;

    /*
     * Optional for rider signup.
     *
     * Current frontend may not send NID yet,
     * so backend will use DEFAULT_NID when empty.
     */
    private String nid;
}