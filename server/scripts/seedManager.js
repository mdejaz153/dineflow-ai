require("dotenv").config();

const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

const seedManager = async () => {
  try {
    const email = "manager@dineflow.com";
    const password = "Manager@123";

    const existingManager = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingManager) {
      console.log("Manager account already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const manager = await prisma.user.create({
      data: {
        name: "DineFlow Manager",
        email,
        passwordHash,
        role: "MANAGER",
        status: "ACTIVE",
      },
    });

    console.log("Manager account created successfully.");
    console.log(`Manager ID: ${manager.id}`);
    console.log(`Email: ${manager.email}`);
  } catch (error) {
    console.error("Manager seed failed:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seedManager();