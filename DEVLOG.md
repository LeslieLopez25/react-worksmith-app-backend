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

## October 24, 2026

- Added isDraft and projectType in project.js

## October 27, 2026

- Updated project schema to have description added to it.

## November 12, 2026

- Added `publicId` to each image in the images array so the file can be removed from Cloudinary when an image card is replaced or deleted.

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

## November 4, 2026

- Added urgency and taskType to task schema.

---

### Controllers Created

#### **authController.js**

Functions: register, loginUser, logoutUser

Key decisions:

- register checks for existing user by email only — not name or password
- Passwords are never returned in responses
- JWT token is signed on login and stored in an httpOnly cookie
- Cookie is cleared on logout using res.clearCookie()

## October 17, 2026

- Added getMe route.

## October 22, 2026

- Updated authController to return the user data and set the cookie.

**Bugs fixed:**

- Missing import statements for bcrypt and jwt
- Duplicate user check was querying by name, email, and password — changed to email only
- Was checking !User (the model) instead of !user (the query result) in login
- No response was being sent after setting the cookie in login — added res.status(200).json()
- Clearcookie was lowercase — corrected to clearCookie
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

## October 24, 2026

- Added filter for drafts in the controller to only return non-draft projects.

## October 24, 2026

- Updated projectController by adding projectType, status, and isDraft to createProject function.

## November 9, 2026

- Created a function to upload the image adding all its logic.

**Bugs fixed:**

- populate() was being passed a filter object instead of a field name string — Mongoose was interpreting it as a callback, causing next is not a function error
- findByIdAndDelete changed to findOneAndDelete to support filtering by both \_id and user

## November 12, 2026

- Added updateProjectImage, deleteProjectImage, updateProjectNote, and deleteProjectNote.
- Each one finds the project by `_id` and `user`, then finds the image or note with `.id()` and removes it with `.pull()`, so only that one item is changed.
- updateProjectImage changes the title and description, and can optionally replace the image. A replacement is uploaded to Cloudinary, and the old file is deleted only after the save succeeds.
- deleteProjectImage removes the card and its Cloudinary file using `publicId`.
- updateProjectNote only changes the content, so the note keeps its original timestamp.
- Added two small helpers, findOwnedProject and removeTempFile, to keep the new functions short.
- addProjectImage now saves the Cloudinary `publicId` along with the url, title, and description.

**Security fixes:**

- getProjectById now filters by `user` as well as `_id`. Before, any logged-in user could open another user's project if they had its ID.
- getProjectById checks that the ID is valid and returns a generic error message instead of the raw Mongoose message.
- updateProject now only accepts title, description, status, projectType, isDraft, and notes instead of passing `req.body` straight through. Images are only changed through the image routes. Passing everything through would have let a user overwrite fields like `user` or an image's `publicId`.
- Added `runValidators: true` to updateProject so the status and project type enums are enforced on updates.

**Bugs fixed:**

- Forgot to import `mongoose` in the controller. getProjectById threw a ReferenceError, the 500 response was hidden behind the frontend's "Project not found" message, and every project failed to load.

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

## November 12, 2026

- createTask now checks that the project in the URL belongs to the logged-in user before creating the task.
- updateTask now only accepts title, description, status, urgency, and taskType, with `runValidators: true`, so a user can't change a task's `project` or `user`.
- getTasksByProject no longer returns a 404 when a project has no tasks. An empty board isn't an error, and it was showing a red toast every time an empty board was opened.

## November 4, 2026

- Added urgency and taskType to create task and removed !description only having !title as it is checked in the frontend.

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

## November 9, 2026

- Replaced the filename function.

**Bugs fixed:**

- Duplicate filename field in diskStorage config — kept only one
- file.filename referenced before it exists — changed to file.originalname
- cb was being called twice in fileFilter — the error callback was always running even for valid files

## November 12, 2026

- The filename function now keeps the original file extension using `path.extname`. Before, names looked like `photo.png-1730...` with the extension in the middle.

---

### Utils Created

#### **cloudinary.js**

- Configured the Cloudinary v2 SDK with the cloud name, API key, and API secret from the environment variables.
- Added `import "dotenv/config"` at the top of the file. Imports run before `dotenv.config()` in server.js, so without it all three values were undefined.

**Bugs fixed:**

- Mixed ES module `import` with CommonJS `module.exports` — standardized to ES modules.
- Imported the default `cloudinary` instead of `v2`.

---

### Routes Created

- authRoutes.js
- userRoutes.js
- projectRoutes.js
- taskRoutes.js

## November 9, 2026

- Added addProjectImage route with the other existing routes.

## November 12, 2026

- Added `PATCH /api/projects/:id/images/:imageId` and `DELETE /api/projects/:id/images/:imageId`.
- Added `PATCH /api/projects/:id/notes/:noteId` and `DELETE /api/projects/:id/notes/:noteId`.
- Moved the Multer wrapper into one reusable function, uploadSingleImage, used by both the upload and the edit image routes. It turns Multer errors (wrong file type, file over 5MB) into a JSON message so the toast on the frontend can show it, instead of Express sending back an HTML error page.

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

## November 12, 2026

- Tested the new image and note routes through the frontend: edit title and description, replace an image, delete an image card, edit a note, delete a note.
- Confirmed in the Cloudinary media library that replaced and deleted images are removed from the `worksmith` folder and that no leftover files stay in `uploads/`.

---

### Environment Variables Required

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=yourlongrandomunguessablestring
JWT_EXPIRES=1d
FRONTEND_URL=http://localhost:5173
PORT=7000
```

## November 12, 2026

- Added the Cloudinary values:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_api_secret
```

---

## August 23, 2026

#### **task.js**

- Added 2 more fields to the task schema; urgency and taskType.
- These 2 new fields will be for the task board on the frontend so that you can add tags showing the level of urgency for your task board items and tags to indicate showing what kind of task it is.

---

## September 9, 2026

#### **task.js**

- Added "blocked" to task schema in the enum as another category was added in the frontend.

---

## October 17, 2026

#### **authRoutes.js**

- Added getMe to authRoutes file.
