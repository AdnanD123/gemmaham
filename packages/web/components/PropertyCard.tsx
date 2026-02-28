import { memo } from "react";
import BuildingCard from "./BuildingCard";
import HouseCard from "./HouseCard";
import type { Building, House } from "@gemmaham/shared";
import type { PropertyItem } from "../lib/firestore";

const PropertyCard = memo(({ property }: { property: PropertyItem }) => {
    if (property.__propertyType === "house") {
        return <HouseCard house={property as House & { __propertyType: "house" }} />;
    }
    return <BuildingCard building={property as Building & { __propertyType: "building" }} />;
});

export default PropertyCard;
