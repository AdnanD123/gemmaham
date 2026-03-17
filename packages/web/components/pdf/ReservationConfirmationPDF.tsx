import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Reservation, Flat, House, Company } from "@gemmaham/shared";

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a2e" },
    header: { marginBottom: 24, borderBottom: "2 solid #5856d6", paddingBottom: 12 },
    companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#5856d6" },
    companyInfo: { fontSize: 9, color: "#666", marginTop: 2 },
    docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4, marginTop: 16 },
    docSubtitle: { fontSize: 11, color: "#666", marginBottom: 20 },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 8, color: "#333", borderBottom: "1 solid #eee", paddingBottom: 4 },
    row: { flexDirection: "row", paddingVertical: 4, borderBottom: "1 solid #f5f5f5" },
    label: { width: "40%", fontSize: 10, color: "#888" },
    value: { width: "60%", fontSize: 11, fontFamily: "Helvetica-Bold" },
    statusBadge: { backgroundColor: "#5856d6", color: "white", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontFamily: "Helvetica-Bold" },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTop: "1 solid #eee", paddingTop: 8, fontSize: 8, color: "#999", textAlign: "center" },
});

interface Props {
    reservation: Reservation;
    property: Flat | House;
    company: Company;
}

function formatDate(value: unknown): string {
    if (!value) return "—";
    if (typeof value === "string") return new Date(value).toLocaleDateString();
    if (typeof value === "object" && value !== null && "toDate" in value) {
        return (value as { toDate: () => Date }).toDate().toLocaleDateString();
    }
    return "—";
}

export default function ReservationConfirmationPDF({ reservation, property, company }: Props) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text style={styles.companyInfo}>{company.email} | {company.phone}</Text>
                </View>

                <Text style={styles.docTitle}>Reservation Confirmation</Text>
                <Text style={styles.docSubtitle}>Reference: {reservation.id}</Text>

                {/* Property Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Property Details</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Property</Text>
                        <Text style={styles.value}>{property.title}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Address</Text>
                        <Text style={styles.value}>{property.address}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Price</Text>
                        <Text style={styles.value}>{property.currency} {property.price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Bedrooms / Bathrooms</Text>
                        <Text style={styles.value}>{property.bedrooms} / {property.bathrooms}</Text>
                    </View>
                </View>

                {/* Reservation Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reservation Details</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={styles.statusBadge}>{reservation.status.toUpperCase()}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Request Date</Text>
                        <Text style={styles.value}>{formatDate(reservation.createdAt)}</Text>
                    </View>
                    {reservation.meetingDate && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Meeting Date</Text>
                            <Text style={styles.value}>{formatDate(reservation.meetingDate)}</Text>
                        </View>
                    )}
                    {reservation.expiresAt && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Expires</Text>
                            <Text style={styles.value}>{formatDate(reservation.expiresAt)}</Text>
                        </View>
                    )}
                </View>

                {/* Applicant Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Applicant</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{reservation.userSnapshot?.displayName || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{reservation.userSnapshot?.email || "—"}</Text>
                    </View>
                </View>

                {/* Additional Info */}
                {(reservation.preferredMoveIn || reservation.financingMethod || reservation.urgency) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Information</Text>
                        {reservation.preferredMoveIn && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Preferred Move-in</Text>
                                <Text style={styles.value}>{reservation.preferredMoveIn}</Text>
                            </View>
                        )}
                        {reservation.financingMethod && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Financing</Text>
                                <Text style={styles.value}>{reservation.financingMethod}</Text>
                            </View>
                        )}
                        {reservation.occupants && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Occupants</Text>
                                <Text style={styles.value}>{reservation.occupants}</Text>
                            </View>
                        )}
                        {reservation.urgency && (
                            <View style={styles.row}>
                                <Text style={styles.label}>Urgency</Text>
                                <Text style={styles.value}>{reservation.urgency}</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.footer} fixed>
                    <Text>This document was generated by {company.name}. For questions, contact {company.email}.</Text>
                </View>
            </Page>
        </Document>
    );
}
