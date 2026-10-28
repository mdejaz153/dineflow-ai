const prisma = require("../config/prisma");

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const categoryName = name.trim();

    const existingCategory = await prisma.menuCategory.findUnique({
      where: {
        name: categoryName,
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await prisma.menuCategory.create({
      data: {
        name: categoryName,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Menu category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      imageUrl,
      prepTime,
      categoryId,
    } = req.body;

    // Required fields
    if (!name || price === undefined || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    const numericPrice = Number(price);
    const numericCategoryId = Number(categoryId);

    // Price validation
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    // Category check
    const category = await prisma.menuCategory.findUnique({
      where: {
        id: numericCategoryId,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Menu category not found",
      });
    }

    // Create dish
    const menuItem = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: numericPrice,
        imageUrl: imageUrl?.trim() || null,
        prepTime: prepTime ? Number(prepTime) : null,
        categoryId: numericCategoryId,
      },

      include: {
        category: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      menuItem,
    });
  } catch (error) {
    console.error("Create menu item error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems,
    });
  } catch (error) {
    console.error("Get menu items error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ========================================
// TOGGLE MENU ITEM AVAILABILITY
// Manager can mark a dish Available/Unavailable
// ========================================

const toggleMenuItemAvailability = async (req, res) => {
  try {
    // Dish ID URL se milegi
    const itemId = Number(req.params.id);

    // Validate dish ID
    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    // Check whether dish exists
    const existingItem = await prisma.menuItem.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // true becomes false, false becomes true
    const updatedItem = await prisma.menuItem.update({
      where: {
        id: itemId,
      },
      data: {
        isAvailable: !existingItem.isAvailable,
      },
      include: {
        category: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: updatedItem.isAvailable
        ? "Menu item is now available"
        : "Menu item is now unavailable",
      menuItem: updatedItem,
    });
  } catch (error) {
    console.error("Toggle menu availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
module.exports = {
  createCategory,
  getAllCategories,
  createMenuItem,
  getAllMenuItems,
  toggleMenuItemAvailability,
};