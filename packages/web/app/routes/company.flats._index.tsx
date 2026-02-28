import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function CompanyFlatsRedirect() {
    const navigate = useNavigate();
    useEffect(() => {
        navigate("/company/buildings", { replace: true });
    }, [navigate]);
    return null;
}
