import { useEffect, useState } from "react";
import api from "../../services/api";

import ReservationBookingForm from "./reservations/ReservationBookingForm";
import AvailableTables from "./reservations/AvailableTables";
import MyReservations from "./reservations/MyReservations";

function ReservationSection() {
  // ========================================
  // BOOKING FORM STATE
  // ========================================

  const [guestCount, setGuestCount] =
    useState("");

  const [
    reservationDate,
    setReservationDate,
  ] = useState("");

  const [
    reservationHour,
    setReservationHour,
  ] = useState("");

  const [
    reservationMinute,
    setReservationMinute,
  ] = useState("00");

  const [
    reservationPeriod,
    setReservationPeriod,
  ] = useState("PM");

  const [
    specialRequest,
    setSpecialRequest,
  ] = useState("");

  // ========================================
  // AVAILABILITY STATE
  // ========================================

  const [
    availableTables,
    setAvailableTables,
  ] = useState([]);

  const [
    availabilityChecked,
    setAvailabilityChecked,
  ] = useState(false);

  const [
    checkingAvailability,
    setCheckingAvailability,
  ] = useState(false);

  // ========================================
  // CUSTOMER RESERVATIONS STATE
  // ========================================

  const [
    reservations,
    setReservations,
  ] = useState([]);

  const [
    loadingReservations,
    setLoadingReservations,
  ] = useState(true);

  // ========================================
  // FETCH MY RESERVATIONS
  // ========================================

  const fetchMyReservations = async () => {
    try {
      const response = await api.get(
        "/reservations/my-reservations"
      );

      setReservations(
        response.data.reservations
      );
    } catch (error) {
      console.error(
        "Fetch reservations error:",
        error
      );
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    fetchMyReservations();
  }, []);

  // ========================================
  // RESET AVAILABILITY
  //
  // Previous availability becomes invalid
  // whenever guest/date/time changes.
  // ========================================

  const resetAvailability = () => {
    setAvailabilityChecked(false);
    setAvailableTables([]);
  };

  // ========================================
  // BUILD RESERVATION DATE/TIME
  //
  // Converts separate date + 12-hour time
  // into an ISO timestamp for backend.
  // ========================================

  const getStartTimeISO = () => {
    if (
      !reservationDate ||
      !reservationHour ||
      !reservationMinute ||
      !reservationPeriod
    ) {
      return null;
    }

    let hour =
      Number(reservationHour);

    const minute =
      Number(reservationMinute);

    if (
      !Number.isInteger(hour) ||
      hour < 1 ||
      hour > 12 ||
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    // ========================================
    // 12-HOUR -> 24-HOUR CONVERSION
    // ========================================

    if (
      reservationPeriod === "AM" &&
      hour === 12
    ) {
      hour = 0;
    }

    if (
      reservationPeriod === "PM" &&
      hour !== 12
    ) {
      hour += 12;
    }

    const [year, month, day] =
      reservationDate
        .split("-")
        .map(Number);

    // JavaScript Date is created in user's
    // local timezone and converted to ISO.
    const localDate = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0
    );

    if (
      Number.isNaN(
        localDate.getTime()
      )
    ) {
      return null;
    }

    return localDate.toISOString();
  };

  // ========================================
  // CHECK TABLE AVAILABILITY
  // ========================================

  const handleCheckAvailability =
    async (e) => {
      e.preventDefault();

      const startTimeISO =
        getStartTimeISO();

      if (!guestCount) {
        alert(
          "Please enter the number of guests"
        );

        return;
      }

      if (!startTimeISO) {
        alert(
          "Please select a valid reservation date and time"
        );

        return;
      }

      try {
        setCheckingAvailability(true);

        const response = await api.get(
          "/reservations/available",
          {
            params: {
              guestCount:
                Number(guestCount),

              startTime:
                startTimeISO,
            },
          }
        );

        setAvailableTables(
          response.data.tables
        );

        setAvailabilityChecked(true);
      } catch (error) {
        console.error(
          "Check availability error:",
          error
        );

        setAvailableTables([]);
        setAvailabilityChecked(true);

        alert(
          error.response?.data?.message ||
            "Failed to check table availability"
        );
      } finally {
        setCheckingAvailability(false);
      }
    };

  // ========================================
  // RESERVE TABLE
  // ========================================

  const handleReserveTable =
    async (tableId) => {
      const startTimeISO =
        getStartTimeISO();

      if (!startTimeISO) {
        alert(
          "Please select a valid reservation date and time"
        );

        return;
      }

      try {
        const response = await api.post(
          "/reservations",
          {
            tableId,

            guestCount:
              Number(guestCount),

            startTime:
              startTimeISO,

            specialRequest,
          }
        );

        const newReservation =
          response.data.reservation;

        // Add reservation instantly
        setReservations((prev) => [
          newReservation,
          ...prev,
        ]);

        // Prevent same table from being
        // selected again from stale results.
        setAvailableTables((prev) =>
          prev.filter(
            (table) =>
              table.id !== tableId
          )
        );

        setSpecialRequest("");

        alert(response.data.message);
      } catch (error) {
        console.error(
          "Reserve table error:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to reserve table"
        );
      }
    };

  // ========================================
  // CANCEL RESERVATION
  // ========================================

  const handleCancelReservation =
    async (reservationId) => {
      try {
        const response = await api.patch(
          `/reservations/${reservationId}/cancel`
        );

        const updatedReservation =
          response.data.reservation;

        setReservations((prev) =>
          prev.map((reservation) =>
            reservation.id ===
            reservationId
              ? updatedReservation
              : reservation
          )
        );

        alert(response.data.message);
      } catch (error) {
        console.error(
          "Cancel reservation error:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to cancel reservation"
        );
      }
    };

  // ========================================
  // FORM CHANGE HANDLERS
  //
  // These handlers also clear stale
  // availability results.
  // ========================================

  const handleGuestCountChange =
    (value) => {
      setGuestCount(value);
      resetAvailability();
    };

  const handleDateChange =
    (value) => {
      setReservationDate(value);
      resetAvailability();
    };

  const handleHourChange =
    (value) => {
      setReservationHour(value);
      resetAvailability();
    };

  const handleMinuteChange =
    (value) => {
      setReservationMinute(value);
      resetAvailability();
    };

  const handlePeriodChange =
    (value) => {
      setReservationPeriod(value);
      resetAvailability();
    };

  // ========================================
  // UI / COMPONENT COMPOSITION
  // ========================================

  return (
    <section>
      <hr />

      {/* =====================================
          BOOKING FORM
      ====================================== */}

      <ReservationBookingForm
        guestCount={guestCount}
        reservationDate={
          reservationDate
        }
        reservationHour={
          reservationHour
        }
        reservationMinute={
          reservationMinute
        }
        reservationPeriod={
          reservationPeriod
        }
        specialRequest={
          specialRequest
        }
        checkingAvailability={
          checkingAvailability
        }
        onGuestCountChange={
          handleGuestCountChange
        }
        onDateChange={
          handleDateChange
        }
        onHourChange={
          handleHourChange
        }
        onMinuteChange={
          handleMinuteChange
        }
        onPeriodChange={
          handlePeriodChange
        }
        onSpecialRequestChange={
          setSpecialRequest
        }
        onSubmit={
          handleCheckAvailability
        }
      />

      {/* =====================================
          AVAILABLE TABLES
      ====================================== */}

      <AvailableTables
        availabilityChecked={
          availabilityChecked
        }
        availableTables={
          availableTables
        }
        onReserve={
          handleReserveTable
        }
      />

      {/* =====================================
          CUSTOMER RESERVATIONS
      ====================================== */}

      <MyReservations
        reservations={reservations}
        loading={
          loadingReservations
        }
        onCancel={
          handleCancelReservation
        }
      />
    </section>
  );
}

export default ReservationSection;