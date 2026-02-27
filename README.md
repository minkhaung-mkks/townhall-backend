# Town Hall Board

Town hall board - A place for users to write and post articles to and read the published articles, with content moderation by editors and admins.

---

# 2. Team Members

- Member 1: Min Khaung Kyaw Swar
- Member 2: Kyaw Zeyar Hein

---

# 6. Technology Stack

Frontend: React  
Backend: Next.js  
Database: MongoDB  
Deployment: Azure Virtual Machine

--

# 3. Problem Statement & Motivation

## What problem does this system solve?

User that want user-written articles often rely on social media or forums, which lack structured publishing, version control, and approval before content goes public. This system would let users publish written works while ensuring quality and safety through editor approval and site moderation.

The site could even serve as an online novel site for aspiring writers.

## Who is the target user?

Primary: readers who browse and comment on published works.  
Secondary: creators who want to submit works for publishing.  
Staff: editors who review/approve submissions, and admins who moderate content and users.

## Why does this problem matter?

Without approval and moderation, platforms can quickly fill with low-quality or harmful content. A simple workflow (submit → review → publish) supports community publishing while keeping trust and content quality.

---

# 5. Data Models

## Entity 1: User
Fields: name, email, passwordHash, role (creator/editor/admin), bio, status (active/suspended), createdAt  
Operations: Create, Read, Update, Delete

## Entity 2: Work (published article)
Fields: title, content, authorId, tags, categoryId, status (draft/submitted/approved/rejected/published/hidden), submittedAt, approvedAt, publishedAt, createAt, updatedAt  
Operations: Create, Read, Update, Delete

## Entity 3: Drafts (the 5 saved versions of an article )
Fields: title, content, authorId, workId, pinned ( don’t delete ), createdAt  
Operations: Create, Read, Update, Delete

## Entity 4: Comment
Fields: workId, userId, body, status (visible/hidden), createdAt, updatedAt  
Operations: Create, Read, Update, Delete

## Entity 5: Review
Fields: workId, editorId, decision (approved/rejected), feedback (optional), createdAt  
Operations: Create, Read, Update, Delete

## Entity 6: Category
Fields: name, description  
Operations: Create, Read, Update, Delete

---



# Features

## Home page ( not logged in )

![Home page unlogged](imgs/home_unlogged.png)

Show the a stats dashboard regarding the most popular author and works along with distribution of work across genres.

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

- Read beautiful rendered works.

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

- Comment system on published works (create/edit/delete own comments)