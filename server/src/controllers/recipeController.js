const prisma = require("../config/prisma");

// ========================================
// GET RECIPE FOR ONE MENU ITEM
//
// Manager can inspect ingredients currently
// configured for a dish.
// ========================================

const getRecipe = async (req, res) => {
  try {
    const menuItemId = Number(req.params.menuItemId);

    if (!Number.isInteger(menuItemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const menuItem =
      await prisma.menuItem.findUnique({
        where: {
          id: menuItemId,
        },

        include: {
          recipeIngredients: {
            include: {
              inventoryItem: true,
            },

            orderBy: {
              id: "asc",
            },
          },
        },
      });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    return res.status(200).json({
      success: true,

      menuItem: {
        id: menuItem.id,
        name: menuItem.name,
      },

      recipeIngredients:
        menuItem.recipeIngredients,
    });
  } catch (error) {
    console.error(
      "Get recipe error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load recipe",
    });
  }
};

// ========================================
// ADD / UPDATE RECIPE INGREDIENT
//
// Manager defines how much inventory is
// required to prepare ONE unit of a dish.
//
// Existing ingredient -> quantity updated.
// New ingredient      -> relation created.
// ========================================

const upsertRecipeIngredient = async (
  req,
  res
) => {
  try {
    const menuItemId = Number(
      req.params.menuItemId
    );

    const inventoryItemId = Number(
      req.body.inventoryItemId
    );

    const quantity = Number(
      req.body.quantity
    );

    // ========================================
    // VALIDATION
    // ========================================

    if (
      !Number.isInteger(menuItemId) ||
      !Number.isInteger(inventoryItemId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid menu or inventory item ID",
      });
    }

    if (
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Recipe quantity must be greater than 0",
      });
    }

    const [menuItem, inventoryItem] =
      await Promise.all([
        prisma.menuItem.findUnique({
          where: {
            id: menuItemId,
          },
        }),

        prisma.inventoryItem.findUnique({
          where: {
            id: inventoryItemId,
          },
        }),
      ]);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message:
          "Inventory item not found",
      });
    }

    // ========================================
    // UPSERT
    // ========================================

    const recipeIngredient =
      await prisma.recipeIngredient.upsert({
        where: {
          menuItemId_inventoryItemId: {
            menuItemId,
            inventoryItemId,
          },
        },

        update: {
          quantity,
        },

        create: {
          menuItemId,
          inventoryItemId,
          quantity,
        },

        include: {
          inventoryItem: true,
          menuItem: true,
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Recipe ingredient saved successfully",
      recipeIngredient,
    });
  } catch (error) {
    console.error(
      "Save recipe ingredient error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save recipe ingredient",
    });
  }
};

// ========================================
// REMOVE RECIPE INGREDIENT
// ========================================

const removeRecipeIngredient = async (
  req,
  res
) => {
  try {
    const recipeIngredientId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(recipeIngredientId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid recipe ingredient ID",
      });
    }

    const existingIngredient =
      await prisma.recipeIngredient.findUnique({
        where: {
          id: recipeIngredientId,
        },
      });

    if (!existingIngredient) {
      return res.status(404).json({
        success: false,
        message:
          "Recipe ingredient not found",
      });
    }

    await prisma.recipeIngredient.delete({
      where: {
        id: recipeIngredientId,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Recipe ingredient removed successfully",
    });
  } catch (error) {
    console.error(
      "Remove recipe ingredient error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove recipe ingredient",
    });
  }
};

module.exports = {
  getRecipe,
  upsertRecipeIngredient,
  removeRecipeIngredient,
};