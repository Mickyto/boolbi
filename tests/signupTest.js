
module.exports = {
    'Sign up' : function (browser) {
        browser
            .url('http://igor.com:3000/users/signup')
            .waitForElementVisible('body', 1000)
            .pause(1000);

        browser
            .waitForElementNotVisible('p#useremail', 1000)
            .pause(3000);

        browser
            .waitForElementVisible('button.signup', 1000)
            .pause(1000)
            .setValue('input#email', 'notEmail')
            .setValue('input#pass', '1111111111')
            .click('button.signup')
            .pause(3000);

        browser
            .waitForElementVisible('p#useremail', 1000)
            .pause(3000);

        browser.end();
    }
};

