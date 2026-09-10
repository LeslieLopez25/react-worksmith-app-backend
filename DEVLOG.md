# Worksmith — Developer Log

A personal devlog documenting the building process of Worksmith, an all-in-one project documentation tool for developers, designers, animators, and creators of any kind.

---

## April 29, 2026

### Project Kickoff

Started this project as a simple private blog for tracking coding projects. Over the course of planning, the scope evolved into something broader — a full-stack project documentation tool for anyone who needs to track their work, progress, and ideas in one place.

---

### Backend Setup

Initialized the backend with the following stack:

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + bcryptjs + cookie-parser
- **File Uploads:** Multer
- **Environment Variables:** dotenv

---

### Models Created

#### **user.js**

Fields: name, email, password, role, timestamps

Key decisions:

- email set to lowercase: true and trim: true to prevent duplicate account issues
- role enum set to ["user", "admin"] with default of "user" for future admin functionality
- Used Mongoose timestamps: true option instead of manually defining createdAt
- Pre-save hook added to hash passwords with bcrypt before saving
- comparePassword method added to the schema for use during login

**Bugs fixed:**

- Missing const on SALT_WORK_FACTOR — was creating an implicit global
- Mixed ES module import with CommonJS module.exports — standardized to ES modules
- Pre-save hook was using callback style mixed with async/await — refactored to pure async
- bcrypt.genSalt() was being called instead of bcrypt.hash() for the password
- In newer versions of Mongoose, pre-save hook no longer accepts next as a parameter the same way — removed next entirely and used throw err instead
- Missing await on bcrypt.compare() in comparePassword method

---

#### **project.js**

Fields: user (ref), title, description, images, notes, status, timestamps

Key decisions:

- status enum set to ["idea", "in-progress", "on-hold", "completed", "archived"]
- images stored as an array of objects with url and filename
- notes stored as an embedded array with content and createdAt
- user field references the User model via ObjectId

---

#### **task.js**

Fields: title, description, status, project (ref), user (ref), timestamps

Key decisions:

- Added to support a kanban-style board within each project
- status enum set to ["todo", "in-progress", "completed", "revise", "later-plan"] to map to kanban columns on the frontend
- Both project and user are required references via ObjectId
- Project status and task status serve different purposes — project status tracks the overall project state, task status tracks individual task progress within the kanban board

**Bugs fixed:**

- timestamps: true was inside the schema fields object instead of the options object and was capitalized — moved to second argument as { timestamps: true }

---

### Controllers Created

#### **authController.js**

Functions: register, loginUser, logoutUser

Key decisions:

- register checks for existing user by email only — not name or password
- Passwords are never returned in responses
- JWT token is signed on login and stored in an httpOnly cookie
- Cookie is cleared on logout using res.clearCookie()

**Bugs fixed:**

- Missing import statements for bcrypt and jwt
- Duplicate user check was querying by name, email, and password — changed to email only
- Was checking !User (the model) instead of !user (the query result) in login
- No response was being sent after setting the cookie in login — added res.status(200).json()
- clearcookie was lowercase — corrected to clearCookie
- JWT_EXPIRE typo in authController.js didn't match JWT_EXPIRES in .env — added the missing S

---

#### **userController.js**

Functions: getUser, updateUser, updatePassword, deleteUser

Key decisions:

- .select("-password") used on all queries that return user data
- updatePassword uses user.save() instead of findByIdAndUpdate to ensure the pre-save hash hook runs
- deleteUser clears the auth cookie after deleting the account

---

#### **projectController.js**

Functions: createProject, getAllProjects, getProjectById, updateProject, deleteProject

Key decisions:

- All queries filter by both \_id and user to ensure users can only access their own projects
- findOneAndUpdate used instead of findByIdAndUpdate to allow filtering by both \_id and user
- populate("user", "name email") used to return user info with project data

**Bugs fixed:**

- populate() was being passed a filter object instead of a field name string — Mongoose was interpreting it as a callback, causing next is not a function error
- findByIdAndDelete changed to findOneAndDelete to support filtering by both \_id and user

---

#### **taskController.js**

Functions: createTask, getTasksByProject, updateTask, deleteTask

Key decisions:

- Only title is required on task creation — description is optional and status defaults to "todo"
- Tasks are scoped to both a project and a user for security
- populate("project", "title") used to return project title with task data

**Bugs fixed:**

- populate() was being passed a filter object instead of a field name string — same issue as project controller
- tasks.length === 0 used instead of !tasks since find() always returns an array
- id used instead of \_id in update and delete queries — MongoDB uses \_id
- Duplicate import of Task model — removed the lowercase duplicate
- During testing, user ID was accidentally used instead of project ID in the URL — fixed by using the correct project ID

---

### Middleware Created

#### **authMiddleware.js**

Exports: authMiddleware, adminOnly

- authMiddleware reads the JWT from req.cookies.token, verifies it, and attaches the user to req.user
- adminOnly checks req.user.role === "admin" — used after authMiddleware for admin-only routes
- Originally named protect, renamed to authMiddleware for clarity

#### **uploadMiddleware.js**

Exports: upload (default)

- Uses Multer diskStorage to save files to the uploads/ folder
- Files are named with Date.now() + random suffix to prevent collisions
- Allowed file types: image/jpeg, image/png, image/jpg
- File size limit: 5MB

**Bugs fixed:**

- Duplicate filename field in diskStorage config — kept only one
- file.filename referenced before it exists — changed to file.originalname
- cb was being called twice in fileFilter — the error callback was always running even for valid files

---

### Routes Created

- authRoutes.js
- userRoutes.js
- projectRoutes.js
- taskRoutes.js

---

### Server Setup (server.js)

- Express app initialized with express.json(), express.urlencoded(), and cookieParser() middleware
- CORS configured with credentials: true and origin set to FRONTEND_URL env variable
- MongoDB connected via Mongoose using MONGO_URI env variable
- All routes mounted under /api prefix
- Server runs on PORT env variable with fallback to 7000
- setServers from node:dns/promises added as a workaround for a known DNS bug

**Bugs fixed:**

- Route imports named incorrectly — imported as user, auth, etc. but used as userRoutes, authRoutes in app.use() causing reference errors
- cookieParser() was missing — auth middleware reads req.cookies.token and without it the token was always undefined
- Was importing controllers directly instead of route files
- Was using app.get() and app.put() instead of app.use() for mounting routers

---

### API Testing

All routes tested using **Thunder Client** in VS Code.

- Auth Routes
- User Routes
- Project Routes
- Task Routes

---

### Environment Variables Required

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=yourlongrandomunguessablestring
JWT_EXPIRES=1d
FRONTEND_URL=http://localhost:5173
PORT=7000
```

---

## August 23, 2026

### Updated

#### **task.js**

- Added 2 more fields to the task schema; urgency and taskType.
- These 2 new fields will be for the task board on the frontend so that you can add tags showing the level of urgency for your task board items and tags to indicate showing what kind of task it is.

---

## September 9, 2026

### Updated

#### **task.js**

- Added "blocked" to task schema in the enum as another category was added in the frontend.
