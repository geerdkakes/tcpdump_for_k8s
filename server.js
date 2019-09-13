const express = require('express');
const port = (process.env.PORT || 3000);

//CREATE EXPRESS APP
const app = express();

const { spawn } = require('child_process');
var child = null; 
var filename = null;
var rootdir = (process.env.ROOTDIR)? process.env.ROOTDIR : './';


// start tcpdump.
app.get('/start', function (req, res) {

    if (!child) {
        filename = rootdir + Date.now().valueOf() + ".pcap"
        console.log('starting tcpdum with file ' + filename);
        child = spawn('/usr/sbin/tcpdump', ['-w', filename]);

        child.stdout.on('data', (chunk) => {
        console.log(chunk.toString());
        });
    
        child.stderr.on('data', (chunk) => {
            console.error(chunk.toString());
        });
    
        child.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
        res.send('tcpdump started, saving data to: ' + filename);
    } else {
        res.send('tcpdump already started');
    }
  })



// stop tcpdump.
app.get('/stop', function (req, res) {

    if (child) {
 
        child.kill('SIGHUP');
        child = null;
        res.send('killing tcpdump.. ');
    } else {
        res.send('tcpdump not started');
    }
  })

// download pcap
app.get('/download', function(req, res){
    if (filename) {
        res.set('Content-Type', 'application/octet-stream');
        res.download(filename); // Set disposition and send it.
    } else {
        res.send('no file present');
    }
});
// status
app.get('/status', function(req, res){
    var message = "";
    if (filename) {
        message = "Filename present: " + filename + ". ";
    } else {
        message = "No filename present. ";
    }
    if (child) {
        message = message + "Process running.";
    } else {
        message = message + "No process running."
    }
    res.send(message);
});

app.listen(port);
console.log("listening to port " + port);

