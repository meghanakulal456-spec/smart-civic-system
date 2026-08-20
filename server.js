const express = require("express");
const fs = require("fs");
const path = require("path");

const detectCategory = require("./services/category");
const detectSeverity = require("./services/severity");
const findSimilarComplaints = require("./services/similarity");
const detectAnomaly = require("./services/anomaly");
const calculateRiskScore = require("./services/riskScore");
const assignDepartment = require("./services/department");
const calculatePriority = require("./services/priority");
const detectEmergingCluster = require("./services/cluster");

const app = express();

const PORT =
    process.env.PORT || 3000;

app.use(express.json());

app.use(
    express.static("public")
);
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =========================================
// SUBMIT COMPLAINT
// =========================================

app.post("/api/complaints", async (req, res) => {

    const { complaint, location } =
        req.body;

    if (!complaint || !location) {

        return res.status(400).json({

            message:
                "Complaint and location are required"

        });

    }


    const file =
        "data/complaints.json";


    const complaints =
        JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );


    // CATEGORY

    const category =
        detectCategory(
            complaint
        );


    // DEPARTMENT

    const department =
        assignDepartment(
            category
        );


    // SEVERITY

    const severity = await detectSeverity(complaint);


    // SIMILARITY

    const similarComplaints =
        findSimilarComplaints(
            complaint,
            complaints
        );


    // ANOMALY

    const isAnomaly =
        detectAnomaly(
            location,
            similarComplaints,
            complaints
        );


    // INCIDENT FUSION

    const cluster =
        detectEmergingCluster(
            category,
            location,
            complaint,
            similarComplaints,
            complaints,
            department,
            severity
        );


    // RISK

    const risk =
        calculateRiskScore(
            severity,
            similarComplaints,
            isAnomaly,
            cluster.riskBoost
        );


    // PRIORITY

    const priority =
        calculatePriority(
            severity,
            risk.score
        );


    // NEW COMPLAINT

    const newComplaint = {

        id:
            complaints.length + 1,

        complaint:
            complaint,

        location:
            location,

        category:
            category,

        department:
            department,

        severity:
            severity,

        similarComplaints:
            similarComplaints,

        isAnomaly:
            isAnomaly,

        riskScore:
            risk.score,

        riskLevel:
            risk.level,

        priority:
            priority,

        // NEW WORKFLOW

        status:
            "Pending",

        citizenVerified:
            false,

        verificationNote:
            "",

        verifiedAt:
            null,


        // INCIDENT DATA

        clusterDetected:
            cluster.detected,

        clusterId:
            cluster.clusterId,

        clusterTitle:
            cluster.clusterTitle,

        clusterLevel:
            cluster.clusterLevel,

        clusterReports:
            cluster.reportCount,

        clusterSimilarity:
            cluster.averageSimilarity,

        previousClusterRisk:
            cluster.previousClusterRisk,

        riskTrend:
            cluster.trend,

        clusterRiskBoost:
            cluster.riskBoost,


        incidentId:
            cluster.incidentId,

        incidentTitle:
            cluster.incidentTitle,

        incidentPressure:
            cluster.incidentPressure,

        reports24h:
            cluster.reports24h,

        reportVelocity:
            cluster.reportVelocity,

        unresolvedReports:
            cluster.unresolvedReports,

        recommendedAction:
            cluster.recommendedAction,


        createdAt:
            new Date().toISOString()

    };


    // SAVE

    complaints.push(
        newComplaint
    );


    fs.writeFileSync(
        file,
        JSON.stringify(
            complaints,
            null,
            2
        )
    );


    console.log(
        "Complaint saved:",
        newComplaint
    );


    // RESPONSE

    res.json({

        message:
            "Complaint submitted successfully!",

        complaintId:
            newComplaint.id,

        category:
            category,

        department:
            department,

        severity:
            severity,

        similarComplaints:
            similarComplaints,

        isAnomaly:
            isAnomaly,

        riskScore:
            risk.score,

        riskLevel:
            risk.level,

        priority:
            priority,

        status:
            "Pending",

        clusterDetected:
            cluster.detected,

        clusterTitle:
            cluster.clusterTitle,

        clusterReports:
            cluster.reportCount,

        clusterSimilarity:
            cluster.averageSimilarity,

        clusterLevel:
            cluster.clusterLevel,

        previousClusterRisk:
            cluster.previousClusterRisk,

        riskTrend:
            cluster.trend,

        incidentId:
            cluster.incidentId,

        incidentTitle:
            cluster.incidentTitle,

        incidentPressure:
            cluster.incidentPressure,

        reports24h:
            cluster.reports24h,

        reportVelocity:
            cluster.reportVelocity,

        unresolvedReports:
            cluster.unresolvedReports,

        recommendedAction:
            cluster.recommendedAction

    });

});


// =========================================
// GET ALL COMPLAINTS
// =========================================

app.get(
    "/api/complaints",
    (req, res) => {

        const file =
            "data/complaints.json";

        const complaints =
            JSON.parse(
                fs.readFileSync(
                    file,
                    "utf8"
                )
            );

        res.json(
            complaints
        );

    }
);


// =========================================
// UPDATE OFFICER STATUS
// =========================================

app.put(
    "/api/complaints/:id",
    (req, res) => {

        const id =
            parseInt(
                req.params.id
            );

        const { status } =
            req.body;


        const allowedStatuses = [

            "Pending",

            "Assigned",

            "In Progress",

            "Awaiting Verification",

            "Reopened",

            "Closed"

        ];


        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return res.status(400).json({

                message:
                    "Invalid status"

            });

        }


        const file =
            "data/complaints.json";


        const complaints =
            JSON.parse(
                fs.readFileSync(
                    file,
                    "utf8"
                )
            );


        const complaint =
            complaints.find(
                item =>
                    item.id === id
            );


        if (!complaint) {

            return res.status(404).json({

                message:
                    "Complaint not found"

            });

        }


        /*
        Officer can send the complaint
        for citizen verification.
        */

        complaint.status =
            status;


        /*
        Reopened means citizen rejected closure.
        */

        if (
            status ===
            "Reopened"
        ) {

            complaint.citizenVerified =
                false;

        }


        fs.writeFileSync(
            file,
            JSON.stringify(
                complaints,
                null,
                2
            )
        );


        res.json({

            message:
                "Complaint status updated successfully",

            complaintId:
                id,

            status:
                status

        });

    }
);


// =========================================
// CITIZEN VERIFICATION
// =========================================

app.post(
    "/api/complaints/:id/verify",
    (req, res) => {

        const id =
            parseInt(
                req.params.id
            );


        const {
            resolved,
            note
        } = req.body;


        if (
            typeof resolved !==
            "boolean"
        ) {

            return res.status(400).json({

                message:
                    "Verification response is required"

            });

        }


        const file =
            "data/complaints.json";


        const complaints =
            JSON.parse(
                fs.readFileSync(
                    file,
                    "utf8"
                )
            );


        const complaint =
            complaints.find(
                item =>
                    item.id === id
            );


        if (!complaint) {

            return res.status(404).json({

                message:
                    "Complaint not found"

            });

        }


        /*
        Citizen says issue is resolved.
        */

        if (resolved) {

            complaint.status =
                "Closed";

            complaint.citizenVerified =
                true;

        }


        /*
        Citizen says issue is NOT resolved.
        */

        else {

            complaint.status =
                "Reopened";

            complaint.citizenVerified =
                false;

        }


        complaint.verificationNote =
            note || "";


        complaint.verifiedAt =
            new Date().toISOString();


        fs.writeFileSync(
            file,
            JSON.stringify(
                complaints,
                null,
                2
            )
        );


        res.json({

            message:
                resolved
                    ? "Complaint closed after citizen verification."
                    : "Complaint reopened for further action.",

            complaintId:
                id,

            status:
                complaint.status,

            citizenVerified:
                complaint.citizenVerified

        });

    }
);


// =========================================
// START SERVER
// =========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);