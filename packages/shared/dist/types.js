/** Safely convert any TimestampLike value to epoch milliseconds. Returns 0 for invalid values. */
export function toMillis(ts) {
    if (!ts)
        return 0;
    if (ts instanceof Date)
        return ts.getTime();
    if (typeof ts === "string")
        return new Date(ts).getTime();
    if (typeof ts === "object" && "seconds" in ts)
        return ts.seconds * 1000;
    return 0;
}
/** Format a TimestampLike to a localized date string. Returns empty string for invalid values. */
export function formatTimestamp(ts) {
    const ms = toMillis(ts);
    return ms ? new Date(ms).toLocaleDateString() : "";
}
// ─── App Status (UI state) ───────────────────────────────
export var AppStatus;
(function (AppStatus) {
    AppStatus["IDLE"] = "IDLE";
    AppStatus["UPLOADING"] = "UPLOADING";
    AppStatus["PROCESSING"] = "PROCESSING";
    AppStatus["READY"] = "READY";
})(AppStatus || (AppStatus = {}));
export function isProfileComplete(profile) {
    return !!(profile.displayName &&
        profile.phone &&
        profile.address &&
        profile.photoURL);
}
