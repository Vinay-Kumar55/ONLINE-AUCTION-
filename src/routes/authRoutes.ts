import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user";

const router = express.Router();

// Register User
router.post("/register", async (req: any, res: any) => {
  try {
    const { email, password, role } = req.body;
    const userRepo = AppDataSource.getRepository(User);

    let user = await userRepo.findOneBy({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User();
    user.email = email;
    user.password = password;
    user.role = role;
    await user.hashPassword();

    await userRepo.save(user);
    res.status(201).json({ message: "User registered successfully" }); // ✅ No explicit return type needed
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Login User
router.post("/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOneBy({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
