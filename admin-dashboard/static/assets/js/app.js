const userInteractionPagLimit = 15;
let userInteractionPagToken = 0;
const homeUserStatusPagLimit = 500; // allow sorting without pagination
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

function truncate(str, n) {
    return (str.length > n) ? str.substr(0, n - 1) + '&hellip;' : str;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function updateUserStatus(user_email) {
    promptPolicyModal();
    $.post("/api/user-summary-status", JSON.stringify({"email": user_email}), function () {
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
    $.post("/api/get-user-info", JSON.stringify({"email": user_email}), function () {
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
            "email": user_email,
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
            let rows = [
                e.timestamp,
                "<a href='/user/" + e.email + "'>" + e.email + "</a>",
            ];
            $("#interactions").append("<tr><td>" + rows.join("</td><td>") + "</td>")
        })
    }).fail(requestFailure)
}

function updateUserReports(user_email) {
    promptPolicyModal();
    $.post("/api/paginate-user-reports", JSON.stringify({
        "email": user_email,
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

function updateHomeStatusSummaries(email = null) {
    promptPolicyModal();
    let data = {
        "pagination_token": homeUserStatusPagToken,
        "limit": homeUserStatusPagLimit
    };
    if (email != null) {
        data['email'] = email
    }

    $.post("/api/paginate-user-summary-items", JSON.stringify(data), function () {
        console.log("Update home status summaries request response received");
    }, "json").done(function (data) {
        if (data['statuses'].length === 0) {
            $("#home-footer").hide();
            return;
        }
        homeUserStatusPagToken = data['pagination_token'];

        data['statuses'].forEach(function (e) {
            let rows = [
                "<a href='/user/" + e.email + "'>" + e.name + "</a>",
                "<span class='badge badge-dot mr-4'><i class='bg-" + e.health.color + "'></i><span class='status'>" +
                "<a class='modal-link' onclick='modifyHealth(\"" + e.email + "\")'>" +
                truncate(e.health.criteria.join(' & '), 45) + "</a></span></span>",
                "<span class='badge badge-dot mr-4'><i class='bg-" + e.location.color + "'></i><span class='status'>" +
                "<a class='modal-link' onclick='changeLocation(\"" + e.email + "\")'>" +
                e.location.location.capitalize() + "</a></span></span>"
            ];
            $("#summaries").append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)
}

function modifyHealth(email){
    console.log('modifying health for ' + email);
    $("#health-user-email").html(email);
    $("#submitHealthModification").attr("onclick", "submitHealthModification('" + email + "', false)");
    $("#setHealthy").attr("onclick", "submitHealthModification('" + email + "', true)");
    $("#health-change").modal('show');
}
function changeLocation(email){
    console.log('changing location for ' + email);
    $("#loc-user-email").html(email);
    $("#submitLocationChange").attr("onclick", "submitLocationChange('" + email + "')");
    $("#location-change").modal('show');
}

function submitHealthModification(email, set_healthy){
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

    payload['email'] = email;
    $("#submitHealthModification").prop('disabled', true);
    $("#setHealthy").prop('disabled', true);
    $.post("/async/modify-health", JSON.stringify(payload), function(){
        console.log("Modify health completed");
    }, "json").done(function (data){
        $("#submitHealthModification").html("Success");
        sleep(500);
        $("#health-change").modal('hide');
        $("#submitHealthModification").prop('disabled', false);
        $("#setHealthy").prop("disabled", false);
        $("#submitHealthModification").html("submit");
        window.location.reload();
    })
}

function submitLocationChange(email){
    const location = $("input[name='location']:checked").val();
    if (location == null){
        alert("You must select an option to submit!");
        return;
    }
    $("#submitLocationChange").prop('disabled', true);
    let data = {
        "location": location,
        "email": email
    };
    $.post("/async/queue-location-change", JSON.stringify(data), function (){
        console.log("Location change completed");
    }, "json").done(function (data){
        $("#submitLocationChange").html("Success");
        sleep(500);
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
    $("#load-more-home").attr("onclick", "updateHomeStatusSummaries('" + email + '")');
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