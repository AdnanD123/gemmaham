import { memo } from "react";
import { Link } from "react-router";
import { Bed, Bath, Maximize, LandPlot, ArrowUpRight } from "lucide-react";
import Badge from "./ui/Badge";
import type { House } from "@gemmaham/shared";

const houseTypeLabels: Record<string, string> = {
    detached: "Detached",
    semi_detached: "Semi-detached",
    villa: "Villa",
    townhouse: "Townhouse",
    cottage: "Cottage",
};

const HouseCard = memo(({ house }: { house: House }) => {
    return (
        <Link to={`/houses/${house.id}`} className="project-card group">
            <div className="preview">
                {house.coverImageUrl || house.floorPlanUrl ? (
                    <img
                        src={house.coverImageUrl || house.floorPlanUrl}
                        alt={house.title}
                    />
                ) : (
                    <div className="w-full h-full min-h-[160px] bg-foreground/5 flex items-center justify-center">
                        <span className="text-4xl">🏡</span>
                    </div>
                )}
                <div className="badge">
                    <Badge variant={house.status}>{house.status}</Badge>
                </div>
            </div>

            <div className="card-body">
                <div>
                    <div className="flex items-center gap-2">
                        <h3>{house.title}</h3>
                        <Badge variant="default" className="text-[10px]">
                            {houseTypeLabels[house.houseType] || house.houseType}
                        </Badge>
                    </div>
                    <p className="text-sm text-foreground/50 mt-0.5">{house.address}</p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-foreground/60">
                        <span className="flex items-center gap-1"><Bed size={12} /> {house.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath size={12} /> {house.bathrooms}</span>
                        <span className="flex items-center gap-1"><Maximize size={12} /> {house.area} {house.areaUnit}</span>
                        <span className="flex items-center gap-1"><LandPlot size={12} /> {house.lotSize} {house.lotSizeUnit}</span>
                    </div>

                    <p className="text-primary font-bold text-lg mt-2">
                        {house.currency} {house.price.toLocaleString()}
                    </p>
                </div>
                <div className="arrow">
                    <ArrowUpRight size={18} />
                </div>
            </div>
        </Link>
    );
});

export default HouseCard;
