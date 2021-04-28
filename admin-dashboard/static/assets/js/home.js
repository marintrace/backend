const homeUserStatusPagLimit = 200; // allow sorting without pagination
let homeUserStatusPagToken = 0;

let selectedMember = null;

$.ajaxSetup({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

/**
 * Populate the health and describing information about active members in the table
 * on the home screen
 * @param email if searching, this isolates the pagination to only emails that start with this input
 * @param getall should we skip pagination (default false)
 */
function populateHealthSummaryTable(email = null, getall = false) {
    let data = {
        "pagination_token": homeUserStatusPagToken,
        "limit": getall ? 10000 : homeUserStatusPagLimit
    };
    if (email != null) {
        data['email'] = email.escapeQuotes();
    }

    $.post("/api/paginate-user-summary-items", JSON.stringify(data), function () {
        console.log("Update home status summaries request response received");
    }, "json").done(function (data) {

        if (data['statuses'].length === 0) {
            alert("No more data!");
            return;
        }

        homeUserStatusPagToken = data['pagination_token'];

        data['statuses'].forEach(function (e) {
            let escapedEmail = e.email.escapeQuotes();
            let rows = [
                `<input type="radio" data-email="${escapedEmail}" onchange="itemSelectionChange(this)" name="userSelect" `
                + (selectedMember === escapedEmail ? "checked" : "") + " class='big-select'/>",
                `<a href='/detail/${escapedEmail}'>${escapedEmail}</a>`,
                "<span class='badge badge-dot mr-4'><i class='bg-" + e.health.color + "'></i><span class='status'>" +
                `<a class='modal-link' onclick='showHealthChangeModal("${escapedEmail}")'>` +
                truncate(e.health.criteria.join(' & '), 45) + "</a></span></span>",
                "<span class='badge badge-dot mr-4'><i class='bg-" + e.location.color + "'></i><span class='status'>" +
                `<a class='modal-link' onclick='showLocationChangeModal("${escapedEmail}")'>` +
                e.location.location.capitalize() + "</a></span></span>"
            ];
            $("#summaries").append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)
}

/**
 * Callback when a health summary item is radio checked. We replace the buttons
 * at the top with modification options for location/health
 * @param radio the radio button to act on
 */
function itemSelectionChange(radio){
    let email = radio.dataset.email;
    selectedMember = email;
    $("#health-button-1").html("Modify Health").attr('onclick', `showHealthChangeModal('${email}')`);
    $("#health-button-2").html("Change Location").attr('onclick', `showLocationChangeModal('${email}')`);
    $("#clear-toggle").html("<br><button class='btn btn-secondary' onclick='clearHealthSelection()'>Clear Selection</button>");
}

/**
 * Clear the radio button selection on the home page, and reset the buttons back to their original states
 */
function clearHealthSelection(){
    $("#health-button-1").html("Export to CSV").attr('onclick', 'exportHealthSummariesAsCSV()');
    $("#health-button-2").html("Manage Members").attr('onclick', 'goToManageUsers()');
    $("#clear-toggle").html("");
    document.getElementsByName("userSelect").forEach(function (e){
        e.checked = false;
    })
    selectedMember = null;
}

/**
 * Export the table on the home screen (health summaries) as a CSV. Disregards pagination and
 * exports all items.
 * @returns {Promise<void>}
 */
async function exportHealthSummariesAsCSV() {
    $("#csv-export-home").html("Loading...").prop("disabled", true);
    populateHealthSummaryTable(null, true);
    await sleep(5000);
    downloadTableAsCSV("home-status-summaries");
    $("#csv-export-home").html("Export to CSV").prop('disabled', false);

}
/**
 * Show the health change modal, the submission of which queues a report in the backend for the selected user(s)
 * @param email the email to show the modal for
 */
function showHealthChangeModal(email) {
    $("#health-user-email").html(email.escapeQuotes());
    $("#submitHealthModification").attr("onclick", `submitHealthReportForm("${email.escapeQuotes()}", false)`);
    $("#setHealthy").attr("onclick", `submitHealthReportForm("${email.escapeQuotes()}", true)`);
    $("#toggleVaccine").attr("onclick", `showVaccinationOptionModal("${email.escapeQuotes()}")`);
    $("#health-change").modal('show');
}

/**
 * Show the modal to set a user's vaccination status (on top of the health change modal)
 * @param email the user's email
 */
function showVaccinationOptionModal(email) {
    $("health-change").modal("hide");
    $("#vac-user-email").html(email.escapeQuotes());
    $("#submitVaccineToggle").attr("onclick", `submitVaccineOptionForm("${email.escapeQuotes()}")`);
    $("#vaccine-options").modal('show');
}

/**
 * Submit a new job to the backend with a change in the user's vaccination status
 * @param email the user's email
 * @returns {Promise<void>} based on response from API
 */
async function submitVaccineOptionForm(email) {
    const vax_status = $("input[name='vax-status']:checked").val();
    if (vax_status == null) {
        alert("You must select an option to submit!");
        return;
    }
    $("#submitVaccineToggle").prop('disabled', true);
    let data = {
        "status": vax_status,
        "email": email.renderQuotes()
    };
    $.post("/health/modify-vaccination", JSON.stringify(data), function () {
        console.log("Vaccination change completed");
    }, "json").done(async function (data) {
        $("#submitVaccineToggle").html("Success");
        await sleep(500);
        $("#vaccine-options").modal("hide");
        $("#submitVaccineToggle").prop('disabled', false);
        $("#submitVaccineToggle").html("Submit");
        window.location.reload();
    }).fail(requestFailure)
}

/**
 * Show the modal to change a user's location (changing their ability to enter the campus)
 * @param email the user's email
 */
function showLocationChangeModal(email) {
    $("#loc-user-email").html(email.escapeQuotes());
    $("#submitLocationChange").attr("onclick", `submitLocationChangeForm("${email.escapeQuotes()}")`);
    $("#location-change").modal('show');
}

/**
 * Submit a new job, creating a new health report for the specified user in the backend
 * @param email the user's email
 * @param set_healthy whether or not to set the user's report to healthy (regardless of the form)
 * @returns {Promise<void>} depending on the response
 */
async function submitHealthReportForm(email, set_healthy) {
    let payload = {};
    if (!set_healthy) {
        const num_symptoms = $("#num_symptoms").val();
        const commercial = $("input[name='commercial']:checked").val();
        const proximity = $("input[name='proximity']:checked").val();
        if (num_symptoms == null || commercial == null || proximity == null) {
            alert("You must complete all options to submit!");
            return;
        }
        let parsed_num_symptoms = parseInt(num_symptoms);
        if (parsed_num_symptoms < 0 || parsed_num_symptoms > 12) {
            alert("Number of symptoms must be greater than 0 and less than 12");
            return;
        }
        payload = {
            "num_symptoms": parsed_num_symptoms,
            "commercial_flight": JSON.parse(commercial.toLowerCase()),
            "proximity": JSON.parse(proximity.toLowerCase())
        }
    } else {
        payload = {"num_symptoms": 0, "commercial_flight": false, "proximity": false}
    }

    payload['email'] = email.renderQuotes();
    $("#submitHealthModification").prop('disabled', true);
    $("#setHealthy").prop('disabled', true);
    $.post("/health/modify-health", JSON.stringify(payload), function () {
        console.log("Modify health completed");
    }, "json").done(async function (data) {
        $("#submitHealthModification").html("Success");
        await sleep(500);
        $("#health-change").modal('hide');
        $("#submitHealthModification").prop('disabled', false);
        $("#setHealthy").prop("disabled", false);
        $("#submitHealthModification").html("submit");
        window.location.reload();
    }).fail(requestFailure)
}

/**
 * Submit a the form to change a user's location, sending a new job to the backend
 * @param email the user's email
 * @returns {Promise<void>} depending on the response
 */
async function submitLocationChangeForm(email) {
    const location = $("input[name='location']:checked").val();
    if (location == null) {
        alert("You must select an option to submit!");
        return;
    }
    $("#submitLocationChange").prop('disabled', true);
    let data = {
        "location": location,
        "email": email.renderQuotes()
    };
    $.post("/health/queue-location-change", JSON.stringify(data), function () {
        console.log("Location change completed");
    }, "json").done(async function (data) {
        $("#submitLocationChange").html("Success");
        await sleep(500);
        $("#location-change").modal("hide");
        $("#submitLocationChange").prop('disabled', false);
        $("#submitLocationChange").html("Submit");
        window.location.reload();
    }).fail(requestFailure)

}

/**
 * Submit the search to filter the health table by user email, updating the table items with filtered ones
 */
function submitHealthSearch() {
    homeUserStatusPagToken = 0;
    const email = $('#email-input').val();
    $("#summaries").html("");
    populateHealthSummaryTable(email);
    $("#load-more-home").attr("onclick", `populateHealthSummaryTable("${email.escapeQuotes()}")`);
    $("#clear-toggle").html("<br><button class='btn btn-secondary' onclick='clearHealthSearch()'>Clear Search</button>");
}

/**
 * Clear the search on the health table, resetting the filter
 */
function clearHealthSearch() {
    homeUserStatusPagToken = 0;
    $("#email-input").val("");
    $("#summaries").html("");
    populateHealthSummaryTable();
    $("#clear-toggle").html("");
    $("#load-more-home").attr("onclick", "populateHealthSummaryTable()");
}

/**
 * Simple function to go to the manage users page
 */
function goToManageUsers(){
    window.location = "/manage-users"
}

/**
 * Update the submitted symptom reports widget on the home page
 */
function updateSubmittedReportsWidget() {
    $.post("/api/submitted-symptom-reports", JSON.stringify({}), function () {
        console.log("Update submitted symptom reports received");
    }, "json").done(function (data) {
        $("#submitted-symptom-reports").html(data.value);
    }).fail(requestFailure);
}