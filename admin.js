const API_URL = "http://localhost:3000";


// =====================================================
// OFFICER LOGIN
// =====================================================

function officerLogin() {

    const officerId =
        document
            .getElementById("officerId")
            .value
            .trim();


    const password =
        document
            .getElementById("officerPassword")
            .value
            .trim();


    const result =
        document
            .getElementById("loginResult");


    if (
        officerId === "TN-OFFICER-001"
        &&
        password === "123456"
    ) {

        result.innerHTML = `
            <p style="color:green;">
                ✅ Login Successful
            </p>
        `;


        document
            .getElementById("loginCard")
            .classList.add("hidden");


        document
            .getElementById("officerDashboard")
            .classList.remove("hidden");


        loadOfficerData();

    }

    else {

        result.innerHTML = `
            <p style="color:red;">
                ❌ Invalid Officer ID or Password
            </p>
        `;

    }

}



// =====================================================
// LOAD OFFICER DATA
// =====================================================

async function loadOfficerData() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/fines`
            );


        const fines =
            await response.json();


        calculateStatistics(fines);

        displayAllFines(fines);

    }

    catch (error) {

        console.error(error);

        document
            .getElementById("allFines")
            .innerHTML = `
                <p style="color:red;">
                    ❌ Unable to connect to backend.
                </p>
            `;

    }

}



// =====================================================
// STATISTICS
// =====================================================

function calculateStatistics(fines) {

    let totalRecords =
        fines.length;

    let pendingRecords = 0;

    let paidRecords = 0;

    let totalValue = 0;


    fines.forEach(function(fine) {

        const amount =
            Number(
                fine.fineAmount || 0
            );


        totalValue += amount;


        const status =
            String(
                fine.status || "Pending"
            ).toLowerCase();


        if (status === "paid") {

            paidRecords++;

        }

        else {

            pendingRecords++;

        }

    });


    document
        .getElementById("totalRecords")
        .innerText =
        totalRecords;


    document
        .getElementById("pendingRecords")
        .innerText =
        pendingRecords;


    document
        .getElementById("paidRecords")
        .innerText =
        paidRecords;


    document
        .getElementById("totalValue")
        .innerText =
        "₹" + totalValue;

}



// =====================================================
// REGISTER NEW FINE
// =====================================================

document
    .getElementById("adminFineForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const vehicleNumber =
                document
                    .getElementById(
                        "newVehicleNumber"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            const fineAmount =
                document
                    .getElementById(
                        "newFineAmount"
                    )
                    .value;


            const dueDate =
                document
                    .getElementById(
                        "newDueDate"
                    )
                    .value;


            const result =
                document
                    .getElementById(
                        "fineRegisterResult"
                    );


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

                            body: JSON.stringify({

                                vehicleNumber:
                                    vehicleNumber,

                                fineAmount:
                                    fineAmount,

                                dueDate:
                                    dueDate

                            })

                        }
                    );


                const data =
                    await response.json();


                if (data.success) {

                    result.innerHTML = `

                        <p style="color:green;">

                            ✅ Fine registered successfully!

                        </p>

                        <p>

                            Vehicle:
                            <strong>
                                ${vehicleNumber}
                            </strong>

                            <br>

                            Fine:
                            <strong>
                                ₹${fineAmount}
                            </strong>

                        </p>

                    `;


                    document
                        .getElementById(
                            "adminFineForm"
                        )
                        .reset();


                    loadOfficerData();

                }

                else {

                    result.innerHTML = `

                        <p style="color:red;">

                            ❌ ${data.message}

                        </p>

                    `;

                }

            }

            catch (error) {

                console.error(error);

                result.innerHTML = `

                    <p style="color:red;">

                        ❌ Backend connection failed.

                    </p>

                `;

            }

        }
    );



// =====================================================
// DISPLAY ALL FINES
// =====================================================

function displayAllFines(fines) {

    const container =
        document
            .getElementById("allFines");


    if (fines.length === 0) {

        container.innerHTML = `
            <div class="welcome">
                <h3>No Records</h3>
                <p>
                    No fine records available.
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    fines.forEach(function(fine) {

        const status =
            String(
                fine.status || "Pending"
            );


        const card =
            document.createElement("div");


        card.className =
            "fine-card";


        card.innerHTML = `

            <p>

                <strong>
                    Fine ID:
                </strong>

                ${fine.id}

            </p>


            <p>

                <strong>
                    Vehicle:
                </strong>

                ${fine.vehicleNumber}

            </p>


            <p>

                <strong>
                    Fine Amount:
                </strong>

                ₹${fine.fineAmount}

            </p>


            <p>

                <strong>
                    Due Date:
                </strong>

                ${
                    fine.dueDate
                    || "Not Available"
                }

            </p>


            <p>

                <strong>
                    Status:
                </strong>

                <span class="${
                    status
                        .toLowerCase()
                        === "paid"

                    ? "paid"

                    : "pending"
                }">

                    ${status}

                </span>

            </p>


            <button
                onclick="
                    searchSpecificVehicle(
                        '${fine.vehicleNumber}'
                    )
                ">

                View Vehicle

            </button>

        `;


        container.appendChild(card);

    });

}



// =====================================================
// SEARCH VEHICLE
// =====================================================

async function searchVehicle() {

    const vehicle =
        document
            .getElementById("adminVehicle")
            .value
            .trim()
            .toUpperCase();


    if (vehicle === "") {

        alert(
            "Please enter vehicle number."
        );

        return;

    }


    searchSpecificVehicle(vehicle);

}



// =====================================================
// SEARCH SPECIFIC VEHICLE
// =====================================================

async function searchSpecificVehicle(
    vehicleNumber
) {

    try {

        const response =
            await fetch(
                `${API_URL}/api/fines`
            );


        const fines =
            await response.json();


        const vehicleFines =
            fines.filter(function(fine) {

                return String(
                    fine.vehicleNumber
                )
                .trim()
                .toUpperCase()
                ===
                vehicleNumber
                    .trim()
                    .toUpperCase();

            });


        const result =
            document
                .getElementById(
                    "searchResult"
                );


        if (
            vehicleFines.length === 0
        ) {

            result.innerHTML = `

                <div class="no-fine">

                    ❌ No records found

                    <br><br>

                    Vehicle:

                    <strong>
                        ${vehicleNumber}
                    </strong>

                </div>

            `;

            return;

        }


        let total = 0;

        let pending = 0;

        let paid = 0;


        vehicleFines.forEach(
            function(fine) {

                const amount =
                    Number(
                        fine.fineAmount || 0
                    );


                total += amount;


                const status =
                    String(
                        fine.status
                        || "Pending"
                    )
                    .toLowerCase();


                if (status === "paid") {

                    paid += amount;

                }

                else {

                    pending += amount;

                }

            }
        );


        result.innerHTML = `

            <div class="search-result-card">

                <h3>
                    Vehicle Details
                </h3>


                <p>

                    <strong>
                        Vehicle Number:
                    </strong>

                    ${vehicleNumber}

                </p>


                <div class="mini-stats">


                    <div>

                        <span>
                            Total
                        </span>

                        <strong>
                            ₹${total}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Pending
                        </span>

                        <strong class="pending">
                            ₹${pending}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Paid
                        </span>

                        <strong class="paid">
                            ₹${paid}
                        </strong>

                    </div>


                </div>


                <h4>
                    Fine Records
                </h4>


                ${vehicleFines.map(
                    function(fine) {

                        const status =
                            String(
                                fine.status
                                || "Pending"
                            );


                        return `

                            <div
                                class="fine-card">

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
                                        Due Date:
                                    </strong>

                                    ${
                                        fine.dueDate
                                        || "Not Available"
                                    }

                                </p>


                                <p>

                                    <strong>
                                        Status:
                                    </strong>

                                    <span class="${
                                        status
                                            .toLowerCase()
                                            === "paid"

                                        ? "paid"

                                        : "pending"
                                    }">

                                        ${status}

                                    </span>

                                </p>

                            </div>

                        `;

                    }
                ).join("")}


            </div>

        `;

    }

    catch (error) {

        console.error(error);

        alert(
            "Backend connection failed."
        );

    }

}



// =====================================================
// LOGOUT
// =====================================================

function officerLogout() {

    document
        .getElementById(
            "officerDashboard"
        )
        .classList.add("hidden");


    document
        .getElementById("loginCard")
        .classList.remove("hidden");


    document
        .getElementById("officerId")
        .value = "";


    document
        .getElementById(
            "officerPassword"
        )
        .value = "";


    document
        .getElementById(
            "loginResult"
        )
        .innerHTML = "";

}