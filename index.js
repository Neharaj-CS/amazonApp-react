const express = require('express')
import dotenv from "dotenv";
const cors = require('cors')
const mongoose = require('mongoose')
const Products = require('./Products')
const stripe = require('stripe')(
    "sk_test_51NTpmeSEgEdLEHAHic68n1kOBH7yfEMjxfMdVUirwn01mhgsehAXbex0iiC9QWROa6Z7WsKDqdz6LXbls21g3Cmi00fBIsh5OB"
);
const Orders = require('./Orders')
const bcrypt = require("bcryptjs"); //////new
const Users = require('./Users') //////new

const app = express()
const port = 3001

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "./front/build")));
app.get("*", function (_, res) {
  res.sendFile(
    path.join(__dirname, "./front/build/index.html"),
    function (err) {
      res.status(500).send(err);
});
});

mongoose.connect(process.env.MONGO, {
    useNewUrlParser:true,
    useUnifiedTopology:true,
})
app.get('/', (req, res) => res.status(200).send("Home Page"));

app.post('/products/add', (req, res) => {
    const productDetail = req.body;
  
    console.log('Product Details >>>>', productDetail);
  
    Products.create(productDetail)
      .then(data => {
        res.status(201).send(data);
      })
      .catch(err => {
        res.status(500).send(err.message);
      });
  });

  app.get('/products/get', (req, res) => {
    Products.find()
      .then(data => {
        res.status(200).send(data);
      })
      .catch(err => {
        res.status(500).send(err.message);
      });
  });


  /////////newly added signup api

  // API for SIGNUP

app.post("/auth/signup", async (req, res) => {
    const { email, password, fullName } = req.body;
  
    const encrypt_password = await bcrypt.hash(password, 10);
  
    const userDetail = {
      email: email,
      password: encrypt_password,
      fullName: fullName,
    };
  
    const userExist = await Users.findOne({ email: email });

if (userExist) {
  res.send({ message: "The Email is already in use!" });
} else {
  try {
    const result = await Users.create(userDetail);
    res.send({ message: "User Created Successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
}
  });

/////////////////newly added
  // API for LOGIN

  app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const userDetail = await Users.findOne({ email: email });
  
      if (userDetail) {
        const isPasswordValid = await bcrypt.compare(password, userDetail.password);
  
        if (isPasswordValid) {
          res.send(userDetail);
        } else {
          res.status(401).send({ error: "Invalid email or password" });
        }
      } else {
        res.status(401).send({ error: "Invalid email or password" });
      }
    } catch (err) {
      res.status(500).send({ error: "An error occurred during login" });
    }
  });

  //API FOR PAYMENT

  app.post('/payment/create', async (req, res) => {
    const total = req.body.amount;
    console.log('Payment request received for this rupees', total);

    const payment = await stripe.paymentIntents.create({
        amount: total*100,
        currency: 'inr'
    });

    res.status(201).send({
        clientSecret: payment.client_secret,
    });
});

//API TO ADD ORDER DETAILS

app.post('/orders/add', (req, res) => {
    const products = req.body.basket;
    const price = req.body.price;
    const email = req.body.email;
    const address = req.body.address;

    const orderDetail = {
        products:products,
        price:price,
        address:address, 
        email:email};

        Orders.create(orderDetail)
        .then(result => {
          console.log('order added to database >>>>>> ', result);
          res.status(201).send(result);
        })
        .catch(err => {
          console.log(err);
          res.status(500).send(err.message);
        });

})


///API for your order details

app.post('/orders/get', (req, res) => {
    const email = req.body.email;
  
    Orders.find()
      .then((result) => {
        const userOrders = result.filter((order) => order.email === email);
        res.send(userOrders);
      })
      .catch((err) => {
        console.log(err);
      });
  });


app.listen(port, () => console.log('Listening on the port ', port));

