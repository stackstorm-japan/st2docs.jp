(function () {
  function renderVersionBadge(versions, currentVersion) {
    var versionsContainer = $('<dl><dt>Versions</dt></dl>');
    $.each(versions, function (slug, url) {
      versionsContainer.append('<dd><a href="' + url + '">' + slug + '</a></dd>');
    });

    var otherVersions = $('<div class="rst-other-versions"></div>').append(versionsContainer);

    var container = $('<div id="versions" class="rst-versions rst-badge" data-toggle="rst-versions" role="note" aria-label="versions"></div>');
    container.append('<span class="rst-current-version" data-toggle="rst-current-version">v: ' + currentVersion + ' <span class="fa fa-caret-down"></span></span>');
    container.append(otherVersions);

    $('#versions').replaceWith(container);
  }

  function showVersionWarning() {
    $('#version-warning').show();
  }

  $(document).ready(function () {
    var latestVersion = "2.7dev";

    var versions = {
      "latest": "https://docs.stackstorm.com/latest",
      "2.7dev": "https://docs.stackstorm.com/2.7dev",
      "2.7": "https://docs.stackstorm.com/2.7",
      "2.6": "https://docs.stackstorm.com/2.6",
    };

    var currentVersion = latestVersion;

    var match = window.location.pathname.match('^/(\\d+\\.\\d+)');
    if (match) {
      currentVersion = match[1];
      showVersionWarning();
    }

    renderVersionBadge(versions, currentVersion);
  });
})()