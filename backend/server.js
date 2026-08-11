const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..")));

let vehicles = [
    {
        vehicleNumber: "TN 01 AB 1234",
        ownerName: "S******** V*****",
        licenceStatus: "Verified",
        aadhaarStatus: "Verified",
        aadhaarMasked: "XXXX-XXXX-1234",
        bankName: "Demo Bank",
        bankAccountMasked: "XXXX1234",
        autoDebitStatus: "Active",
        authorizationMonths: 3,
        vehicleStatus: "Normal",
        stolen: false
    }
];

let fines = [
    {
        id: 1,
        vehicleNumber: "TN 01 AB 1234",
        fineAmount: 1000,
        registeredDate: "2026-08-09",
        dueDate: "2026-10-09",
        status: "Pending",
        paymentStatus: "Not Paid",
        violation: "Signal Violation",
        paymentMethod: null,
        paidDate: null,
        receiptNumber: null
    }
];

let auditLogs = [];
let notifications = [];

/* =====================================================
   HELPERS
===================================================== */

function formatVehicleNumber(value) {
    return decodeURIComponent(String(value || ""))
        .trim()
        .toUpperCase();
}

function findVehicle(vehicleNumber) {
    return vehicles.find(function (vehicle) {
        return vehicle.vehicleNumber.toUpperCase() === vehicleNumber;
    });
}

function createReceiptNumber(fineId) {
    return "TN-SP-" + fineId + "-" + Date.now();
}

function addAuditLog(officerId, action, vehicleNumber, details) {
    auditLogs.unshift({
        id: Date.now(),
        officerId: officerId || "TN-OFFICER-001",
        action: action,
        vehicleNumber: vehicleNumber,
        details: details,
        dateTime: new Date().toISOString()
    });

    auditLogs = auditLogs.slice(0, 50);
}

function addNotification(vehicleNumber, type, title, message) {
    notifications.unshift({
        id: Date.now(),
        vehicleNumber: vehicleNumber,
        type: type,
        title: title,
        message: message,
        dateTime: new Date().toISOString()
    });

    notifications = notifications.slice(0, 50);
}

/* =====================================================
   HOME + HEALTH
===================================================== */

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.get("/api/health", function (req, res) {
    res.json({
        success: true,
        message: "TN Vehicle SecurePay backend is running.",
        port: PORT
    });
});

/* =====================================================
   OFFICER STATISTICS
===================================================== */

app.get("/api/officer/statistics", function (req, res) {
    const pendingFines = fines.filter(function (fine) {
        return String(fine.status).toLowerCase() === "pending";
    });

    const paidFines = fines.filter(function (fine) {
        return String(fine.status).toLowerCase() === "paid";
    });

    const pendingAmount = pendingFines.reduce(function (total, fine) {
        return total + Number(fine.fineAmount || 0);
    }, 0);

    const paidAmount = paidFines.reduce(function (total, fine) {
        return total + Number(fine.fineAmount || 0);
    }, 0);

    res.json({
        success: true,
        statistics: {
            totalVehicles: vehicles.length,
            totalFines: fines.length,
            pendingFines: pendingFines.length,
            paidFines: paidFines.length,
            pendingAmount: pendingAmount,
            paidAmount: paidAmount,
            stolenVehicles: vehicles.filter(function (vehicle) {
                return vehicle.stolen === true;
            }).length,
            autoPayVehicles: vehicles.filter(function (vehicle) {
                return String(vehicle.autoDebitStatus).toLowerCase() === "active";
            }).length
        }
    });
});

/* =====================================================
   AUDIT LOG
===================================================== */

app.get("/api/officer/audit-logs", function (req, res) {
    res.json({
        success: true,
        logs: auditLogs
    });
});

/* =====================================================
   OWNER NOTIFICATIONS
===================================================== */

app.get("/api/notifications/:vehicleNumber", function (req, res) {
    const vehicleNumber = formatVehicleNumber(req.params.vehicleNumber);

    const vehicleNotifications = notifications.filter(function (item) {
        return item.vehicleNumber.toUpperCase() === vehicleNumber;
    });

    res.json({
        success: true,
        notifications: vehicleNotifications
    });
});

/* =====================================================
   VEHICLE SEARCH
===================================================== */

app.get("/api/officer/vehicle/:vehicleNumber", function (req, res) {
    const vehicleNumber = formatVehicleNumber(req.params.vehicleNumber);
    const officerId = String(req.query.officerId || "").trim();

    const vehicle = findVehicle(vehicleNumber);

    if (!vehicle) {
        if (officerId) {
            addAuditLog(
                officerId,
                "Vehicle Search Failed",
                vehicleNumber,
                "Vehicle record not found"
            );
        }

        return res.status(404).json({
            success: false,
            message: "Vehicle not found."
        });
    }

    if (officerId) {
        addAuditLog(
            officerId,
            "Vehicle Searched",
            vehicleNumber,
            "Officer viewed vehicle details"
        );
    }

    const vehicleFines = fines.filter(function (fine) {
        return fine.vehicleNumber.toUpperCase() === vehicleNumber;
    });

    res.json({
        success: true,
        vehicle: vehicle,
        fines: vehicleFines
    });
});

/* =====================================================
   FINE RECORDS + PAYMENT HISTORY
===================================================== */

/* =====================================================
   OFFICER ADD NEW FINE
===================================================== */

app.post("/api/officer/fine", function (req, res) {
    const vehicleNumber = formatVehicleNumber(req.body.vehicleNumber);
    const violation = String(req.body.violation || "").trim();
    const fineAmount = Number(req.body.fineAmount);
    const officerId = String(req.body.officerId || "").trim();

    if (!vehicleNumber || !violation || !fineAmount) {
        return res.status(400).json({
            success: false,
            message: "Vehicle number, violation and fine amount are required."
        });
    }

    if (fineAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Fine amount must be greater than ₹0."
        });
    }

    const vehicle = findVehicle(vehicleNumber);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: "Vehicle not found."
        });
    }

    const newFineId =
        fines.length > 0
            ? Math.max(...fines.map(function (fine) {
                return Number(fine.id);
            })) + 1
            : 1;

    const registeredDate =
        new Date().toISOString().split("T")[0];

    const dueDate = new Date();

    dueDate.setDate(dueDate.getDate() + 30);

    const newFine = {
        id: newFineId,
        vehicleNumber: vehicleNumber,
        fineAmount: fineAmount,
        registeredDate: registeredDate,
        dueDate: dueDate.toISOString().split("T")[0],
        status: "Pending",
        paymentStatus: "Not Paid",
        violation: violation,
        paymentMethod: null,
        paidDate: null,
        receiptNumber: null
    };

    fines.push(newFine);

    addAuditLog(
        officerId,
        "Fine Added",
        vehicleNumber,
        "Fine of ₹" + fineAmount +
        " added for: " + violation
    );

    addNotification(
        vehicleNumber,
        "danger",
        "New Traffic Fine Added",
        "Fine #" + newFineId +
        " of ₹" + fineAmount +
        " was added for " + violation + "."
    );

    res.json({
        success: true,
        message: "Traffic fine added successfully.",
        fine: newFine
    });
});

app.get("/api/fines", function (req, res) {
    res.json(fines);
});

app.get("/api/fines/:vehicleNumber", function (req, res) {
    const vehicleNumber = formatVehicleNumber(req.params.vehicleNumber);

    res.json(
        fines.filter(function (fine) {
            return fine.vehicleNumber.toUpperCase() === vehicleNumber;
        })
    );
});

app.get("/api/payment-history/:vehicleNumber", function (req, res) {
    const vehicleNumber = formatVehicleNumber(req.params.vehicleNumber);

    res.json(
        fines.filter(function (fine) {
            return (
                fine.vehicleNumber.toUpperCase() === vehicleNumber &&
                String(fine.status).toLowerCase() === "paid"
            );
        })
    );
});

/* =====================================================
   DIGITAL RECEIPT
===================================================== */

app.get("/api/receipt/:fineId", function (req, res) {
    const fineId = Number(req.params.fineId);

    const fine = fines.find(function (item) {
        return Number(item.id) === fineId;
    });

    if (!fine) {
        return res.status(404).json({
            success: false,
            message: "Fine record not found."
        });
    }

    if (String(fine.status).toLowerCase() !== "paid") {
        return res.status(400).json({
            success: false,
            message: "Receipt is available only after payment."
        });
    }

    res.json({
        success: true,
        fine: fine,
        vehicle: findVehicle(fine.vehicleNumber)
    });
});

/* =====================================================
   BANK LINK + DEMO AUTO-PAY
===================================================== */

app.post("/api/bank-link", function (req, res) {
    const vehicleNumber = formatVehicleNumber(req.body.vehicleNumber);
    const bankName = String(req.body.bankName || "").trim();
    const accountNumber = String(req.body.accountNumber || "").trim();

    if (!vehicleNumber || !bankName || !accountNumber) {
        return res.status(400).json({
            success: false,
            message: "Vehicle, bank and account details are required."
        });
    }

    let vehicle = findVehicle(vehicleNumber);

    if (!vehicle) {
        vehicle = {
            vehicleNumber: vehicleNumber,
            ownerName: "S******** V*****",
            licenceStatus: "Verified",
            aadhaarStatus: "Verified",
            aadhaarMasked: "XXXX-XXXX-1234",
            bankName: bankName,
            bankAccountMasked: "XXXX" + accountNumber.slice(-4),
            autoDebitStatus: "Active",
            authorizationMonths: 3,
            vehicleStatus: "Normal",
            stolen: false
        };

        vehicles.push(vehicle);
    } else {
        vehicle.bankName = bankName;
        vehicle.bankAccountMasked = "XXXX" + accountNumber.slice(-4);
        vehicle.autoDebitStatus = "Active";
        vehicle.authorizationMonths = 3;
    }

    addNotification(
        vehicleNumber,
        "success",
        "Auto-Pay Activated",
        "Your 3-month Demo Auto-Pay authorization is active."
    );

    res.json({
        success: true,
        message: "3-month Demo Auto-Pay activated.",
        vehicle: vehicle
    });
});

/* =====================================================
   DEMO FINE PAYMENT
===================================================== */

app.put("/api/fines/:id/auto-debit", function (req, res) {
    const fineId = Number(req.params.id);

    const fine = fines.find(function (item) {
        return Number(item.id) === fineId;
    });

    if (!fine) {
        return res.status(404).json({
            success: false,
            message: "Fine record not found."
        });
    }

    if (String(fine.status).toLowerCase() === "paid") {
        return res.status(400).json({
            success: false,
            message: "This fine is already paid."
        });
    }

    const vehicle = findVehicle(fine.vehicleNumber);

    if (!vehicle || vehicle.autoDebitStatus !== "Active") {
        return res.status(400).json({
            success: false,
            message: "Auto-Pay is not active for this vehicle."
        });
    }

    fine.status = "Paid";
    fine.paymentStatus = "Paid";
    fine.paymentMethod = "Demo Auto-Pay";
    fine.paidDate = new Date().toISOString();
    fine.receiptNumber = createReceiptNumber(fine.id);

    addNotification(
        fine.vehicleNumber,
        "success",
        "Fine Payment Successful",
        "Fine #" + fine.id + " of ₹" + fine.fineAmount +
        " was paid using Demo Auto-Pay."
    );

    res.json({
        success: true,
        message: "Fine paid successfully using Demo Auto-Pay.",
        fine: fine
    });
});

/* =====================================================
   OFFICER ADD FINE
===================================================== */

app.post("/api/officer/fine", function (req, res) {

    const vehicleNumber = formatVehicleNumber(req.body.vehicleNumber);
    const officerId = String(req.body.officerId || "").trim();
    const violation = String(req.body.violation || "").trim();
    const fineAmount = Number(req.body.fineAmount || 0);

    if (!vehicleNumber || !officerId || !violation || !fineAmount) {
        return res.status(400).json({
            success: false,
            message: "Vehicle, officer, violation and fine amount are required."
        });
    }

    const vehicle = findVehicle(vehicleNumber);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: "Vehicle not found."
        });
    }

    const newFine = {
        id: fines.length
            ? Math.max(...fines.map(function (fine) {
                return Number(fine.id);
            })) + 1
            : 1,

        vehicleNumber: vehicleNumber,

        fineAmount: fineAmount,

        registeredDate: new Date()
            .toISOString()
            .split("T")[0],

        dueDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        )
            .toISOString()
            .split("T")[0],

        status: "Pending",

        paymentStatus: "Not Paid",

        violation: violation,

        paymentMethod: null,

        paidDate: null,

        receiptNumber: null
    };

    fines.push(newFine);

    addAuditLog(
        officerId,
        "Fine Added",
        vehicleNumber,
        "Fine added for " + violation +
        " - ₹" + fineAmount
    );

    addNotification(
        vehicleNumber,
        "danger",
        "New Traffic Fine Added",
        "A fine of ₹" + fineAmount +
        " was added for: " + violation + "."
    );

    res.json({
        success: true,
        message: "Fine added successfully.",
        fine: newFine
    });
});

/* =====================================================
   STOLEN VEHICLE ACTIONS
===================================================== */

app.put("/api/officer/vehicle/:vehicleNumber/stolen", function (req, res) {
    const vehicleNumber = formatVehicleNumber(req.params.vehicleNumber);
    const officerId = String(req.body.officerId || "").trim();

    const vehicle = findVehicle(vehicleNumber);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: "Vehicle not found."
        });
    }

    vehicle.stolen = true;
    vehicle.vehicleStatus = "STOLEN";

    addAuditLog(
        officerId,
        "Vehicle Flagged as Stolen",
        vehicleNumber,
        "Vehicle status changed to STOLEN"
    );

    addNotification(
        vehicleNumber,
        "danger",
        "Stolen Vehicle Alert",
        "Your vehicle has been flagged as STOLEN. Contact Transport Authority or Police."
    );

    res.json({
        success: true,
        message: "Vehicle flagged as stolen.",
        vehicle: vehicle
    });
});

app.put("/api/officer/vehicle/:vehicleNumber/normal", function (req, res) {
    const vehicleNumber = formatVehicleNumber(req.params.vehicleNumber);
    const officerId = String(req.body.officerId || "").trim();

    const vehicle = findVehicle(vehicleNumber);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: "Vehicle not found."
        });
    }

    vehicle.stolen = false;
    vehicle.vehicleStatus = "Normal";

    addAuditLog(
        officerId,
        "Stolen Flag Removed",
        vehicleNumber,
        "Vehicle status changed to NORMAL"
    );

    addNotification(
        vehicleNumber,
        "success",
        "Vehicle Status Updated",
        "The stolen vehicle flag has been removed. Vehicle status is now NORMAL."
    );

    res.json({
        success: true,
        message: "Vehicle status changed to normal.",
        vehicle: vehicle
    });
});

/* =====================================================
   API NOT FOUND + START SERVER
===================================================== */

app.use("/api", function (req, res) {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

app.listen(PORT, function () {
    console.log("Server running at http://localhost:" + PORT);
    console.log("TN Vehicle SecurePay backend started successfully.");
});