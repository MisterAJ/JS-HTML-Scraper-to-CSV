let osmosis = require('osmosis');
let json2csv = require('json2csv');
let fs = require('fs');

// Array of Objects from shirt site
let shirtsArray = [];

// Fields for CSV file
let fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];

// Reusable Function to check if a directory exists
function checkDirectorySync(directory) {
    try {
        fs.statSync(directory);
    } catch(e) {
        fs.mkdirSync(directory);
    }
}

// Error Logging function
function connectionError(comment) {
    let time = new Date();

    // Writes file to error log
    fs.writeFile('scraper-error.log', comment + ' ' + time, function(err) {
        if (err) throw err;
        console.log('Connection error logged to scraper-error.log');
    });
}

// Function to create CSV file
function toCSV() {
    // Get and format date for file
    let today = new Date();
    // Year - Month is zero indexed so I added +1 - Day
    today = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();


    // Generate CSV Object
    let csv = json2csv({ data: shirtsArray, fields: fields });

    // Osmosis does not have correct error handling yet
    // Checking in shirtsArray has objects in it or calling a connectionError
    if(shirtsArray.length !== 0) {
        checkDirectorySync("./data");

        fs.writeFile('data/' + today + '.csv', csv, function (err) {
            if (err) throw err;
            console.log('file saved');
        });
    } else connectionError('Interwebs Broken, Parsing Failed')
}

// Scraper to pull info from the site's main page
function getLinks() {
    osmosis
        // Connecting to main site
        .get('http://www.shirts4mike.com/shirts.php')
        // Setting URL variable in Object
        .set({'URL': '.products a@href'})
        // Iterating through the shirt links
        .follow('.products a@href')
        // Setting More variables
        .set({
            'Title':'.shirt-picture @alt',
            'Price': '.price',
            'ImageURL': 'img @src',
            })
        // Formatting object and pushing to shirtsArray
        .data(function(listing) {
            listing.ImageURL = 'http://www.shirts4mike.com/' + listing.ImageURL;
            listing.URL = 'http://www.shirts4mike.com/' + listing.URL;
            listing.Time = new Date();
            shirtsArray.push(listing);
            })
        .error("Interwebs Broken, Connection Failed :-( ");

    // Delaying CSV function by 1s to allow osmosis to finish it's background work
    /* Callbacks do not work correctly so I'm using this until the issue has been fixed
       by the devs */
    setTimeout(function(){toCSV()},1000);
}


// Calling the getLinks method to start the magic!
getLinks();

