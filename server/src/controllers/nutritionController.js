const {
  searchUsdaFoods,
  getUsdaFoodDetails,
} = require(
  "../services/nutritionService"
);

// ========================================
// NORMALIZE NUTRIENT
//
// USDA records can contain nutrients in
// slightly different JSON structures
// depending on food data type.
//
// This helper safely extracts:
// - nutrient name
// - amount
// - unit
// ========================================

const normalizeNutrient = (
  foodNutrient
) => {
  const nutrient =
    foodNutrient.nutrient || {};

  return {
    name:
      nutrient.name ||
      foodNutrient.nutrientName ||
      "",

    amount:
      Number(
        foodNutrient.amount ??
          foodNutrient.value ??
          0
      ),

    unit:
      nutrient.unitName ||
      foodNutrient.unitName ||
      "",
  };
};

// ========================================
// FIND NUTRIENT
// ========================================

const findNutrient = (
  foodNutrients,
  possibleNames
) => {
  const normalized =
    (foodNutrients || []).map(
      normalizeNutrient
    );

  const found =
    normalized.find((nutrient) => {
      const nutrientName =
        nutrient.name
          .trim()
          .toLowerCase();

      return possibleNames.some(
        (name) =>
          nutrientName ===
          name.toLowerCase()
      );
    });

  if (!found) {
    return null;
  }

  return {
    value: Number(
      found.amount.toFixed(2)
    ),

    unit: found.unit,
  };
};

// ========================================
// BUILD NUTRITION SUMMARY
// ========================================

const buildNutritionSummary = (
  food
) => {
  const nutrients =
    food.foodNutrients || [];

  return {
    fdcId: food.fdcId,

    description:
      food.description ||
      "Unknown food",

    dataType:
      food.dataType ||
      null,

    brandOwner:
      food.brandOwner ||
      null,

    servingSize:
      food.servingSize ||
      null,

    servingSizeUnit:
      food.servingSizeUnit ||
      null,

    nutrients: {
      calories: findNutrient(
        nutrients,
        [
          "Energy",
          "Energy (Atwater General Factors)",
          "Energy (Atwater Specific Factors)",
        ]
      ),

      protein: findNutrient(
        nutrients,
        ["Protein"]
      ),

      carbohydrates: findNutrient(
        nutrients,
        [
          "Carbohydrate, by difference",
          "Carbohydrate, by summation",
        ]
      ),

      fat: findNutrient(
        nutrients,
        [
          "Total lipid (fat)",
          "Total fat (NLEA)",
        ]
      ),

      fiber: findNutrient(
        nutrients,
        [
          "Fiber, total dietary",
          "Total dietary fiber (AOAC 2011.25)",
        ]
      ),

      sugars: findNutrient(
        nutrients,
        [
          "Sugars, total including NLEA",
          "Total Sugars",
          "Sugars, total",
        ]
      ),

      sodium: findNutrient(
        nutrients,
        [
          "Sodium, Na",
          "Sodium",
        ]
      ),
    },
  };
};

// ========================================
// SEARCH NUTRITION
//
// GET /api/nutrition/search?q=pizza
// ========================================

const searchNutrition = async (
  req,
  res
) => {
  try {
    const query =
      req.query.q?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,

        message:
          "Food search query is required",
      });
    }

    const data =
      await searchUsdaFoods(query);

    const results =
      (data.foods || []).map(
        (food) =>
          buildNutritionSummary(
            food
          )
      );

    return res.status(200).json({
      success: true,

      query,

      count:
        results.length,

      results,

      source:
        "USDA FoodData Central",
    });
  } catch (error) {
    console.error(
      "Nutrition search error:",
      error.response?.data ||
        error.message
    );

    if (
      error.message ===
      "USDA_API_KEY_NOT_CONFIGURED"
    ) {
      return res.status(500).json({
        success: false,

        message:
          "Nutrition API is not configured",
      });
    }

    if (
      error.response?.status === 429
    ) {
      return res.status(429).json({
        success: false,

        message:
          "Nutrition API rate limit reached. Please try again later.",
      });
    }

    return res.status(502).json({
      success: false,

      message:
        "Unable to retrieve nutrition data from USDA",
    });
  }
};

// ========================================
// GET FOOD NUTRITION DETAILS
//
// GET /api/nutrition/:fdcId
// ========================================

const getNutritionDetails = async (
  req,
  res
) => {
  try {
    const fdcId =
      Number(req.params.fdcId);

    if (
      !Number.isInteger(fdcId) ||
      fdcId <= 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid USDA food ID",
      });
    }

    const food =
      await getUsdaFoodDetails(
        fdcId
      );

    const nutrition =
      buildNutritionSummary(
        food
      );

    return res.status(200).json({
      success: true,

      nutrition,

      source:
        "USDA FoodData Central",
    });
  } catch (error) {
    console.error(
      "Nutrition details error:",
      error.response?.data ||
        error.message
    );

    if (
      error.message ===
      "USDA_API_KEY_NOT_CONFIGURED"
    ) {
      return res.status(500).json({
        success: false,

        message:
          "Nutrition API is not configured",
      });
    }

    if (
      error.response?.status === 404
    ) {
      return res.status(404).json({
        success: false,

        message:
          "Nutrition record not found",
      });
    }

    if (
      error.response?.status === 429
    ) {
      return res.status(429).json({
        success: false,

        message:
          "Nutrition API rate limit reached. Please try again later.",
      });
    }

    return res.status(502).json({
      success: false,

      message:
        "Unable to retrieve nutrition details from USDA",
    });
  }
};

module.exports = {
  searchNutrition,
  getNutritionDetails,
};