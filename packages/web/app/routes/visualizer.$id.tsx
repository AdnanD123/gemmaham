import { useNavigate, useOutletContext, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, RefreshCcw, X } from "lucide-react";
import Button from "../../components/ui/Button";
import { getFlat } from "../../lib/firestore";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import type { Flat, AuthContext } from "@gemmaham/shared";

const VisualizerId = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useOutletContext<AuthContext>();

    const hasInitialGenerated = useRef(false);

    const [flat, setFlat] = useState<Flat | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    const handleBack = () => navigate(-1);

    const handleExport = () => {
        if (!currentImage) return;
        const link = document.createElement("a");
        link.href = currentImage;
        link.download = `gemmaham-${id || "design"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const runGeneration = async (flat: Flat) => {
        if (!id || !flat.floorPlanUrl) return;

        try {
            setIsProcessing(true);
            const result = await generate3DView({
                flatId: id,
                imageUrl: flat.floorPlanUrl,
            });

            if (result.renderedImageUrl) {
                setCurrentImage(result.renderedImageUrl);
                setFlat((prev) =>
                    prev ? { ...prev, renderedImageUrl: result.renderedImageUrl } : prev
                );
            }
        } catch (error) {
            console.error("Generation failed: ", error);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadFlat = async () => {
            if (!id) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const fetchedFlat = await getFlat(id);

            if (!isMounted) return;

            setFlat(fetchedFlat);
            setCurrentImage(fetchedFlat?.renderedImageUrl || null);
            setIsLoading(false);
            hasInitialGenerated.current = false;
        };

        loadFlat();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (isLoading || hasInitialGenerated.current || !flat?.floorPlanUrl) return;

        if (flat.renderedImageUrl) {
            setCurrentImage(flat.renderedImageUrl);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(flat);
    }, [flat, isLoading]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />
                    <span className="name">Gemmaham</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon" /> {t("visualizer.exitEditor")}
                </Button>
            </nav>

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>{t("visualizer.flat")}</p>
                            <h2>{flat?.title || `${t("visualizer.flat")} ${id}`}</h2>
                            <p className="note">{flat?.address || ""}</p>
                        </div>

                        <div className="panel-actions">
                            <Button
                                size="sm"
                                onClick={handleExport}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2" /> {t("visualizer.export")}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => flat && !flat.renderedImageUrl && runGeneration(flat)}
                                disabled={isProcessing || !flat?.floorPlanUrl}
                            >
                                <RefreshCcw className="w-4 h-4 mr-2" /> {t("visualizer.regenerate")}
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img" />
                        ) : (
                            <div className="render-placeholder">
                                {flat?.floorPlanUrl && (
                                    <img src={flat.floorPlanUrl} alt="Floor Plan" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">{t("visualizer.rendering")}</span>
                                    <span className="subtitle">{t("visualizer.generatingVisualization")}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel compare">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>{t("visualizer.comparison")}</p>
                            <h3>{t("visualizer.beforeAfter")}</h3>
                        </div>
                        <div className="hint">{t("visualizer.dragToCompare")}</div>
                    </div>

                    <div className="compare-stage">
                        {flat?.floorPlanUrl && currentImage ? (
                            <ReactCompareSlider
                                defaultValue={50}
                                style={{ width: "100%", height: "auto" }}
                                itemOne={
                                    <ReactCompareSliderImage src={flat.floorPlanUrl} alt="before" className="compare-img" />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage src={currentImage} alt="after" className="compare-img" />
                                }
                            />
                        ) : (
                            <div className="compare-fallback">
                                {flat?.floorPlanUrl && (
                                    <img src={flat.floorPlanUrl} alt="Floor Plan" className="compare-img" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VisualizerId;
