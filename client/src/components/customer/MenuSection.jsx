import { useState } from "react";
import api from "../../services/api";

// ========================================
// MENU SECTION
//
// Displays restaurant dishes and allows:
// - Add to cart
// - View external nutrition information
//
// Nutrition data is retrieved through the
// DineFlow backend from USDA FoodData Central.
// ========================================

function MenuSection({
  menuItems,
  loading,
  error,
  onAddToCart,
}) {
  // ========================================
  // NUTRITION STATE
  // ========================================

  // Stores nutrition result separately
  // for each DineFlow menu item.
  const [nutritionData, setNutritionData] =
    useState({});

  // Menu item currently loading nutrition
  const [
    loadingNutritionId,
    setLoadingNutritionId,
  ] = useState(null);

  // ========================================
  // BUILD NUTRITION SEARCH QUERY
  //
  // DineFlow names may not exactly match
  // USDA names.
  //
  // Example:
  // "Margherita Pizza" -> "cheese pizza"
  //
  // This gives a more useful reference match.
  // ========================================

  const getNutritionSearchQuery = (
    item
  ) => {
    const name =
      item.name.toLowerCase();

    if (
      name.includes("margherita")
    ) {
      return "cheese pizza";
    }

    if (
      name.includes("veg supreme")
    ) {
      return "vegetable pizza";
    }

    return item.name;
  };

  // ========================================
  // VIEW NUTRITION
  // ========================================

  const handleViewNutrition = async (
    item
  ) => {
    // If already visible, clicking again
    // hides the nutrition panel.
    if (nutritionData[item.id]) {
      setNutritionData((prev) => {
        const updated = {
          ...prev,
        };

        delete updated[item.id];

        return updated;
      });

      return;
    }

    try {
      setLoadingNutritionId(
        item.id
      );

      const query =
        getNutritionSearchQuery(
          item
        );

      const response = await api.get(
        "/nutrition/search",
        {
          params: {
            q: query,
          },
        }
      );

      const results =
        response.data.results || [];

      if (results.length === 0) {
        setNutritionData(
          (prev) => ({
            ...prev,

            [item.id]: {
              notFound: true,
            },
          })
        );

        return;
      }

      // V1 uses the highest-ranked USDA
      // search result as a nutrition
      // reference for the dish.
      const bestMatch =
        results[0];

      setNutritionData(
        (prev) => ({
          ...prev,

          [item.id]: {
            ...bestMatch,

            source:
              response.data.source,
          },
        })
      );
    } catch (error) {
      console.error(
        "Nutrition fetch error:",
        error
      );

      setNutritionData(
        (prev) => ({
          ...prev,

          [item.id]: {
            fetchError:
              error.response?.data
                ?.message ||
              "Unable to load nutrition information",
          },
        })
      );
    } finally {
      setLoadingNutritionId(
        null
      );
    }
  };

  // ========================================
  // DISPLAY NUTRIENT
  // ========================================

  const displayNutrient = (
    nutrient
  ) => {
    if (!nutrient) {
      return "Not available";
    }

    return `${nutrient.value} ${nutrient.unit}`;
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Our Menu</h2>

      {/* Menu loading state */}
      {loading && (
        <p>
          Loading menu...
        </p>
      )}

      {/* Menu error state */}
      {error && (
        <p>{error}</p>
      )}

      {/* Empty menu */}
      {!loading &&
        !error &&
        menuItems.length === 0 && (
          <p>
            No menu items available.
          </p>
        )}

      {/* =====================================
          MENU ITEMS
      ====================================== */}

      {!loading &&
        !error &&
        menuItems.map((item) => {
          const nutrition =
            nutritionData[item.id];

          return (
            <div key={item.id}>
              <h3>
                {item.name}
              </h3>

              <p>
                {item.description ||
                  "No description available"}
              </p>

              <p>
                Category:{" "}
                {item.category.name}
              </p>

              <p>
                Price: ₹
                {Number(
                  item.price
                ).toFixed(2)}
              </p>

              <p>
                Preparation Time:{" "}
                {item.prepTime
                  ? `${item.prepTime} minutes`
                  : "Not specified"}
              </p>

              <p>
                Status:{" "}
                {item.isAvailable
                  ? "Available"
                  : "Currently Unavailable"}
              </p>

              {/* =================================
                  CART
              ================================= */}

              <button
                type="button"
                onClick={() =>
                  onAddToCart(item)
                }
                disabled={
                  !item.isAvailable
                }
              >
                {item.isAvailable
                  ? "Add to Cart"
                  : "Unavailable"}
              </button>

              {" "}

              {/* =================================
                  NUTRITION
              ================================= */}

              <button
                type="button"
                onClick={() =>
                  handleViewNutrition(
                    item
                  )
                }
                disabled={
                  loadingNutritionId ===
                  item.id
                }
              >
                {loadingNutritionId ===
                item.id
                  ? "Loading Nutrition..."
                  : nutrition
                    ? "Hide Nutrition"
                    : "View Nutrition"}
              </button>

              {/* =================================
                  NUTRITION RESULT
              ================================= */}

              {nutrition && (
                <div>
                  <br />

                  <h4>
                    Nutrition Information
                  </h4>

                  {nutrition.fetchError ? (
                    <p>
                      {
                        nutrition.fetchError
                      }
                    </p>
                  ) : nutrition.notFound ? (
                    <p>
                      Nutrition information
                      could not be found for
                      this dish.
                    </p>
                  ) : (
                    <>
                      <p>
                        Reference Food:{" "}
                        <strong>
                          {
                            nutrition.description
                          }
                        </strong>
                      </p>

                      {nutrition.brandOwner && (
                        <p>
                          Reference Brand:{" "}
                          {
                            nutrition.brandOwner
                          }
                        </p>
                      )}

                      {nutrition.servingSize && (
                        <p>
                          Reference Serving:{" "}
                          {
                            nutrition.servingSize
                          }{" "}
                          {
                            nutrition.servingSizeUnit
                          }
                        </p>
                      )}

                      <p>
                        Calories:{" "}
                        <strong>
                          {displayNutrient(
                            nutrition
                              .nutrients
                              .calories
                          )}
                        </strong>
                      </p>

                      <p>
                        Protein:{" "}
                        <strong>
                          {displayNutrient(
                            nutrition
                              .nutrients
                              .protein
                          )}
                        </strong>
                      </p>

                      <p>
                        Carbohydrates:{" "}
                        <strong>
                          {displayNutrient(
                            nutrition
                              .nutrients
                              .carbohydrates
                          )}
                        </strong>
                      </p>

                      <p>
                        Fat:{" "}
                        <strong>
                          {displayNutrient(
                            nutrition
                              .nutrients
                              .fat
                          )}
                        </strong>
                      </p>

                      <p>
                        Fiber:{" "}
                        <strong>
                          {displayNutrient(
                            nutrition
                              .nutrients
                              .fiber
                          )}
                        </strong>
                      </p>

                      <p>
                        Sugars:{" "}
                        <strong>
                          {displayNutrient(
                            nutrition
                              .nutrients
                              .sugars
                          )}
                        </strong>
                      </p>

                      <p>
                        Sodium:{" "}
                        <strong>
                          {displayNutrient(
                            nutrition
                              .nutrients
                              .sodium
                          )}
                        </strong>
                      </p>

                      <p>
                        <small>
                          Source:{" "}
                          {nutrition.source}
                        </small>
                      </p>

                      <p>
                        <small>
                          Nutrition values are
                          based on a USDA
                          reference food and
                          may differ from the
                          restaurant's exact
                          recipe and serving
                          size.
                        </small>
                      </p>
                    </>
                  )}
                </div>
              )}

              <hr />
            </div>
          );
        })}
    </section>
  );
}

export default MenuSection;