const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;



// middleware
app.use(cors());
app.use(express.json());


// mongodb


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shepece.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {

    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(403).send({ error: true, message: 'unauthorized people' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: 'unauthorized people' });
        }

        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('carsMaster').collection('services');
        const checkoutcollection = client.db('carsMaster').collection('checkout');



        // jwt token start.........................

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token });

        })





        // jwt token end.........................




        // services...............start
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await servicesCollection.findOne(query);
            res.send(result);

        })

        // services**********end


        // checkout/booking................start

        app.get('/checkout', verifyJWT, async (req, res) => {
            const decoded = req.decoded;

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            }
            const result = await checkoutcollection.find(query).toArray();
            res.send(result);
        })

        app.post('/checkout', async (req, res) => {
            const checkout = req.body;
            const result = await checkoutcollection.insertOne(checkout);
            res.send(result);

        })


        app.patch('/checkout/:id', async (req, res) => {
            const id = req.params.id;
            const confirm = req.body;

            const filter = { _id: new ObjectId(id) };
            updatedDoc = {
                $set: {
                    status: confirm.status
                }
            }
            const result = await checkoutcollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/checkout/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await checkoutcollection.deleteOne(query);
            res.send(result);
        })


        // checkout/booking.....................end
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);













app.get('/', (req, res) => {
    res.send('car server is running');
})

app.listen(port, (req, res) => {
    console.log('Car server is running on :', port)
})