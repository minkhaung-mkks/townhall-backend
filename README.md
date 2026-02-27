# 1. Town Hall Board

Town hall board - A place for users to write and post articles to and read the published articles, with content moderation by editors and admins.

Deployment URL : [https://townhall-board.eastus2.cloudapp.azure.com](https://townhall-board.eastus2.cloudapp.azure.com)

---

# 2. Team Members

- Member 1: [Min Khaung Kyaw Swar ( 6712164 )](https://github.com/minkhaung-mkks) 
- Member 2: [Kyaw Zeyar Hein ( 6632106 )](https://github.com/KyawZeyarHein)

---

# 3. Problem Statement & Motivation

## What problem does this system solve?

Users that want user-written articles often rely on social media or forums, which lack structured publishing, version control, and approval before content goes public. This system would let users publish written works while ensuring quality and safety through editor approval and site moderation.

The site could even serve as an online novel site for aspiring writers.

## Who is the target user?

Primary: readers who browse and comment on published works.  
Secondary: creators who want to submit works for publishing.  
Staff: editors who review/approve submissions, and admins who moderate content and users.

## Why does this problem matter?

Without approval and moderation, platforms can quickly fill with low-quality or harmful content. A simple workflow (submit → review → publish) supports community publishing while keeping trust and content quality.

---

# 4. Data Models

## Entity 1: User
Fields: username, email, password, firstname, lastname, bio, role (creator/editor/admin), status (active/suspended/banned), createdAt
Operations: Create, Read, Update, Delete

## Entity 2: Work (published article)
Fields: title, content, authorId, categoryId, tags, status (draft/submitted/approved/rejected/published/hidden), submittedAt, approvedAt, publishedAt, createdAt, updatedAt
Operations: Create, Read, Update, Delete

## Entity 3: Draft (the 5 saved versions of an article)
Fields: title, content, authorId, workId, pinned, createdAt
Operations: Create, Read, Update, Delete

## Entity 4: Comment
Fields: workId, userId, username, body, status (visible/hidden), createdAt, updatedAt
Operations: Create, Read, Update, Delete

## Entity 5: Review
Fields: workId, editorId, decision (approved/rejected), feedback, createdAt
Operations: Create, Read, Update, Delete

## Entity 6: Category
Fields: name, description, createdAt
Operations: Create, Read, Update, Delete

## Entity 7: Like
Fields: userId, workId, createdAt
Operations: Create, Read, Delete

---

# 5. Technology Stack

Frontend: React
Backend: Next.js
Database: MongoDB
Deployment: Azure Virtual Machine

---

# 6. Features

## Home page ( not logged in )

![Home page unlogged](imgs/home_unlogged.png)

Show a stats dashboard regarding the most popular author and works along with distribution of work across genres.

![Home page unlogged 2](imgs/home_2_unlogged.png)

- Browse published works.
- Search and filtering (by title/keyword, author, date)

![Register](imgs/register.png)

Register as a creator / user

![Login](imgs/login.png)

- User authentication with roles (Reader/Creator, Editor, Admin)

## Logged in User

![Logged in home](imgs/logged_home.png)

Logged in users are able to create works, comment and like published articles.

![Create work](imgs/logged_create_work.png)

- Create works with markdown syntax to beautifully render them and submit for review
- Save drafts of your work and pin them if you don't want to delete them by accident.

![Logged article](imgs/logged_article.png)

- Read beautifully rendered works.

![Work comments](imgs/logged_work_comments.png)

- Give the articles likes or comment on them.

![Profile](imgs/logged_profile.png)

- See your profile

![Edit profile](imgs/logged_edit_profile.png)

- Edit your profile

![My works](imgs/logged_my_works.png)

- View and manage your submitted works.

![Edit work](imgs/logged_edit_work.png)

- Edit your existing works.

## Editor

![Editor dashboard](imgs/editor_dashboard.png)

- Editorial dashboard

![Editor approval](imgs/editor_approval.png)

  - Editors can approve/reject works

![Editor approved](imgs/editor_approved.png)

  - Only approved works become publicly visible

## Admin

![Admin manage users](imgs/admin_manage_users.png)

- Admin can manage user access (e.g., suspend/ban)

![Admin manage works](imgs/admin_manage_works.png)

- Admin can remove/hide works that violate rules

![Admin manage comments](imgs/admin_manage_comments.png)

- Admin can hide/delete comments

![Admin manage categories](imgs/admin_manage_categories.png)

- Admin can manage categories

---

# Test Accounts

All accounts use the password: `password123`

| Role | Username | Email | Name | Status |
|------|----------|-------|------|--------|
| Admin | `admin` | admin@test.com | Admin User | active |
| Editor | `editor1` | editor@test.com | John Editor | active |
| Creator | `creator1` | creator1@test.com | Jane Writer | active |
| Creator | `creator2` | creator2@test.com | Bob Author | active |
| Creator | `banned_user` | banned@test.com | Banned User | banned |
| Creator | `suspended_user` | suspended@test.com | Suspended User | suspended |