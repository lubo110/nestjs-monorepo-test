# API Documentation (2019/11/18) - v1.0

- API User Endpoints - Get a token by contacting an inCare administrator
  - [Register a new user](#post-medical-v1-register)
  - [Verify a user phone number](#post-medical-v1-verify-username-code)
- Regular User Endpoints - Get a token though a login
  - [Login](#post-medical-v1-login)

API URL： https://dev.intelliances.com/api/

---

## POST medical/v1/register

> Register a regular user

Header

- Authorization: "Bearer " + API_KEY
- Content-Type: application/json

Body

- username: String `Username of the user`
- password: String `Password of the user`
- phone: String (only "+" and numbers, unique for mobile)
- email: String
- gender: String
- birthday: String
- role: String `What type of user` - `put regular`
- phone: String `Phone number of the user in the format +(country code)(phone number)`

Response

```json
{
  "code": 0,
  "status": "created",
  "username": "name"
}
```

Response Fields

- status: created | user already exists
- username: `the user's username you wanted to create`

---

## POST medical/v1/verify/:username/:code

> Verify user phone number with SMS code

Header

- Authorization: "Bearer " + API_KEY

Response

```json
{
  "code": 0,
  "status": "verified"
}
```

Response Fields

- status: verified | already verified

---

## POST medical/v1/login

> User's login

Header

- Authorization: "Bearer " + API_KEY
- platform: mobile|web

Body

- identifier: String (username for web|phone for mobile)
- password: String

Response

```json
{
  "code": 0,
  "access_token": "eyJhbGciOiJIUzINiIsInR5cCI6kpXVCQXOxjtiMHuQlGQVvEggdVWxAoM",
  "role": "regular",
  "status": "verified"
}
```

Response Fields

- access_token: `the user's token`
- role: regular
- status: verified | not verified

---

## PUT medical/v1/user/complete

> Complete user registration data

Header

- Authorization: "Bearer " + API_KEY
- Content-Type: application/json

Body

- phone: String (only "+" and numbers, unique for mobile)
- email: String
- gender: String
- birthday: String
- profile_image: String (Base64)

Response

```json
{
  "code": 0,
  "status": "user updated || user not found"
}
```

---
