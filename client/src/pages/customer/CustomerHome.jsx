import { useEffect, useState } from "react";

import api from "../../services/api";

import LogoutButton from "../../components/LogoutButton";

import MenuSection from "../../components/customer/MenuSection";
import CartSection from "../../components/customer/CartSection";
import OrderTracking from "../../components/customer/OrderTracking";
import ReservationSection from "../../components/customer/ReservationSection";

function CustomerHome() {
  // ========================================
  // STATE - MENU
  // ========================================

  const [menuItems, setMenuItems] =
    useState([]);

  const [menuLoading, setMenuLoading] =
    useState(true);

  const [menuError, setMenuError] =
    useState("");

  // ========================================
  // STATE - CART
  //
  // Cart remains in parent because both
  // MenuSection and CartSection need it.
  // ========================================

  const [cart, setCart] =
    useState([]);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  // ========================================
  // STATE - CUSTOMER ORDERS
  //
  // Kept in parent because placing a new
  // order must instantly update tracking.
  // ========================================

  const [orders, setOrders] =
    useState([]);

  const [ordersLoading, setOrdersLoading] =
    useState(true);

  const [ordersError, setOrdersError] =
    useState("");

  // ========================================
  // FETCH INITIAL CUSTOMER DATA
  // Menu + customer's order history
  // ========================================

  useEffect(() => {
    // Fetch restaurant menu
    const fetchMenu = async () => {
      try {
        const response = await api.get(
          "/menu/items"
        );

        setMenuItems(
          response.data.menuItems
        );
      } catch (error) {
        console.error(
          "Menu fetch error:",
          error
        );

        setMenuError(
          error.response?.data?.message ||
            "Failed to load menu"
        );
      } finally {
        setMenuLoading(false);
      }
    };

    // Fetch customer's orders
    const fetchMyOrders = async () => {
      try {
        const response = await api.get(
          "/orders/my-orders"
        );

        setOrders(
          response.data.orders
        );
      } catch (error) {
        console.error(
          "Orders fetch error:",
          error
        );

        setOrdersError(
          error.response?.data?.message ||
            "Failed to load your orders"
        );
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchMenu();
    fetchMyOrders();
  }, []);

  // ========================================
  // ADD ITEM TO CART
  // ========================================

  const addToCart = (item) => {
    // Extra protection even though
    // unavailable button is disabled.
    if (!item.isAvailable) {
      alert(
        "This dish is currently unavailable"
      );
      return;
    }

    setCart((prev) => {
      const existingItem = prev.find(
        (cartItem) =>
          cartItem.id === item.id
      );

      // Increase quantity when item
      // already exists in cart
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,

                quantity:
                  cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      // First time item is added
      return [
        ...prev,

        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  // ========================================
  // INCREASE CART QUANTITY
  // ========================================

  const increaseQuantity = (itemId) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,

              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  };

  // ========================================
  // DECREASE CART QUANTITY
  //
  // Quantity reaching zero automatically
  // removes the item.
  // ========================================

  const decreaseQuantity = (itemId) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? {
                ...item,

                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  // ========================================
  // REMOVE COMPLETE CART ITEM
  // ========================================

  const removeFromCart = (itemId) => {
    setCart((prev) =>
      prev.filter(
        (item) => item.id !== itemId
      )
    );
  };

  // ========================================
  // CLEAR CART
  // ========================================

  const clearCart = () => {
    setCart([]);
  };

  // ========================================
  // PLACE ORDER
  //
  // Frontend sends only:
  // menuItemId + quantity
  //
  // Backend securely gets prices from DB
  // and calculates final order total.
  // ========================================

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Prevent accidental double submission
    if (placingOrder) {
      return;
    }

    try {
      setPlacingOrder(true);

      const orderItems = cart.map(
        (item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })
      );

      const response = await api.post(
        "/orders",
        {
          items: orderItems,
        }
      );

      const newOrder =
        response.data.order;

      // New order immediately appears
      // at top of My Orders.
      setOrders((prev) => [
        newOrder,
        ...prev,
      ]);

      // Successful order clears cart
      setCart([]);

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to place order"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div>
      {/* =====================================
          CUSTOMER HEADER
      ====================================== */}

      <h1>DineFlow</h1>

      <p>
        Welcome to DineFlow Customer Portal
      </p>

      <LogoutButton />

      {/* =====================================
          ORDER TRACKING
      ====================================== */}

      <OrderTracking
        orders={orders}
        loading={ordersLoading}
        error={ordersError}
      />

      {/* =====================================
          RESTAURANT MENU
      ====================================== */}

      <MenuSection
        menuItems={menuItems}
        loading={menuLoading}
        error={menuError}
        onAddToCart={addToCart}
      />

      {/* =====================================
          SHOPPING CART
      ====================================== */}

      <CartSection
        cart={cart}
        placingOrder={placingOrder}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
        onRemove={removeFromCart}
        onClear={clearCart}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* =====================================
          TABLE RESERVATIONS
          Existing component remains unchanged.
      ====================================== */}

      <ReservationSection />
    </div>
  );
}

export default CustomerHome;