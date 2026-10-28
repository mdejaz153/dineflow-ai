// ========================================
// MENU SECTION
// Displays restaurant dishes and allows
// customer to add available dishes to cart
// ========================================

function MenuSection({
  menuItems,
  loading,
  error,
  onAddToCart,
}) {
  return (
    <section>
      <hr />

      <h2>Our Menu</h2>

      {/* Menu loading state */}
      {loading && (
        <p>Loading menu...</p>
      )}

      {/* Menu error state */}
      {error && (
        <p>{error}</p>
      )}

      {/* Empty menu */}
      {!loading &&
        !error &&
        menuItems.length === 0 && (
          <p>No menu items available.</p>
        )}

      {/* Menu items */}
      {!loading &&
        !error &&
        menuItems.map((item) => (
          <div key={item.id}>
            <h3>{item.name}</h3>

            <p>
              {item.description ||
                "No description available"}
            </p>

            <p>
              Category: {item.category.name}
            </p>

            <p>
              Price: ₹
              {Number(item.price).toFixed(2)}
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

            {/* Only available dishes can
                be added to cart */}
            <button
              type="button"
              onClick={() =>
                onAddToCart(item)
              }
              disabled={!item.isAvailable}
            >
              {item.isAvailable
                ? "Add to Cart"
                : "Unavailable"}
            </button>

            <hr />
          </div>
        ))}
    </section>
  );
}

export default MenuSection;