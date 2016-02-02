/**
 * Created by mickyto on 02/02/16.
 */

module.exports = function (date) {
    var timeObject = {};
    var seconds = Math.round((new Date() - date) / 1000);

    if (seconds < 3600) {
        timeObject.time = Math.round(seconds / 60);
        timeObject.unit = 'minutes';
    }
    if (seconds > 3600 && seconds < 86400 ) {
        timeObject.time = Math.round(seconds / 3600);
        timeObject.unit = 'hours';
    }
    if (seconds > 86400 ) {
        timeObject.time = Math.round(seconds / 86400);
        timeObject.unit = 'days';
    }
    return timeObject;
};
