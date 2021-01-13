const userInteractionPagLimit = 15;
let userInteractionPagToken = 0;
const homeUserStatusPagLimit = 200; // allow sorting without pagination
let homeUserStatusPagToken = 0;
const userReportPagLimit = 15;
let userReportPagToken = 0;

$.ajaxSetup({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

function requestFailure(data) {
    alert("[Error] Failed to communicate with backend services");
    console.log("Error while issuing POST request");
    console.log(data);
}

async function exportToCsv(){
    $("#csv-export-home").html("Loading...").prop("disabled", true);
    await sleep(1000)
    updateHomeStatusSummaries(null, true);
    download_table_as_csv("home-status-summaries");
    $("#csv-export-home").html("Export to CSV").prop('disabled', false);

}

// Quick and simple export target #table_id into a csv
function download_table_as_csv(table_id, separator = ',') {
    // Select rows from table_id
    var rows = document.querySelectorAll('table#' + table_id + ' tr');
    // Construct csv
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            // Clean innertext to remove multiple spaces and jumpline (break csv)
            var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
            // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
            data = data.replace(/"/g, '""');
            // Push escaped string
            row.push('"' + data + '"');
        }
        csv.push(row.join(separator));
    }
    var csv_string = csv.join('\n');
    // Download it
    var filename = 'export_' + table_id + '_' + new Date().toLocaleDateString() + '.csv';
    var link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function truncate(str, n) {
    return (str.length > n) ? str.substr(0, n - 1) + '&hellip;' : str;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.escapeQuotes = function () {
    return this.replace("'", "&#39;").replace('"', "&quot;");
};

String.prototype.renderQuotes = function () {
    return this.replace("&#39;", "'").replace('&quote;', '"');
};

function updateUserStatus(user_email) {
    promptPolicyModal();
    $.post("/api/user-summary-status", JSON.stringify({"email": user_email.renderQuotes()}), function () {
        console.log("User Status Request Response Received");
    }, "json").done(function (data) {
            $("#today-status-color").addClass("bg-" + data.health.color);
            $("#today-status-description").html(data.health.criteria.join(' & '));
            $("#today-location-color").addClass("bg-" + data.location.color);
            $("#today-location-description").html(data.location.location.capitalize());
        }
    ).fail(requestFailure)
}

function updateUserInfo(user_email) {
    promptPolicyModal();
    $.post("/api/get-user-info", JSON.stringify({"email": user_email.renderQuotes()}), function () {
        console.log("User info Request Response Received");
    }, "json").done(function (data) {
            $("#first-name").html(data["first_name"]);
            $("#last-name").html(data["last_name"]);
            $("#active").html(data["active"] ? 'Yes' : 'No');
            if (data["cohort"] != null) {
                $("#cohort").html(data["cohort"]);
            } else {
                $("#cohort").html("Unassigned");
            }
        }
    ).fail(requestFailure)
}

function updateUserInteractions(user_email) {
    promptPolicyModal();
    $.post("/api/paginate-user-interactions",
        JSON.stringify({
            "email": user_email.renderQuotes(),
            "pagination_token": userInteractionPagToken,
            "limit": userInteractionPagLimit
        }), function () {
            console.log("Paginate User Interactions Request Response Received");
        }, "json").done(function (data) {
        if (data['users'].length === 0) {
            $('#interaction-footer').hide();
        }
        userInteractionPagToken = data['pagination_token'];

        data['users'].forEach(function (e) {
            let escapedEmail = e.email.escapeQuotes();
            let rows = [
                e.timestamp,
                `<a href='/user/${e.email.escapeQuotes()}'>${e.email.escapeQuotes()}</a>`
            ];
            $("#interactions").append("<tr><td>" + rows.join("</td><td>") + "</td>")
        })
    }).fail(requestFailure)
}

function updateUserReports(user_email) {
    promptPolicyModal();
    $.post("/api/paginate-user-reports", JSON.stringify({
        "email": user_email.renderQuotes(),
        "pagination_token": userReportPagToken,
        "limit": userReportPagLimit
    }), function () {
        console.log("Paginating user reports request response received");
    }, "json").done(function (data) {
        if (data['health_reports'].length === 0) {
            $("#report-footer").hide();
            return;
        }
        userReportPagToken = data['pagination_token'];
        data['health_reports'].forEach(function (e) {
            let rows = [
                e.timestamp,
                "<span class=\"badge badge-dot mr-4\"><i class='bg-" + e.dated_report.color + "'></i><span class='status'>" +
                truncate(e.dated_report.criteria.join(' & '), 45) + "</span></span>",
            ];
            $("#reports").append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)
}

function showBriefingConfirm() {
    $("#digestModal").modal("show");
}

function updateHomeStatusSummaries(email = null, getall=false) {
    promptPolicyModal();
    let data = {
        "pagination_token": homeUserStatusPagToken,
        "limit": homeUserStatusPagLimit
    };
    if (email != null) {
        data['email'] = email.escapeQuotes();
    }

    $.post("/api/paginate-user-summary-items", JSON.stringify(data), function () {
        console.log("Update home status summaries request response received");
    }, "json").done(function (data) {
        if (data['statuses'].length === 0) {
            $("#home-footer").hide();
            return;
        }

        homeUserStatusPagToken = getall ? 10000 : data['pagination_token'];

        data['statuses'].forEach(function (e) {
            let escapedEmail = e.email.escapeQuotes();
            let rows = [
                `<a href='/user/${escapedEmail}'>${escapedEmail}</a>`,
                "<span class='badge badge-dot mr-4'><i class='bg-" + e.health.color + "'></i><span class='status'>" +
                `<a class='modal-link' onclick='modifyHealth("${escapedEmail}")'>` +
                truncate(e.health.criteria.join(' & '), 45) + "</a></span></span>",
                "<span class='badge badge-dot mr-4'><i class='bg-" + e.location.color + "'></i><span class='status'>" +
                `<a class='modal-link' onclick='changeLocation("${escapedEmail}")'>` +
                e.location.location.capitalize() + "</a></span></span>"
            ];
            $("#summaries").append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)
}

function modifyHealth(email) {
    $("#health-user-email").html(email.escapeQuotes());
    $("#submitHealthModification").attr("onclick", `submitHealthModification("${email.escapeQuotes()}", false)`);
    $("#setHealthy").attr("onclick", `submitHealthModification("${email.escapeQuotes()}", true)`);
    $("#health-change").modal('show');
}

function changeLocation(email) {
    $("#loc-user-email").html(email.escapeQuotes());
    $("#submitLocationChange").attr("onclick", `submitLocationChange("${email.escapeQuotes()}")`);
    $("#location-change").modal('show');
}

async function resendDailyBriefing() {
    promptPolicyModal();
    $("#resendButton").html("Submitting...").prop('disabled', true);
    $.post("/async/send-targeted-digest", JSON.stringify({}), function () {
        console.log("Send targeted digest report recieved");
    }, "json").done(function (data) {
        $("#resendButton").html("Success!");
        await sleep(500);
        $("#resendButton").html("Resend").prop('disabled', false);
        $("#digestModal").modal('hide');
    }).fail(requestFailure);


}

async function submitHealthModification(email, set_healthy) {
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
    $.post("/async/modify-health", JSON.stringify(payload), function () {
        console.log("Modify health completed");
    }, "json").done(function (data) {
        $("#submitHealthModification").html("Success");
        await sleep(500);
        $("#health-change").modal('hide');
        $("#submitHealthModification").prop('disabled', false);
        $("#setHealthy").prop("disabled", false);
        $("#submitHealthModification").html("submit");
        window.location.reload();
    })
}

async function submitLocationChange(email) {
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
    $.post("/async/queue-location-change", JSON.stringify(data), function () {
        console.log("Location change completed");
    }, "json").done(function (data) {
        $("#submitLocationChange").html("Success");
        await sleep(500);
        $("#location-change").modal("hide");
        $("#submitLocationChange").prop('disabled', false);
        $("#submitLocationChange").html("Submit");
        window.location.reload();
    }).fail(requestFailure)

}

function submitSearch() {
    promptPolicyModal();
    homeUserStatusPagToken = 0;
    const email = $('#email-input').val();
    $("#summaries").html("");
    updateHomeStatusSummaries(email);
    $("#load-more-home").attr("onclick", `updateHomeStatusSummaries("${email.escapeQuotes()}")`);
    $("#search-toggle").html("<br><button class='btn btn-secondary' onclick='clearSearch()'>Clear Search</button>");
}

function clearSearch() {
    promptPolicyModal();
    homeUserStatusPagToken = 0;
    $("#email-input").val("");
    $("#summaries").html("");
    updateHomeStatusSummaries();
    $("#search-toggle").html("");
    $("#load-more-home").attr("onclick", "updateHomeStatusSummaries()");
}

function updateSubmittedWidget() {
    promptPolicyModal();
    $.post("/api/submitted-symptom-reports", JSON.stringify({}), function () {
        console.log("Update submitted symptom reports received");
    }, "json").done(function (data) {
        $("#submitted-symptom-reports").html(data.value);
    }).fail(requestFailure);
}

function promptPolicyModal() {
    if (!(localStorage.getItem("agreed") === "true")) {
        $('#policyModal').modal({backdrop: 'static', keyboard: false})
    }
}

function acceptPolicy() {
    console.log("Policy agreed... caching");
    localStorage.setItem("agreed", "true");
    $("#policyModal").modal("hide");
}

$(document).ready(function () {
    promptPolicyModal();
});