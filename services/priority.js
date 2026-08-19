function calculatePriority(severity, riskScore) {

    if (riskScore >= 80 || severity === "Critical") {
        return "Critical";
    }

    if (riskScore >= 60 || severity === "High") {
        return "High";
    }

    if (riskScore >= 30 || severity === "Medium") {
        return "Medium";
    }

    return "Low";
}

module.exports = calculatePriority;