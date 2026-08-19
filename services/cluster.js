function normalizeLocation(location) {

    return (location || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ");

}


function createIncidentId(category, location) {

    const text =
        `${category}-${normalizeLocation(location)}`;

    let hash = 0;

    for (let i = 0; i < text.length; i++) {

        hash =
            ((hash << 5) - hash) +
            text.charCodeAt(i);

        hash |= 0;
    }

    hash = Math.abs(hash);

    return `INC-${String(hash).slice(0, 6)}`;
}


function getIncidentTitle(category, complaint) {

    const text =
        (complaint || "").toLowerCase();

    if (
        category === "Electricity" &&
        (
            text.includes("street light") ||
            text.includes("streetlight") ||
            text.includes("light")
        )
    ) {
        return "Street-light failures";
    }

    if (category === "Garbage") {
        return "Garbage accumulation";
    }

    if (category === "Water") {
        return "Water supply issues";
    }

    if (category === "Drainage") {
        return "Drainage problems";
    }

    if (category === "Road Damage") {
        return "Road damage and potholes";
    }

    return `${category} civic issue`;

}


function getRecommendedAction(
    department,
    pressure
) {

    if (pressure === "Critical") {

        return `Dispatch ${department || "relevant"} field team immediately for coordinated resolution.`;

    }

    if (pressure === "High") {

        return `Dispatch ${department || "relevant"} field team for priority response.`;

    }

    if (pressure === "Medium") {

        return `Assign ${department || "relevant"} team for priority inspection and action.`;

    }

    if (pressure === "Emerging") {

        return `Monitor the affected area and assign an officer for inspection.`;

    }

    return "Continue normal complaint processing.";

}


function detectEmergingCluster(
    category,
    location,
    complaint,
    similarComplaints,
    complaints,
    department,
    severity
) {

    const normalizedLocation =
        normalizeLocation(location);


    const oneDayAgo =
        Date.now() - (24 * 60 * 60 * 1000);


    /*
    Recent complaints with:
    same category + same locality
    */

    const recentRelated =
        complaints.filter(item => {

            const sameCategory =
                item.category === category;

            const sameLocation =
                normalizeLocation(item.location) ===
                normalizedLocation;

            const createdTime =
                new Date(item.createdAt).getTime();

            const recent =
                !isNaN(createdTime) &&
                createdTime >= oneDayAgo;

            return (
                sameCategory &&
                sameLocation &&
                recent
            );

        });


    /*
    Number of reports in the incident
    */

    const reportCount =
        recentRelated.length + 1;


    /*
    Similarity
    */

    const recentIds =
        new Set(
            recentRelated.map(
                item => item.id
            )
        );


    const similarityMatches =
        similarComplaints.filter(
            item =>
                recentIds.has(item.id)
        );


    let averageSimilarity = 0;


    if (
        similarityMatches.length > 0
    ) {

        averageSimilarity =
            Math.round(

                similarityMatches.reduce(
                    (sum, item) =>
                        sum +
                        Number(item.similarity || 0),
                    0
                )
                /
                similarityMatches.length

            );

    }


    /*
    Unresolved reports
    */

    const unresolvedPrevious =
        recentRelated.filter(
            item =>
                (item.status || "Pending") !==
                "Resolved"
        ).length;


    const unresolvedReports =
        unresolvedPrevious + 1;


    /*
    Velocity
    */

    const reports24h =
        reportCount;


    const reportVelocity =
        `${reports24h} report${reports24h === 1 ? "" : "s"} / 24h`;


    /*
    =====================================
    SEVERITY PRESSURE
    =====================================
    */

    let severityWeight = 0;


    if (severity === "Critical") {

        severityWeight = 4;

    }
    else if (severity === "High") {

        severityWeight = 3;

    }
    else if (severity === "Medium") {

        severityWeight = 2;

    }
    else {

        severityWeight = 1;

    }


    /*
    =====================================
    VELOCITY PRESSURE
    =====================================
    */

    let velocityWeight = 0;


    if (reports24h >= 8) {

        velocityWeight = 4;

    }
    else if (reports24h >= 6) {

        velocityWeight = 3;

    }
    else if (reports24h >= 4) {

        velocityWeight = 2;

    }
    else if (reports24h >= 3) {

        velocityWeight = 1;

    }


    /*
    =====================================
    UNRESOLVED PRESSURE
    =====================================
    */

    let unresolvedWeight = 0;


    if (unresolvedReports >= 6) {

        unresolvedWeight = 4;

    }
    else if (unresolvedReports >= 4) {

        unresolvedWeight = 3;

    }
    else if (unresolvedReports >= 3) {

        unresolvedWeight = 2;

    }
    else if (unresolvedReports >= 1) {

        unresolvedWeight = 1;

    }


    /*
    =====================================
    TOTAL INCIDENT PRESSURE
    =====================================
    */

    const pressureScore =
        severityWeight +
        velocityWeight +
        unresolvedWeight;


    let incidentPressure = "None";


    if (
        pressureScore >= 10
    ) {

        incidentPressure = "Critical";

    }
    else if (
        pressureScore >= 8
    ) {

        incidentPressure = "High";

    }
    else if (
        pressureScore >= 5
    ) {

        incidentPressure = "Medium";

    }
    else if (
        reportCount >= 3 &&
        averageSimilarity >= 60
    ) {

        incidentPressure = "Emerging";

    }


    /*
    An incident must still have
    repeated local reports.
    */

    const isEmerging =
        reportCount >= 3 &&
        averageSimilarity >= 60;


    /*
    =====================================
    RISK BOOST
    =====================================
    */

    let riskBoost = 0;


    if (reportCount >= 8) {

        riskBoost += 20;

    }
    else if (reportCount >= 5) {

        riskBoost += 15;

    }
    else if (reportCount >= 3) {

        riskBoost += 10;

    }


    if (averageSimilarity >= 90) {

        riskBoost += 5;

    }
    else if (averageSimilarity >= 75) {

        riskBoost += 3;

    }


    /*
    =====================================
    PREVIOUS RISK
    =====================================
    */

    const previousRiskValues =
        recentRelated
            .map(
                item =>
                    Number(
                        item.riskScore || 0
                    )
            )
            .filter(
                value =>
                    value > 0
            );


    let previousClusterRisk = 0;


    if (
        previousRiskValues.length > 0
    ) {

        previousClusterRisk =
            Math.round(

                previousRiskValues.reduce(
                    (sum, value) =>
                        sum + value,
                    0
                )
                /
                previousRiskValues.length

            );

    }


    /*
    =====================================
    INCIDENT INFORMATION
    =====================================
    */

    const incidentId =
        createIncidentId(
            category,
            location
        );


    const incidentTitle =
        getIncidentTitle(
            category,
            complaint
        );


    const recommendedAction =
        getRecommendedAction(
            department,
            incidentPressure
        );


    return {

        detected:
            isEmerging,

        incidentId:
            incidentId,

        clusterId:
            incidentId,

        incidentTitle:
            incidentTitle,

        clusterTitle:
            incidentTitle,

        location:
            location,

        reportCount:
            reportCount,

        reports24h:
            reports24h,

        reportVelocity:
            reportVelocity,

        averageSimilarity:
            averageSimilarity,

        previousClusterRisk:
            previousClusterRisk,

        unresolvedReports:
            unresolvedReports,

        severity:
            severity,

        severityWeight:
            severityWeight,

        velocityWeight:
            velocityWeight,

        unresolvedWeight:
            unresolvedWeight,

        pressureScore:
            pressureScore,

        incidentPressure:
            incidentPressure,

        riskBoost:
            riskBoost,

        clusterLevel:
            incidentPressure,

        recommendedAction:
            recommendedAction,

        trend:
            isEmerging
                ? "↑"
                : "→"

    };

}


module.exports =
    detectEmergingCluster;