import { memo } from "react";
import { Link } from "react-router";
import { Bed, Bath, Maximize, ArrowUpRight } from "lucide-react";
import Badge from "./ui/Badge";
import type { Flat } from "@gemmaham/shared";

const FlatCard = memo(({ flat }: { flat: Flat }) => {
    return (
        <Link to={`/flats/${flat.id}`} className="project-card group">
            <div className="preview">
                {flat.renderedImageUrl || flat.floorPlanUrl ? (
                    <img
                        src={flat.renderedImageUrl || flat.floorPlanUrl}
                        alt={flat.title}
                    />
                ) : (
                    <div className="w-full h-full min-h-[160px] bg-foreground/5 flex items-center justify-center">
                        <span className="text-4xl">🏠</span>
                    </div>
                )}
                <div className="badge">
                    <Badge variant={flat.status}>{flat.status}</Badge>
                </div>
            </div>

            <div className="card-body">
                <div>
                    <h3>{flat.title}</h3>
                    <p className="text-sm text-foreground/50 mt-0.5">{flat.address}</p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-foreground/60">
                        <span className="flex items-center gap-1"><Bed size={12} /> {flat.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath size={12} /> {flat.bathrooms}</span>
                        <span className="flex items-center gap-1"><Maximize size={12} /> {flat.area} {flat.areaUnit}</span>
                    </div>

                    <p className="text-primary font-bold text-lg mt-2">
                        {flat.currency} {flat.price.toLocaleString()}
                    </p>
                </div>
                <div className="arrow">
                    <ArrowUpRight size={18} />
                </div>
            </div>
        </Link>
    );
});

export default FlatCard;
