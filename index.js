const express = require('express');
const app = express();
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const assert = require('assert');
const bodyParser = require('body-parser');
const fs = require('fs-extra');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

function createFolder() {

}

app.get('/plugins', (req, res) => {
    const client = new MongoClient(url);
    client.connect().then(() => {
        const db = client.db('player');
        const col = db.collection('plugins');
        col.find({}).toArray().then((result) => {
            client.close();
            res.send(result);
        })
    }).catch((err) => {
        res.send({ error: true });
        client.close();
    })
});
app.post('/reg', (req, res) => {
    const client = new MongoClient(url);
    client.connect((err) => {
        assert.equal(null, err);
        const db = client.db('player');
        const col = db.collection('users');
        col.insertOne({ author: req.body.author, password: req.body.password }).then((r) => {
            res.send('ok');
            client.close();
        }).catch((err) => {
            res.send('auther name has been used');
            client.close();
        })
    })

});
app.post('/plugins', (req, res) => {
    // author password name
    const client = new MongoClient(url);
    client.connect().then(() => {
        const db = client.db('player');
        db.collection('users').findOne({ author: req.query.author }).then((r) => {
            if (r === null) {
                res.send('author not reged'); console.log('no author');
                client.close();
                return;
            }
            if (r.password !== req.query.password) {
                res.send('password wrong'); console.log('password wrong');
                client.close();
                return;
            }
            db.collection('plugins').findOne({ name: req.query.name }).then((r) => {
                if (r === null || r.author === req.query.author) {
                    const dir = path.join('./public/assets/plugins', req.query.name, req.query.version);
                    fs.ensureDirSync(dir);
                    const ws = fs.createWriteStream(path.join(dir, `${req.query.name}.zip`));
                    req.pipe(ws);
                    req.on('end', () => {
                        db.collection('plugins').findOneAndUpdate({ path: req.query.name }, {
                            $set: {
                                path: req.query.name,
                                author: req.query.author,
                                description: req.query.description,
                                version: req.query.version,
                                pluginName: req.query.pluginName
                            }
                        }, { upsert: true }).then((v) => {
                            client.close();
                            res.send('ok');
                        }).catch((err) => {
                            res.send(err); console.log(err);
                            client.close();
                            return;
                        })
                    })
                } else {
                    res.send('plugin name has been used'); console.log('plugin name has been used');
                    client.close();
                    return;
                }
            });
        });
    }).catch((err) => {
        res.send(err);
        client.close();
        return;
    })
});

app.get('/fuckyouthisshitisinit', (req, res) => {
    const client = new MongoClient(url);
    client.connect((err) => {
        assert.equal(null, err);
        const db = client.db('player');
        db.collection('users').createIndex({ "author": 1 }, { unique: true }, (err, result) => {
            res.send('ok');
        });
    });
})

app.listen(80);