function assignDepartment(category) {

    if (category === "Water") {
        return "Water Supply";
    }

    if (category === "Electricity") {
        return "Electrical";
    }

    if (category === "Garbage") {
        return "Sanitation";
    }

    if (category === "Drainage") {
        return "Drainage";
    }

    if (category === "Road Damage") {
        return "Public Works";
    }

    return "General Administration";
}

module.exports = assignDepartment;