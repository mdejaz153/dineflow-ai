function ReservationBookingForm({
  guestCount,
  reservationDate,
  reservationHour,
  reservationMinute,
  reservationPeriod,
  specialRequest,
  checkingAvailability,
  onGuestCountChange,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  onSpecialRequestChange,
  onSubmit,
}) {
  // Available hours for 12-hour clock
  const hours = Array.from(
    { length: 12 },
    (_, index) => index + 1
  );

  return (
    <section>
      <h2>Book a Table</h2>

      <form onSubmit={onSubmit}>
        {/* =====================================
            NUMBER OF GUESTS
        ====================================== */}

        <div>
          <label>Number of Guests</label>
          <br />

          <input
            type="number"
            min="1"
            max="20"
            value={guestCount}
            onChange={(e) =>
              onGuestCountChange(e.target.value)
            }
            placeholder="e.g. 4"
            required
          />
        </div>

        <br />

        {/* =====================================
            RESERVATION DATE
        ====================================== */}

        <div>
          <label>Reservation Date</label>
          <br />

          <input
            type="date"
            value={reservationDate}
            onChange={(e) =>
              onDateChange(e.target.value)
            }
            required
          />
        </div>

        <br />

        {/* =====================================
            RESERVATION TIME
        ====================================== */}

        <div>
          <label>Reservation Time</label>
          <br />

          {/* Hour */}
          <select
            value={reservationHour}
            onChange={(e) =>
              onHourChange(e.target.value)
            }
            required
          >
            <option value="">
              Hour
            </option>

            {hours.map((hour) => (
              <option
                key={hour}
                value={hour}
              >
                {hour}
              </option>
            ))}
          </select>

          {" : "}

          {/* Minute */}
          <select
            value={reservationMinute}
            onChange={(e) =>
              onMinuteChange(e.target.value)
            }
          >
            <option value="00">00</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
          </select>

          {" "}

          {/* AM / PM */}
          <select
            value={reservationPeriod}
            onChange={(e) =>
              onPeriodChange(e.target.value)
            }
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>

        <br />

        {/* =====================================
            SPECIAL REQUEST
        ====================================== */}

        <div>
          <label>Special Request</label>
          <br />

          <textarea
            value={specialRequest}
            onChange={(e) =>
              onSpecialRequestChange(
                e.target.value
              )
            }
            placeholder="Window side, birthday setup, etc."
            rows="3"
          />
        </div>

        <br />

        {/* =====================================
            CHECK AVAILABILITY
        ====================================== */}

        <button
          type="submit"
          disabled={checkingAvailability}
        >
          {checkingAvailability
            ? "Checking..."
            : "Check Available Tables"}
        </button>
      </form>
    </section>
  );
}

export default ReservationBookingForm;