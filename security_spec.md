# Security Specification for NutriTrack

## 1. Data Invariants
- A FoodEntry must always be associated with the user who created it (`userId`).
- Nutrient values (calories, protein, carbs, fats) must always be non-negative numbers.
- The `timestamp` must always match the server time (`request.time`).
- The `date` must be a YYYY-MM-DD string.

## 2. The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Theft**: Create an entry with someone else's `userId`.
2. **Shadow Field Injection**: Create an entry with extra fields (e.g., `isVerified: true`).
3. **Invalid ID Poisoning**: Access entry with a 2KB garbage document ID.
4. **Nutrient Overflow**: Set protein to a negative number or a huge string.
5. **Timestamp Spoofing**: Provide a custom client-side `timestamp` instead of `request.time`.
6. **Date Poisoning**: Set `date` to a 500-character string.
7. **Unauthorized Read**: User A tries to `get` User B's food log.
8. **Unauthorized List**: User A tries to `list` without a `userId` filter matching their UID.
9. **Unauthorized Update**: User A tries to modify User B's entry.
10. **Immutable Field Write**: Attempting to change `userId` during an update.
11. **Type Mismatch**: Sending a string for `calories`.
12. **Anonymous Write**: Attempting to create an entry while not signed in.

## 3. The Test Runner (Mock Tests)
Rules are designed to block all the above via:
- `incoming().userId == request.auth.uid`
- `isValidFoodEntry(incoming())` check for keys size and types.
- `incoming().timestamp == request.time`
- Resource-based filters on `read` and `list`.
