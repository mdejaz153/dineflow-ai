// ========================================
// CART SECTION
// Displays selected dishes and allows
// quantity management + order placement
// ========================================

function CartSection({
  cart,
  placingOrder,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onPlaceOrder,
}) {
  // ========================================
  // CART TOTAL
  // Display-only calculation.
  // Backend calculates secure final total.
  // ========================================

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price) * item.quantity,
    0
  );

  // Total quantity of all dishes
  const cartItemCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>
        🛒 Your Cart ({cartItemCount})
      </h2>

      {/* Empty cart */}
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {/* =====================================
              CART ITEMS
          ====================================== */}

          {cart.map((item) => (
            <div key={item.id}>
              <h3>{item.name}</h3>

              <p>
                ₹
                {Number(
                  item.price
                ).toFixed(2)}
                {" × "}
                {item.quantity}
              </p>

              <p>
                Subtotal: ₹
                {(
                  Number(item.price) *
                  item.quantity
                ).toFixed(2)}
              </p>

              {/* Decrease quantity */}
              <button
                type="button"
                onClick={() =>
                  onDecrease(item.id)
                }
                disabled={placingOrder}
              >
                −
              </button>

              <span>
                {" "}
                {item.quantity}
                {" "}
              </span>

              {/* Increase quantity */}
              <button
                type="button"
                onClick={() =>
                  onIncrease(item.id)
                }
                disabled={placingOrder}
              >
                +
              </button>

              {" "}

              {/* Remove complete item */}
              <button
                type="button"
                onClick={() =>
                  onRemove(item.id)
                }
                disabled={placingOrder}
              >
                Remove
              </button>

              <br />
              <br />
            </div>
          ))}

          {/* =====================================
              CART SUMMARY
          ====================================== */}

          <h3>
            Total: ₹{cartTotal.toFixed(2)}
          </h3>

          <button
            type="button"
            onClick={onClear}
            disabled={placingOrder}
          >
            Clear Cart
          </button>

          {" "}

          {/* =====================================
              PLACE ORDER
          ====================================== */}

          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={placingOrder}
          >
            {placingOrder
              ? "Placing Order..."
              : "Place Order"}
          </button>
        </div>
      )}
    </section>
  );
}

export default CartSection;