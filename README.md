# 🎬 Video Hosting Platform – Backend

This project is a full-featured backend for a video hosting and micro-content platform, inspired by services like **YouTube** and **Twitter/X**. It provides scalable APIs for user authentication, video management, playlists, tweets, likes, comments, and creator analytics.

> ✅ Production-ready backend  
> 🚀 Frontend under development

---

## 📌 Highlights

- 🔐 JWT Authentication with refresh tokens
- 📼 Upload and manage videos & thumbnails
- 📝 Micro-content (tweet-style posts)
- 💬 Comments, likes, playlists
- 📊 Analytics for creators
- 🌐 RESTful API structure

---

## 📁 API Features

### 🧑‍💻 User & Auth
- Sign up, log in, log out
- Refresh tokens for session management
- Update profile, avatar, and account info

### 🎥 Video Module
- Upload videos and thumbnails
- Track views, likes, and engagement
- Comment support
- Like/unlike toggle system

### ✏️ Tweets (Short Posts)
- Post, edit, delete micro-content
- Like/unlike tweets
- View personal and timeline feeds

### 💬 Comment System
- Add, update, delete comments on videos
- Like/unlike comments
- View comment threads with user metadata

### 📚 Playlists
- Create, update, delete playlists
- Add or remove videos
- View complete playlist contents

### ❤️ Likes
- Toggle likes on videos, tweets, comments
- View most liked videos
- Get user’s liked content list

### 🔔 Subscriptions
- Subscribe/unsubscribe to creators
- View subscriber count and list

### 📊 Creator Dashboard
- View profile stats (uploads, likes, views)
- Track most popular content
- Recent uploads and engagement logs

---

## 🧰 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT + Refresh Tokens
- **File Uploads**: Multer + Cloudinary
- **Dev Tools**: Nodemon, ESLint, Prettier

---

## 🗂 Directory Structure

```
src/
├── controllers/      # Business logic for each route
├── models/           # Mongoose schemas
├── routes/           # API route definitions
├── middlewares/      # Authentication, error handlers
├── utils/            # Custom helpers, error/response classes
├── app.js            # Main express app
└── index.js          # Entry point
```

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/PrafullShinde28/Backend_Project.git
cd Backend_Project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

Create a `.env` file with the following:

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/your-db-name

JWT_SECRET=your_jwt_secret
JWT_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Start Development Server

```bash
npm run dev
```

---

## 🙏 Credits

This project was built as a learning and production exercise based on modern backend architecture.  
Special thanks to **Hitesh Choudhary** for providing guidance and inspiration.

---

## 📬 Feedback

Have suggestions or found bugs?

- 🌟 Star this repository to support
- 🛠 Open an issue to contribute
- 🤝 Fork and submit a pull request

---

## 👤 Maintainer

**Prafull**  
📧 Email: [prafullshinde7007@gmail.com](mailto:prafullshinde7007@gmail.com)  
🔗 LinkedIn: [linkedin.com/in/prafull-shinde-0b8ab62b1](https://www.linkedin.com/in/prafull-shinde-0b8ab62b1)  
💻 GitHub: [PrafullShinde28](https://github.com/PrafullShinde28)

---
