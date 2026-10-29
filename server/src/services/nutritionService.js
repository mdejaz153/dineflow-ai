const axios = require("axios");

const USDA_BASE_URL =
  "https://api.nal.usda.gov/fdc/v1";

// ========================================
// GET API KEY
// ========================================

const getApiKey = () => {
  const apiKey =
    process.env.USDA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "USDA_API_KEY_NOT_CONFIGURED"
    );
  }

  return apiKey;
};

// ========================================
// SEARCH FOODDATA CENTRAL
//
// Searches USDA FoodData Central.
//
// Example:
// "Margherita Pizza"
// "Cheese Pizza"
// "Mozzarella"
// ========================================

const searchUsdaFoods = async (
  query
) => {
  const response = await axios.get(
    `${USDA_BASE_URL}/foods/search`,
    {
      params: {
        api_key: getApiKey(),
        query,
        pageSize: 10,
      },

      timeout: 10000,
    }
  );

  return response.data;
};

// ========================================
// GET ONE FOOD DETAIL
// ========================================

const getUsdaFoodDetails = async (
  fdcId
) => {
  const response = await axios.get(
    `${USDA_BASE_URL}/food/${fdcId}`,
    {
      params: {
        api_key: getApiKey(),
      },

      timeout: 10000,
    }
  );

  return response.data;
};

module.exports = {
  searchUsdaFoods,
  getUsdaFoodDetails,
};