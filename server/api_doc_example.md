# Movie API Documentation

## Endpoints :

List of available endpoints:


USER : 
- `POST /user/register`
- `POST /user/login`
- `POST /user/google-sign-in`
- `PATCH /user/subscription`
- `POST /user/generate-midtrans-token`

&nbsp;


&nbsp;

## USER
## 1. POST /user/register

Request:
- body:

```json
{
  "email": "string",
  "password": "string",
}
```

_Response (201 - Created)_

```json
{
  "id": "integer",
  "username": "string"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Email is required"
}
OR
{
  "message": "Invalid email format"
}
OR
{
  "message": "Email must be unique"
}
OR
{
  "message": "Name is required"
}
OR
{
  "message": "Password is required"
}
```

&nbsp;

## 2. POST /user/google-sign-in

Request:

- body:

```json
{
  "email": "string",
  "password": "string"
}
```

_Response (200 - OK)_

```json
{
  "access_token": "string",
  "username": "string",
}
```

_Response (201 - Create)_
```json
{
    "access_token": "string",
    "username": "string",
    "role": "string",

}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Email is required"
}
OR
{
  "message": "Password is required"
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid email/password"
}
```

&nbsp;

## 3. POST /user/login

Request:

- body:

```json
{
  "email": "string",
  "password": "string"
}
```

_Response (200 - OK)_

```json
{
  "access_token": "string",
  "username": "string",
  "role": "string",
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Email is required"
}
OR
{
  "message": "Password is required"
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid email/password"
}
```

&nbsp;
## 4. PATCH /user/subscription

Request:
- headers: 

```json
{
  "access_token": "string"
}
```


_Response (201 - updated)_

```json
{
    "msg": `status has been succesfuly updated`
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid email/password"
}
```

&nbsp;

## 5. POST /user/generate-midtrans-token

Request:
- headers: 

```json
{
  "access_token": "string"
}
```


_Response (201 - updated)_

```json
{
    "midtransToken": "string"
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid email/password"
}
```

&nbsp;




## Global Error

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid token"
}
```

_Response (500 - Internal Server Error)_

```json
{
  "message": "Internal server error"
}
```