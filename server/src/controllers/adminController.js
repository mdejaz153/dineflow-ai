const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

// ========================================
// CREATE STAFF
// ========================================

const createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      department,
      shift,
    } = req.body;

    // Required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    // Manager sirf in staff roles ko create kar sakta hai
    const allowedStaffRoles = [
      "CHEF",
      "WAITER",
      "INVENTORY_STAFF",
    ];

    if (!allowedStaffRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff role",
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Existing email check
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Password hash
    const passwordHash = await bcrypt.hash(password, 12);

    // Employee code generate
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: {
        id: "desc",
      },
    });

    const nextNumber = lastEmployee
      ? lastEmployee.id + 101
      : 101;

    const employeeCode = `EMP${nextNumber}`;

    // User + Employee ek transaction mein create honge
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          phone: phone || null,
          passwordHash,
          role,
          status: "ACTIVE",
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode,
          department: department || null,
          shift: shift || null,
        },
      });

      return {
        user,
        employee,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",

      staff: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        status: result.user.status,

        employeeId: result.employee.id,
        employeeCode: result.employee.employeeCode,
        department: result.employee.department,
        shift: result.employee.shift,
        joinedAt: result.employee.joinedAt,
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========================================
// GET ALL STAFF
// ========================================

const getAllStaff = async (req, res) => {
  try {
    const staff = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },

      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const deactivateStaff = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await prisma.user.update({
      where: {
        id: employee.userId,
      },
      data: {
        status: "INACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const reactivateStaff = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await prisma.user.update({
      where: {
        id: employee.userId,
      },
      data: {
        status: "ACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Employee reactivated successfully",
    });
  } catch (error) {
    console.error("Reactivate staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ========================================
// EXPORTS
// ========================================

module.exports = {
  createStaff,
  getAllStaff,
  deactivateStaff,
  reactivateStaff,
};