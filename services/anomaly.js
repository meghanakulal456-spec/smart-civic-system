function detectAnomaly(location, similarComplaints, complaints) {

    const sameLocationComplaints = complaints.filter(item =>
        item.location.toLowerCase() === location.toLowerCase()
    );

    const totalRelatedComplaints =
        sameLocationComplaints.length + similarComplaints.length;

    if (totalRelatedComplaints >= 3) {
        return true;
    }

    return false;
}

module.exports = detectAnomaly;