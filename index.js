const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const uri = "mongodb+srv://drubo:123mongodb456@cluster0.7hj0csw.mongodb.net/uplearndb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/',(req,res) =>{
    res.sendFile(__dirname +'/index.html')
})



client.connect(err => {
  const productCollection = client.db("uplearndb").collection("products");

  app.get('/addProducts',(req,res)=>{
    productCollection.find({})
    .toArray((err, documents)=>{
        res.send(documents);
    })
})
  app.get('/load/:id',(req,res)=>{
    productCollection.find({_id: ObjectId(req.params.id)})
    .toArray((err,documents) => {
      res.send(documents[0]);
    })
  })
  app.post("/addProduct" ,(req,res)=> {
    const product = req.body;
    console.log(product)
    productCollection.insertOne(product)
    .then(result => {
        console.log('data added successfully');
        res.redirect('/')
    })
    
  })

  app.delete('/delete/:id', (req,res)=>{
    productCollection.deleteOne({_id:ObjectId(req.params.id)})
    .then(result => {
      res.send(result)
    })
  })

  app.patch('/update/:id',(req,res)=>{
    
    productCollection.updateOne({_id:ObjectId(req.params.id)},
    {
      $set:{price: req.body.price, quantity: req.body.quantity}
    })
    .then(result => res.send(result))
  })

});


app.listen(3000);