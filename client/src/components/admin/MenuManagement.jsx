import { useEffect, useState } from "react";
import api from "../../services/api";

function MenuManagement() {
  // ========================================
  // STATE - MENU DATA
  // ========================================

  const [categories, setCategories] =
    useState([]);

  const [menuItems, setMenuItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // STATE - CATEGORY FORM
  // ========================================

  const [categoryName, setCategoryName] =
    useState("");

  // ========================================
  // STATE - ADD DISH FORM
  // ========================================

  const [dishForm, setDishForm] = useState({
    name: "",
    description: "",
    price: "",
    prepTime: "",
    categoryId: "",
    imageUrl: "",
  });

  // ========================================
  // FETCH MENU DATA
  // Categories + dishes
  // ========================================

  const fetchMenuData = async () => {
    try {
      setError("");

      const [
        categoriesResponse,
        itemsResponse,
      ] = await Promise.all([
        api.get("/menu/categories"),
        api.get("/menu/items"),
      ]);

      setCategories(
        categoriesResponse.data.categories
      );

      setMenuItems(
        itemsResponse.data.menuItems
      );
    } catch (error) {
      console.error(
        "Menu fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load menu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  // ========================================
  // CREATE MENU CATEGORY
  // ========================================

  const handleAddCategory = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/menu/categories",
        {
          name: categoryName,
        }
      );

      const newCategory =
        response.data.category;

      setCategories((prev) => [
        ...prev,
        newCategory,
      ]);

      setCategoryName("");

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Create category error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create category"
      );
    }
  };

  // ========================================
  // DISH FORM INPUT CHANGE
  // ========================================

  const handleDishChange = (e) => {
    const { name, value } = e.target;

    setDishForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // CREATE MENU ITEM
  // ========================================

  const handleAddDish = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/menu/items",
        {
          name: dishForm.name,

          description:
            dishForm.description,

          price: Number(
            dishForm.price
          ),

          prepTime: dishForm.prepTime
            ? Number(dishForm.prepTime)
            : null,

          categoryId: Number(
            dishForm.categoryId
          ),

          imageUrl:
            dishForm.imageUrl,
        }
      );

      const newMenuItem =
        response.data.menuItem;

      // Add dish instantly to current menu
      setMenuItems((prev) => [
        ...prev,
        newMenuItem,
      ]);

      // Clear form
      setDishForm({
        name: "",
        description: "",
        price: "",
        prepTime: "",
        categoryId: "",
        imageUrl: "",
      });

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Create dish error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create dish"
      );
    }
  };

  // ========================================
  // TOGGLE DISH AVAILABILITY
  // ========================================

  const handleToggleAvailability =
    async (itemId) => {
      try {
        const response = await api.patch(
          `/menu/items/${itemId}/availability`
        );

        const updatedItem =
          response.data.menuItem;

        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? updatedItem
              : item
          )
        );

        alert(response.data.message);
      } catch (error) {
        console.error(
          "Toggle availability error:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to update dish availability"
        );
      }
    };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Menu Management</h2>

      {/* =====================================
          CATEGORIES
      ====================================== */}

      <h3>Categories</h3>

      <form onSubmit={handleAddCategory}>
        <input
          type="text"
          placeholder="Category name"
          value={categoryName}
          onChange={(e) =>
            setCategoryName(e.target.value)
          }
          required
        />

        {" "}

        <button type="submit">
          Add Category
        </button>
      </form>

      <br />

      {categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              {category.name}
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* =====================================
          ADD DISH
      ====================================== */}

      <h3>Add Dish</h3>

      <form onSubmit={handleAddDish}>
        <div>
          <label>Dish Name</label>
          <br />

          <input
            type="text"
            name="name"
            placeholder="e.g. Veg Supreme Pizza"
            value={dishForm.name}
            onChange={handleDishChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Description</label>
          <br />

          <input
            type="text"
            name="description"
            placeholder="Dish description"
            value={dishForm.description}
            onChange={handleDishChange}
          />
        </div>

        <br />

        <div>
          <label>Price</label>
          <br />

          <input
            type="number"
            min="0.01"
            step="0.01"
            name="price"
            placeholder="e.g. 349"
            value={dishForm.price}
            onChange={handleDishChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Category</label>
          <br />

          <select
            name="categoryId"
            value={dishForm.categoryId}
            onChange={handleDishChange}
            required
          >
            <option value="">
              Select Category
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              )
            )}
          </select>
        </div>

        <br />

        <div>
          <label>
            Preparation Time (minutes)
          </label>
          <br />

          <input
            type="number"
            min="0"
            name="prepTime"
            placeholder="e.g. 15"
            value={dishForm.prepTime}
            onChange={handleDishChange}
          />
        </div>

        <br />

        <div>
          <label>Image URL</label>
          <br />

          <input
            type="text"
            name="imageUrl"
            placeholder="Optional image URL"
            value={dishForm.imageUrl}
            onChange={handleDishChange}
          />
        </div>

        <br />

        <button type="submit">
          Add Dish
        </button>
      </form>

      <hr />

      {/* =====================================
          CURRENT MENU
      ====================================== */}

      <h3>Current Menu</h3>

      {loading && (
        <p>Loading menu...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        menuItems.length === 0 && (
          <p>No dishes found.</p>
        )}

      {!loading &&
        !error &&
        menuItems.length > 0 && (
          <table
            border="1"
            cellPadding="10"
          >
            <thead>
              <tr>
                <th>Dish</th>
                <th>Category</th>
                <th>Price</th>
                <th>Prep Time</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {menuItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>

                  <td>
                    {item.category.name}
                  </td>

                  <td>
                    ₹
                    {Number(
                      item.price
                    ).toFixed(2)}
                  </td>

                  <td>
                    {item.prepTime
                      ? `${item.prepTime} min`
                      : "-"}
                  </td>

                  <td>
                    {item.isAvailable
                      ? "Available"
                      : "Unavailable"}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleAvailability(
                          item.id
                        )
                      }
                    >
                      {item.isAvailable
                        ? "Mark Unavailable"
                        : "Mark Available"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  );
}

export default MenuManagement;