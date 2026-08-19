function calculateRiskScore(
    severity,
    similarComplaints,
    isAnomaly,
    clusterBoost = 0
) {

    let score = 0;


    // -----------------------------
    // 1. SEVERITY
    // -----------------------------

    if (severity === "Critical") {
        score += 50;
    }
    else if (severity === "High") {
        score += 35;
    }
    else if (severity === "Medium") {
        score += 22;
    }
    else {
        score += 10;
    }


    // -----------------------------
    // 2. SIMILAR COMPLAINTS
    // -----------------------------

    if (similarComplaints.length >= 5) {
        score += 20;
    }
    else if (similarComplaints.length >= 3) {
        score += 14;
    }
    else if (similarComplaints.length >= 1) {
        score += 7;
    }


    // -----------------------------
    // 3. ANOMALY
    // -----------------------------

    if (isAnomaly) {
        score += 15;
    }


    // -----------------------------
    // 4. EMERGING INCIDENT BOOST
    // -----------------------------

    // Keep cluster influence small
    if (clusterBoost >= 20) {
        score += 12;
    }
    else if (clusterBoost >= 15) {
        score += 9;
    }
    else if (clusterBoost >= 10) {
        score += 6;
    }
    else if (clusterBoost > 0) {
        score += 3;
    }


    // -----------------------------
    // 5. CAP
    // -----------------------------

    if (score > 100) {
        score = 100;
    }


    // -----------------------------
    // 6. RISK LEVEL
    // -----------------------------

    let level;

    if (score >= 70) {
        level = "High Risk";
    }
    else if (score >= 30) {
        level = "Medium Risk";
    }
    else {
        level = "Low Risk";
    }


    return {
        score: score,
        level: level
    };
}


module.exports = calculateRiskScore;