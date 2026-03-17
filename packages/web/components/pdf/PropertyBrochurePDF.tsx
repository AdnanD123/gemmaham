import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Flat, House, Company } from "@gemmaham/shared";

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a2e" },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 20, borderBottom: "2 solid #5856d6", paddingBottom: 12 },
    logo: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
    companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#5856d6" },
    companyEmail: { fontSize: 9, color: "#666" },
    title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 4 },
    address: { fontSize: 12, color: "#555", marginBottom: 16 },
    price: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#5856d6", marginBottom: 20 },
    specsRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
    specBox: { flex: 1, padding: 10, backgroundColor: "#f5f5ff", borderRadius: 6, alignItems: "center" },
    specLabel: { fontSize: 9, color: "#888", marginBottom: 2 },
    specValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
    description: { fontSize: 11, lineHeight: 1.6, color: "#333", marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 8, color: "#1a1a2e" },
    photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    photo: { width: 240, height: 160, objectFit: "cover", borderRadius: 6 },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTop: "1 solid #eee", paddingTop: 8, fontSize: 8, color: "#999", textAlign: "center" },
});

interface Props {
    property: Flat | House;
    company: Company;
    photos: string[];
}

function isHouse(p: Flat | House): p is House {
    return "lotSize" in p;
}

export default function PropertyBrochurePDF({ property, company, photos }: Props) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    {company.logo ? (
                        <Image src={company.logo} style={styles.logo} />
                    ) : null}
                    <View>
                        <Text style={styles.companyName}>{company.name}</Text>
                        <Text style={styles.companyEmail}>{company.email}</Text>
                    </View>
                </View>

                {/* Title & Price */}
                <Text style={styles.title}>{property.title}</Text>
                <Text style={styles.address}>{property.address}</Text>
                <Text style={styles.price}>
                    {property.currency} {property.price.toLocaleString()}
                </Text>

                {/* Specs */}
                <View style={styles.specsRow}>
                    <View style={styles.specBox}>
                        <Text style={styles.specLabel}>Bedrooms</Text>
                        <Text style={styles.specValue}>{property.bedrooms}</Text>
                    </View>
                    <View style={styles.specBox}>
                        <Text style={styles.specLabel}>Bathrooms</Text>
                        <Text style={styles.specValue}>{property.bathrooms}</Text>
                    </View>
                    <View style={styles.specBox}>
                        <Text style={styles.specLabel}>Area</Text>
                        <Text style={styles.specValue}>{property.area} {property.areaUnit}</Text>
                    </View>
                    {isHouse(property) && (
                        <View style={styles.specBox}>
                            <Text style={styles.specLabel}>Lot Size</Text>
                            <Text style={styles.specValue}>{property.lotSize} {property.areaUnit}</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                {property.description && (
                    <View>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{property.description}</Text>
                    </View>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Gallery</Text>
                        <View style={styles.photoGrid}>
                            {photos.slice(0, 6).map((url, i) => (
                                <Image key={i} src={url} style={styles.photo} />
                            ))}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text>{company.name} | {company.email} | {company.phone}</Text>
                </View>
            </Page>
        </Document>
    );
}
