# Customer App - Order Tracking Logic

This application uses a hybrid strategy to track riders during active deliveries:

1. **Primary: Firebase Realtime Database (RTDB)**
   - The driver app publishes high-frequency GPS updates (every 5s) to `liveLocations/${driverId}`.
   - The customer app listens to this path for real-time marker movement.

2. **Fallback: Firestore Order Snapshot**
   - In case of RTDB permission issues or stale data, the driver app also embeds the current coordinates directly into the `order` document in Firestore every 10-15s.
   - Keywords: `riderCurrentLat`, `riderCurrentLng`, `riderHeading`.

## Build Instructions
- Use `npm run clean:android` if native builds fail.
- Build restricted to `arm64-v8a` for faster development cycles.
