const API_URL = "http://localhost:3000";


// =====================================================
// VEHICLE OWNER DASHBOARD
// =====================================================

async function openDashboard() {

    const input =
        document.getElementById("dashboardVehicle");

    const result =
        document.getElementById("dashboardResult");

    const vehicleNumber =
        input.value.trim().toUpperCase();


    if (vehicleNumber === "") {

        result.innerHTML = `
            <div class="card">
                ❌ Please enter a vehicle number.
            </div>
        `;

        return;
    }


    result.innerHTML = `
        <div class="card">
            Loading vehicle details...
        </div>
    `;


    try {

        const fineResponse =
            await fetch(
                `${API_URL}/api/fines/${encodeURIComponent(vehicleNumber)}`
            );


        const fines =
            await fineResponse.json();


        const autoDebitResponse =
            await fetch(
                `${API_URL}/api/auto-debit/${encodeURIComponent(vehicleNumber)}`
            );


        const autoDebitData =
            await autoDebitResponse.json();


        if (!Array.isArray(fines) || fines.length === 0) {

            result.innerHTML = `
                <div class="card">

                    <h3>
                        Vehicle: ${vehicleNumber}
                    </h3>

                    <p>
                        No fine records found.
                    </p>

                    ${
                        autoDebitData.active
                        ? autoDebitHTML(autoDebitData.autoDebit)
                        : ""
                    }

                </div>
            `;

            return;
        }


        let totalFine = 0;
        let pendingAmount = 0;
        let paidAmount = 0;

        let pendingCount = 0;
        let paidCount = 0;


        fines.forEach(function (fine) {

            const amount =
                Number(fine.fineAmount) || 0;


            totalFine += amount;


            if (
                String(fine.status).toLowerCase()
                ===
                "paid"
            ) {

                paidAmount += amount;
                paidCount++;

            }

            else {

                pendingAmount += amount;
                pendingCount++;

            }

        });


        let fineHTML = "";


        fines.forEach(function (fine) {

            const isPaid =
                String(fine.status).toLowerCase()
                ===
                "paid";


            fineHTML += `

                <div class="fine-card">

                    <p>
                        <strong>
                            Fine ID:
                        </strong>

                        ${fine.id}
                    </p>


                    <p>
                        <strong>
                            Amount:
                        </strong>

                        ₹${fine.fineAmount}
                    </p>


                    <p>
                        <strong>
                            Registered Date:
                        </strong>

                        ${fine.registeredDate || "-"}
                    </p>


                    <p>
                        <strong>
                            Due Date:
                        </strong>

                        ${fine.dueDate || "-"}
                    </p>


                    <p>

                        <strong>
                            Status:
                        </strong>

                        ${
                            isPaid
                            ? `<span class="paid">Paid</span>`
                            : `<span class="pending">Pending</span>`
                        }

                    </p>


                    <p>

                        <strong>
                            Payment:
                        </strong>

                        ${fine.paymentStatus || "-"}

                    </p>


                    ${
                        !isPaid
                        ?
                        `
                        <button
                            onclick="demoAutoDebit(${fine.id})">

                            💳 Pay Fine - Demo Auto-Debit

                        </button>
                        `
                        :
                        ""
                    }

                </div>

            `;

        });


        result.innerHTML = `

            <div class="owner-card">

                <div class="owner-header">

                    <h2>
                        Vehicle Owner Dashboard
                    </h2>

                    <p>
                        Vehicle:
                        <strong>
                            ${vehicleNumber}
                        </strong>
                    </p>

                </div>


                <div class="dashboard-grid">

                    <div class="stat-card">

                        <h4>
                            Total Fine
                        </h4>

                        <p>
                            ₹${totalFine}
                        </p>

                    </div>


                    <div class="stat-card">

                        <h4>
                            Pending Amount
                        </h4>

                        <p class="pending-text">
                            ₹${pendingAmount}
                        </p>

                    </div>


                    <div class="stat-card">

                        <h4>
                            Paid Amount
                        </h4>

                        <p class="paid-text">
                            ₹${paidAmount}
                        </p>

                    </div>


                    <div class="stat-card">

                        <h4>
                            Total Records
                        </h4>

                        <p>
                            ${fines.length}
                        </p>

                    </div>


                    <div class="stat-card">

                        <h4>
                            Pending Fines
                        </h4>

                        <p>
                            ${pendingCount}
                        </p>

                    </div>


                    <div class="stat-card">

                        <h4>
                            Paid Fines
                        </h4>

                        <p>
                            ${paidCount}
                        </p>

                    </div>

                </div>


                ${
                    autoDebitData.active
                    ?
                    autoDebitHTML(
                        autoDebitData.autoDebit
                    )
                    :
                    `
                    <div class="card">

                        <h3>
                            🔴 Auto-Debit Not Active
                        </h3>

                        <p>
                            No active demo authorization
                            found for this vehicle.
                        </p>

                    </div>
                    `
                }


                <h3 class="table-title">
                    Fine Records
                </h3>


                ${fineHTML}

            </div>

        `;

    }

    catch (error) {

        console.error(error);


        result.innerHTML = `

            <div class="card">

                <h3>
                    ❌ Backend Connection Error
                </h3>

                <p>
                    Make sure the Node.js server
                    is running.
                </p>

                <p>
                    <strong>
                        node server.js
                    </strong>
                </p>

            </div>

        `;

    }

}



// =====================================================
// AUTO-DEBIT DISPLAY
// =====================================================

function autoDebitHTML(autoDebit) {

    if (!autoDebit) {
        return "";
    }


    return `

        <div class="auto-debit-card">

            <h3>
                🟢 AUTO-DEBIT ACTIVE
            </h3>


            <p>

                <strong>
                    Authorization:
                </strong>

                ${autoDebit.authorizationMonths}
                Months

            </p>


            <p>

                <strong>
                    Start Date:
                </strong>

                ${autoDebit.authorizationStart}

            </p>


            <p>

                <strong>
                    Valid Until:
                </strong>

                ${autoDebit.authorizationEnd}

            </p>


            <p>

                <strong>
                    Bank:
                </strong>

                ${autoDebit.bankName}

            </p>


            <p>

                <strong>
                    Account:
                </strong>

                ${autoDebit.accountNumber}

            </p>


            <p>

                <strong>
                    Next Fine Action:
                </strong>

                Demo Auto-Debit

            </p>


            <p class="demo-warning">

                ⚠️ This is a project simulation.
                No real bank transaction is performed.

            </p>

        </div>

    `;

}



// =====================================================
// DEMO AUTO-DEBIT PAYMENT
// =====================================================

async function demoAutoDebit(fineId) {

    const confirmation =
        confirm(
            "Proceed with Demo Auto-Debit payment?"
        );


    if (!confirmation) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/fines/${fineId}/auto-debit`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        if (data.success) {

            alert(
                "✅ Demo Auto-Debit completed successfully!"
            );


            const vehicleNumber =
                document
                    .getElementById(
                        "dashboardVehicle"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            document
                .getElementById(
                    "dashboardVehicle"
                )
                .value =
                    vehicleNumber;


            openDashboard();

        }

        else {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Payment failed."
                )
            );

        }

    }

    catch (error) {

        console.error(error);

        alert(
            "❌ Cannot connect to backend."
        );

    }

}



// =====================================================
// FINE REGISTRATION
// =====================================================

const fineForm =
    document.getElementById("fineForm");


if (fineForm) {

    fineForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const vehicleNumber =
                document
                    .getElementById(
                        "vehicleNumber"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            const fineAmount =
                document
                    .getElementById(
                        "fineAmount"
                    )
                    .value;


            const dueDate =
                document
                    .getElementById(
                        "dueDate"
                    )
                    .value;


            const result =
                document
                    .getElementById(
                        "result"
                    );


            if (
                vehicleNumber === "" ||
                fineAmount === "" ||
                dueDate === ""
            ) {

                result.innerHTML = `

                    <div class="card">

                        ❌ Please fill all fields.

                    </div>

                `;

                return;

            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/fines`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    vehicleNumber:
                                        vehicleNumber,

                                    fineAmount:
                                        Number(
                                            fineAmount
                                        ),

                                    dueDate:
                                        dueDate

                                })

                        }
                    );


                const data =
                    await response.json();


                if (data.success) {

                    result.innerHTML = `

                        <div class="verification-success">

                            <h3>
                                ✅ Fine Registered
                            </h3>

                            <p>
                                Vehicle:
                                <strong>
                                    ${vehicleNumber}
                                </strong>
                            </p>

                            <p>
                                Fine Amount:
                                <strong>
                                    ₹${fineAmount}
                                </strong>
                            </p>

                            <p>
                                🟢 Auto-Debit:
                                <strong>
                                    ACTIVE
                                </strong>
                            </p>

                            <p>
                                Authorization:
                                <strong>
                                    3 Months
                                </strong>
                            </p>

                        </div>

                    `;


                    fineForm.reset();


                    loadFineRecords();

                }

                else {

                    result.innerHTML = `

                        <div class="card">

                            ❌
                            ${data.message}

                        </div>

                    `;

                }

            }

            catch (error) {

                console.error(error);


                result.innerHTML = `

                    <div class="card">

                        ❌ Backend connection failed.

                    </div>

                `;

            }

        }
    );

}



// =====================================================
// LOAD ALL FINE RECORDS
// =====================================================

async function loadFineRecords() {

    const list =
        document.getElementById(
            "fineList"
        );


    if (!list) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/fines`
            );


        const fines =
            await response.json();


        if (
            !Array.isArray(fines) ||
            fines.length === 0
        ) {

            list.innerHTML =
                "No fine records found.";

            return;

        }


        let html = "";


        fines.forEach(function (fine) {

            html += `

                <div class="fine-card">

                    <p>
                        <strong>
                            Vehicle:
                        </strong>

                        ${fine.vehicleNumber}
                    </p>

                    <p>
                        <strong>
                            Fine:
                        </strong>

                        ₹${fine.fineAmount}
                    </p>

                    <p>
                        <strong>
                            Status:
                        </strong>

                        ${
                            String(fine.status)
                                .toLowerCase()
                            ===
                            "paid"

                            ? "Paid"

                            : "Pending"
                        }

                    </p>

                </div>

            `;

        });


        list.innerHTML = html;

    }

    catch (error) {

        console.error(error);

        list.innerHTML =
            "Unable to load records.";

    }

}



// =====================================================
// OWNER VERIFICATION — DEMO
// =====================================================

function sendVerificationOTP() {

    const vehicle =
        document
            .getElementById(
                "verifyVehicleNumber"
            )
            .value
            .trim()
            .toUpperCase();


    const identity =
        document
            .getElementById(
                "demoIdentityId"
            )
            .value
            .trim();


    const message =
        document
            .getElementById(
                "verificationMessage"
            );


    if (
        vehicle === "" ||
        identity === ""
    ) {

        message.innerHTML = `

            <div class="card">

                ❌ Enter vehicle number
                and demo identity ID.

            </div>

        `;

        return;

    }


    message.innerHTML = `

        <div class="verification-success">

            ✅ Demo OTP generated.

            <br><br>

            For this project demo,
            use OTP:

            <strong>
                123456
            </strong>

        </div>

    `;


    document
        .getElementById(
            "verificationOTPBox"
        )
        .classList
        .remove("hidden");

}



function verifyOwner() {

    const otp =
        document
            .getElementById(
                "verificationOTP"
            )
            .value
            .trim();


    const vehicle =
        document
            .getElementById(
                "verifyVehicleNumber"
            )
            .value
            .trim()
            .toUpperCase();


    if (otp !== "123456") {

        alert(
            "❌ Invalid demo OTP."
        );

        return;

    }


    document
        .getElementById(
            "verifiedVehicleNumber"
        )
        .textContent =
            vehicle;


    document
        .getElementById(
            "verificationSuccess"
        )
        .classList
        .remove("hidden");

}



// =====================================================
// BANK LINK — DEMO
// =====================================================

const bankForm =
    document.getElementById(
        "bankForm"
    );


if (bankForm) {

    bankForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const vehicleNumber =
                document
                    .getElementById(
                        "bankVehicleNumber"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            const bankName =
                document
                    .getElementById(
                        "bankName"
                    )
                    .value;


            const accountNumber =
                document
                    .getElementById(
                        "accountNumber"
                    )
                    .value
                    .trim();


            const result =
                document
                    .getElementById(
                        "bankResult"
                    );


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/bank-link`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    vehicleNumber:
                                        vehicleNumber,

                                    bankName:
                                        bankName,

                                    accountNumber:
                                        accountNumber

                                })

                        }
                    );


                const data =
                    await response.json();


                if (data.success) {

                    result.innerHTML = `

                        <div class="auto-debit-card">

                            <h3>
                                🟢 AUTO-DEBIT ACTIVE
                            </h3>

                            <p>
                                Vehicle:
                                <strong>
                                    ${data.vehicleNumber}
                                </strong>
                            </p>

                            <p>
                                Bank:
                                <strong>
                                    ${data.bankName}
                                </strong>
                            </p>

                            <p>
                                Account:
                                <strong>
                                    ${data.accountNumber}
                                </strong>
                            </p>

                            <p>
                                Authorization:
                                <strong>
                                    3 Months
                                </strong>
                            </p>

                            <p class="demo-warning">

                                ⚠️ Demo authorization only.
                                No real bank debit is performed.

                            </p>

                        </div>

                    `;


                    bankForm.reset();

                }

                else {

                    result.innerHTML = `

                        <div class="card">

                            ❌
                            ${data.message}

                        </div>

                    `;

                }

            }

            catch (error) {

                console.error(error);


                result.innerHTML = `

                    <div class="card">

                        ❌ Backend connection failed.

                    </div>

                `;

            }

        }
    );

}



// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadFineRecords();

    }
);