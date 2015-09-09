module.exports = function (perPage, count, link) {
    "use strict";
    var pageLinks = [],
        p;
    for (p = 0; p < count / perPage; p++) {
        pageLinks.push({
            link: link + p,
            pg: p + 1
        });
    }
    return pageLinks;
};
