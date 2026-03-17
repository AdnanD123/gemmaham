import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Contractor, Building, Company } from "@gemmaham/shared";

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a2e" },
    header: { marginBottom: 24, borderBottom: "2 solid #5856d6", paddingBottom: 12 },
    companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#5856d6" },
    companyInfo: { fontSize: 9, color: "#666", marginTop: 2 },
    docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 20, marginTop: 16 },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 8, color: "#333", borderBottom: "1 solid #eee", paddingBottom: 4 },
    row: { flexDirection: "row", paddingVertical: 4, borderBottom: "1 solid #f5f5f5" },
    label: { width: "40%", fontSize: 10, color: "#888" },
    value: { width: "60%", fontSize: 11, fontFamily: "Helvetica-Bold" },
    progressBar: { height: 8, backgroundColor: "#eee", borderRadius: 4, marginTop: 4 },
    progressFill: { height: 8, backgroundColor: "#5856d6", borderRadius: 4 },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTop: "1 solid #eee", paddingTop: 8, fontSize: 8, color: "#999", textAlign: "center" },
});

interface Props {
    assignment: Contractor;
    building: Building;
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

export default function ContractorAssignmentPDF({ assignment, building, company }: Props) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text style={styles.companyInfo}>{company.email} | {company.phone}</Text>
                </View>

                <Text style={styles.docTitle}>Contractor Assignment Summary</Text>

                {/* Building Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Project</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Building</Text>
                        <Text style={styles.value}>{building.title}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Address</Text>
                        <Text style={styles.value}>{building.address}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={styles.value}>{building.status}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phase</Text>
                        <Text style={styles.value}>{building.currentPhase}</Text>
                    </View>
                </View>

                {/* Contractor Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contractor</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{assignment.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trade</Text>
                        <Text style={styles.value}>{assignment.trade}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Category</Text>
                        <Text style={styles.value}>{assignment.category}</Text>
                    </View>
                    {assignment.email && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{assignment.email}</Text>
                        </View>
                    )}
                    {assignment.phone && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Phone</Text>
                            <Text style={styles.value}>{assignment.phone}</Text>
                        </View>
                    )}
                </View>

                {/* Assignment Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Assignment</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={styles.value}>{assignment.status}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Start Date</Text>
                        <Text style={styles.value}>{formatDate(assignment.startDate)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>End Date</Text>
                        <Text style={styles.value}>{formatDate(assignment.endDate)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Progress</Text>
                        <Text style={styles.value}>{assignment.progressPercent}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${assignment.progressPercent}%` }]} />
                    </View>
                </View>

                {/* Description */}
                {assignment.description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Scope of Work</Text>
                        <Text style={{ fontSize: 11, lineHeight: 1.6, color: "#333" }}>{assignment.description}</Text>
                    </View>
                )}

                <View style={styles.footer} fixed>
                    <Text>Generated by {company.name} | {company.email}</Text>
                </View>
            </Page>
        </Document>
    );
}
