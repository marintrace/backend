/**
 * Prompt the user to agree to the terms of service and privacy policy if they haven't already
 */
function showPolicyModal() {
    if (!(localStorage.getItem("agreed") === "true")) {
        $('#policy-modal').modal({backdrop: 'static', keyboard: false})
    }
}


/**
 * Callback when the user accepts the TOS/PP - store in local storage so they
 * don't need to agree again.
 */
function acceptPolicy() {
    console.log("Policy agreed... caching");
    localStorage.setItem("agreed", "true");
    $("#policy-modal").modal("hide");
}

/**
 * Show the switch role dialog
 */
function showSwitchRoleModal() {
    $("#switch-campus").modal('show');
    $("#user-roles").html("<option disabled selected>Loading...</option>");
    let currentRole = getCookie("assume_role");
    $.get("/user/current-user-roles", function () {
        console.log("Got Current User Roles");
    }, "json").done(function (data) {
        let options = [];
        data.roles.forEach(function (e) {
            if (e.endsWith('-admin')) {
                options.push(`<option value="${e}"` + (currentRole === e ? "selected": "") + `>${e.split("-admin")[0]}</option>`)
            }
        });
        $("#user-roles").html(options.join(""))
    }).fail(requestFailure)
}

/**
 Switch the users role by getting the backend to set a cookie
 with our new role
 **/
function submitSwitchCampus() {
    $("#switch-campus-btn").prop('disabled', true).html("Switching...");
    let userRole = $("#user-roles").val();
    if (userRole === "Loading...") {
        alert("Please wait for the system to load your roles")
    }

    $.get("/user/assume-role/" + userRole, function () {
        console.log("Received Assume Role Cookie");
    }, "json").done(async function (data) {
        let submitBtn = $("#switch-campus-btn")
        submitBtn.html("Success.")
        await sleep(1500);
        window.location.href = '/';
    }).fail(requestFailure);
}


/**
 * Show the confirmation dialog to resend the daily briefing
 * if the feature is enabled for the given school. An API request
 * is made to verify if this is the case.
 */
function showResendBriefingModal() {
    $("#resend-briefing-text").innerHTML = "Loading...";
    $.get("/api/briefing-enabled", function () {
        console.log("Got briefing status for current school");
        $("#resend-briefing-text").innerHTML = "Resend Daily Briefing";
    }, "json").done(function (data) {
        if (data.enabled) {
            console.log("Briefings are enabled... showing");
            $("#digest-modal").modal("show");
        } else {
            console.log("Briefings are disabled... hiding");
            alert("Daily Digests are not enabled for your school. Please contact an administrator to set them up.")
        }
    }).fail(requestFailure)
}

/**
 * Submit the resend daily briefing form, which creates a job in the backend
 * to resend the briefing to the current logged in user (if they are authorized to receive
 * briefings)
 * @returns {Promise<void>} depends on response
 */
async function submitResendBriefingForm() {
    $("#resendButton").html("Submitting...").prop('disabled', true);
    $.post("/health/send-targeted-digest", JSON.stringify({}), function () {
        console.log("Send targeted digest report recieved");
    }, "json").done(async function (data) {
        $("#resendButton").html("Success!");
        await sleep(500);
        $("#resendButton").html("Resend").prop('disabled', false);
        $("#digest-modal").modal('hide');
    }).fail(requestFailure);
}

/**
 * Delete a JS cookie
 * @param name the cookie to delete
 */
var delete_cookie = function (name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

/**
 * Function to process logout—we clear the user's cookies (for switched campuses)
 * and redirect the user to the logout louketo screen
 */
function logoutUser() {
    delete_cookie("assume_role");
    window.location.href = "/admin/oauth/logout";
}


/**
 * Callback function run on REST API failure to communicate with the backend
 * @param data the failed response payload
 */
function requestFailure(data) {
    alert("[Error] Failed to communicate with backend services: " + JSON.stringify(data));
    console.log("Error while issuing request");
    console.log(data);
}


/**
 * Quick and simple export target tabe into a csv file
 * @param table_id html table id to export
 * @param separator the delimiter in between items in the file (default comma)
 *
 * Source: https://stackoverflow.com/questions/15547198/export-html-table-to-csv
 */
//
function downloadTableAsCSV(table_id, separator = ',') {
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

/**
 * Delete shortcut (AJAX) for Jquery $.delete
 * @param url the url to send a request to
 * @param data payload
 * @param callback callback to run upon receipt of the response
 * @param type depends
 * @returns {{getAllResponseHeaders: function(): *|null, abort: function(*=): *, setRequestHeader: function(*=, *): *, readyState: number, getResponseHeader: function(*): null|*, overrideMimeType: function(*): *, statusCode: function(*=): this}|*}
 */
$.delete = function (url, data, callback, type) {

    if ($.isFunction(data)) {
        type = type || callback,
            callback = data,
            data = {}
    }

    return $.ajax({
        url: url,
        type: 'DELETE',
        success: callback,
        data: data,
        contentType: type
    });
}

/**
 * Truncate a string to a given length, adding elipsis if necessary. If string is less
 * than the maximimum size, no change is made
 * @param str the string to truncate
 * @param n the number of letters to truncate to
 * @returns {string|*} the truncated string
 */
function truncate(str, n) {
    return (str.length > n) ? str.substr(0, n - 1) + '&hellip;' : str;
}

/**
 * Get a JS cookie by name from the browser
 * @param name the string name of cookie
 * @returns {string}
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

/**
 * Wait for a specified amount of time
 * @param ms amount of time in ms
 * @returns {Promise<unknown>} async promise to wait
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * String prototype function to capitalize a string (only the first letter is upper cased)
 * @returns {string}
 */
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 * Escape quotes into their corresponding html characters for embedding
 * @returns {*} escaped string
 */
String.prototype.escapeQuotes = function () {
    return this.replace("'", "&#39;").replace('"', "&quot;");
};

/**
 * Unescape quotes in an html string, turning them back into ASCII characters
 * @returns {*} unescaped string
 */
String.prototype.renderQuotes = function () {
    return this.replace("&#39;", "'").replace('&quote;', '"');
};


$(document).ready(function () {
    showPolicyModal();
});