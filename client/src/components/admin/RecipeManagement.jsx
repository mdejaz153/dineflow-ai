import { useEffect, useState } from "react";
import api from "../../services/api";

function RecipeManagement() {
  // ========================================
  // STATE
  // ========================================

  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  const [selectedMenuItemId, setSelectedMenuItemId] =
    useState("");

  const [recipeIngredients, setRecipeIngredients] =
    useState([]);

  const [selectedInventoryItemId, setSelectedInventoryItemId] =
    useState("");

  const [quantity, setQuantity] = useState("");

  const [loadingRecipe, setLoadingRecipe] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ========================================
  // FETCH MENU + INVENTORY
  // ========================================

  const fetchBaseData = async () => {
    try {
      setError("");

      const [
        menuResponse,
        inventoryResponse,
      ] = await Promise.all([
        api.get("/menu/items"),
        api.get("/inventory"),
      ]);

      setMenuItems(
        menuResponse.data.menuItems
      );

      setInventoryItems(
        inventoryResponse.data.items
      );
    } catch (error) {
      console.error(
        "Recipe base data error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load recipe management data"
      );
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  // ========================================
  // FETCH SELECTED DISH RECIPE
  // ========================================

  const fetchRecipe = async (
    menuItemId
  ) => {
    if (!menuItemId) {
      setRecipeIngredients([]);
      return;
    }

    try {
      setLoadingRecipe(true);
      setError("");

      const response = await api.get(
        `/recipes/${menuItemId}`
      );

      setRecipeIngredients(
        response.data.recipeIngredients
      );
    } catch (error) {
      console.error(
        "Recipe fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load recipe"
      );
    } finally {
      setLoadingRecipe(false);
    }
  };

  // ========================================
  // DISH SELECTION
  // ========================================

  const handleMenuItemChange = (
    e
  ) => {
    const value = e.target.value;

    setSelectedMenuItemId(value);

    setSelectedInventoryItemId("");
    setQuantity("");

    fetchRecipe(value);
  };

  // ========================================
  // INGREDIENT SELECTION
  //
  // If ingredient already exists in recipe,
  // load its current quantity so Manager can
  // easily update it.
  // ========================================

  const handleInventoryItemChange = (
    e
  ) => {
    const value = e.target.value;

    setSelectedInventoryItemId(
      value
    );

    const existingIngredient =
      recipeIngredients.find(
        (ingredient) =>
          ingredient.inventoryItemId ===
          Number(value)
      );

    if (existingIngredient) {
      setQuantity(
        String(
          existingIngredient.quantity
        )
      );
    } else {
      setQuantity("");
    }
  };

  // ========================================
  // ADD / UPDATE RECIPE INGREDIENT
  // ========================================

  const handleSaveIngredient = async (
    e
  ) => {
    e.preventDefault();

    const menuItemId =
      Number(selectedMenuItemId);

    const inventoryItemId =
      Number(
        selectedInventoryItemId
      );

    const parsedQuantity =
      Number(quantity);

    if (!menuItemId) {
      alert(
        "Please select a menu item"
      );

      return;
    }

    if (!inventoryItemId) {
      alert(
        "Please select an inventory item"
      );

      return;
    }

    if (
      Number.isNaN(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      alert(
        "Enter a valid ingredient quantity"
      );

      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        `/recipes/${menuItemId}/ingredients`,
        {
          inventoryItemId,
          quantity:
            parsedQuantity,
        }
      );

      // Reload recipe from backend so
      // frontend always shows canonical data.
      await fetchRecipe(
        menuItemId
      );

      setSelectedInventoryItemId(
        ""
      );

      setQuantity("");

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Save recipe ingredient error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to save recipe ingredient"
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // REMOVE INGREDIENT
  // ========================================

  const handleRemoveIngredient = async (
    recipeIngredientId
  ) => {
    try {
      const response =
        await api.delete(
          `/recipes/ingredients/${recipeIngredientId}`
        );

      setRecipeIngredients(
        (prev) =>
          prev.filter(
            (ingredient) =>
              ingredient.id !==
              recipeIngredientId
          )
      );

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Remove recipe ingredient error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to remove recipe ingredient"
      );
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Recipe Management</h2>

      <p>
        Configure the inventory
        ingredients required to prepare
        one unit of each menu item.
      </p>

      {error && (
        <p>{error}</p>
      )}

      {/* =====================================
          SELECT DISH
      ====================================== */}

      <div>
        <label>
          Menu Item
        </label>

        <br />

        <select
          value={
            selectedMenuItemId
          }
          onChange={
            handleMenuItemChange
          }
        >
          <option value="">
            Select Menu Item
          </option>

          {menuItems.map(
            (item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            )
          )}
        </select>
      </div>

      <br />

      {/* =====================================
          CURRENT RECIPE
      ====================================== */}

      {selectedMenuItemId && (
        <>
          <h3>Current Recipe</h3>

          {loadingRecipe ? (
            <p>
              Loading recipe...
            </p>
          ) : recipeIngredients.length ===
            0 ? (
            <p>
              No ingredients configured
              for this dish.
            </p>
          ) : (
            <table
              border="1"
              cellPadding="10"
            >
              <thead>
                <tr>
                  <th>
                    Ingredient
                  </th>

                  <th>
                    Quantity Per Dish
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {recipeIngredients.map(
                  (ingredient) => (
                    <tr
                      key={
                        ingredient.id
                      }
                    >
                      <td>
                        {
                          ingredient
                            .inventoryItem
                            .name
                        }
                      </td>

                      <td>
                        {Number(
                          ingredient.quantity
                        ).toFixed(3)}
                        {" "}
                        {
                          ingredient
                            .inventoryItem
                            .unit
                        }
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveIngredient(
                              ingredient.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}

          <br />

          {/* =================================
              ADD / UPDATE INGREDIENT
          ================================= */}

          <h3>
            Add / Update Ingredient
          </h3>

          <form
            onSubmit={
              handleSaveIngredient
            }
          >
            <div>
              <label>
                Inventory Item
              </label>

              <br />

              <select
                value={
                  selectedInventoryItemId
                }
                onChange={
                  handleInventoryItemChange
                }
                required
              >
                <option value="">
                  Select Ingredient
                </option>

                {inventoryItems.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {" — "}
                      {item.unit}
                    </option>
                  )
                )}
              </select>
            </div>

            <br />

            <div>
              <label>
                Quantity Per Dish
              </label>

              <br />

              <input
                type="number"
                min="0.001"
                step="0.001"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value
                  )
                }
                placeholder="e.g. 0.150"
                required
              />
            </div>

            <br />

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Ingredient"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default RecipeManagement;