const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcrypt");
require("dotenv").config();
const port = process.env.PORT || 5000;

const corsConfig = {
  origin: "*",
  credential: true,
  optionSuccessStatus: 200,
};

// middlewares
app.use(cors());
app.options("", cors(corsConfig));
app.use(express.json());

//mongodb start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1oh7p7d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware to verify jwt token
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ error: "Access denied. Token is missing." });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access denied. Invalid token." });
    }
    req.user = user;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //collections start
    const usersCollection = client.db("house-hunter").collection("users");
    //collections end
    // APIs start

    //registration endpoint
    app.post("/register", async (req, res) => {
      const userData = req.body;

      try {
        const existingUser = await usersCollection.findOne({
          email: userData.email,
        });

        if (existingUser) {
          return res.status(409).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const newUser = {
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          email: userData.email,
          password: hashedPassword,
        };

        const result = await usersCollection.insertOne(newUser);

        const registeredUser = {
          _id: result.insertedId,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          email: newUser.email,
        };

        const token = jwt.sign(
          { email: userData.email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1h" }
        );

        res.status(201).json({ token, user: registeredUser });
      } catch (error) {
        console.error("Registration Failed:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Login endpoint
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      try {
        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
          { email: user.email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1h",
          }
        );
        res.json({ token, user });
      } catch (error) {
        console.error("Login failed:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // users Api
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // APIs end
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//mongodb end

// basic setup
app.get("/", (req, res) => {
  res.send("House-Hunter Server is running");
});

app.listen(port, () => {
  console.log(`House-Hunter Server is running on port: ${port}`);
});
