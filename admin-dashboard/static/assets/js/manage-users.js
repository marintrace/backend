const communityUserPagLimit = 300;
let communityUserPagToken = 0;

let selectedCommunityUsers = [];

/**
 * Populate the community members table on the home screen, with the ability to change
 * certain options for them.
 * @param email email if searching, which isolates pagination to only users with emails that start the same
 * @param getall should we skip pagination (default true)
 */
function populateMembersTable(email = null, getall = true) {
    showPolicyModal();
    let data = {
        "pagination_token": communityUserPagToken,
        "limit": getall ? 10000 : communityUserPagLimit
    }

    if (email != null) {
        data['email'] = email.escapeQuotes();
    }

    $.post("/user/paginate-users", JSON.stringify(data), function () {
        console.log("Get community members request received...")
    }, "json").done(function (data) {
        if (data['users'].length === 0) {
            $("#home-footer").hide();
            return;
        }

        communityUserPagToken = data['pagination_token'];

        data['users'].forEach(function (e) {
            let escapedEmail = e.email.escapeQuotes();
            let rows = [
                `<input type='checkbox' name="${escapedEmail}" class="member-edit-checkbox"/>`,
                e.name + (e.active ? "" : " (invited)"),
                `<a href='/detail/${escapedEmail}'>${escapedEmail}</a>`,
                "<span class='badge badge-dot mr-4'><i class='bg-" + (e.blocked ? "danger" : "success") + "'></i>" +
                "<span>" + (e.blocked ? "Disabled" : "Active") + "</span>"
            ];
            $("#users").append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)

}

/**
 * Get Invite Statistics and update top statistics widget on manage users page
 */
function updateInviteStatsWidget(){
    $.get("/user/get-invite-stats", function () {
        console.log("Received Invite Stats");
    }, "json").done(function (data){
        $("#active-members").html(data.active);
        $("#inactive-members").html(data.inactive);
    }).fail(requestFailure)
}

/**
 * Submit the search for a member, re-paginating the table based on the new filter condition
 */
function submitMemberSearch() {
    showPolicyModal();
    communityUserPagToken = 0;
    const email = $('#email-input').val();
    $("#users").html("");
    populateMembersTable(email);
    $("#load-more-users").attr("onclick", `populateMembersTable("${email.escapeQuotes()}")`)
    $("#search-toggle").html("<br><button class='btn btn-secondary' onclick='clearMemberSearch()'>Clear Search</button>");
}

/**
 * Remove the search query, re-pagining the table without a filter condition
 */
function clearMemberSearch(){
    showPolicyModal();
    communityUserPagToken = 0;
    $("#email-input").val("");
    $("#users").html("");
    populateMembersTable();
    $("#search-toggle").html("");
    $("#load-more-home").attr("onclick", "populateMembersTable()");
}
