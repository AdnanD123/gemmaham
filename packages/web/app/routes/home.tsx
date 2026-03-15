import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import { ArrowRight, ArrowUpRight, Clock, Layers, Building2, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import { Link, useOutletContext, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFeaturedFlats } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import { FlatGridSkeleton } from "../../components/skeletons/FlatCardSkeleton";
import type { Flat, AuthContext } from "@gemmaham/shared";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gemmaham — Find Your Dream Flat" },
    { name: "description", content: "Browse flats with AI-powered 3D floor plan visualizations" },
  ];
}

export default function Home() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { user, role } = auth;
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [flats, setFlats] = useState<Flat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect logged-in agency/contractor users to their dashboards
        if (role === "company") { navigate("/company/dashboard", { replace: true }); return; }
        if (role === "contractor") { navigate("/contractor/dashboard", { replace: true }); return; }

        getFeaturedFlats(6)
            .then(setFlats)
            .catch((e) => {
                console.error("Failed to load featured flats:", e);
                addToast("error", t("errors.loadFailed"));
            })
            .finally(() => setLoading(false));
    }, [role]);

    return (
        <div className="home">
            <Navbar />
            <section className="hero">
                <div className="announce">
                    <div className="dot">
                        <div className="pulse"></div>
                    </div>
                    <p>{t("home.badge")}</p>
                </div>

                <h1>{t("home.title")}</h1>

                <p className="subtitle">
                    {t("home.subtitle")}
                </p>

                <div className="actions">
                    <Link to="/flats" className="cta">
                        {t("home.demo")} <Search className="icon" />
                    </Link>

                    {role === "company" ? (
                        <Link to="/company/flats/new">
                            <Button variant="outline" size="lg" className="demo">
                                <Building2 className="w-4 h-4 mr-2" /> {t("home.addFlat")}
                            </Button>
                        </Link>
                    ) : !user ? (
                        <Link to="/auth/register">
                            <Button variant="outline" size="lg" className="demo">
                                {t("home.cta")} <ArrowRight className="icon" />
                            </Button>
                        </Link>
                    ) : null}
                </div>

                <div id="upload" className="upload-shell">
                    <div className="grid-overlay" />

                    <div className="upload-card">
                        <div className="upload-head">
                            <div className="upload-icon">
                                <Layers className="icon" />
                            </div>
                            <h3>{t("home.uploadTitle")}</h3>
                            <p>{t("home.uploadDesc")}</p>
                        </div>

                        <div className="p-6 text-center">
                            {role === "company" ? (
                                <Link to="/company/flats/new" className="cta">
                                    {t("home.uploadFloorPlan")} <ArrowRight className="icon" />
                                </Link>
                            ) : (
                                <Link to="/flats" className="cta">
                                    {t("home.browseAvailable")} <ArrowRight className="icon" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="projects">
                <div className="section-inner">
                    <div className="section-head">
                        <div className="copy">
                            <h2>{t("home.featuredTitle")}</h2>
                            <p>{t("home.featuredSubtitle")}</p>
                        </div>

                        <Link to="/flats">
                            <Button variant="outline" size="sm">
                                {t("home.viewAll")} <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        <FlatGridSkeleton count={6} />
                    ) : flats.length === 0 ? (
                        <div className="text-center py-12 text-foreground/50">
                            <p>{t("home.noFeatured")}</p>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {flats.map((flat) => (
                                <Link
                                    key={flat.id}
                                    to={`/flats/${flat.id}`}
                                    className="project-card group"
                                >
                                    <div className="preview">
                                        <img
                                            src={flat.renderedImageUrl || flat.floorPlanUrl}
                                            alt={flat.title}
                                        />
                                        <div className="badge">
                                            <span>{flat.status}</span>
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div>
                                            <h3>{flat.title}</h3>
                                            <div className="meta">
                                                <Clock size={12} />
                                                <span>
                                                    {flat.bedrooms} {t("home.bed")} &middot; {flat.bathrooms} {t("home.bath")} &middot; {flat.area} {flat.areaUnit}
                                                </span>
                                            </div>
                                            <p className="text-primary font-bold mt-1">
                                                {flat.currency} {flat.price.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="arrow">
                                            <ArrowUpRight size={18} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
