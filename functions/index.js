const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Callable Function: Secure User Registration with Role Assignment
 * 
 * - Volunteers can register without an invitation code -> Assigned 'volunteer' role
 * - Organizers must supply a valid single-use invitation code -> Assigned 'organizer' role
 * - Validates code against backend environment (ORGANIZER_INVITATION_CODE)
 * - Verifies code has not already been burned/consumed
 * - Sets custom claims on Firebase Auth token
 * - Marks code as used in protected collection (_system_invitations)
 */
exports.registerUserAccount = onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const { email, password, displayName, accountType, invitationCode } = data;

  // 1. Basic validation
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "A valid email address is required.");
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must be at least 6 characters long.");
  }
  if (!["organizer", "volunteer"].includes(accountType)) {
    throw new HttpsError("invalid-argument", "Invalid account type. Must be 'organizer' or 'volunteer'.");
  }

  let role = "volunteer";

  // 2. Organizer invitation code verification
  if (accountType === "organizer") {
    if (!invitationCode || typeof invitationCode !== "string" || !invitationCode.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "An Organizer Invitation Code is required to register as an Organizer."
      );
    }

    const cleanCode = invitationCode.trim();

    // Load backend-only secret invitation code from environment variable
    const validBackendCode = process.env.ORGANIZER_INVITATION_CODE || "RELAY-COMMAND-2026";

    // Timing-safe / strict equality check
    if (cleanCode !== validBackendCode) {
      throw new HttpsError(
        "permission-denied",
        "Invalid invitation code. Please check your credentials with Incident Command."
      );
    }

    // Check if the single-use code has already been burned
    const inviteRef = db.collection("_system_invitations").doc(cleanCode);
    const inviteSnap = await inviteRef.get();

    if (inviteSnap.exists && inviteSnap.data().used === true) {
      throw new HttpsError(
        "already-exists",
        "This organizer invitation code has already been used and expired. Each code is strictly single-use."
      );
    }

    role = "organizer";
  }

  // 3. Create user in Firebase Authentication via Admin SDK
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      displayName: displayName ? displayName.trim() : "",
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError(
        "already-exists",
        "An account with this email address already exists. Please sign in instead."
      );
    }
    throw new HttpsError("internal", error.message || "Failed to create user account.");
  }

  // 4. Assign trusted Firebase Authentication custom claims
  await auth.setCustomUserClaims(userRecord.uid, {
    role: role,
    isOrganizer: role === "organizer",
    isVolunteer: role === "volunteer",
  });

  // 5. If organizer, burn the single-use code in backend Firestore
  if (role === "organizer" && invitationCode) {
    await db.collection("_system_invitations").doc(invitationCode.trim()).set({
      used: true,
      usedByUid: userRecord.uid,
      usedByEmail: userRecord.email,
      accountType: "organizer",
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 6. Persist user document in Firestore users collection
  const resolvedName = displayName ? displayName.trim() : (role === "organizer" ? "Incident Commander" : "Response Volunteer");
  await db.collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    name: resolvedName,
    displayName: resolvedName,
    email: userRecord.email,
    role: role,
    skills: role === "organizer" ? ["Incident Command", "Crisis Dispatch"] : ["First Aid", "Field Operations"],
    availability: "available",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 7. Mint custom token for instant automatic sign-in on the frontend
  const customToken = await auth.createCustomToken(userRecord.uid, { role });

  return {
    success: true,
    uid: userRecord.uid,
    email: userRecord.email,
    role: role,
    customToken: customToken,
  };
});

