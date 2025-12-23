const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
require("express-async-errors");
global.StatusCodes = require("http-status-codes").StatusCodes;

// WebSocket and HTTP/HTTPS server setup
const { Server } = require("socket.io");
const useHttps = process.env.USE_HTTPS === "true"; // opt-in for local mkcert
const certPath = path.join(__dirname, "localhost-cert.pem");
const keyPath = path.join(__dirname, "localhost-key.pem");

let server;
if (useHttps && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const credentials = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  server = https.createServer(credentials, app);
  console.log("HTTPS enabled with mkcert certificates");
} else {
  server = http.createServer(app);
  if (useHttps) {
    console.warn("USE_HTTPS is true but certificates not found; falling back to HTTP.");
  }
}

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"]
  }
});

// In-memory map to track userId to socketId
const userSocketMap = {};

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('A user connected via WebSocket:', socket.id);

  // Listen for a user to register their ID
  socket.on('register', (userId) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`User registered: ${userId} with socket: ${socket.id}`);
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    // Find the user and remove them from the map
    const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`User disconnected and unregistered: ${userId}`);
    } else {
      console.log('User disconnected:', socket.id);
    }
  });
});


const { ConnectDatabase } = require("./database/databaseConnector");

// Allowed origins for CORS. Extend with your deployed frontend URL if needed.
const allowedOrigins = [
  "http://localhost:5173",
  "https://localhost:5173",
  "http://localhost:3000",
  "https://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const booksRouter = require("./routes/bookRoutes");
const bookCategoryRouter = require("./routes/bookCategoryRoutes");
const booksRouterLimitSkip = require("./routes/bookRoutesLimitSkip");
const booksRouterRecentBooks = require("./routes/booksRoutesRecentBooks");
const booksRouterFeaturedBooks = require("./routes/booksRoutesFeatured");
const requestBookRouter = require("./routes/requestBooksRoute");
const popularBooksRouter = require("./routes/popularBooksRoutes");

const userRouter = require("./routes/usersRoute");

const CheckBookReturnRouter = require("./routes/checkBookReturn");

const signUpRouter = require("./routes/signUpRoute");
const loginRouter = require("./routes/loginRoutes");
const logoutRouter = require("./routes/logoutRoute");
const forgotpasswordRouter = require("./routes/forgotpassword");

const filterRouter = require("./routes/filterRoutes");

const adminHomePageInfoRouter = require("./routes/adminHomePageInfoRoute");

const CustomError = require("./errorHandler/CustomError");
const PageNotFound = require("./errorHandler/PageNotFound");

// Allow CORS Policy
// app.use(cors())

// For recieiving httpOnly cookies
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // If running on Render as a monolith (same origin), the origin might match the site URL
    // We can also check if the origin is the same as the server's external URL if needed.
    // For now, let's trust the explicit allowedOrigins list.
    // However, for Monolith deployment (frontend served by backend), standard fetches are same-origin.
    return callback(null, true); // Fallback: Allow all for now to prevent breakage in this setup, strictly you'd restrict it.
  }
}));

app.use(cookieParser());

// Parse Form data in JSON Format
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// making uploads folder globally accessable through static routing
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve built frontend (for Elastic Beanstalk / single-host deploys)
// Placed BEFORE API routes to ensure static files are served efficiently
const clientBuildPath = path.join(__dirname, "..", "frontend", "dist");
console.log("Checking Client Build Path:", clientBuildPath);
console.log("Does it exist?", fs.existsSync(clientBuildPath));

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
} else {
  console.log("Client build path not found. Frontend will not be served.");
}

// Middleware to attach Socket.IO and user map to requests
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// Middlewares
const verifyToken = require("./middleware/verifyToken");
const adminAuthorization = require("./middleware/adminAuth");
const cacheMiddleware = require("./middleware/cacheMiddleware");

// ROUTES
app.use("/api/v1/signup", signUpRouter);
app.use("/api/v1/login", loginRouter);

app.use("/api/v1/logout", verifyToken, logoutRouter);
app.use("/api/v1/forgotpassword", forgotpasswordRouter);

// Filter Books
app.use("/api/v1/filter", filterRouter);

// ALL BOOKS CRUD (Dynamic Middleware Setup on API Endpoints)
app.use("/api/v1/books", booksRouter);

// Fetches all Categories of Books
app.use("/api/v1/book_category", cacheMiddleware(3600), bookCategoryRouter);

// Limit() and Skip() & Pagination
app.use("/api/v1/book", cacheMiddleware(300), booksRouterLimitSkip);

app.use("/api/v1/recentBooks", booksRouterRecentBooks);
app.use("/api/v1/featuredBooks", booksRouterFeaturedBooks);
app.use("/api/v1/requestBooks", verifyToken, requestBookRouter);
app.use("/api/v1/popularBooks", popularBooksRouter);

// User Routes
app.use("/api/v1/users", verifyToken, userRouter);

// handles if book not returned then automate CHARGES FINE
app.use("/api/v1/checkbookreturn", CheckBookReturnRouter);

// Admin Home page Infos
app.use(
  "/api/v1/adminHomePageInfo",
  verifyToken,
  adminAuthorization,
  adminHomePageInfoRouter
);

// Update Users Email - ADMIN
const UpdateUserEmailRouter = require("./routes/updateUserEmailRoute");
app.use(
  "/api/v1/updateUserEmail",
  verifyToken,
  adminAuthorization,
  UpdateUserEmailRouter
);

// Fetch Similar Books
const SimilarBooksRouter = require("./routes/similarBooksRouter");
app.use("/api/v1/similarBooks", SimilarBooksRouter);

// Fetch RECOMMENDED books
const recommendedBooksRouter = require("./routes/recommendBooksRouter");
app.use("/api/v1/recommendedBooks", verifyToken, recommendedBooksRouter);

// Admin Issued Books
app.use(
  "/api/v1/requestBooks/notreturnedbooks",
  verifyToken,
  adminAuthorization,
  cacheMiddleware(300),
  requestBookRouter
);

//---------------- RECOMMENDATION ALGO TESTING --------------------------
const { algoTest } = require("./controller/bookRecommendationAlgorithm");
app.get("/api/algotest", algoTest);

// Query Db
const QueryRouter = require("./utils/MongoDbQuery");
app.use("/api/v1/query", QueryRouter);

// Serve index.html for any unknown routes (Client-side routing)
if (fs.existsSync(clientBuildPath)) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.use(CustomError);
app.use(PageNotFound);

const { initializeRedis } = require("./database/redisConnector");

// Server
const port = process.env.PORT || process.env.CONNECTION_PORT || 5000;
const InitiateServer = async () => {
  try {
    await ConnectDatabase(process.env.CONNECTION_URL);
    console.log("Connected to Database Successfully");
    await initializeRedis(); // Initialize Redis connection
    server.listen(port, () =>
      console.log(`server started at port ${port} . . . `)
    );
  } catch (error) {
    console.log("ERROR IN SERVER");
  }
};

InitiateServer();
