module.exports = function (pageNumber, perPage, count, link) {
    "use strict";
    var pageLinks = [];

    for (var p = 0; p < count / perPage; p++) {
        pageLinks.push({
            link: link + p,
            pg: p + 1
        });
    }

    var partsOfLinks = {
        first: pageLinks[0],
        firstPart: pageLinks.slice(0, 6),
        middle: pageLinks.slice(parseInt(pageNumber, 10) - 1, parseInt(pageNumber, 10)  + 3),
        lastPart: pageLinks.slice(-6),
        last: pageLinks[pageLinks.length-1],
        total: pageLinks.length
    };
    return partsOfLinks;
};
