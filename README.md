# Store Rating Platform

A full-stack web app where users can rate stores from 1 to 5.
One login page for everyone - what you see after login depends on your role.

**Tech stack:** Node.js + Express (backend), MySQL (database), HTML + CSS + JavaScript (frontend)

## Roles and features

\ Role  What they can do |

| System Administrator | Dashboard (total users / stores / ratings), add users, admins and stores, view and filter all users and stores, see user details (store owners also show their rating) |
| Normal User | Sign up, log in, search stores by name or address, submit and modify a 1-5 rating, change password |
| Store Owner | See average rating of their store and the list of users who rated it, change password |

Every table can be sorted ascending or descending by clicking a column heading.

## Form validations

- **Name:** 20 to 60 characters
- **Address:** maximum 400 characters
- **Password:** 8 to 16 characters, at least one uppercase letter and one special character
- **Email:** standard email format

Validation is done in the browser (for quick feedback) and again on the server (for safety).

## How to run

1. Install [Node.js](https://nodejs.org) and MySQL, and make sure MySQL is running.
2. Open a terminal in the `backend` folder and install packages:
   ```bash
   cd backend
   npm install
   ```
3. Copy `.env.example` to `.env` and put your MySQL password in it.
4. Create the database, tables and demo data (only needed once):
   ```bash
   npm run setup
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. Open **http://localhost:3000** in your browser.

### Demo logins (created by `npm run setup`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@storerating.com | Admin@123 |
| Store Owner | owner@storerating.com | Owner@123 |
| Normal User | user@storerating.com | User@1234 |

## Project structure

```
store-rating-app/
├── backend/
│   ├── server.js            # starts the Express app
│   ├── setup.js             # creates DB + demo data
│   ├── schema.sql           # database tables
│   └── src/
│       ├── db.js            # MySQL connection pool
│       ├── validators.js    # form validation rules
│       ├── utils.js         # safe sorting helper
│       ├── userService.js   # create-user logic
│       ├── middleware/auth.js   # JWT login check + role check
│       └── routes/          # auth, admin, user, owner APIs
└── frontend/
    ├── index.html / signup.html            # login + registration
    ├── admin.html / user.html / owner.html # one page per role
    ├── css/style.css
    └── js/                  # common helpers + one script per page
```

## Database design

- **users** - id, name, email (unique), password_hash, address, role (`admin` / `user` / `owner`)
- **stores** - id, name, email (unique), address, owner_id (unique, links to a user with the owner role)
- **ratings** - id, user_id, store_id, rating (1-5, enforced by a CHECK constraint), with a unique pair
  (user_id, store_id) so one user can only have one rating per store (modifying updates the same row)

## Security notes

- Passwords are hashed with bcrypt, never stored as plain text
- Login uses JWT tokens; every API route checks the token and the role
- SQL queries use placeholders (no SQL injection), and sort columns come from a fixed whitelist

## API summary

| Method | URL | Who |
|--------|-----|-----|
| POST | /api/auth/signup, /api/auth/login | public |
| PUT | /api/auth/password | any logged-in user |
| GET | /api/admin/stats, /users, /users/:id, /stores, /owners/available | admin |
| POST | /api/admin/users, /api/admin/stores | admin |
| GET | /api/stores | normal user |
| POST | /api/stores/:id/rating | normal user |
| GET | /api/owner/dashboard | store owner |



```bash
git init
git add .
git commit -m "Store rating platform"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```
