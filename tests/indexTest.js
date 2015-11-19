
module.exports = {
    'is index page exist' : function (browser) {
        browser
            .url('http://boolbi.dev')
            .waitForElementVisible('body', 1000)
            .pause(1000);

        browser.expect.element('#forTest').text.to.contain('сайт');

        browser.end();
    }
};







