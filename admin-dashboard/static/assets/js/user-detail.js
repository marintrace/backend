const userInteractionPagLimit = 15;
let userInteractionPagToken = 0;
const userReportPagLimit = 15;
let userReportPagToken = 0;

$.ajaxSetup({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});


/**
 * Get a user's health status from the backend
 * @param user_email the user's email
 */
function getUserHealthStatus(user_email) {
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

/**
 * Get a user's metadata (their cohort, activity, first name, last name, etc.)
 * @param user_email the user's email
 */
function getUserMetadata(user_email) {
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

/**
 * Populate the table on the users page with their contact history
 * @param user_email the user's email
 */
function populateUserInteractions(user_email) {
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

        // populate table entries with retrieved information
        data['users'].forEach(function (e) {
            let rows = [
                e.timestamp,
                `<a href='/detail/${e.email.escapeQuotes()}'>${e.email.escapeQuotes()}</a>`
            ];
            $("#interactions").append("<tr><td>" + rows.join("</td><td>") + "</td>")
        })
    }).fail(requestFailure)
}

/**
 * Populate the table on the user detail page with a user's report history (excluding vax adjustments)
 * @param user_email the user's email 
 */
function populateUserReports(user_email) {
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