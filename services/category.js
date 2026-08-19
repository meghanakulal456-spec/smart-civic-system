

    function detectCategory(text) {

    const complaint = text.toLowerCase();

    // WATER
    if (
        complaint.includes("water") ||
        complaint.includes("pipeline") ||
        complaint.includes("pipe") ||
        complaint.includes("leakage") ||
        complaint.includes("leak")
    ) {
        return "Water";
    }

    // GARBAGE
    if (
        complaint.includes("garbage") ||
        complaint.includes("waste") ||
        complaint.includes("trash") ||
        complaint.includes("dump") ||
        complaint.includes("rubbish")
    ) {
        return "Garbage";
    }

    // DRAINAGE
    if (
        complaint.includes("drain") ||
        complaint.includes("drainage") ||
        complaint.includes("sewage") ||
        complaint.includes("dirty water")
    ) {
        return "Drainage";
    }

    // ROAD
    if (
        complaint.includes("pothole") ||
        complaint.includes("road") ||
        complaint.includes("street damage") ||
        complaint.includes("road damage")
    ) {
        return "Road Damage";
    }

    // ELECTRICITY
    if (
        complaint.includes("street light") ||
        complaint.includes("streetlight") ||
        complaint.includes("electricity") ||
        complaint.includes("electrical") ||
        complaint.includes("power line") ||
        complaint.includes("electric pole")
    ) {
        return "Electricity";
    }

    return "Other";
}

module.exports = detectCategory;